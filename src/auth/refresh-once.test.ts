import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { refreshOnce, RefreshFailedError, RefreshTransientError } from "./refresh-once";
import { useSession } from "./session-store";

function okResponse(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as Response;
}
function failResponse(status: number): Response {
  return { ok: false, status, json: async () => ({}) } as Response;
}

beforeEach(() => {
  useSession.setState({ accessToken: null, user: null, status: "idle" });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("refreshOnce — cookie transport + single-flight + family-revoke safety", () => {
  it("posts with credentials:include and NO body (token rides the HttpOnly cookie)", async () => {
    let captured: RequestInit | undefined;
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      captured = init;
      return okResponse({ access_token: "A1" });
    });
    vi.stubGlobal("fetch", fetchMock);

    await refreshOnce();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(captured?.method).toBe("POST");
    expect(captured?.credentials).toBe("include");
    expect(captured?.body).toBeUndefined(); // no refresh_token in the body
  });

  it("collapses concurrent refreshes into ONE network call (family-revoke guard)", async () => {
    let resolveFetch!: (r: Response) => void;
    const fetchMock = vi.fn(() => new Promise<Response>((res) => (resolveFetch = res)));
    vi.stubGlobal("fetch", fetchMock);

    // Three concurrent 401s would each refresh under naive handling -> the second
    // double-refresh revokes the whole family. Single-flight must dedupe to one.
    const p1 = refreshOnce();
    const p2 = refreshOnce();
    const p3 = refreshOnce();

    resolveFetch(okResponse({ access_token: "newA" }));
    const [a, b, c] = await Promise.all([p1, p2, p3]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect([a, b, c]).toEqual(["newA", "newA", "newA"]);
    expect(useSession.getState().accessToken).toBe("newA");
  });

  it("wipes the session and rejects TERMINALLY when refresh returns 401 (reuse-detected)", async () => {
    useSession.setState({ accessToken: "old", status: "authenticated" });
    vi.stubGlobal("fetch", vi.fn(async () => failResponse(401)));

    await expect(refreshOnce()).rejects.toBeInstanceOf(RefreshFailedError);
    expect(useSession.getState().accessToken).toBeNull();
    expect(useSession.getState().status).toBe("unauthenticated");
  });

  it("does NOT wipe the session on a network error (transient — cookie not consumed)", async () => {
    useSession.setState({ accessToken: "old", status: "authenticated" });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("network down");
      }),
    );

    await expect(refreshOnce()).rejects.toBeInstanceOf(RefreshTransientError);
    // Session preserved: a flaky boot-refresh must not force a credential re-entry.
    expect(useSession.getState().accessToken).toBe("old");
    expect(useSession.getState().status).toBe("authenticated");
  });

  it("always hits the network — there is no JS token to short-circuit on", async () => {
    // Post-migration there is no persisted token to check; every call must reach the server,
    // which decides resumability from the cookie (a 401 means logged out).
    const fetchMock = vi.fn(async () => failResponse(401));
    vi.stubGlobal("fetch", fetchMock);

    await expect(refreshOnce()).rejects.toBeInstanceOf(RefreshFailedError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("allows a fresh refresh after the previous one settled (inflight resets)", async () => {
    const fetchMock = vi.fn(async () => okResponse({ access_token: "A1" }));
    vi.stubGlobal("fetch", fetchMock);

    await refreshOnce();
    await refreshOnce();
    expect(fetchMock).toHaveBeenCalledTimes(2); // not deduped — they were sequential
  });
});

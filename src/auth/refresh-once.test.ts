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
  useSession.setState({
    accessToken: null,
    refreshToken: null,
    user: null,
    permissions: [],
    status: "idle",
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("refreshOnce - token-body transport + single-flight safety", () => {
  it("posts the current access and refresh token in the JSON body", async () => {
    useSession.setState({ accessToken: "oldA", refreshToken: "oldR", status: "authenticated" });
    let captured: RequestInit | undefined;
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      captured = init;
      return okResponse({ accessToken: "A1", refreshToken: "R1" });
    });
    vi.stubGlobal("fetch", fetchMock);

    await refreshOnce();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(captured?.method).toBe("POST");
    expect(captured?.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(String(captured?.body))).toEqual({ accessToken: "oldA", refreshToken: "oldR" });
  });

  it("collapses concurrent refreshes into ONE network call", async () => {
    useSession.setState({ accessToken: "oldA", refreshToken: "oldR", status: "authenticated" });
    let resolveFetch!: (r: Response) => void;
    const fetchMock = vi.fn(() => new Promise<Response>((res) => (resolveFetch = res)));
    vi.stubGlobal("fetch", fetchMock);

    const p1 = refreshOnce();
    const p2 = refreshOnce();
    const p3 = refreshOnce();

    resolveFetch(okResponse({ accessToken: "newA", refreshToken: "newR" }));
    const [a, b, c] = await Promise.all([p1, p2, p3]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect([a, b, c]).toEqual(["newA", "newA", "newA"]);
    expect(useSession.getState().accessToken).toBe("newA");
    expect(useSession.getState().refreshToken).toBe("newR");
  });

  it("wipes the session and rejects TERMINALLY when refresh returns 401", async () => {
    useSession.setState({ accessToken: "old", refreshToken: "refresh", status: "authenticated" });
    vi.stubGlobal("fetch", vi.fn(async () => failResponse(401)));

    await expect(refreshOnce()).rejects.toBeInstanceOf(RefreshFailedError);
    expect(useSession.getState().accessToken).toBeNull();
    expect(useSession.getState().refreshToken).toBeNull();
    expect(useSession.getState().status).toBe("unauthenticated");
  });

  it("does NOT wipe the session on a network error", async () => {
    useSession.setState({ accessToken: "old", refreshToken: "refresh", status: "authenticated" });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("network down");
      }),
    );

    await expect(refreshOnce()).rejects.toBeInstanceOf(RefreshTransientError);
    expect(useSession.getState().accessToken).toBe("old");
    expect(useSession.getState().refreshToken).toBe("refresh");
    expect(useSession.getState().status).toBe("authenticated");
  });

  it("fails before the network when either token is missing", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(refreshOnce()).rejects.toBeInstanceOf(RefreshFailedError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("allows a fresh refresh after the previous one settled", async () => {
    useSession.setState({ accessToken: "oldA", refreshToken: "oldR", status: "authenticated" });
    const fetchMock = vi.fn(async () => okResponse({ accessToken: "A1", refreshToken: "R1" }));
    vi.stubGlobal("fetch", fetchMock);

    await refreshOnce();
    await refreshOnce();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

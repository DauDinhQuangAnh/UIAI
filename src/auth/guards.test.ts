import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { requireAuth } from "./guards";
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
afterEach(() => vi.restoreAllMocks());

describe("requireAuth — cold-load boot state machine", () => {
  it("passes immediately when an access token is already in memory (no network)", async () => {
    useSession.setState({ accessToken: "live", status: "authenticated" });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(requireAuth("/agents")).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("boot-refreshes from the cookie and passes when the server returns a session", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => okResponse({ access_token: "rehydrated" })));

    await expect(requireAuth("/agents")).resolves.toBeUndefined();
    expect(useSession.getState().accessToken).toBe("rehydrated");
  });

  it("throws a /login redirect when the boot refresh 401s (logged out)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => failResponse(401)));

    await expect(requireAuth("/agents")).rejects.toMatchObject({
      options: { to: "/login", search: { redirect: "/agents" } },
    });
  });
});

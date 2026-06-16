import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { requireAuth } from "./guards";
import { useSession } from "./session-store";

beforeEach(() => {
  useSession.setState({ accessToken: null, refreshToken: null, user: null, status: "idle" });
});

afterEach(() => vi.restoreAllMocks());

describe("requireAuth - authed route guard", () => {
  it("passes immediately when an access token is already in memory", async () => {
    useSession.setState({ accessToken: "live", status: "authenticated" });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(requireAuth("/agents")).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws a /login redirect when no access token is available", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(requireAuth("/agents")).rejects.toMatchObject({
      options: { to: "/login", search: { redirect: "/agents" } },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

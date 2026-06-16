import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient } from "./client";
import { useSession } from "@/auth/session-store";

// Resolve a fetch input (string | URL | Request) to a comparable URL + header reader.
function describeRequest(input: RequestInfo | URL): { url: string; header: (k: string) => string | null } {
  if (typeof input === "string") return { url: input, header: () => null };
  if (input instanceof URL) return { url: input.toString(), header: () => null };
  const req = input as Request;
  return { url: req.url, header: (k) => req.headers.get(k) };
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

beforeEach(() => {
  useSession.setState({ accessToken: null, user: null, status: "idle" });
});
afterEach(() => vi.restoreAllMocks());

describe("auth refresh interceptor (client middleware)", () => {
  it("does NOT refresh on a login 401 — credential failure stays generic", async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        calls.push(describeRequest(input).url);
        return json(401, { error: { code: "invalid_credentials" } });
      }),
    );

    const res = await apiClient.POST("/api/auth/login", {
      body: { tenant_slug: "t", email: "e@x.com", password: "bad" },
    });

    expect(res.response.status).toBe(401);
    expect(calls.some((u) => u.includes("/api/auth/refresh"))).toBe(false); // never refreshed
    expect(calls.filter((u) => u.includes("/api/auth/login"))).toHaveLength(1); // no replay loop
  });

  it("refreshes ONCE on a resource 401 then replays with the rotated token", async () => {
    // The refresh token rides the HttpOnly cookie now — nothing to seed in JS.
    useSession.setState({ accessToken: "old", status: "authenticated" });

    const calls: Array<{ url: string; auth: string | null; retry: string | null }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const d = describeRequest(input);
        calls.push({ url: d.url, auth: d.header("authorization"), retry: d.header("x-session-retry") });
        if (d.url.includes("/api/auth/refresh")) {
          return json(200, { access_token: "fresh" });
        }
        // First resource hit (old token) -> 401; the replayed hit (fresh token) -> 200.
        if (d.header("authorization") === "Bearer fresh") return json(200, { agents: [], next_cursor: {} });
        return json(401, { error: { code: "unauthorized" } });
      }),
    );

    const res = await apiClient.GET("/api/agents", { params: { query: { limit: 50 } } });

    expect(res.response.status).toBe(200);
    const refreshCalls = calls.filter((c) => c.url.includes("/api/auth/refresh"));
    expect(refreshCalls).toHaveLength(1); // exactly one refresh
    const replay = calls.find((c) => c.retry === "1");
    expect(replay?.auth).toBe("Bearer fresh"); // replay carried the rotated token
    expect(useSession.getState().accessToken).toBe("fresh");
  });
});

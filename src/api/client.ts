import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./schema";
import { API_BASE_URL, AUTH_LOGIN_PATH, AUTH_LOGOUT_PATH, AUTH_REFRESH_PATH } from "./config";
import { useSession } from "@/auth/session-store";
import { refreshOnce, RefreshFailedError, RefreshTransientError } from "@/auth/refresh-once";

// Marks a request that already retried after a refresh, so a second 401 doesn't
// loop back into another refresh.
const RETRY_HEADER = "x-session-retry";

function isAuthEndpoint(url: string): boolean {
  return url.includes(AUTH_LOGIN_PATH) || url.includes(AUTH_REFRESH_PATH) || url.includes(AUTH_LOGOUT_PATH);
}

const authMiddleware: Middleware = {
  onRequest({ request }) {
    // Never attach a Bearer to login/refresh (spec sets security:[] there; a stale
    // token must not leak onto them).
    if (isAuthEndpoint(request.url)) return request;
    const { accessToken, tokenType } = useSession.getState();
    if (accessToken) request.headers.set("Authorization", `${tokenType || "Bearer"} ${accessToken}`);
    return request;
  },

  async onResponse({ request, response }) {
    // 403 = role block (member hit an admin route). Hard failure — never refresh.
    // 401 on an auth endpoint (bad login / refresh reuse) is handled by the caller.
    if (response.status !== 401 || isAuthEndpoint(request.url)) return response;
    if (request.headers.get(RETRY_HEADER)) return response; // already retried once

    let newToken: string;
    try {
      newToken = await refreshOnce();
    } catch (err) {
      // Terminal (RefreshFailedError): session already wiped by refreshOnce → _app sees
      // unauthenticated and redirects to login. Transient (RefreshTransientError, network):
      // session kept → surface the 401 to THIS caller only, no global logout. Either way,
      // return the original 401 rather than throwing.
      if (err instanceof RefreshFailedError || err instanceof RefreshTransientError) return response;
      throw err;
    }

    // Replay the original request once with the rotated access token.
    const retried = new Request(request, {});
    retried.headers.set("Authorization", `${useSession.getState().tokenType || "Bearer"} ${newToken}`);
    retried.headers.set(RETRY_HEADER, "1");
    return fetch(retried);
  },
};

// Resolve globalThis.fetch lazily per call (rather than letting openapi-fetch bind
// it once at construction) so the browser's fetch is always used — and tests can
// swap the global fetch to drive the auth middleware deterministically.
export const apiClient = createClient<paths>({
  baseUrl: API_BASE_URL,
  // SAR auth uses Bearer tokens and refresh-token request bodies, so cross-origin calls
  // should not require browser credentials/cookies.
  credentials: "same-origin",
  fetch: (input) => globalThis.fetch(input),
});
apiClient.use(authMiddleware);

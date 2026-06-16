import { API_BASE_URL, AUTH_REFRESH_PATH } from "@/api/config";
import { useSession, type Session } from "./session-store";

// Thrown when a refresh fails TERMINALLY (server returned a non-200: reuse-detected /
// family-revoked / expired). The client can't tell these apart — the server returns one
// generic 401. The session is wiped and the user must re-login.
export class RefreshFailedError extends Error {
  constructor() {
    super("refresh_failed");
    this.name = "RefreshFailedError";
  }
}

// Thrown when a refresh fails TRANSIENTLY (network error — the request never reached the
// server, so the cookie was not consumed). The session is NOT wiped: boot-refresh now runs
// on every cold load, and a flaky-network blip must not force a needless credential re-entry.
export class RefreshTransientError extends Error {
  constructor() {
    super("refresh_transient");
    this.name = "RefreshTransientError";
  }
}

// In-tab single-flight: N concurrent 401s collapse into exactly ONE refresh call.
// Critical — the API revokes the whole token family on concurrent double-refresh,
// so naive per-request refresh logs the user out.
let inflight: Promise<string> | null = null;

const LOCK_NAME = "social-ai-auth-refresh";

/**
 * Refresh the access token, deduped within the tab and serialized across tabs.
 * Resolves with the new access token. Rejects with RefreshFailedError (terminal,
 * session wiped) or RefreshTransientError (network, session kept). Never auto-retries.
 */
export function refreshOnce(): Promise<string> {
  if (inflight) return inflight;
  inflight = runRefresh().finally(() => {
    inflight = null;
  });
  return inflight;
}

async function runRefresh(): Promise<string> {
  // Cross-tab serialization: two tabs cold-booting at once would otherwise BOTH present
  // the same pre-rotation cookie and trip the server's atomic Rotate family-revoke,
  // logging both out. The Web Locks API serializes them so the second tab refreshes only
  // after the first has rotated the cookie the browser now holds. (The lock's old reason —
  // re-reading a rotated token from localStorage — is gone; this race is the new reason.)
  if (typeof navigator !== "undefined" && "locks" in navigator) {
    return navigator.locks.request(LOCK_NAME, () => doRefresh());
  }
  return doRefresh();
}

async function doRefresh(): Promise<string> {
  // No body, no JS-side token: the HttpOnly cookie is sent automatically. credentials:
  // "include" MUST be here — refresh bypasses the openapi-fetch client entirely, so the
  // client's credentials setting does not apply to this raw fetch.
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${AUTH_REFRESH_PATH}`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Network error — the cookie was never consumed. Keep the session; surface transient.
    throw new RefreshTransientError();
  }

  if (!res.ok) {
    // Any non-200 is terminal: reuse-detected, family-revoked, or expired. Wipe + bail.
    useSession.getState().clear();
    throw new RefreshFailedError();
  }

  const session = (await res.json()) as Session;
  if (!session.access_token) {
    useSession.getState().clear();
    throw new RefreshFailedError();
  }
  useSession.getState().setSession(session);
  return session.access_token;
}

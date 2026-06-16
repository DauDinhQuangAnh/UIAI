import { API_BASE_URL, AUTH_REFRESH_PATH } from "@/api/config";
import { useSession, type Session } from "./session-store";

// Thrown when a refresh fails TERMINALLY (server returned a non-200). The session is
// wiped and the user must re-login.
export class RefreshFailedError extends Error {
  constructor() {
    super("refresh_failed");
    this.name = "RefreshFailedError";
  }
}

// Thrown when a refresh fails TRANSIENTLY (network error — the request never reached the
// server). The session is NOT wiped, so a flaky-network blip does not force a needless
// credential re-entry.
export class RefreshTransientError extends Error {
  constructor() {
    super("refresh_transient");
    this.name = "RefreshTransientError";
  }
}

// In-tab single-flight: N concurrent 401s collapse into exactly ONE refresh call.
let inflight: Promise<string> | null = null;

/**
 * Refresh the access token, deduped within the tab.
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
  return doRefresh();
}

async function doRefresh(): Promise<string> {
  const { accessToken, refreshToken } = useSession.getState();
  if (!accessToken || !refreshToken) {
    useSession.getState().clear();
    throw new RefreshFailedError();
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${AUTH_REFRESH_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, refreshToken }),
    });
  } catch {
    throw new RefreshTransientError();
  }

  if (!res.ok) {
    // Any non-200 is terminal for this session. Wipe + bail.
    useSession.getState().clear();
    throw new RefreshFailedError();
  }

  const session = (await res.json()) as Session;
  if (!session.accessToken) {
    useSession.getState().clear();
    throw new RefreshFailedError();
  }
  useSession.getState().setSession(session);
  return session.accessToken;
}

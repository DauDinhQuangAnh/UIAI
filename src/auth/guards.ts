import { redirect } from "@tanstack/react-router";
import { DEV_AUTH_BYPASS, useSession } from "./session-store";
import { refreshOnce } from "./refresh-once";

// Role hierarchy mirrors the server (internal/auth/roles.go): admin-gated actions
// require rank >= admin, so owner satisfies admin too.
const ROLE_RANK: Record<string, number> = { member: 1, admin: 2, owner: 3 };

export function roleRank(role: string | null | undefined): number {
  return (role && ROLE_RANK[role]) || 0;
}

export function isAdmin(role: string | null | undefined): boolean {
  return roleRank(role) >= ROLE_RANK.admin;
}

/**
 * Route guard for the authed layout. If an access token is in memory, pass. Otherwise
 * (cold load / after a wipe) ALWAYS attempt one bootstrap refresh — the refresh token is
 * an HttpOnly cookie JS cannot read, so the only way to learn if a session is resumable is
 * to try. On success, pass. On any failure (terminal = wiped by refreshOnce; transient =
 * network, session kept), redirect to /login since there is no usable token to proceed.
 * Throwing redirect short-circuits the load (TanStack awaits this beforeLoad → no flash).
 */
export async function requireAuth(currentPath: string): Promise<void> {
  if (DEV_AUTH_BYPASS) return;
  if (useSession.getState().accessToken) return;
  try {
    await refreshOnce();
    return;
  } catch {
    throw redirect({ to: "/login", search: { redirect: currentPath } });
  }
}

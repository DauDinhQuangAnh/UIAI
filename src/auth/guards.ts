import { redirect } from "@tanstack/react-router";
import { useSession } from "./session-store";

// Role hierarchy mirrors the server (internal/auth/roles.go): admin-gated actions
// require rank >= admin, so owner satisfies admin too.
const ROLE_RANK: Record<string, number> = { member: 1, admin: 2, owner: 3 };

export function roleRank(role: string | null | undefined): number {
  return (role && ROLE_RANK[role.toLowerCase()]) || 0;
}

export function isAdmin(role: string | null | undefined): boolean {
  return roleRank(role) >= ROLE_RANK.admin;
}

/**
 * Route guard for the authed layout. The SAR API expects refresh requests to include
 * the previous access token, so a session without an access token cannot be bootstrapped.
 * Expired access tokens are refreshed reactively by the API client after a 401.
 */
export async function requireAuth(currentPath: string): Promise<void> {
  if (useSession.getState().accessToken) return;
  throw redirect({ to: "/login", search: { redirect: currentPath } });
}

import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { requireAuth } from "@/auth/guards";
import { useSession } from "@/auth/session-store";
import { useMe } from "@/api/hooks/auth";
import { AppShell } from "@/components/shell/app-shell";

// Authed layout. The guard ensures a valid access token before any child route loads —
// on a cold load it awaits a bootstrap refresh against the HttpOnly cookie. That network
// round-trip is gated by BootPending (pendingMs:0 → shown immediately) so the user sees a
// calm full-page spinner, never a blank screen or an auth flash, until the guard resolves.
export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ location }) => {
    await requireAuth(location.pathname);
  },
  pendingComponent: BootPending,
  pendingMs: 0,
  component: AppLayout,
});

function BootPending() {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-surface" role="status" aria-live="polite">
      <span
        className="size-8 animate-spin rounded-full border-2 border-border border-t-brand-500"
        aria-hidden
      />
      <span className="sr-only">Loading your workspace…</span>
    </div>
  );
}

function AppLayout() {
  const navigate = useNavigate();
  const status = useSession((s) => s.status);
  // Populate the current user once a token exists.
  useMe();

  // Reactive logout: if a refresh fails mid-session (status -> unauthenticated),
  // leave the authed area immediately. beforeLoad covers fresh loads.
  useEffect(() => {
    if (status === "unauthenticated") {
      navigate({ to: "/login" });
    }
  }, [status, navigate]);

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

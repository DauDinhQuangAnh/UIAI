import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { requireAuth } from "@/auth/guards";
import { useSession } from "@/auth/session-store";
import { useMe, useMePermissions } from "@/api/hooks/auth";
import { AppShell } from "@/components/shell/app-shell";

// Authed layout. The guard requires an access token before any child route loads; expired
// tokens are refreshed reactively by the API client after a 401.
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
      <span className="sr-only">Đang tải không gian làm việc của bạn…</span>
    </div>
  );
}

function AppLayout() {
  const navigate = useNavigate();
  const status = useSession((s) => s.status);
  // Populate the current user once a token exists.
  useMe();
  useMePermissions();

  // Reactive logout: if refresh fails mid-session (status -> unauthenticated),
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

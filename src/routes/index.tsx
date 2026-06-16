import { createFileRoute, redirect } from "@tanstack/react-router";

// Entry redirect. The `/_app` guard decides whether the persisted SAR session is usable
// and bounces to /login when no access token is available.
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/agents" });
  },
});

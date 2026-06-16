import { createFileRoute, redirect } from "@tanstack/react-router";

// Entry redirect. The refresh token is an HttpOnly cookie JS cannot read, so there is no
// session signal to test here — always route into the app. The `/_app` guard then performs
// the cookie exchange (boot refresh) and bounces to /login on a 401.
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/agents" });
  },
});

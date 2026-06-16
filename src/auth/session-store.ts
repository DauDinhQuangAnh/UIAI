import { create } from "zustand";
import type { components } from "@/api/schema";

export type Me = components["schemas"]["Me"];
export type Session = components["schemas"]["Session"];

export type SessionStatus = "idle" | "authenticated" | "unauthenticated";

// Temporary FE-only bypass so the dashboard can be opened without a backend login.
// Set this back to false and restore the empty initial session before wiring real auth.
export const DEV_AUTH_BYPASS = true;

const DEV_USER: Me = {
  email: "fe-dev@local.test",
  display_name: "FE Dev",
  role: "admin",
};

// In-memory only. The access JWT lives here (never persisted — reduces XSS exfil), and
// the rotating refresh token is no longer in JS at all: it rides an HttpOnly cookie the
// browser manages, so there is nothing to persist or read here. On a cold load the store
// starts at `idle` and the boot guard reconstructs the session by attempting a refresh
// (the cookie is the only durable signal).
interface SessionState {
  accessToken: string | null;
  user: Me | null;
  status: SessionStatus;
  setSession: (session: Session) => void;
  setUser: (user: Me) => void;
  clear: () => void;
}

export const useSession = create<SessionState>()((set) => ({
  accessToken: null,
  user: DEV_AUTH_BYPASS ? DEV_USER : null,
  status: DEV_AUTH_BYPASS ? "authenticated" : "idle",
  setSession: (session) =>
    set({
      accessToken: session.access_token ?? null,
      status: session.access_token ? "authenticated" : "unauthenticated",
    }),
  setUser: (user) => set({ user, status: "authenticated" }),
  clear: () => set({ accessToken: null, user: null, status: "unauthenticated" }),
}));

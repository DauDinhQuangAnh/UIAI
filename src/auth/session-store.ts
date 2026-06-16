import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface AuthRole {
  id?: string;
  name?: string;
  code?: string;
}

export interface Me {
  id?: string;
  username?: string;
  email?: string;
  firstTimeLogin?: boolean;
  display_name?: string | null;
  role?: string;
  roleInfo?: AuthRole;
}

export interface AuthMenuPage {
  pageId?: string;
  pageName?: string;
  pageCode?: string;
  route?: string;
  icon?: string | null;
  displayOrder?: number;
  requiredPermission?: string;
}

export interface AuthMenu {
  featureId?: string;
  featureName?: string;
  featureCode?: string;
  displayOrder?: number;
  pages?: AuthMenuPage[];
}

export interface Session {
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  permissions?: string[];
  menus?: AuthMenu[];
}

export type SessionStatus = "idle" | "authenticated" | "unauthenticated";

// SAR auth returns access/refresh tokens in JSON. We persist the session so reloads keep
// the user signed in, then rotate both tokens whenever refresh succeeds.
interface SessionState {
  accessToken: string | null;
  refreshToken: string | null;
  tokenType: string;
  expiresIn: number | null;
  permissions: string[];
  menus: AuthMenu[];
  user: Me | null;
  status: SessionStatus;
  setSession: (session: Session) => void;
  setUser: (user: Me) => void;
  setPermissions: (permissions: string[], menus: AuthMenu[]) => void;
  setAuth: (session: Session, user: Me | null) => void;
  clear: () => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      tokenType: "Bearer",
      expiresIn: null,
      permissions: [],
      menus: [],
      user: null,
      status: "idle",
      setSession: (session) =>
        set((state) => ({
          accessToken: session.accessToken ?? null,
          refreshToken: session.refreshToken ?? null,
          tokenType: session.tokenType ?? "Bearer",
          expiresIn: session.expiresIn ?? null,
          permissions: session.permissions ?? state.permissions,
          menus: session.menus ?? state.menus,
          status: session.accessToken ? "authenticated" : "unauthenticated",
        })),
      setUser: (user) => set({ user, status: "authenticated" }),
      setPermissions: (permissions, menus) => set({ permissions, menus }),
      setAuth: (session, user) =>
        set({
          accessToken: session.accessToken ?? null,
          refreshToken: session.refreshToken ?? null,
          tokenType: session.tokenType ?? "Bearer",
          expiresIn: session.expiresIn ?? null,
          permissions: session.permissions ?? [],
          menus: session.menus ?? [],
          user,
          status: session.accessToken ? "authenticated" : "unauthenticated",
        }),
      clear: () =>
        set({
          accessToken: null,
          refreshToken: null,
          tokenType: "Bearer",
          expiresIn: null,
          permissions: [],
          menus: [],
          user: null,
          status: "unauthenticated",
        }),
    }),
    {
      name: "sar-auth-session",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        tokenType: state.tokenType,
        expiresIn: state.expiresIn,
        permissions: state.permissions,
        menus: state.menus,
        user: state.user,
        status: state.status,
      }),
    },
  ),
);

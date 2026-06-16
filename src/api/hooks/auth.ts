import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useSession, type AuthMenu, type AuthRole, type Me, type Session } from "@/auth/session-store";

// Thrown by auth mutations carrying the HTTP status + parsed error body so screens
// can branch (e.g. login 401 -> ONE generic message; 400 -> "check your input").
export class AuthRequestError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown) {
    super(`auth_request_failed_${status}`);
    this.name = "AuthRequestError";
    this.status = status;
    this.body = body;
  }
}

export interface LoginInput {
  usernameOrEmail: string;
  password: string;
}

interface LoginResponse extends Session {
  user?: AuthUser;
  role?: AuthRole;
  permissions?: string[];
}

interface AuthUser {
  id?: string;
  username?: string;
  email?: string;
  firstTimeLogin?: boolean;
}

interface ProfileResponse extends AuthUser {
  role?: AuthRole;
}

interface PermissionsResponse {
  user?: AuthUser;
  role?: AuthRole;
  permissions?: string[];
  menus?: AuthMenu[];
}

function isLoginResponse(profile: ProfileResponse | LoginResponse): profile is LoginResponse {
  return "accessToken" in profile || "refreshToken" in profile || "permissions" in profile || "user" in profile;
}

function normalizeUser(profile: ProfileResponse | LoginResponse): Me {
  const rawUser = isLoginResponse(profile) ? profile.user : profile;
  const roleInfo = profile.role;
  return {
    id: rawUser?.id,
    username: rawUser?.username,
    email: rawUser?.email,
    firstTimeLogin: rawUser?.firstTimeLogin,
    display_name: rawUser?.username ?? rawUser?.email ?? null,
    role: roleInfo?.code ?? roleInfo?.name,
    roleInfo,
  };
}

// login -> store session -> fetch /me. Login is excluded from the refresh
// interceptor, so a 401 here is a real credential failure, never a refresh.
export function useLogin() {
  const setAuth = useSession((s) => s.setAuth);
  const setUser = useSession((s) => s.setUser);
  const setPermissions = useSession((s) => s.setPermissions);
  return useMutation({
    mutationFn: async (input: LoginInput): Promise<Me> => {
      const { data, error, response } = await apiClient.POST("/api/auth/login", { body: input });
      if (error || !data) throw new AuthRequestError(response.status, error);
      const loginData = data as LoginResponse;
      setAuth(loginData, normalizeUser(loginData));
      const me = await apiClient.GET("/api/me");
      if (me.error || !me.data) throw new AuthRequestError(me.response.status, me.error);
      const user = normalizeUser(me.data as ProfileResponse);
      setUser(user);
      const permissions = await apiClient.GET("/api/me/permissions");
      if (permissions.error || !permissions.data) {
        throw new AuthRequestError(permissions.response.status, permissions.error);
      }
      const permissionsData = permissions.data as PermissionsResponse;
      setPermissions(permissionsData.permissions ?? [], permissionsData.menus ?? []);
      return user;
    },
  });
}

// Current user. Enabled only when an access token exists.
export function useMe() {
  const accessToken = useSession((s) => s.accessToken);
  const setUser = useSession((s) => s.setUser);
  return useQuery({
    queryKey: ["auth", "me"],
    enabled: !!accessToken,
    queryFn: async (): Promise<Me> => {
      const { data, error, response } = await apiClient.GET("/api/me");
      if (error || !data) throw new AuthRequestError(response.status, error);
      const user = normalizeUser(data as ProfileResponse);
      setUser(user);
      return user;
    },
  });
}

// Permissions + backend-driven menu tree. This is fetched on app boot/reload and after
// login so navigation/action visibility can follow the current user's role.
export function useMePermissions() {
  const accessToken = useSession((s) => s.accessToken);
  const setPermissions = useSession((s) => s.setPermissions);
  return useQuery({
    queryKey: ["auth", "permissions"],
    enabled: !!accessToken,
    queryFn: async (): Promise<PermissionsResponse> => {
      const { data, error, response } = await apiClient.GET("/api/me/permissions");
      if (error || !data) throw new AuthRequestError(response.status, error);
      const permissions = data as PermissionsResponse;
      setPermissions(permissions.permissions ?? [], permissions.menus ?? []);
      return permissions;
    },
  });
}

// Logout revokes refresh tokens server-side; the access JWT survives until expiry
// (~15m), so the client also clears local state immediately and proactively.
export function useLogout() {
  const clear = useSession((s) => s.clear);
  const refreshToken = useSession((s) => s.refreshToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (refreshToken) {
        await apiClient.POST("/api/auth/logout", { body: { refreshToken } }); // best-effort; clear regardless
      }
    },
    onSettled: () => {
      clear();
      queryClient.clear();
    },
  });
}

export interface PasswordChangeInput {
  current_password: string;
  new_password: string;
}

// Change password. Like logout, only revokes refresh tokens — copy must reflect
// that background sessions end within ~15m, not "logs out all sessions" instantly.
export function useChangePassword() {
  const clear = useSession((s) => s.clear);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PasswordChangeInput) => {
      const { error, response } = await apiClient.POST("/api/auth/password", { body: input });
      if (error) throw new AuthRequestError(response.status, error);
    },
    onSuccess: () => {
      // Refresh tokens are now revoked; drop local session and force re-login.
      clear();
      queryClient.clear();
    },
  });
}

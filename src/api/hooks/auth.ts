import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { useSession, type Me } from "@/auth/session-store";

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
  tenant_slug: string;
  email: string;
  password: string;
}

// login -> store session -> fetch /me. Login is excluded from the refresh
// interceptor, so a 401 here is a real credential failure, never a refresh.
export function useLogin() {
  const setSession = useSession((s) => s.setSession);
  const setUser = useSession((s) => s.setUser);
  return useMutation({
    mutationFn: async (input: LoginInput): Promise<Me> => {
      const { data, error, response } = await apiClient.POST("/api/auth/login", { body: input });
      if (error || !data) throw new AuthRequestError(response.status, error);
      setSession(data);
      const me = await apiClient.GET("/api/auth/me");
      if (me.error || !me.data) throw new AuthRequestError(me.response.status, me.error);
      setUser(me.data);
      return me.data;
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
      const { data, error, response } = await apiClient.GET("/api/auth/me");
      if (error || !data) throw new AuthRequestError(response.status, error);
      setUser(data);
      return data;
    },
  });
}

// Logout revokes refresh tokens server-side; the access JWT survives until expiry
// (~15m), so the client also clears local state immediately and proactively.
export function useLogout() {
  const clear = useSession((s) => s.clear);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.POST("/api/auth/logout"); // best-effort; clear regardless
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

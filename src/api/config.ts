// Same-origin by default: the SPA is served from the Go gateway, so a relative
// "/api/..." needs no base URL and no CORS. In dev, Vite proxies /api to the
// backend. VITE_API_BASE_URL can override for non-proxied setups.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export const AUTH_REFRESH_PATH = "/api/auth/refresh";
export const AUTH_LOGIN_PATH = "/api/auth/login";

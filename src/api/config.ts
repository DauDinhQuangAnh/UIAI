// Same-origin by default. In dev, Vite proxies /api to the SAR backend; production
// should serve the SPA and API from the same origin or provide VITE_API_BASE_URL.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export const AUTH_REFRESH_PATH = "/api/auth/refresh-token";
export const AUTH_LOGIN_PATH = "/api/auth/login";
export const AUTH_LOGOUT_PATH = "/api/auth/logout";

export const META_APP_ID = import.meta.env.VITE_META_APP_ID ?? "";
export const META_APP_SECRET = import.meta.env.VITE_META_APP_SECRET ?? "";
export const META_OAUTH_CALLBACK_URL = import.meta.env.VITE_META_OAUTH_CALLBACK_URL ?? "";
export const META_OAUTH_CALLBACK_PATH = "/meta/callback";

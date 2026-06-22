/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_FACEBOOK_OAUTH_CALLBACK_URL?: string;
  readonly VITE_META_APP_ID?: string;
  readonly VITE_META_APP_SECRET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

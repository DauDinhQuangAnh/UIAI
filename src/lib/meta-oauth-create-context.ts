import type { MetaOAuthPage } from "@/api/social-media-types";

const PENDING_KEY = "sar.socialMedia.metaCreate.pending";
const RESULT_KEY = "sar.socialMedia.metaCreate.result";

export interface MetaCreatePendingContext {
  businessPartnerId: string;
  appId: string;
}

export interface MetaCreateOAuthResult {
  businessPartnerId: string;
  appId: string;
  pages: MetaOAuthPage[];
}

export function storeMetaCreatePendingContext(context: MetaCreatePendingContext): void {
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(context));
}

export function readMetaCreatePendingContext(): MetaCreatePendingContext | null {
  return readJson<MetaCreatePendingContext>(PENDING_KEY);
}

export function clearMetaCreatePendingContext(): void {
  sessionStorage.removeItem(PENDING_KEY);
}

export function storeMetaCreateOAuthResult(result: MetaCreateOAuthResult): void {
  sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
}

export function consumeMetaCreateOAuthResult(): MetaCreateOAuthResult | null {
  const result = readJson<MetaCreateOAuthResult>(RESULT_KEY);
  sessionStorage.removeItem(RESULT_KEY);
  return result;
}

function readJson<T>(key: string): T | null {
  const raw = sessionStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    sessionStorage.removeItem(key);
    return null;
  }
}

export type FacebookOAuthFlow = "add-link" | "reauthorize";

export interface FacebookOAuthContext {
  businessPartnerId: string;
  integrationId?: string;
  appId?: string;
  state?: string;
  flow?: FacebookOAuthFlow;
  resumePageSelection?: boolean;
}

const FACEBOOK_OAUTH_CONTEXT_KEY = "reo-ai.facebook-oauth-context";

export function storeFacebookOAuthContext(context: FacebookOAuthContext) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(FACEBOOK_OAUTH_CONTEXT_KEY, JSON.stringify(context));
}

export function readFacebookOAuthContext(): FacebookOAuthContext | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(FACEBOOK_OAUTH_CONTEXT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<FacebookOAuthContext>;
    if (!parsed.businessPartnerId) return null;
    return {
      businessPartnerId: parsed.businessPartnerId,
      integrationId: parsed.integrationId,
      appId: parsed.appId,
      state: parsed.state,
      flow: parsed.flow,
      resumePageSelection: parsed.resumePageSelection,
    };
  } catch {
    return null;
  }
}

export function clearFacebookOAuthContext() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(FACEBOOK_OAUTH_CONTEXT_KEY);
}

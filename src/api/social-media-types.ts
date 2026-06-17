export interface SocialMediaProvider {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

export interface SocialMediaIntegrationSummary {
  id: string;
  providerName: string;
  providerCode: string;
  appId: string;
  status: string;
  authorizedAt?: string | null;
  pagesCount: number;
  activeBotPagesCount: number;
  pages?: SocialMediaLinkedPage[];
  selectedPages?: SocialMediaLinkedPage[];
}

export interface SocialMediaIntegrationDetail extends SocialMediaIntegrationSummary {
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface SocialMediaLinkedPage {
  externalPageId: string;
  pageName: string;
  username?: string | null;
  status?: string | null;
}

export interface FacebookAppConfigRequest {
  appId: string;
  appSecret: string;
}

export interface FacebookAppConfigResponse {
  integrationId: string;
  businessPartnerId: string;
  providerCode: string;
  appId: string;
  status: string;
}

export interface FacebookOAuthStartRequest {
  redirectUri: string;
}

export interface FacebookOAuthStartResponse {
  authorizationUrl: string;
  state: string;
}

export interface FacebookOAuthCallbackResponse {
  success: boolean;
  businessPartnerId?: string | null;
  integrationId?: string | null;
  status?: string | null;
  message?: string | null;
}

export interface FacebookManagedPage {
  externalPageId: string;
  pageName: string;
  username?: string | null;
  avatarUrl?: string | null;
  pageAccessToken: string;
}

export interface FacebookPagesResponse {
  integrationId: string;
  pages: FacebookManagedPage[];
}

export interface SaveFacebookPagesRequest {
  pages: FacebookManagedPage[];
}

export interface SaveFacebookPagesResponse {
  message: string;
}

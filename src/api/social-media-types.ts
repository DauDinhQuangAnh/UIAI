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
}

export interface SocialMediaIntegrationDetail extends SocialMediaIntegrationSummary {
  createdAt?: string | null;
  updatedAt?: string | null;
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

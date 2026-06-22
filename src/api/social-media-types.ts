export interface SocialMediaProvider {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export interface SocialMediaIntegrationSummary {
  id: string;
  providerName: string;
  providerCode: string;
  appId: string;
  status: string;
  authorizedAt?: string | null;
  businessPartnerId?: string | null;
  lastSyncedAt?: string | null;
  externalUserId?: string | null;
  externalUserName?: string | null;
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
  id?: string;
  externalPageId: string;
  pageName: string;
  username?: string | null;
  pageAvatarUrl?: string | null;
  isBotEnabled?: boolean;
  isActive?: boolean;
  status?: string | null;
  schedules?: SocialMediaPageSchedule[] | null;
}

export interface SocialMediaPageSchedule {
  id?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  timeZoneId?: string | null;
  isActive?: boolean;
}

export interface BotScheduleRequest {
  timezone?: string | null;
  workingDays: string[];
  startTime: string;
  endTime: string;
}

export interface MetaLoginUrlResponse {
  loginUrl: string;
  state: string;
  expiresAt?: string | null;
}

export interface MetaOAuthCallbackRequest {
  redirectUrl: string;
  code?: string | null;
  state?: string | null;
  error?: string | null;
  errorReason?: string | null;
  errorDescription?: string | null;
}

export interface MetaOAuthPage {
  pageId: string;
  pageName: string;
  avatarUrl?: string | null;
  hasAccessToken: boolean;
}

export interface MetaOAuthCallbackResponse {
  success: boolean;
  message?: string | null;
  pages: MetaOAuthPage[];
}

export interface UpdateSocialMediaPageRequest {
  status: string;
  botSchedule: BotScheduleRequest;
}

export interface UpdateSocialMediaPageResponse {
  pageId: string;
  status: string;
  schedules: SocialMediaPageSchedule[];
}

export interface CreateSocialMediaPageRequest {
  externalPageId: string;
  pageName: string;
  pageAvatarUrl?: string | null;
  pageImageUrl?: string | null;
  status?: string | null;
  botSchedule: BotScheduleRequest;
}

export interface CreateSocialMediaIntegrationRequest {
  provider: string;
  appId: string;
  appSecret: string;
  pages: CreateSocialMediaPageRequest[];
}

export interface CreatedSocialMediaPage {
  id: string;
  externalPageId: string;
  pageName: string;
  isBotEnabled: boolean;
  isActive: boolean;
  schedulesCount: number;
}

export interface CreateSocialMediaIntegrationResponse {
  businessPartnerId: string;
  integrationId: string;
  providerCode: string;
  appId: string;
  status: string;
  pages: CreatedSocialMediaPage[];
  message?: string | null;
}

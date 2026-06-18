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

export interface CreateSocialMediaIntegrationPageRequest {
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
  pages: CreateSocialMediaIntegrationPageRequest[];
}

export interface CreateSocialMediaIntegrationPageResponse {
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
  pages: CreateSocialMediaIntegrationPageResponse[];
  message?: string | null;
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

export interface BotWorkingScheduleRequest {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export interface FacebookManagedPage {
  externalPageId: string;
  pageName: string;
  username?: string | null;
  avatarUrl?: string | null;
  pageAvatarUrl?: string | null;
  pageAccessToken: string;
  isSelected?: boolean;
  isBotEnabled?: boolean;
}

export interface FacebookPagesResponse {
  integrationId: string;
  pages: FacebookManagedPage[];
}

export interface SaveFacebookPageRequest {
  externalPageId: string;
  pageName: string;
  pageAvatarUrl?: string | null;
  pageAccessToken: string;
  schedules?: BotWorkingScheduleRequest[];
}

export interface SaveFacebookPagesRequest {
  pages: SaveFacebookPageRequest[];
}

export interface SaveFacebookPagesResponse {
  message: string;
}

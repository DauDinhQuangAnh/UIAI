import type { BusinessPartner } from "@/components/business/information/business-information-data";
import type { SocialMediaIntegrationSummary, SocialMediaLinkedPage } from "@/api/social-media-types";

export type ProviderFilter = "FACEBOOK" | "TIKTOK";
export type CreateStep = "config" | "pages" | "schedule";
export type ScheduleMode = "full" | "part";
export type ManageBotMode = "inactive" | "full" | "part";
export type DayOfWeekName = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

export interface PageScheduleDraft {
  mode: ScheduleMode;
  timezone: string;
  workingDays: DayOfWeekName[];
  startTime: string;
  endTime: string;
}

export interface SocialMediaCreatePageDraft {
  localId: string;
  externalPageId: string;
  pageName: string;
  username?: string | null;
  pageAvatarUrl: string;
  pageImageUrl: string;
  pageAccessToken: string;
  status: "Active" | "Inactive";
  schedule: PageScheduleDraft;
}

export interface SocialMediaCreateForm {
  businessPartnerId: string;
  appId: string;
  appSecret: string;
  pages: SocialMediaCreatePageDraft[];
}

export interface ManageConfigForm {
  businessPartnerId: string;
  appSecret: string;
  botMode: ManageBotMode;
  schedule: PageScheduleDraft;
}

export interface RefreshTokenForm {
  businessPartnerId: string;
  appSecret: string;
}

export type CreateFormErrors = Partial<Record<"businessPartnerId" | "appId" | "appSecret" | "pages" | "schedule", string>>;

export interface SocialMediaIntegrationRow {
  business: BusinessPartner;
  integration: SocialMediaIntegrationSummary;
}

export interface SocialMediaTableRow extends SocialMediaIntegrationRow {
  page: SocialMediaLinkedPage | null;
  rowKey: string;
}


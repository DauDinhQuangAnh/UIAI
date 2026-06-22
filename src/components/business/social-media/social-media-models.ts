import type { BusinessPartner } from "@/components/business/information/business-information-data";
import type { SocialMediaIntegrationSummary, SocialMediaLinkedPage } from "@/api/social-media-types";

export type ProviderFilter = "FACEBOOK" | "TIKTOK";
export type CreateStep = "config" | "pages" | "schedule";
export type ScheduleMode = "full" | "part";
export type ManageBotMode = "inactive" | "full" | "part";
export type DayOfWeekName = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

export interface DaySchedule {
  fullDay: boolean;
  startTime: string;
  endTime: string;
}

export interface PageScheduleDraft {
  mode: ScheduleMode;
  timezone: string;
  daySchedules: Partial<Record<DayOfWeekName, DaySchedule>>;
}

export interface SocialMediaCreatePageDraft {
  localId: string;
  externalPageId: string;
  pageName: string;
  username?: string | null;
  pageAvatarUrl: string;
  pageImageUrl: string;
  status: "Active" | "Inactive";
  schedule: PageScheduleDraft;
}

export interface SocialMediaSelectablePage {
  externalPageId: string;
  pageName: string;
  username?: string | null;
  pageAvatarUrl?: string | null;
  pageImageUrl?: string | null;
}

export interface SocialMediaCreateForm {
  businessPartnerId: string;
  appId: string;
  appSecret: string;
  pages: SocialMediaCreatePageDraft[];
}

export interface ManageConfigForm {
  businessPartnerId: string;
  botMode: ManageBotMode;
  schedule: PageScheduleDraft;
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

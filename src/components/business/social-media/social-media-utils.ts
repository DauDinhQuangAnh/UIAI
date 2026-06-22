import { ApiRequestError, errorMessage } from "@/api/errors";
import { META_APP_ID, META_APP_SECRET } from "@/api/config";
import type {
  BotScheduleRequest,
  CreateSocialMediaIntegrationRequest,
  CreateSocialMediaPageRequest,
  SocialMediaIntegrationSummary,
  SocialMediaLinkedPage,
  UpdateSocialMediaPageRequest,
} from "@/api/social-media-types";
import type {
  CreateFormErrors,
  DayOfWeekName,
  DaySchedule,
  ManageBotMode,
  ManageConfigForm,
  PageScheduleDraft,
  SocialMediaCreateForm,
  SocialMediaCreatePageDraft,
  SocialMediaIntegrationRow,
  SocialMediaSelectablePage,
  SocialMediaTableRow,
} from "./social-media-models";

export function createSocialMediaIntegrationPayload(form: SocialMediaCreateForm): CreateSocialMediaIntegrationRequest {
  return {
    provider: "Facebook",
    appId: form.appId.trim(),
    appSecret: form.appSecret.trim(),
    pages: form.pages.map(createSocialMediaPagePayload),
  };
}

function createSocialMediaPagePayload(page: SocialMediaCreatePageDraft): CreateSocialMediaPageRequest {
  return {
    externalPageId: page.externalPageId.trim(),
    pageName: page.pageName.trim(),
    pageAvatarUrl: nullableTrim(page.pageAvatarUrl),
    pageImageUrl: nullableTrim(page.pageImageUrl),
    status: page.status,
    botSchedule: botScheduleFromDraft(page.schedule),
  };
}

export const DEFAULT_TIMEZONE = "Asia/Ho_Chi_Minh";
export const FULL_TIME_START = "00:00";
export const FULL_TIME_END = "23:59";
export const DEFAULT_PART_TIME_START = "08:00";
export const DEFAULT_PART_TIME_END = "17:30";
export const APP_SECRET_MASK = "••••••••••••••••••••••••";

export const DAY_OPTIONS: { value: DayOfWeekName; label: string; shortLabel: string }[] = [
  { value: "Monday", label: "Thứ 2", shortLabel: "T2" },
  { value: "Tuesday", label: "Thứ 3", shortLabel: "T3" },
  { value: "Wednesday", label: "Thứ 4", shortLabel: "T4" },
  { value: "Thursday", label: "Thứ 5", shortLabel: "T5" },
  { value: "Friday", label: "Thứ 6", shortLabel: "T6" },
  { value: "Saturday", label: "Thứ 7", shortLabel: "T7" },
  { value: "Sunday", label: "Chủ nhật", shortLabel: "CN" },
];

export function buildSocialMediaTableRows(rows: SocialMediaIntegrationRow[]): SocialMediaTableRow[] {
  return rows.flatMap((row) => {
    const pages = integrationPages(row.integration);
    if (pages.length === 0) {
      const tableRow: SocialMediaTableRow = { ...row, page: null, rowKey: `${row.business.id}:${row.integration.id}` };
      return [tableRow];
    }
    return pages.map<SocialMediaTableRow>((page) => ({
      ...row,
      page,
      rowKey: `${row.business.id}:${row.integration.id}:${page.id || page.externalPageId || page.pageName}`,
    }));
  });
}

export function integrationPages(integration: SocialMediaIntegrationSummary): SocialMediaLinkedPage[] {
  if (integration.selectedPages && integration.selectedPages.length > 0) return integration.selectedPages;
  if (integration.pages && integration.pages.length > 0) return integration.pages;
  return [];
}

export function displayPageName(page: SocialMediaLinkedPage | null, integration: SocialMediaIntegrationSummary): string {
  if (page?.pageName) return page.pageName;
  if (page?.username) return page.username;
  if (integration.pagesCount > 0) return `${integration.pagesCount} trang đã chọn`;
  return "Chưa chọn trang";
}

export function displayDeleteTargetName(row: SocialMediaTableRow): string {
  return `${row.business.brandName} / ${providerCode(row.integration)}`;
}

export function providerCode(integration: SocialMediaIntegrationSummary): string {
  const code = integration.providerCode.trim().toUpperCase();
  if (code) return code;
  return integration.providerName.trim().toUpperCase();
}

export function isFacebookIntegration(integration: SocialMediaIntegrationSummary): boolean {
  return providerCode(integration) === "FACEBOOK";
}

export function blankScheduleDraft(): PageScheduleDraft {
  return {
    mode: "full",
    timezone: DEFAULT_TIMEZONE,
    daySchedules: {},
  };
}

export function defaultPartScheduleDraft(): PageScheduleDraft {
  const weekdays: DayOfWeekName[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const daySchedules: Partial<Record<DayOfWeekName, DaySchedule>> = {};
  for (const day of weekdays) {
    daySchedules[day] = { fullDay: false, startTime: DEFAULT_PART_TIME_START, endTime: DEFAULT_PART_TIME_END };
  }
  return { mode: "part", timezone: DEFAULT_TIMEZONE, daySchedules };
}

export function manageBotModeFromPage(page: SocialMediaLinkedPage | null): ManageBotMode {
  const normalizedStatus = page?.status?.trim().toLowerCase();
  if (!page || normalizedStatus === "inactive" || page.isActive === false || page.isBotEnabled === false) {
    return "inactive";
  }
  return scheduleDraftFromPage(page).mode === "full" ? "full" : "part";
}

export function scheduleDraftFromPage(page: SocialMediaLinkedPage | null): PageScheduleDraft {
  const schedules = (page?.schedules ?? []).filter((schedule) => schedule.isActive !== false);
  if (schedules.length === 0) return blankScheduleDraft();

  const fullTime = DAY_OPTIONS.every((day) =>
    schedules.some(
      (schedule) =>
        normalizeDay(schedule.dayOfWeek) === day.value &&
        schedule.startTime === FULL_TIME_START &&
        schedule.endTime === FULL_TIME_END,
    ),
  );
  if (fullTime) return blankScheduleDraft();

  const timezone = schedules[0]?.timeZoneId || DEFAULT_TIMEZONE;
  const daySchedules: Partial<Record<DayOfWeekName, DaySchedule>> = {};

  for (const schedule of schedules) {
    const day = normalizeDay(schedule.dayOfWeek);
    if (!isDayOfWeekName(day)) continue;
    const isFullDay = schedule.startTime === FULL_TIME_START && schedule.endTime === FULL_TIME_END;
    daySchedules[day] = {
      fullDay: isFullDay,
      startTime: schedule.startTime || DEFAULT_PART_TIME_START,
      endTime: schedule.endTime || DEFAULT_PART_TIME_END,
    };
  }

  return { mode: "part", timezone, daySchedules };
}

export function managePagePayload(form: ManageConfigForm): UpdateSocialMediaPageRequest {
  return {
    status: form.botMode === "inactive" ? "Inactive" : "Active",
    botSchedule: botScheduleFromDraft(form.botMode === "full" ? blankScheduleDraft() : form.schedule),
  };
}

export function botScheduleFromDraft(draft: PageScheduleDraft): BotScheduleRequest {
  const timezone = draft.timezone.trim() || DEFAULT_TIMEZONE;

  if (draft.mode === "full") {
    return {
      timezone,
      workingDays: DAY_OPTIONS.map((d) => d.value),
      startTime: FULL_TIME_START,
      endTime: FULL_TIME_END,
    };
  }

  const activeDays = DAY_OPTIONS
    .filter((d) => draft.daySchedules[d.value as DayOfWeekName])
    .map((d) => ({ day: d.value as DayOfWeekName, config: draft.daySchedules[d.value as DayOfWeekName]! }));

  if (activeDays.length === 0) {
    return { timezone, workingDays: [], startTime: DEFAULT_PART_TIME_START, endTime: DEFAULT_PART_TIME_END };
  }

  // Find first non-full-day time to use as primary; fall back to 00:00-23:59 if all are "Cả ngày"
  const firstPartDay = activeDays.find((x) => !x.config.fullDay);
  const startTime = firstPartDay?.config.startTime ?? FULL_TIME_START;
  const endTime = firstPartDay?.config.endTime ?? FULL_TIME_END;

  return { timezone, workingDays: activeDays.map((x) => x.day), startTime, endTime };
}

export function uniqueDays(days: string[]): DayOfWeekName[] {
  const result: DayOfWeekName[] = [];
  for (const day of days) {
    if (isDayOfWeekName(day) && !result.includes(day)) result.push(day);
  }
  return result;
}

export function isDayOfWeekName(day: string): day is DayOfWeekName {
  return DAY_OPTIONS.some((item) => item.value === day);
}

export function createPageDraftFromSelectablePage(page: SocialMediaSelectablePage): SocialMediaCreatePageDraft {
  return {
    localId: page.externalPageId || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    externalPageId: page.externalPageId,
    pageName: page.pageName,
    username: page.username ?? null,
    pageAvatarUrl: page.pageAvatarUrl ?? "",
    pageImageUrl: page.pageImageUrl ?? "",
    status: "Active",
    schedule: blankScheduleDraft(),
  };
}

export function defaultCreateForm(businessPartnerId: string): SocialMediaCreateForm {
  return {
    businessPartnerId,
    appId: META_APP_ID,
    appSecret: META_APP_SECRET,
    pages: [],
  };
}

export function normalizeDay(day: string): string {
  const normalized = day.trim().toLowerCase();
  return DAY_OPTIONS.find((item) => item.value.toLowerCase() === normalized || item.shortLabel.toLowerCase() === normalized)?.value ?? day;
}

export function validateCreateUntilStep(form: SocialMediaCreateForm, nextStep: string): CreateFormErrors {
  if (nextStep === "config") return {};
  if (nextStep === "pages") return validateCreateConfig(form);
  if (nextStep === "schedule") return validateCreatePages(form);
  return validateCreateForm(form);
}

export function validateCreateForm(form: SocialMediaCreateForm): CreateFormErrors {
  return {
    ...validateCreateConfig(form),
    ...validateCreatePages(form),
    ...validateCreateSchedules(form),
  };
}

export function validateCreateConfig(form: SocialMediaCreateForm): CreateFormErrors {
  const errors: CreateFormErrors = {};
  if (!form.businessPartnerId) errors.businessPartnerId = "Vui lòng chọn doanh nghiệp.";
  return errors;
}

export function validateCreatePages(form: SocialMediaCreateForm): CreateFormErrors {
  const pageIds = new Set<string>();
  for (const [index, page] of form.pages.entries()) {
    const label = `Page ${index + 1}`;
    if (!page.pageName.trim()) return { pages: `${label}: vui lòng nhập tên page.` };
    if (!page.externalPageId.trim()) return { pages: `${label}: vui lòng nhập ID page.` };
    const externalPageId = page.externalPageId.trim();
    if (pageIds.has(externalPageId)) return { pages: `ID page ${externalPageId} bị trùng.` };
    pageIds.add(externalPageId);
  }
  return form.pages.length > 0 ? {} : { pages: "Vui lòng thêm ít nhất một page." };
}

export function validateCreateSchedules(form: SocialMediaCreateForm): CreateFormErrors {
  for (const page of form.pages) {
    const error = validateScheduleDraft(page.schedule, page.pageName || page.externalPageId || "Facebook Page");
    if (error) return { schedule: error };
  }
  return {};
}

export function validateScheduleDraft(draft: PageScheduleDraft, pageName: string): string {
  if (draft.mode !== "part") return "";

  const activeDays = Object.entries(draft.daySchedules) as [DayOfWeekName, DaySchedule][];
  if (activeDays.length === 0) {
    return `${pageName}: vui lòng chọn ít nhất một ngày hoạt động.`;
  }

  for (const [, config] of activeDays) {
    if (config.fullDay) continue;
    if (!isValidScheduleTime(config.startTime) || !isValidScheduleTime(config.endTime)) {
      return `${pageName}: giờ hoạt động phải đúng định dạng HH:mm.`;
    }
    if (config.startTime === config.endTime) {
      return `${pageName}: giờ bắt đầu và giờ kết thúc không được trùng nhau.`;
    }
  }
  return "";
}

export function hasErrors(errors: CreateFormErrors): boolean {
  return Object.values(errors).some(Boolean);
}

export function nullableTrim(value: string): string | null {
  const trimmed = value.trim();
  return trimmed || null;
}

export function isValidScheduleTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function pageInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "FB";
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError) {
    const message = errorMessage(error.body, fallback);
    return message === fallback ? `${fallback} (HTTP ${error.status})` : message;
  }
  return fallback;
}

export function deleteSocialMediaErrorMessage(error: unknown): string {
  return apiErrorMessage(error, "Không thể xóa liên kết mạng xã hội.");
}

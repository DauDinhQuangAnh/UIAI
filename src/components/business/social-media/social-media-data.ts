import type { BadgeProps } from "@/components/ui/badge";

export type Platform = "facebook" | "tiktok";
export type LinkStatus = "Toàn thời gian" | "Bán thời gian" | "Tạm dừng";
export type AddStep = "credentials" | "pages" | "schedule";
export type ScheduleMode = "full" | "partial";
export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface SocialLink {
  id: string;
  platform: Platform;
  business: string;
  appId: string;
  appSecret: string;
  page: string;
  pageId: string;
  status: LinkStatus;
}

export interface AddLinkForm {
  business: string;
  appId: string;
  appSecret: string;
}

export interface ManagedPage {
  id: string;
  name: string;
  handle: string;
  initials: string;
  accent: string;
}

export interface DaySchedule {
  enabled: boolean;
  start: string;
  end: string;
}

export interface PageSchedule {
  mode: ScheduleMode;
  days: Record<DayKey, DaySchedule>;
}

export interface EditLinkForm {
  business: string;
  appId: string;
  appSecret: string;
  page: string;
  pageId: string;
  status: LinkStatus;
  schedule: PageSchedule;
}

export type ScheduleState = Record<string, PageSchedule>;

export const SOCIAL_LINKS: SocialLink[] = [
  {
    id: "fb-lupita",
    platform: "facebook",
    business: "Phòng khám y dược cổ truyền Lupita",
    appId: "htoa-uyan-1899-ajkp",
    appSecret: "connected-secret",
    page: "Phòng khám y dược cổ truyền Lupita",
    pageId: "lupia8190",
    status: "Toàn thời gian",
  },
  {
    id: "fb-ds-tien",
    platform: "facebook",
    business: "Mỹ phẩm cao cấp Dược sĩ Tiến",
    appId: "dst-app-4482",
    appSecret: "connected-secret",
    page: "Mỹ phẩm cao cấp Dược sĩ Tiến",
    pageId: "DSThathayqua",
    status: "Bán thời gian",
  },
  {
    id: "fb-lam-dep",
    platform: "facebook",
    business: "Mỹ phẩm cao cấp Dược sĩ Tiến",
    appId: "beauty-app-8719",
    appSecret: "connected-secret",
    page: "Làm đẹp mỗi ngày",
    pageId: "8719-8afb-9189",
    status: "Tạm dừng",
  },
  {
    id: "fb-minamoto",
    platform: "facebook",
    business: "Shop quần áo thời trang Minamoto",
    appId: "minamoto-fb-2026",
    appSecret: "connected-secret",
    page: "Shop quần áo thời trang Minamoto",
    pageId: "minamoto-clothes",
    status: "Toàn thời gian",
  },
  {
    id: "tt-lily",
    platform: "tiktok",
    business: "Shop hoa Lily",
    appId: "lily-tt-2026",
    appSecret: "connected-secret",
    page: "Lily Flowers",
    pageId: "@lilyflowers",
    status: "Toàn thời gian",
  },
  {
    id: "tt-minamoto",
    platform: "tiktok",
    business: "Shop quần áo thời trang Minamoto",
    appId: "minamoto-tt-2026",
    appSecret: "connected-secret",
    page: "Minamoto Daily",
    pageId: "@minamotodaily",
    status: "Bán thời gian",
  },
];

export const STATUS_TONE: Record<LinkStatus, BadgeProps["tone"]> = {
  "Toàn thời gian": "success",
  "Bán thời gian": "info",
  "Tạm dừng": "neutral",
};

export const BUSINESS_OPTIONS = Array.from(new Set(SOCIAL_LINKS.map((link) => link.business)));

export const EMPTY_ADD_FORM: AddLinkForm = {
  business: BUSINESS_OPTIONS[0] ?? "",
  appId: "",
  appSecret: "",
};

export const DAYS: Array<{ key: DayKey; label: string }> = [
  { key: "mon", label: "T2" },
  { key: "tue", label: "T3" },
  { key: "wed", label: "T4" },
  { key: "thu", label: "T5" },
  { key: "fri", label: "T6" },
  { key: "sat", label: "T7" },
  { key: "sun", label: "CN" },
];

export const MANAGED_PAGES: ManagedPage[] = [
  {
    id: "sinh-ton-sir",
    name: "Sinh tồn lương 5tr",
    handle: "61560960993910",
    initials: "ST",
    accent: "bg-info-bg text-info-fg",
  },
  {
    id: "cau-lac-bo-ly-luan",
    name: "Câu lạc bộ Lý luận trẻ UIT",
    handle: "lyluantreuit",
    initials: "UIT",
    accent: "bg-danger-bg text-danger-fg",
  },
  {
    id: "ndk-binh-duong",
    name: "NDK Bình Dương",
    handle: "ndkbinhduong",
    initials: "NDK",
    accent: "bg-warning-bg text-warning-fg",
  },
  {
    id: "xa-kho",
    name: "Xả Kho Quần Áo Mẹ & Bé",
    handle: "XaKhoQuanAoMeBe",
    initials: "XB",
    accent: "bg-brand-50 text-brand-800",
  },
];

export function createDefaultSchedule(): PageSchedule {
  return {
    mode: "full",
    days: DAYS.reduce(
      (days, day) => ({
        ...days,
        [day.key]: { enabled: false, start: "09:00", end: "18:00" },
      }),
      {} as Record<DayKey, DaySchedule>,
    ),
  };
}

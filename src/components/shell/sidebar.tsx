import { useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import {
  Buildings,
  CaretDown,
  Robot,
  FileText,
  Graph,
  LinkSimple,
  ShareNetwork,
  ChatsCircle,
  ChatTeardropDots,
  ChartBar,
  SlidersHorizontal,
  Sparkle,
  UserCircle,
  type Icon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { useSession, type AuthMenu, type AuthMenuPage } from "@/auth/session-store";

const linkBase = "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors";
const idle = "text-text-secondary hover:bg-surface hover:text-text-primary hover:shadow-xs";
const active = "border border-brand-100 bg-brand-50 text-brand-800 font-semibold shadow-xs";

const BACKEND_ROUTE_MAP: Record<string, string> = {
  "/business-partner/profile": "/business/information",
  "/social-media/facebook": "/business/social-media",
  "/roles": "/roles",
  "/roles/list": "/roles",
  "/permissions/features": "/permissions/features",
  "/permissions/pages": "/permissions/pages",
  "/permissions/actions": "/permissions/actions",
  "/permissions/page-actions": "/permissions/page-actions",
  "/permissions/role-permissions": "/permissions/role-permissions",
};

interface BackendPageOverride {
  icon?: string;
  label?: string;
  omit?: boolean;
  sectionCode?: string;
  sectionLabel?: string;
}

const PERMISSION_SECTION = {
  sectionCode: "PERMISSION_MANAGEMENT",
  sectionLabel: "Permission Management",
} satisfies Pick<BackendPageOverride, "sectionCode" | "sectionLabel">;

const BACKEND_PAGE_OVERRIDES: Record<string, BackendPageOverride> = {
  "/business-partner/profile": {
    icon: "briefcase",
    label: "Thông tin doanh nghiệp",
    sectionCode: "BUSINESS_PARTNER",
    sectionLabel: "Business Management",
  },
  "/social-media/facebook": {
    icon: "link",
    label: "Liên kết mạng xã hội",
    sectionCode: "BUSINESS_PARTNER",
    sectionLabel: "Business Management",
  },
  "/social-media/bot-schedule": {
    omit: true,
  },
  "/roles": {
    ...PERMISSION_SECTION,
  },
  "/roles/list": {
    ...PERMISSION_SECTION,
  },
  "/permissions/role-permissions": {
    omit: true,
  },
  "/conversations": {
    omit: true,
  },
  "/conversations/list": {
    omit: true,
  },
  "/messages/history": {
    omit: true,
  },
  "/message-history": {
    omit: true,
  },
  "/users": {
    omit: true,
  },
  "/users/list": {
    omit: true,
  },
};

const OMIT_BACKEND_PAGE_CODES = new Set([
  "CONVERSATION_LIST",
  "MESSAGE_HISTORY",
  "ROLE_PERMISSION_CONFIG",
  "USER_LIST",
]);

const OMIT_BACKEND_PAGE_NAMES = new Set([
  "conversation list",
  "message history",
  "role permission config",
  "user list",
]);

const BACKEND_PAGE_CODE_OVERRIDES: Record<string, BackendPageOverride> = {
  ROLE_LIST: PERMISSION_SECTION,
};

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const params = useParams({ strict: false }) as { agentId?: string };
  const agentId = params.agentId;
  const menus = useSession((s) => s.menus);
  const backendSections = buildBackendNavSections(menus);
  const hasBackendMenus = backendSections.length > 0;

  return (
    <nav className="flex h-full w-64 flex-col gap-1 border-r border-border bg-surface p-3" aria-label="Điều hướng chính">
      <div className="flex h-full flex-col gap-2 rounded-md border border-border bg-surface-2 p-2 shadow-sm">
      <Link
        to="/agents"
        onClick={onNavigate}
        className="mb-2 flex items-center gap-2 rounded-md border border-brand-100 bg-surface px-3 py-2 font-display text-lg font-semibold text-text-primary shadow-xs"
      >
        <span className="flex size-8 items-center justify-center rounded-md bg-brand-50 text-brand-600">
          <Sparkle weight="fill" className="size-5" aria-hidden />
        </span>
        social-ai
      </Link>

      {hasBackendMenus ? (
        backendSections.map((section) => (
            <NavSection key={section.key} label={section.label}>
              {section.pages.map((page) => (
                <BackendNavItem
                  key={page.pageId ?? page.route ?? page.pageCode}
                  page={page}
                  onNavigate={onNavigate}
                />
              ))}
            </NavSection>
          ))
      ) : (
        <NavSection label="Business Management">
          <NavItem
            to="/business/information"
            icon={Buildings}
            label="Thông tin doanh nghiệp"
            onNavigate={onNavigate}
          />
          <NavItem
            to="/business/social-media"
            icon={LinkSimple}
            label="Liên kết mạng xã hội"
            onNavigate={onNavigate}
          />
        </NavSection>
      )}

      <NavSection label="Agents">
        <NavItem to="/agents" icon={Robot} label="Agents" onNavigate={onNavigate} />
        <AgentNavItem agentId={agentId} to="/agents/$agentId" icon={SlidersHorizontal} label="Cấu hình" onNavigate={onNavigate} exact />
        <AgentNavItem agentId={agentId} to="/agents/$agentId/documents" icon={FileText} label="Tài liệu" onNavigate={onNavigate} />
        <AgentNavItem agentId={agentId} to="/agents/$agentId/knowledge" icon={Graph} label="Tri thức" onNavigate={onNavigate} />
        <AgentNavItem agentId={agentId} to="/agents/$agentId/graph" icon={ShareNetwork} label="Đồ thị" onNavigate={onNavigate} />
        <AgentNavItem agentId={agentId} to="/agents/$agentId/chat" icon={ChatTeardropDots} label="Trò chuyện" onNavigate={onNavigate} />
        <AgentNavItem agentId={agentId} to="/agents/$agentId/conversations" icon={ChatsCircle} label="Cuộc hội thoại" onNavigate={onNavigate} />
        <AgentNavItem agentId={agentId} to="/agents/$agentId/analytics" icon={ChartBar} label="Phân tích" onNavigate={onNavigate} />
      </NavSection>

      </div>
    </nav>
  );
}

function NavSection({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="mt-3 flex flex-col gap-1">
      <button
        type="button"
        className={cn(
          "flex w-full min-w-0 items-center justify-between gap-1.5 rounded-md border border-border-strong bg-surface px-2.5 py-2 text-left text-[13px] font-semibold text-text-primary shadow-sm transition-colors",
          "hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800 focus-visible:outline-none focus-visible:shadow-focus",
        )}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="min-w-0 flex-1 truncate" title={label}>{label}</span>
        <CaretDown className={cn("size-3 flex-none text-text-dim transition-transform", !open && "-rotate-90")} aria-hidden />
      </button>
      {open && (
        <div className="flex flex-col gap-1 rounded-md bg-surface-2/70 py-1 shadow-xs">
          {children}
        </div>
      )}
    </div>
  );
}

function NavItem({
  to,
  icon: IconCmp,
  label,
  onNavigate,
}: {
  to: string;
  icon: Icon;
  label: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={cn(linkBase, idle)}
      activeProps={{ className: cn(linkBase, active) }}
    >
      <IconCmp className="size-5" aria-hidden />
      {label}
    </Link>
  );
}

interface BackendNavSection {
  key: string;
  label: string;
  displayOrder: number;
  pages: AuthMenuPage[];
}

function buildBackendNavSections(menus: AuthMenu[]): BackendNavSection[] {
  const sections = new Map<string, BackendNavSection>();

  for (const menu of menus.slice().sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))) {
    const pages = (menu.pages ?? []).slice().sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

    for (const page of pages) {
      const override = getBackendPageOverride(page);
      if (override?.omit || shouldOmitBackendPage(page)) continue;

      const sectionKey = override?.sectionCode ?? menu.featureCode ?? menu.featureId ?? menu.featureName ?? "menu";
      const sectionLabel = override?.sectionLabel ?? menu.featureName ?? "Menu";
      const section =
        sections.get(sectionKey) ??
        ({
          key: sectionKey,
          label: sectionLabel,
          displayOrder: menu.displayOrder ?? 0,
          pages: [],
        } satisfies BackendNavSection);

      section.pages.push({
        ...page,
        icon: override?.icon ?? page.icon,
        pageName: override?.label ?? page.pageName,
      });
      sections.set(sectionKey, section);
    }
  }

  return Array.from(sections.values())
    .filter((section) => section.pages.length > 0)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

function getBackendPageOverride(page: AuthMenuPage): BackendPageOverride | undefined {
  const routeOverride = page.route ? BACKEND_PAGE_OVERRIDES[page.route] : undefined;
  if (routeOverride) return routeOverride;
  const code = (page.pageCode ?? "").trim().toUpperCase();
  return BACKEND_PAGE_CODE_OVERRIDES[code];
}

function shouldOmitBackendPage(page: AuthMenuPage): boolean {
  const code = (page.pageCode ?? "").trim().toUpperCase();
  const name = (page.pageName ?? "").trim().toLowerCase();
  return OMIT_BACKEND_PAGE_CODES.has(code) || OMIT_BACKEND_PAGE_NAMES.has(name);
}

function BackendNavItem({ page, onNavigate }: { page: AuthMenuPage; onNavigate?: () => void }) {
  const IconCmp = iconForPage(page);
  const route = routeForBackendPage(page.route);
  const label = page.pageName ?? page.pageCode ?? "Trang";

  if (!route) {
    return (
      <span
        className={cn(linkBase, "cursor-not-allowed text-text-dim opacity-60")}
        title={`Chưa có màn hình FE cho route ${page.route ?? ""}`.trim()}
      >
        <IconCmp className="size-5" aria-hidden />
        {label}
      </span>
    );
  }

  return <NavItem to={route} icon={IconCmp} label={label} onNavigate={onNavigate} />;
}

function routeForBackendPage(route: string | undefined): string | null {
  if (!route) return null;
  return BACKEND_ROUTE_MAP[route] ?? null;
}

function iconForPage(page: AuthMenuPage): Icon {
  const key = (page.icon || page.pageCode || "").toLowerCase();
  if (key.includes("briefcase") || key.includes("profile")) return Buildings;
  if (key.includes("facebook") || key.includes("link")) return LinkSimple;
  if (key.includes("calendar") || key.includes("schedule")) return ChartBar;
  if (key.includes("message") || key.includes("conversation")) return ChatsCircle;
  if (key.includes("history")) return FileText;
  if (key.includes("users") || key.includes("user")) return UserCircle;
  if (key.includes("shield") || key.includes("role")) return SlidersHorizontal;
  if (key.includes("feature") || key.includes("module")) return Sparkle;
  if (key.includes("page_action") || key.includes("page-action")) return LinkSimple;
  if (key.includes("action")) return SlidersHorizontal;
  if (key.includes("page")) return FileText;
  if (key.includes("table")) return Graph;
  if (key.includes("config") || key.includes("cog") || key.includes("panel") || key.includes("pointer")) {
    return SlidersHorizontal;
  }
  return FileText;
}

function AgentNavItem({
  agentId,
  to,
  icon: IconCmp,
  label,
  onNavigate,
  exact,
}: {
  agentId?: string;
  to:
    | "/agents/$agentId"
    | "/agents/$agentId/documents"
    | "/agents/$agentId/knowledge"
    | "/agents/$agentId/graph"
    | "/agents/$agentId/chat"
    | "/agents/$agentId/conversations"
    | "/agents/$agentId/analytics";
  icon: Icon;
  label: string;
  onNavigate?: () => void;
  exact?: boolean;
}) {
  if (!agentId) {
    return (
      <span
        className={cn(linkBase, "cursor-not-allowed text-text-dim opacity-60")}
        title="Chọn hoặc tạo tác nhân trước"
      >
        <IconCmp className="size-5" aria-hidden />
        {label}
      </span>
    );
  }

  return (
    <Link
      to={to}
      params={{ agentId }}
      onClick={onNavigate}
      activeOptions={exact ? { exact: true } : undefined}
      className={cn(linkBase, idle)}
      activeProps={{ className: cn(linkBase, active) }}
    >
      <IconCmp className="size-5" aria-hidden />
      {label}
    </Link>
  );
}

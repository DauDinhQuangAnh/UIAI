import { Link, useParams } from "@tanstack/react-router";
import {
  Buildings,
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

const linkBase = "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors";
const idle = "text-text-secondary hover:bg-surface-2 hover:text-text-primary";
const active = "bg-brand-50 text-brand-800 font-medium";

const BACKEND_ROUTE_MAP: Record<string, string> = {
  "/business-partner/profile": "/business/information",
  "/social-media/facebook": "/business/social-media",
};

const BACKEND_PAGE_OVERRIDES: Record<
  string,
  {
    icon?: string;
    label?: string;
    omit?: boolean;
    sectionCode?: string;
    sectionLabel?: string;
  }
> = {
  "/business-partner/profile": {
    icon: "briefcase",
    label: "Thông tin doanh nghiệp",
    sectionCode: "BUSINESS_PARTNER",
    sectionLabel: "Quản lý doanh nghiệp",
  },
  "/social-media/facebook": {
    icon: "link",
    label: "Liên kết mạng xã hội",
    sectionCode: "BUSINESS_PARTNER",
    sectionLabel: "Quản lý doanh nghiệp",
  },
  "/social-media/bot-schedule": {
    omit: true,
  },
};

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const params = useParams({ strict: false }) as { agentId?: string };
  const agentId = params.agentId;
  const menus = useSession((s) => s.menus);
  const backendSections = buildBackendNavSections(menus);
  const hasBackendMenus = backendSections.length > 0;

  return (
    <nav className="flex h-full w-64 flex-col gap-1 border-r border-border bg-surface p-3" aria-label="Điều hướng chính">
      <Link
        to="/agents"
        onClick={onNavigate}
        className="mb-2 flex items-center gap-2 px-3 py-2 font-display text-lg font-semibold text-text-primary"
      >
        <Sparkle weight="fill" className="size-5 text-brand-500" aria-hidden />
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
        <NavSection label="Quản lý doanh nghiệp">
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

      <NavSection label="Tác nhân">
        <NavItem to="/agents" icon={Robot} label="Tác nhân" onNavigate={onNavigate} />
        <AgentNavItem agentId={agentId} to="/agents/$agentId" icon={SlidersHorizontal} label="Cấu hình" onNavigate={onNavigate} exact />
        <AgentNavItem agentId={agentId} to="/agents/$agentId/documents" icon={FileText} label="Tài liệu" onNavigate={onNavigate} />
        <AgentNavItem agentId={agentId} to="/agents/$agentId/knowledge" icon={Graph} label="Tri thức" onNavigate={onNavigate} />
        <AgentNavItem agentId={agentId} to="/agents/$agentId/graph" icon={ShareNetwork} label="Đồ thị" onNavigate={onNavigate} />
        <AgentNavItem agentId={agentId} to="/agents/$agentId/chat" icon={ChatTeardropDots} label="Trò chuyện" onNavigate={onNavigate} />
        <AgentNavItem agentId={agentId} to="/agents/$agentId/conversations" icon={ChatsCircle} label="Cuộc hội thoại" onNavigate={onNavigate} />
        <AgentNavItem agentId={agentId} to="/agents/$agentId/analytics" icon={ChartBar} label="Phân tích" onNavigate={onNavigate} />
      </NavSection>

      <NavSection label="Hệ thống">
        <NavItem to="/account" icon={UserCircle} label="Tài khoản" onNavigate={onNavigate} />
      </NavSection>
    </nav>
  );
}

function NavSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-3 flex flex-col gap-1">
      <span className="px-3 py-1 font-mono text-xs uppercase tracking-wide text-text-dim">{label}</span>
      {children}
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
      const override = page.route ? BACKEND_PAGE_OVERRIDES[page.route] : undefined;
      if (override?.omit) continue;

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

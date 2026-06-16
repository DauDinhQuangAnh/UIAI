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
  type Icon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

const linkBase = "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors";
const idle = "text-text-secondary hover:bg-surface-2 hover:text-text-primary";
const active = "bg-brand-50 text-brand-800 font-medium";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const params = useParams({ strict: false }) as { agentId?: string };
  const agentId = params.agentId;

  return (
    <nav className="flex h-full w-64 flex-col gap-1 border-r border-border bg-surface p-3" aria-label="Main">
      <Link
        to="/agents"
        onClick={onNavigate}
        className="mb-2 flex items-center gap-2 px-3 py-2 font-display text-lg font-semibold text-text-primary"
      >
        <Sparkle weight="fill" className="size-5 text-brand-500" aria-hidden />
        social-ai
      </Link>

      <NavSection label="Business Management">
        <NavItem
          to="/business/information"
          icon={Buildings}
          label="Business Information"
          onNavigate={onNavigate}
        />
        <NavItem
          to="/business/social-media"
          icon={LinkSimple}
          label="Social Media Links"
          onNavigate={onNavigate}
        />
      </NavSection>

      {agentId && (
        <div className="mt-3 flex flex-col gap-1">
          <span className="px-3 py-1 font-mono text-xs uppercase tracking-wide text-text-dim">Agent</span>
          <Link
            to="/agents"
            onClick={onNavigate}
            activeOptions={{ exact: true }}
            className={cn(linkBase, idle)}
            activeProps={{ className: cn(linkBase, active) }}
          >
            <Robot className="size-5" aria-hidden />
            Agents
          </Link>
          <Link
            to="/agents/$agentId"
            params={{ agentId }}
            onClick={onNavigate}
            activeOptions={{ exact: true }}
            className={cn(linkBase, idle)}
            activeProps={{ className: cn(linkBase, active) }}
          >
            <SlidersHorizontal className="size-5" aria-hidden />
            Configuration
          </Link>

          <Link
            to="/agents/$agentId/documents"
            params={{ agentId }}
            onClick={onNavigate}
            className={cn(linkBase, idle)}
            activeProps={{ className: cn(linkBase, active) }}
          >
            <FileText className="size-5" aria-hidden />
            Documents
          </Link>

          <Link
            to="/agents/$agentId/knowledge"
            params={{ agentId }}
            onClick={onNavigate}
            className={cn(linkBase, idle)}
            activeProps={{ className: cn(linkBase, active) }}
          >
            <Graph className="size-5" aria-hidden />
            Knowledge
          </Link>

          <Link
            to="/agents/$agentId/graph"
            params={{ agentId }}
            onClick={onNavigate}
            className={cn(linkBase, idle)}
            activeProps={{ className: cn(linkBase, active) }}
          >
            <ShareNetwork className="size-5" aria-hidden />
            Graph
          </Link>

          <Link
            to="/agents/$agentId/chat"
            params={{ agentId }}
            onClick={onNavigate}
            className={cn(linkBase, idle)}
            activeProps={{ className: cn(linkBase, active) }}
          >
            <ChatTeardropDots className="size-5" aria-hidden />
            Chat
          </Link>

          <Link
            to="/agents/$agentId/conversations"
            params={{ agentId }}
            onClick={onNavigate}
            className={cn(linkBase, idle)}
            activeProps={{ className: cn(linkBase, active) }}
          >
            <ChatsCircle className="size-5" aria-hidden />
            Conversations
          </Link>

          <Link
            to="/agents/$agentId/analytics"
            params={{ agentId }}
            onClick={onNavigate}
            className={cn(linkBase, idle)}
            activeProps={{ className: cn(linkBase, active) }}
          >
            <ChartBar className="size-5" aria-hidden />
            Analytics
          </Link>
        </div>
      )}
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

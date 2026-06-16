import { useNavigate, useParams } from "@tanstack/react-router";
import { CaretUpDown, Check, Robot } from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAgents } from "@/api/hooks/agents";
import { cn } from "@/lib/cn";

// Topbar agent context switcher. The URL is the single source of truth for the
// selected agent; this only navigates to another agent's config.
export function AgentSwitcher() {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { agentId?: string };
  const agentId = params.agentId;
  const { items: agents, isLoading } = useAgents();

  if (!agentId) return null;
  const current = agents.find((a) => a.id === agentId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-9 items-center gap-2 rounded-md border border-border-strong bg-surface px-3 text-sm text-text-primary shadow-xs focus-visible:outline-none focus-visible:shadow-focus">
        <Robot className="size-4 text-brand-500" aria-hidden />
        <span className="max-w-[12rem] truncate font-medium">
          {current?.display_name || current?.agent_ref || "Chọn tác nhân"}
        </span>
        <CaretUpDown className="size-4 text-text-dim" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Đổi tác nhân</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading && <div className="px-2 py-1.5 text-sm text-text-dim">Đang tải…</div>}
        {agents.map((a) => (
          <DropdownMenuItem
            key={a.id}
            onSelect={() => navigate({ to: "/agents/$agentId", params: { agentId: a.id! } })}
          >
            <span className="flex-1 truncate">{a.display_name || a.agent_ref}</span>
            {a.id === agentId && <Check className={cn("size-4 text-brand-600")} aria-hidden />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

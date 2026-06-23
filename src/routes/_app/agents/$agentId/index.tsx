import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { AgentConfigForm } from "@/components/agents/agent-config-form";
import { useAgent, type Agent } from "@/api/hooks/agents";
import { useSession } from "@/auth/session-store";
import { isAdmin } from "@/auth/guards";
import { ApiRequestError } from "@/api/errors";

export const Route = createFileRoute("/_app/agents/$agentId/")({
  component: AgentDetail,
});

const DEMO_AGENT_ID = "demo";

const DEMO_AGENT = {
  id: "demo",
  agent_ref: "reo-messenger-01",
  display_name: "REO Messenger Bot",
  status: "active",
  system_prompt: "Bạn là trợ lý AI thân thiện của REO – AI. Hãy trả lời ngắn gọn, chính xác bằng tiếng Việt. Nếu không chắc chắn, hãy nói thật thay vì đoán.",
  model: "claude-sonnet-4-6",
  debounce_ms: 500,
  history_turns: 10,
  max_output_tokens: 2048,
  kg_enabled: true,
  retrieval_config: { top_k: 5, vector_weight: 0.6, fts_weight: 0.4 },
  created_at: "2026-06-01T08:00:00Z",
} as unknown as Agent;

function AgentDetail() {
  const { agentId } = Route.useParams();
  const role = useSession((s) => s.user?.role);
  const admin = isAdmin(role);
  const isDemoMode = agentId === DEMO_AGENT_ID;
  const { data: apiAgent, isLoading, error } = useAgent(agentId);

  const agent = isDemoMode ? DEMO_AGENT : apiAgent;

  if (!isDemoMode && isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6 sm:p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!isDemoMode && (error || !agent)) {
    const notFound = error instanceof ApiRequestError && error.status === 404;
    return (
      <div className="mx-auto w-full max-w-3xl p-6 sm:p-8">
        <EmptyState
          title={notFound ? "Agent không tồn tại" : "Không thể tải thông tin Agent"}
          description={notFound ? "Có thể Agent đã bị xóa hoặc bạn không có quyền truy cập." : "Vui lòng thử lại."}
          action={
            <Button asChild variant="secondary">
              <Link to="/agents">Quay lại danh sách Agents</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (!agent) return null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6 sm:p-8">
      <div className="flex flex-col gap-1">
        <Link to="/agents" className="flex w-fit items-center gap-1 text-sm text-text-secondary hover:text-text-primary">
          <ArrowLeft className="size-4" aria-hidden /> Agents
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl font-semibold text-text-primary">
            {agent.display_name || agent.agent_ref}
          </h1>
          <span className="font-mono text-sm text-text-dim">{agent.agent_ref}</span>
        </div>
        {!admin && <p className="text-sm text-text-dim">Chỉ đọc — cần vai trò quản trị để chỉnh sửa.</p>}
      </div>

      <AgentConfigForm agent={agent} readOnly={!admin} />
    </div>
  );
}

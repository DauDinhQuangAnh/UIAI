import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { AgentConfigForm } from "@/components/agents/agent-config-form";
import { useAgent } from "@/api/hooks/agents";
import { useSession } from "@/auth/session-store";
import { isAdmin } from "@/auth/guards";
import { ApiRequestError } from "@/api/errors";

export const Route = createFileRoute("/_app/agents/$agentId/")({
  component: AgentDetail,
});

function AgentDetail() {
  const { agentId } = Route.useParams();
  const role = useSession((s) => s.user?.role);
  const admin = isAdmin(role);
  const { data: agent, isLoading, error } = useAgent(agentId);

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6 sm:p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !agent) {
    const notFound = error instanceof ApiRequestError && error.status === 404;
    return (
      <div className="mx-auto w-full max-w-3xl p-6 sm:p-8">
        <EmptyState
          title={notFound ? "Agent not found" : "Couldn't load agent"}
          description={notFound ? "It may have been deleted, or you don't have access." : "Please try again."}
          action={
            <Button asChild variant="secondary">
              <Link to="/agents">Back to agents</Link>
            </Button>
          }
        />
      </div>
    );
  }

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
        {!admin && <p className="text-sm text-text-dim">Read-only — admin role required to edit.</p>}
      </div>

      <AgentConfigForm agent={agent} readOnly={!admin} />
    </div>
  );
}

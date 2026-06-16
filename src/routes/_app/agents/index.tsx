import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus, Robot } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KeysetList } from "@/components/common/keyset-list";
import { EmptyState } from "@/components/common/empty-state";
import { useAgents, type Agent } from "@/api/hooks/agents";
import { useSession } from "@/auth/session-store";
import { isAdmin } from "@/auth/guards";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_app/agents/")({
  component: AgentsList,
});

function AgentsList() {
  const navigate = useNavigate();
  const role = useSession((s) => s.user?.role);
  const admin = isAdmin(role);
  const { items, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } =
    useAgents();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-text-primary">Agents</h1>
        {admin && (
          <Button asChild>
            <Link to="/agents/new">
              <Plus className="size-4" aria-hidden /> Create agent
            </Link>
          </Button>
        )}
      </div>

      <KeysetList
        items={items}
        isLoading={isLoading}
        isError={isError}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
        onRetry={refetch}
        skeleton={<Skeleton className="h-48 w-full rounded-2xl" />}
        empty={
          <EmptyState
            icon={Robot}
            title="No agents yet"
            description={
              admin
                ? "Create your first agent to start grounding replies in your knowledge."
                : "An admin hasn't created any agents yet."
            }
            action={
              admin ? (
                <Button asChild>
                  <Link to="/agents/new">
                    <Plus className="size-4" aria-hidden /> Create your first agent
                  </Link>
                </Button>
              ) : undefined
            }
          />
        }
      >
        {(agents) => (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Ref</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => (
                <TableRow
                  key={agent.id}
                  className="cursor-pointer"
                  onClick={() => navigate({ to: "/agents/$agentId", params: { agentId: agent.id! } })}
                >
                  <TableCell className="font-medium">{agent.display_name || agent.agent_ref}</TableCell>
                  <TableCell className="font-mono text-text-secondary">{agent.agent_ref}</TableCell>
                  <TableCell>
                    <AgentStatus status={agent.status} />
                  </TableCell>
                  <TableCell className="tabular text-text-secondary">{formatDate(agent.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </KeysetList>
    </div>
  );
}

function AgentStatus({ status }: { status: Agent["status"] }) {
  const live = status === "active" || status === "live" || status === "enabled";
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-text-secondary">
      <span className={live ? "size-2 rounded-pill bg-success-base" : "size-2 rounded-pill bg-text-dim"} />
      {status || "unknown"}
    </span>
  );
}

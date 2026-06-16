import { createFileRoute } from "@tanstack/react-router";
import { ChatsCircle, ChatText, Graph, LinkSimple, FileText, GitMerge } from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { KpiCard } from "@/components/analytics/kpi-card";
import { useStats } from "@/api/hooks/stats";

export const Route = createFileRoute("/_app/agents/$agentId/analytics/")({
  component: AnalyticsScreen,
});

function AnalyticsScreen() {
  const { agentId } = Route.useParams();
  const { data: stats, isLoading, isError, refetch } = useStats(agentId);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6 sm:p-8">
      <h1 className="font-display text-3xl font-semibold text-text-primary">Analytics</h1>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : isError || !stats ? (
        <EmptyState
          title="Couldn't load analytics"
          description="Please try again."
          action={
            <Button variant="secondary" onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <KpiCard label="Conversations" value={stats.conversations} icon={ChatsCircle} />
            <KpiCard label="Messages (30d)" value={stats.messages_30d} icon={ChatText} />
            <KpiCard label="KG entities" value={stats.kg_entities} icon={Graph} />
            <KpiCard label="KG relations" value={stats.kg_relations} icon={LinkSimple} />
            <KpiCard
              label="Pending dedup"
              value={stats.pending_dedup}
              icon={GitMerge}
              hint={stats.pending_dedup ? "Candidates awaiting review" : undefined}
            />
          </div>

          <DocumentsByStatus byStatus={stats.documents_by_status} />
        </div>
      )}
    </div>
  );
}

// Documents broken down by ingest status — rendered as a small labelled grid since
// the API returns a free-form status->count map (no fixed enum yet).
function DocumentsByStatus({ byStatus }: { byStatus: Record<string, number> | undefined }) {
  const entries = Object.entries(byStatus ?? {});
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-text-secondary">
        <FileText className="size-4" aria-hidden />
        <h2 className="text-sm font-semibold">Documents by status</h2>
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-text-dim">No documents yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {entries.map(([status, count]) => (
            <KpiCard key={status} label={status} value={count} />
          ))}
        </div>
      )}
    </div>
  );
}

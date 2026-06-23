import { createFileRoute } from "@tanstack/react-router";
import { ChatsCircle, ChatText, Graph, LinkSimple, FileText, GitMerge } from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { KpiCard } from "@/components/analytics/kpi-card";
import { useStats, type Stats } from "@/api/hooks/stats";

export const Route = createFileRoute("/_app/agents/$agentId/analytics/")({
  component: AnalyticsScreen,
});

const DEMO_AGENT_ID = "demo";

const DEMO_STATS: Stats = {
  conversations: 142,
  messages_30d: 891,
  kg_entities: 58,
  kg_relations: 73,
  pending_dedup: 3,
  documents_by_status: { ready: 3, queued: 1 },
};

function AnalyticsScreen() {
  const { agentId } = Route.useParams();
  const isDemoMode = agentId === DEMO_AGENT_ID;
  const { data: apiStats, isLoading, isError, refetch } = useStats(agentId);

  const stats = isDemoMode ? DEMO_STATS : apiStats ?? undefined;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6 sm:p-8">
      <h1 className="font-display text-3xl font-semibold text-text-primary">Analytics</h1>

      {!isDemoMode && isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : !isDemoMode && (isError || !stats) ? (
        <EmptyState
          title="Không thể tải Analytics"
          description="Vui lòng thử lại."
          action={
            <Button variant="secondary" onClick={() => refetch()}>
              Thử lại
            </Button>
          }
        />
      ) : stats ? (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <KpiCard label="Conversations" value={stats.conversations} icon={ChatsCircle} />
            <KpiCard label="Messages (30 ngày)" value={stats.messages_30d} icon={ChatText} />
            <KpiCard label="KG entities" value={stats.kg_entities} icon={Graph} />
            <KpiCard label="KG relations" value={stats.kg_relations} icon={LinkSimple} />
            <KpiCard
              label="Pending dedupe"
              value={stats.pending_dedup}
              icon={GitMerge}
              hint={stats.pending_dedup ? "Ứng viên đang chờ xem xét" : undefined}
            />
          </div>

          <DocumentsByStatus byStatus={stats.documents_by_status} />
        </div>
      ) : null}
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
        <p className="text-sm text-text-dim">Chưa có Documents nào.</p>
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

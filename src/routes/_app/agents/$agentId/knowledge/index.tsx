import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Graph } from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { KeysetList } from "@/components/common/keyset-list";
import { EmptyState } from "@/components/common/empty-state";
import { CandidateCard } from "@/components/knowledge/candidate-card";
import { useCandidates } from "@/api/hooks/knowledge";
import { useSession } from "@/auth/session-store";
import { isAdmin } from "@/auth/guards";

export const Route = createFileRoute("/_app/agents/$agentId/knowledge/")({
  component: KnowledgeScreen,
});

const STATUS_OPTIONS = ["pending", "merged", "dismissed"] as const;

function KnowledgeScreen() {
  const { agentId } = Route.useParams();
  const admin = isAdmin(useSession((s) => s.user?.role));
  const [status, setStatus] = useState<string>("pending");
  const list = useCandidates(agentId, status);

  // Reconcile-from-200: a merged/dismissed card reports its id here so it leaves the
  // current (e.g. pending) view immediately, before the invalidated refetch lands.
  // Scoped to the active filter — switching status clears it so a just-resolved
  // candidate isn't wrongly hidden in the view it now belongs to (e.g. "merged").
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const onResolved = (id: string) => setResolved((prev) => new Set(prev).add(id));
  const onStatusChange = (next: string) => {
    setStatus(next);
    setResolved(new Set());
  };
  const cards = list.items.filter((c) => !resolved.has(c.id!));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6 sm:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-semibold text-text-primary">Tri thức</h1>
        <p className="text-sm text-text-secondary">
          Xem lại các cặp thực thể mà đồ thị đánh dấu là có thể trùng lặp.
        </p>
        {!admin && <p className="text-sm text-text-dim">Chỉ đọc — cần vai trò quản trị để hợp nhất hoặc bỏ qua.</p>}
      </div>

      <div className="flex items-center gap-3">
        <Label htmlFor="status-filter" className="text-sm text-text-secondary">
          Trạng thái
        </Label>
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger id="status-filter" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <KeysetList
        items={cards}
        isLoading={list.isLoading}
        isError={list.isError}
        hasNextPage={list.hasNextPage}
        isFetchingNextPage={list.isFetchingNextPage}
        fetchNextPage={list.fetchNextPage}
        onRetry={list.refetch}
        skeleton={
          <div className="flex flex-col gap-4">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-44 w-full rounded-2xl" />
          </div>
        }
        empty={
          <EmptyState
            icon={Graph}
            title={status === "pending" ? "Không có ứng viên nào cần xem xét" : `Không có ứng viên ${status} nào`}
            description={
              status === "pending"
                ? "Đồ thị chưa chỉ ra bất kỳ thực thể trùng lặp nào cần xem xét."
                : "Chưa có nội dung nào ở đây."
            }
          />
        }
      >
        {(items) => (
          <div className="flex flex-col gap-4">
            {items.map((c) => (
              <CandidateCard
                key={c.id}
                agentId={agentId}
                candidate={c}
                admin={admin}
                onResolved={onResolved}
              />
            ))}
          </div>
        )}
      </KeysetList>
    </div>
  );
}

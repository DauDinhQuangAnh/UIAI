import { useState } from "react";
import { toast } from "sonner";
import { GitMerge, X } from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/common/status-chip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import { ApiRequestError } from "@/api/errors";
import { useMergeCandidate, useDismissCandidate, type Candidate } from "@/api/hooks/knowledge";

// One dedup candidate. Merge is destructive and irreversible, so the admin MUST
// pick which entity to KEEP (the other is dropped) — never defaulted — and confirm
// in a dialog that names the entity being dropped. Not optimistic-remove: a pending
// spinner shows during the mutation; on the 200 response the card reports its
// terminal id up so the route drops it from the pending list (no flicker). 409/422
// leave the card in place with a toast.
export function CandidateCard({
  agentId,
  candidate,
  admin,
  onResolved,
}: {
  agentId: string;
  candidate: Candidate;
  admin: boolean;
  onResolved: (id: string) => void;
}) {
  const merge = useMergeCandidate(agentId);
  const dismiss = useDismissCandidate(agentId);
  const [keepId, setKeepId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const id = candidate.id!;
  const a = candidate.entity_a_id ?? "";
  const b = candidate.entity_b_id ?? "";
  const dropId = keepId ? (keepId === a ? b : a) : null;
  const pending = merge.isPending || dismiss.isPending;

  const onConfirmMerge = () => {
    if (!keepId || !dropId) return;
    merge.mutate(
      { id, body: { keep_id: keepId, drop_id: dropId } },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          onResolved(id);
          toast.success("Các thực thể đã được hợp nhất.");
        },
        onError: (err) => {
          setConfirmOpen(false);
          const code = err instanceof ApiRequestError ? err.code : undefined;
          toast.error(code === "merge_not_applied" ? "Không thể áp dụng hợp nhất." : "Không thể hợp nhất các thực thể.");
        },
      },
    );
  };

  const onDismiss = () => {
    dismiss.mutate(id, {
      onSuccess: () => {
        onResolved(id);
        toast.success("Ứng viên đã bị bỏ qua.");
      },
      onError: () => toast.error("Không thể bỏ qua ứng viên."),
    });
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <StatusChip status={candidate.status} />
            <span className="text-sm text-text-secondary tabular">
              {Math.round((candidate.similarity ?? 0) * 100)}% similar
            </span>
          </div>
          {pending && <StatusChip status="extracting" className="capitalize" />}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <EntityColumn
            label="Thực thể A"
            entityId={a}
            selected={keepId === a}
            disabled={!admin || pending}
            onSelect={() => setKeepId(a)}
          />
          <EntityColumn
            label="Thực thể B"
            entityId={b}
            selected={keepId === b}
            disabled={!admin || pending}
            onSelect={() => setKeepId(b)}
          />
        </div>

        {admin && (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-text-dim">
              {keepId ? "Thực thể còn lại sẽ bị bỏ — hành động này không thể hoàn tác." : "Chọn thực thể cần giữ lại."}
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onDismiss} loading={dismiss.isPending} disabled={pending}>
                <X className="size-4" aria-hidden /> Bỏ qua
              </Button>
              <Button size="sm" onClick={() => setConfirmOpen(true)} disabled={!keepId || pending}>
                <GitMerge className="size-4" aria-hidden /> Hợp nhất
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={(open) => !open && setConfirmOpen(false)}>
        <DialogContent>
          <DialogHeader>
          <DialogTitle>Hợp nhất thực thể</DialogTitle>
          <DialogDescription>
              Giữ <span className="font-mono text-xs">{keepId}</span> và xóa vĩnh viễn{" "}
              <span className="font-mono text-xs">{dropId}</span>. Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Hủy
            </Button>
            <Button variant="danger" loading={merge.isPending} onClick={onConfirmMerge}>
              Hợp nhất &amp; xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// A selectable entity column. Acts as a radio "keep this one"; disabled for members
// (read-only) and while a mutation is in flight.
function EntityColumn({
  label,
  entityId,
  selected,
  disabled,
  onSelect,
}: {
  label: string;
  entityId: string;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex flex-col gap-1 rounded-xl border p-3 text-left transition-colors",
        "focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-default",
        selected ? "border-brand-400 bg-brand-50" : "border-border bg-surface enabled:hover:bg-surface-2",
      )}
    >
      <span className="text-xs font-medium uppercase tracking-wide text-text-dim">{label}</span>
      <span className="break-all font-mono text-sm text-text-primary">{entityId || "—"}</span>
      <span className={cn("text-xs", selected ? "text-brand-700" : "text-text-dim")}>
        {selected ? "Giữ thực thể này" : "Giữ"}
      </span>
    </button>
  );
}

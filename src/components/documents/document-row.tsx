import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Trash } from "@phosphor-icons/react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/common/status-chip";
import {
  useDocumentStatus,
  isTerminalStatus,
  documentKeys,
  type Document,
} from "@/api/hooks/documents";
import { ApiRequestError } from "@/api/errors";
import { formatDate } from "@/lib/format";

// One document row. While the doc is mid-ingest it polls its own status; on a
// terminal status it converges the list (invalidate) and stops. A 404 mid-poll
// means the doc was deleted — drop the row quietly, no error toast.
export function DocumentRow({
  agentId,
  doc,
  admin,
  onRequestDelete,
  onRemoved,
}: {
  agentId: string;
  doc: Document;
  admin: boolean;
  onRequestDelete: (doc: Document) => void;
  onRemoved: (docId: string) => void;
}) {
  const queryClient = useQueryClient();
  const active = !isTerminalStatus(doc.status);
  const poll = useDocumentStatus(agentId, doc.id!, active);

  const liveStatus = poll.data?.status ?? doc.status;

  // Converge the list once polling reaches a terminal status. Don't drop the
  // optimistic row here — the list dedup hides it as soon as the refetched server
  // row arrives, which avoids a vanish-then-reappear flicker.
  useEffect(() => {
    if (poll.data && isTerminalStatus(poll.data.status)) {
      queryClient.invalidateQueries({ queryKey: documentKeys.list(agentId) });
    }
  }, [poll.data, agentId, queryClient]);

  // 404 while polling -> doc is gone; remove the row without surfacing an error.
  useEffect(() => {
    if (poll.error instanceof ApiRequestError && poll.error.status === 404) {
      onRemoved(doc.id!);
    }
  }, [poll.error, doc.id, onRemoved]);

  return (
    <TableRow>
      <TableCell className="font-medium">{doc.title || "Chưa có tiêu đề"}</TableCell>
      <TableCell className="font-mono text-text-secondary">{doc.format || "—"}</TableCell>
      <TableCell>
        <StatusChip status={liveStatus} />
        {liveStatus === "failed" && doc.error && (
          <span className="ml-2 text-xs text-danger-fg">{doc.error}</span>
        )}
      </TableCell>
      <TableCell className="tabular text-text-secondary">{formatDate(doc.created_at)}</TableCell>
      <TableCell className="w-12 text-right">
        {admin && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Xóa ${doc.title || "tài liệu"}`}
            onClick={() => onRequestDelete(doc)}
          >
            <Trash className="size-4 text-danger-base" aria-hidden />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

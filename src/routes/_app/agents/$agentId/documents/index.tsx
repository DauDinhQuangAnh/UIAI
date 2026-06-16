import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { FileText, Warning } from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { KeysetList } from "@/components/common/keyset-list";
import { EmptyState } from "@/components/common/empty-state";
import { UploadDropzone } from "@/components/documents/upload-dropzone";
import { DocumentRow } from "@/components/documents/document-row";
import { useDocuments, useUploadDocument, useDeleteDocument, type Document } from "@/api/hooks/documents";
import { useSession } from "@/auth/session-store";
import { isAdmin } from "@/auth/guards";
import { ApiRequestError } from "@/api/errors";

export const Route = createFileRoute("/_app/agents/$agentId/documents/")({
  component: DocumentsScreen,
});

function DocumentsScreen() {
  const { agentId } = Route.useParams();
  const admin = isAdmin(useSession((s) => s.user?.role));
  const list = useDocuments(agentId);
  const upload = useUploadDocument(agentId);
  const del = useDeleteDocument(agentId);

  // Optimistic rows exist only after a 202; keyed by the returned document_id.
  const [optimistic, setOptimistic] = useState<Document[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);

  const serverIds = new Set(list.items.map((d) => d.id));
  const rows = [...optimistic.filter((d) => !serverIds.has(d.id)), ...list.items];

  const removeOptimistic = (id: string) => setOptimistic((prev) => prev.filter((d) => d.id !== id));

  const onUpload = (file: File) => {
    setUploadError(null);
    setUnavailable(false);
    upload.mutate(file, {
      onSuccess: (ack) => {
        // Insert the optimistic queued row ONLY after the 202.
        setOptimistic((prev) => [
          {
            id: ack.document_id,
            agent_id: agentId,
            title: file.name,
            format: file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "",
            status: ack.status || "queued",
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
      },
      onError: (err) => {
        if (!(err instanceof ApiRequestError)) return setUploadError("Tải lên thất bại. Vui lòng thử lại.");
        if (err.status === 400) setUploadError("Loại hoặc kích thước tệp không được hỗ trợ. Vui lòng kiểm tra và thử lại.");
        else if (err.status === 409) setUploadError("Tài liệu này đã được tải lên trước đó.");
        else if (err.status === 503) setUnavailable(true);
        else setUploadError("Tải lên thất bại. Vui lòng thử lại.");
      },
    });
  };

  const onConfirmDelete = () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id!;
    del.mutate(id, {
      onSuccess: () => {
        removeOptimistic(id); // stops that doc's poller (row unmounts)
        setDeleteTarget(null);
        toast.success("Tài liệu đã bị xóa.");
      },
      onError: () => {
        setDeleteTarget(null);
        toast.error("Không thể xóa tài liệu.");
      },
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6 sm:p-8">
      <h1 className="font-display text-3xl font-semibold text-text-primary">Tài liệu</h1>

      {unavailable && (
        <div className="flex items-center gap-2 rounded-md border border-warning-border bg-warning-bg px-3 py-2 text-sm text-warning-fg" role="alert">
          <Warning className="size-4" aria-hidden />
          Hệ thống đang tạm thời không khả dụng. Vui lòng thử lại sau.
        </div>
      )}

      {admin && <UploadDropzone onUpload={onUpload} isUploading={upload.isPending} error={uploadError} />}

      <KeysetList
        items={rows}
        isLoading={list.isLoading}
        isError={list.isError}
        hasNextPage={list.hasNextPage}
        isFetchingNextPage={list.isFetchingNextPage}
        fetchNextPage={list.fetchNextPage}
        onRetry={list.refetch}
        skeleton={<Skeleton className="h-40 w-full rounded-2xl" />}
        empty={
          <EmptyState
            icon={FileText}
            title="Chưa có tài liệu nào"
            description={admin ? "Tải lên một tệp để làm nền cho phản hồi của tác nhân." : "Chưa có tài liệu nào được tải lên."}
          />
        }
      >
        {(docs) => (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Định dạng</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Tải lên lúc</TableHead>
                <TableHead className="w-12" aria-label="Hành động" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((doc) => (
                <DocumentRow
                  key={doc.id}
                  agentId={agentId}
                  doc={doc}
                  admin={admin}
                  onRequestDelete={setDeleteTarget}
                  onRemoved={removeOptimistic}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </KeysetList>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
          <DialogTitle>Xóa tài liệu</DialogTitle>
          <DialogDescription>
              Xóa “{deleteTarget?.title || "tài liệu này"}”? Hành động này không thể hoàn tác; để xử lý lại, bạn cần tải tệp lên lại.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Hủy
            </Button>
            <Button variant="danger" loading={del.isPending} onClick={onConfirmDelete}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

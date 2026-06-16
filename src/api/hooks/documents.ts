import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { unwrap } from "../errors";
import { normalizeForwardCursor, type ForwardCursor } from "../cursors";
import { useKeysetQuery } from "@/lib/use-keyset-query";
import type { components } from "../schema";

export type Document = components["schemas"]["Document"];
export type UploadAck = components["schemas"]["UploadAck"];

const PAGE_LIMIT = 50;
const POLL_INTERVAL_MS = 2500;

// Active ingest states. ANY other value (ready, failed, or an unknown status) is
// terminal — a defensive guard so polling always stops (success = "ready",
// verified server-side; never "ingested").
const ACTIVE_STATES = new Set(["queued", "extracting"]);
export function isTerminalStatus(status: string | undefined): boolean {
  return !ACTIVE_STATES.has((status ?? "").toLowerCase());
}

export const documentKeys = {
  all: (agentId: string) => ["agents", agentId, "documents"] as const,
  list: (agentId: string) => [...documentKeys.all(agentId), "list"] as const,
  status: (agentId: string, docId: string) => [...documentKeys.all(agentId), "status", docId] as const,
};

// Agent documents — forward keyset cursor.
export function useDocuments(agentId: string) {
  return useKeysetQuery<Document, ForwardCursor>({
    queryKey: documentKeys.list(agentId),
    getId: (d) => d.id!,
    fetchPage: async (cursor) => {
      const page = unwrap(
        await apiClient.GET("/api/agents/{id}/documents", {
          params: {
            path: { id: agentId },
            query: { limit: PAGE_LIMIT, after_created_at: cursor?.after_created_at, after_id: cursor?.after_id },
          },
        }),
      );
      return { items: page.documents ?? [], nextCursor: normalizeForwardCursor(page.next_cursor) };
    },
  });
}

// Multipart upload. Returns the 202 UploadAck; the caller inserts the optimistic
// row only after this resolves. 400/409/503 surface via ApiRequestError.status.
export function useUploadDocument(agentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File): Promise<UploadAck> =>
      unwrap(
        await apiClient.POST("/api/agents/{id}/documents", {
          params: { path: { id: agentId } },
          // The file is appended via the serializer from the closure; body content
          // is irrelevant since bodySerializer fully builds the multipart payload.
          body: {},
          bodySerializer: () => {
            const fd = new FormData();
            fd.append("file", file);
            return fd;
          },
        }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentKeys.list(agentId) }),
  });
}

// Poll a single document until terminal. Stops on a terminal status, on error
// (e.g. 404 if deleted mid-poll), and pauses automatically when the tab is hidden
// (refetchIntervalInBackground defaults to false).
export function useDocumentStatus(agentId: string, docId: string, enabled: boolean) {
  return useQuery({
    queryKey: documentKeys.status(agentId, docId),
    enabled,
    staleTime: 0,
    retry: false,
    queryFn: async (): Promise<Document> =>
      unwrap(await apiClient.GET("/api/agents/{id}/documents/{docId}", {
        params: { path: { id: agentId, docId } },
      })),
    refetchInterval: (query) => {
      if (query.state.status === "error") return false; // deleted / gone -> stop
      const status = query.state.data?.status;
      if (status === undefined) return POLL_INTERVAL_MS; // not loaded yet
      return isTerminalStatus(status) ? false : POLL_INTERVAL_MS;
    },
  });
}

// Delete. Server returns 204 or 404 (no 409). Caller stops the poller for this doc.
export function useDeleteDocument(agentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (docId: string): Promise<void> => {
      const res = await apiClient.DELETE("/api/agents/{id}/documents/{docId}", {
        params: { path: { id: agentId, docId } },
      });
      // 404 = already gone: treat as success (idempotent delete), not an error.
      if (res.error && res.response.status !== 404) unwrap(res);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentKeys.list(agentId) }),
  });
}

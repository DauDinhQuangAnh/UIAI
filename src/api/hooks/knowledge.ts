import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { unwrap } from "../errors";
import { normalizeForwardCursor, type ForwardCursor } from "../cursors";
import { useKeysetQuery } from "@/lib/use-keyset-query";
import type { components } from "../schema";

export type Candidate = components["schemas"]["Candidate"];
export type MergeRequest = components["schemas"]["MergeRequest"];
export type KGGraph = components["schemas"]["KGGraph"];
export type KGNode = components["schemas"]["KGNode"];
export type KGEdge = components["schemas"]["KGEdge"];

export const kgGraphKeys = {
  graph: (agentId: string) => ["agents", agentId, "kg-graph"] as const,
};

// useKgGraph loads the agent's read-only knowledge graph (entities as nodes, relations as
// edges; backend caps to top-150 by confidence and flags `truncated`). The endpoint ships no
// coordinates — the Graph view runs its own layout. Stable until invalidated; not refetched on
// focus (the graph only changes when a document is (re-)ingested).
export function useKgGraph(agentId: string) {
  return useQuery({
    queryKey: kgGraphKeys.graph(agentId),
    queryFn: async (): Promise<KGGraph> =>
      unwrap(await apiClient.GET("/api/agents/{id}/kg/graph", { params: { path: { id: agentId } } })),
    refetchOnWindowFocus: false,
  });
}

const PAGE_LIMIT = 50;

export const candidateKeys = {
  all: (agentId: string) => ["agents", agentId, "candidates"] as const,
  list: (agentId: string, status: string) => [...candidateKeys.all(agentId), "list", status] as const,
};

// KG dedup candidates — forward keyset cursor, status-filtered (default "pending").
export function useCandidates(agentId: string, status: string) {
  return useKeysetQuery<Candidate, ForwardCursor>({
    queryKey: candidateKeys.list(agentId, status),
    getId: (c) => c.id!,
    fetchPage: async (cursor) => {
      const page = unwrap(
        await apiClient.GET("/api/agents/{id}/kg/candidates", {
          params: {
            path: { id: agentId },
            query: { status, limit: PAGE_LIMIT, after_created_at: cursor?.after_created_at, after_id: cursor?.after_id },
          },
        }),
      );
      return { items: page.candidates ?? [], nextCursor: normalizeForwardCursor(page.next_cursor) };
    },
  });
}

// Merge is destructive/irreversible: the caller MUST pick keep/drop explicitly and
// confirm. Returns the 200 Candidate (status "merged", verified server-side); may
// 409 merge_not_applied or 422 — surface those and leave the card in place.
export function useMergeCandidate(agentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: string; body: MergeRequest }): Promise<Candidate> =>
      unwrap(await apiClient.POST("/api/kg/candidates/{id}/merge", { params: { path: { id: vars.id } }, body: vars.body })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: candidateKeys.all(agentId) }),
  });
}

// Dismiss returns the 200 Candidate (status "dismissed", verified server-side) or 404.
export function useDismissCandidate(agentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<Candidate> =>
      unwrap(await apiClient.POST("/api/kg/candidates/{id}/dismiss", { params: { path: { id } } })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: candidateKeys.all(agentId) }),
  });
}

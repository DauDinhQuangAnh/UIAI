import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { unwrap } from "../errors";
import { normalizeForwardCursor, type ForwardCursor } from "../cursors";
import { useKeysetQuery } from "@/lib/use-keyset-query";
import type { components } from "../schema";

export type Agent = components["schemas"]["Agent"];
export type AgentCreate = components["schemas"]["AgentCreate"];
export type AgentPatch = components["schemas"]["AgentPatch"];

const PAGE_LIMIT = 50;

export const agentKeys = {
  all: ["agents"] as const,
  list: () => [...agentKeys.all, "list"] as const,
  detail: (id: string) => [...agentKeys.all, "detail", id] as const,
};

// Agents list — forward keyset cursor (after_created_at + after_id).
export function useAgents() {
  return useKeysetQuery<Agent, ForwardCursor>({
    queryKey: agentKeys.list(),
    getId: (a) => a.id!,
    fetchPage: async (cursor) => {
      const page = unwrap(
        await apiClient.GET("/api/agents", {
          params: {
            query: {
              limit: PAGE_LIMIT,
              after_created_at: cursor?.after_created_at,
              after_id: cursor?.after_id,
            },
          },
        }),
      );
      return {
        items: page.agents ?? [],
        nextCursor: normalizeForwardCursor(page.next_cursor),
      };
    },
  });
}

export function useAgent(id: string) {
  return useQuery({
    queryKey: agentKeys.detail(id),
    queryFn: async (): Promise<Agent> =>
      unwrap(await apiClient.GET("/api/agents/{id}", { params: { path: { id } } })),
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: AgentCreate): Promise<Agent> =>
      unwrap(await apiClient.POST("/api/agents", { body })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.list() });
    },
  });
}

// Update config. The server clamps retrieval knobs regardless of client input, so
// on success we replace the cache with the server's response (the clamped truth)
// rather than trusting the optimistic value.
export function useUpdateAgent(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: AgentPatch): Promise<Agent> =>
      unwrap(await apiClient.PATCH("/api/agents/{id}", { params: { path: { id } }, body })),
    onSuccess: (agent) => {
      queryClient.setQueryData(agentKeys.detail(id), agent);
      queryClient.invalidateQueries({ queryKey: agentKeys.list() });
    },
  });
}

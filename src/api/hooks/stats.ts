import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client";
import { unwrap } from "../errors";
import type { components } from "../schema";

export type Stats = components["schemas"]["Stats"];

export const statsKeys = {
  detail: (agentId: string) => ["agents", agentId, "stats"] as const,
};

// Aggregate counts for the analytics dashboard. Counts move slowly relative to a
// dashboard view, so a 30s staleTime avoids refetch churn on navigation.
export function useStats(agentId: string) {
  return useQuery({
    queryKey: statsKeys.detail(agentId),
    staleTime: 30_000,
    queryFn: async (): Promise<Stats> =>
      unwrap(await apiClient.GET("/api/agents/{id}/stats", { params: { path: { id: agentId } } })),
  });
}

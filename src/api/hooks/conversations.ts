import { useInfiniteQuery } from "@tanstack/react-query";
import { apiClient } from "../client";
import { unwrap } from "../errors";
import {
  normalizeBackwardCursor,
  normalizeForwardCursor,
  type BackwardCursor,
  type ForwardCursor,
} from "../cursors";
import { useKeysetQuery } from "@/lib/use-keyset-query";
import type { components } from "../schema";

export type Conversation = components["schemas"]["Conversation"];
export type Message = components["schemas"]["Message"];

const PAGE_LIMIT = 50;

export const conversationKeys = {
  all: (agentId: string) => ["agents", agentId, "conversations"] as const,
  list: (agentId: string) => [...conversationKeys.all(agentId), "list"] as const,
  messages: (conversationId: string) => ["conversations", conversationId, "messages"] as const,
};

// Conversations — most-recent-first, so this list uses the BACKWARD cursor
// (before_activity_at + before_id), distinct from every other list's forward cursor.
export function useConversations(agentId: string) {
  return useKeysetQuery<Conversation, BackwardCursor>({
    queryKey: conversationKeys.list(agentId),
    getId: (c) => c.id!,
    fetchPage: async (cursor) => {
      const page = unwrap(
        await apiClient.GET("/api/agents/{id}/conversations", {
          params: {
            path: { id: agentId },
            query: { limit: PAGE_LIMIT, before_activity_at: cursor?.before_activity_at, before_id: cursor?.before_id },
          },
        }),
      );
      return { items: page.conversations ?? [], nextCursor: normalizeBackwardCursor(page.next_cursor) };
    },
  });
}

// Messages — forward cursor (oldest→newest), paged DOWNWARD: the endpoint has no
// backward cursor. Custom infinite query (not useKeysetQuery) so the per-page
// rolling `summary` is surfaced alongside the deduped message list.
export function useMessages(conversationId: string) {
  const query = useInfiniteQuery({
    queryKey: conversationKeys.messages(conversationId),
    initialPageParam: undefined as ForwardCursor | undefined,
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam as ForwardCursor | undefined;
      return unwrap(
        await apiClient.GET("/api/conversations/{id}/messages", {
          params: {
            path: { id: conversationId },
            query: { limit: PAGE_LIMIT, after_created_at: cursor?.after_created_at, after_id: cursor?.after_id },
          },
        }),
      );
    },
    getNextPageParam: (lastPage) => normalizeForwardCursor(lastPage.next_cursor),
  });

  const seen = new Set<string>();
  const messages: Message[] = [];
  for (const page of query.data?.pages ?? []) {
    for (const m of page.messages ?? []) {
      if (m.id && seen.has(m.id)) continue;
      if (m.id) seen.add(m.id);
      messages.push(m);
    }
  }

  return {
    messages,
    summary: query.data?.pages[0]?.summary ?? "",
    isLoading: query.isLoading,
    isError: query.isError,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
}

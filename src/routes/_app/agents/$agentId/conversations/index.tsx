import { createFileRoute, Link } from "@tanstack/react-router";
import { ChatsCircle, CaretRight } from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { KeysetList } from "@/components/common/keyset-list";
import { EmptyState } from "@/components/common/empty-state";
import { StatusChip } from "@/components/common/status-chip";
import { useConversations, type Conversation } from "@/api/hooks/conversations";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_app/agents/$agentId/conversations/")({
  component: ConversationsScreen,
});

const DEMO_AGENT_ID = "demo";

const DEMO_CONVERSATIONS: Conversation[] = [
  { id: "conv-001", conversation_ref: "CONV-20260620-001", end_user_ref: "user_nguyenvana", status: "open", last_activity_at: "2026-06-20T15:32:00Z" },
  { id: "conv-002", conversation_ref: "CONV-20260620-002", end_user_ref: "user_tranthib", status: "closed", last_activity_at: "2026-06-20T14:10:00Z" },
  { id: "conv-003", conversation_ref: "CONV-20260619-003", end_user_ref: "user_levanc", status: "open", last_activity_at: "2026-06-19T09:45:00Z" },
  { id: "conv-004", conversation_ref: "CONV-20260619-004", end_user_ref: "user_phamthid", status: "closed", last_activity_at: "2026-06-19T08:20:00Z" },
  { id: "conv-005", conversation_ref: "CONV-20260618-005", end_user_ref: "user_hoangvane", status: "open", last_activity_at: "2026-06-18T16:55:00Z" },
];

function ConversationsScreen() {
  const { agentId } = Route.useParams();
  const isDemoMode = agentId === DEMO_AGENT_ID;
  const apiList = useConversations(agentId);
  const list = isDemoMode
    ? {
        items: DEMO_CONVERSATIONS,
        isLoading: false,
        isError: false,
        error: null,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage: apiList.fetchNextPage,
        refetch: apiList.refetch,
      }
    : apiList;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6 sm:p-8">
      <h1 className="font-display text-3xl font-semibold text-text-primary">Conversations</h1>

      <KeysetList
        items={list.items}
        isLoading={list.isLoading}
        isError={list.isError}
        hasNextPage={list.hasNextPage}
        isFetchingNextPage={list.isFetchingNextPage}
        fetchNextPage={list.fetchNextPage}
        onRetry={list.refetch}
        skeleton={<Skeleton className="h-40 w-full rounded-2xl" />}
        empty={
          <EmptyState
            icon={ChatsCircle}
            title="Chưa có Conversation nào"
            description="Conversation sẽ xuất hiện khi người dùng bắt đầu chat với Agent này."
          />
        }
      >
        {(rows) => (
          <div className="flex flex-col gap-2">
            {rows.map((c) => (
              <ConversationRow key={c.id} agentId={agentId} conversation={c} />
            ))}
          </div>
        )}
      </KeysetList>
    </div>
  );
}

function ConversationRow({ agentId, conversation }: { agentId: string; conversation: Conversation }) {
  return (
    <Link to="/agents/$agentId/conversations/$conversationId" params={{ agentId, conversationId: conversation.id! }}>
      <Card className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-surface-2">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-text-primary">
              {conversation.end_user_ref || conversation.conversation_ref || "Conversation"}
            </span>
            <StatusChip status={conversation.status} />
          </div>
          <span className="font-mono text-xs text-text-dim">{conversation.conversation_ref}</span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-sm text-text-secondary tabular">{formatDateTime(conversation.last_activity_at)}</span>
          <CaretRight className="size-4 text-text-dim" aria-hidden />
        </div>
      </Card>
    </Link>
  );
}

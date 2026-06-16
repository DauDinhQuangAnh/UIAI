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

function ConversationsScreen() {
  const { agentId } = Route.useParams();
  const list = useConversations(agentId);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6 sm:p-8">
      <h1 className="font-display text-3xl font-semibold text-text-primary">Cuộc trò chuyện</h1>

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
            title="Chưa có cuộc trò chuyện nào"
            description="Cuộc trò chuyện sẽ xuất hiện khi người dùng bắt đầu chat với tác nhân này."
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
              {conversation.end_user_ref || conversation.conversation_ref || "Cuộc trò chuyện"}
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

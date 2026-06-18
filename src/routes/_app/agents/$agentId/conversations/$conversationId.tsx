import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ChatText } from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { SummaryCallout } from "@/components/conversations/summary-callout";
import { MessageList } from "@/components/conversations/message-list";
import { useMessages } from "@/api/hooks/conversations";

export const Route = createFileRoute("/_app/agents/$agentId/conversations/$conversationId")({
  component: TranscriptScreen,
});

function TranscriptScreen() {
  const { agentId, conversationId } = Route.useParams();
  const thread = useMessages(conversationId);

  // Constrain to the viewport minus the 3.5rem topbar so the message list owns a
  // bounded scroll region for virtualization (header + summary stay pinned).
  return (
    <div className="mx-auto flex h-[calc(100dvh-3.5rem)] w-full max-w-4xl flex-col gap-4 p-6 sm:p-8">
      <Link
        to="/agents/$agentId/conversations"
        params={{ agentId }}
        className="flex w-fit items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden /> Conversation
      </Link>

      {thread.isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-16 w-3/4 rounded-2xl" />
          <Skeleton className="h-16 w-2/3 self-end rounded-2xl" />
        </div>
      ) : thread.isError ? (
        <TranscriptError onRetry={thread.refetch} />
      ) : thread.messages.length === 0 ? (
        <EmptyState icon={ChatText} title="Không có tin nhắn" description="Conversation này chưa có tin nhắn nào." />
      ) : (
        <>
          <SummaryCallout summary={thread.summary} />
          <MessageList
            messages={thread.messages}
            hasNextPage={thread.hasNextPage}
            isFetchingNextPage={thread.isFetchingNextPage}
            fetchNextPage={thread.fetchNextPage}
          />
        </>
      )}
    </div>
  );
}

function TranscriptError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-danger-border bg-danger-bg px-6 py-12 text-center">
      <p className="text-sm text-danger-fg">Không thể tải Conversation này.</p>
      <Button variant="secondary" size="sm" onClick={onRetry}>
        Thử lại
      </Button>
    </div>
  );
}

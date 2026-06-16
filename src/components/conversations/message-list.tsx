import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Button } from "@/components/ui/button";
import { MessageBubble } from "@/components/conversations/message-bubble";
import type { Message } from "@/api/hooks/conversations";

// Virtualized transcript (oldest→newest). Long threads stay smooth via row
// virtualization with dynamic measurement (message heights vary). "Load older
// messages"… no — the endpoint has only a forward cursor, so newer pages append at
// the bottom and we page DOWNWARD with a trailing "Load more" control.
export function MessageList({
  messages,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: {
  messages: Message[];
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage: () => void;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 88,
    overscan: 8,
  });

  return (
    <div ref={parentRef} className="flex-1 overflow-y-auto">
      <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((row) => {
          const message = messages[row.index];
          return (
            <div
              key={message.id ?? row.index}
              data-index={row.index}
              ref={virtualizer.measureElement}
              className="absolute left-0 top-0 w-full"
              style={{ transform: `translateY(${row.start}px)` }}
            >
              <MessageBubble message={message} />
            </div>
          );
        })}
      </div>

      {hasNextPage && (
        <div className="flex justify-center py-4">
          <Button variant="secondary" size="sm" onClick={() => fetchNextPage()} loading={isFetchingNextPage}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}

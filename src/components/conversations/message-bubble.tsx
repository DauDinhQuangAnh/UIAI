import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { MarkdownMessage } from "@/components/conversations/markdown-message";
import { TypingDots } from "@/components/chat/typing-dots";
import type { Message } from "@/api/hooks/conversations";

// Role-styled chat bubble shared by the read-only transcript view and the live chat
// playground. user = right-aligned coral; assistant = left-aligned surface; anything else
// (system/tool) = a muted neutral note. When `streaming` is set, a blinking caret trails
// the (partial) assistant content to signal tokens are still arriving.
export function MessageBubble({
  message,
  streaming = false,
  loading = false,
}: {
  message: Message;
  streaming?: boolean;
  // When true (assistant awaiting its first token), render the typing dots in place of
  // content + caret, keeping the bubble chrome (role label, alignment) identical.
  loading?: boolean;
}) {
  const role = (message.role ?? "").toLowerCase();
  const isUser = role === "user";
  const isAssistant = role === "assistant";

  return (
    <div className={cn("flex flex-col gap-1 px-1 py-2", isUser ? "items-end" : "items-start")}>
      <div className="flex items-center gap-2 px-1">
        <span className="text-xs font-medium capitalize text-text-secondary">{message.role || "system"}</span>
        {message.created_at && (
          <span className="text-xs text-text-dim tabular">{formatDateTime(message.created_at)}</span>
        )}
      </div>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          // Plain bubbles preserve typed whitespace; the assistant path renders markdown,
          // which manages its own block spacing (pre-wrap would double it).
          !isAssistant && "whitespace-pre-wrap",
          isUser && "bg-brand-500 text-white",
          isAssistant && "border border-border bg-surface text-text-primary",
          !isUser && !isAssistant && "border border-border bg-surface-2 text-text-secondary",
        )}
      >
        {loading ? (
          <TypingDots />
        ) : isAssistant ? (
          <MarkdownMessage content={message.content ?? ""} />
        ) : (
          message.content
        )}
        {streaming && !loading && (
          <span
            className="ml-0.5 inline-block w-1.5 animate-pulse select-none text-text-dim"
            aria-hidden
          >
            ▋
          </span>
        )}
      </div>
    </div>
  );
}

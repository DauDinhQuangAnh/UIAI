import { useEffect, useRef, useState } from "react";
import { ArrowClockwise, Flask, Warning } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { MessageBubble } from "@/components/conversations/message-bubble";
import { ChatComposer } from "@/components/chat/chat-composer";
import { useChatSession, useResetChat, sendChatMessage, type Message } from "@/api/hooks/chat";

interface StreamError {
  code: string;
  message: string;
}

// ChatPanel is the live playground: a thread seeded from the saved scratch session, a composer
// that streams the agent's reply token-by-token, Reset, and graceful error/disabled states.
// It talks to the agent using its SAVED config — this is NOT a real end-user conversation, so a
// banner marks it as a playground and nothing here appears under Conversations or Analytics.
export function ChatPanel({ agentId }: { agentId: string }) {
  const session = useChatSession(agentId);
  const reset = useResetChat(agentId);

  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<StreamError | null>(null);
  const lastSentRef = useRef<string>("");
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const providerUnavailable = error?.code === "provider_unavailable";
  const conversationId = session.data?.conversation?.id;

  // Reseed the thread whenever the open session changes (initial load + after Reset). Does not
  // fire mid-stream (same conversation id), so a streaming reply is never clobbered.
  useEffect(() => {
    setMessages(session.data?.messages ?? []);
    setStreamingText(null);
    setPending(false);
    setError(null);
  }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Abort any in-flight stream on unmount.
  useEffect(() => () => abortRef.current?.abort(), []);

  // Auto-scroll to the bottom on new content when already pinned near the bottom (so a user
  // who scrolled up to read history isn't yanked down).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const pinned = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (pinned) el.scrollTop = el.scrollHeight;
  }, [messages, streamingText]);

  function send(text: string) {
    lastSentRef.current = text;
    setMessages((m) => [...m, { id: `local-${m.length}`, role: "user", content: text, created_at: new Date().toISOString() }]);
    setStreamingText("");
    setPending(true);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;
    let acc = "";
    void sendChatMessage(agentId, text, {
      signal: controller.signal,
      onDelta: (t) => {
        acc += t;
        setStreamingText(acc);
      },
      onDone: (done) => {
        setMessages((m) => [
          ...m,
          { id: done.message_id || `assistant-${m.length}`, role: "assistant", content: acc, created_at: new Date().toISOString() },
        ]);
        setStreamingText(null);
        setPending(false);
      },
      onError: (err) => {
        setStreamingText(null);
        setPending(false);
        setError(err);
      },
    });
  }

  function handleReset() {
    abortRef.current?.abort();
    reset.mutate();
  }

  function retry() {
    if (lastSentRef.current) {
      // Drop the failed optimistic user bubble before re-sending so it isn't duplicated.
      setMessages((m) => (m.length && m[m.length - 1].role === "user" ? m.slice(0, -1) : m));
      send(lastSentRef.current);
    }
  }

  const showThread = messages.length > 0 || streamingText !== null;

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-800">
            <Flask weight="fill" className="size-3.5" aria-hidden />
            Khu thử nghiệm
          </span>
          <span className="text-xs text-text-dim">
            Dùng cấu hình đã lưu của Agent · không hiển thị trong Conversations
          </span>
        </div>
        <Button variant="secondary" size="sm" onClick={handleReset} loading={reset.isPending} disabled={pending}>
          <ArrowClockwise className="size-4" aria-hidden /> Làm mới
        </Button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4" aria-live="polite">
        {!showThread ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-text-secondary">
            <Flask className="size-8 text-text-dim" aria-hidden />
            <p className="text-sm">Gửi một tin nhắn để thử Agent với cấu hình hiện tại.</p>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-3xl flex-col">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {streamingText !== null && (
              <MessageBubble
                message={{ id: "streaming", role: "assistant", content: streamingText, created_at: "" }}
                streaming
                loading={streamingText === ""}
              />
            )}
          </div>
        )}
      </div>

      {error && !providerUnavailable && (
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-2 text-sm text-danger-fg">
          <span className="flex items-center gap-2">
            <Warning weight="fill" className="size-4" aria-hidden /> {error.message}
          </span>
          <Button variant="ghost" size="sm" onClick={retry} disabled={pending}>
            Thử lại
          </Button>
        </div>
      )}

      {providerUnavailable ? (
        <div className="flex items-center gap-2 border-t border-border bg-surface-2 px-4 py-4 text-sm text-text-secondary">
          <Warning weight="fill" className="size-4 text-warning-fg" aria-hidden />
          Chat cần cấu hình khóa Gemini. Hãy thiết lập khóa để dùng khu thử nghiệm.
        </div>
      ) : (
        <ChatComposer onSend={send} disabled={pending || session.isLoading} />
      )}
    </div>
  );
}

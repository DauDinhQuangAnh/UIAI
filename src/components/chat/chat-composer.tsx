import { useRef, useState } from "react";
import { PaperPlaneRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

// Composer for the chat playground. Enter sends; Shift+Enter inserts a newline. The textarea
// auto-grows up to a cap and is disabled while a reply streams (one in-flight turn).
export function ChatComposer({
  onSend,
  disabled = false,
  placeholder = "Nhắn tin với tác nhân này…",
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  function submit() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
    if (ref.current) ref.current.style.height = "auto";
  }

  return (
    <div className="flex items-end gap-2 border-t border-border bg-surface p-3">
      <label htmlFor="chat-input" className="sr-only">
        Tin nhắn
      </label>
      <textarea
        id="chat-input"
        ref={ref}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          e.target.style.height = "auto";
          e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        rows={1}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          "max-h-40 flex-1 resize-none rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm",
          "leading-relaxed text-text-primary placeholder:text-text-dim",
          "focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100",
          "disabled:cursor-not-allowed disabled:opacity-60",
        )}
      />
      <Button
        type="button"
        size="md"
        onClick={submit}
        disabled={disabled || text.trim() === ""}
        aria-label="Gửi tin nhắn"
      >
        <PaperPlaneRight weight="fill" className="size-4" aria-hidden />
      </Button>
    </div>
  );
}

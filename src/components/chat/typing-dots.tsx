// Three bouncing dots shown in the assistant bubble between send() and the first SSE delta,
// so the wait reads as "thinking" rather than an empty bubble. Pure CSS (Tailwind's
// animate-bounce) with a staggered per-dot animation-delay; role=status + aria-label expose it
// to screen readers.
export function TypingDots() {
  return (
    <span role="status" aria-label="Agent is typing" className="inline-flex items-center gap-1 py-1">
      {["0ms", "150ms", "300ms"].map((delay) => (
        <span
          key={delay}
          className="size-1.5 animate-bounce rounded-full bg-text-dim"
          style={{ animationDelay: delay }}
        />
      ))}
    </span>
  );
}

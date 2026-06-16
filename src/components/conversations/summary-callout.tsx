import { Notepad } from "@phosphor-icons/react";

// Rolling conversation summary, pinned above the transcript. Rendered as a distinct
// callout (not a message bubble) so it reads as meta, not dialogue.
export function SummaryCallout({ summary }: { summary: string }) {
  if (!summary.trim()) return null;
  return (
    <div className="flex gap-3 rounded-2xl border border-brand-100 bg-brand-50 p-4">
      <Notepad className="size-5 shrink-0 text-brand-600" aria-hidden />
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-brand-800">Summary</span>
        <p className="text-sm leading-relaxed text-text-primary">{summary}</p>
      </div>
    </div>
  );
}

import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

// Every list gets icon + message + (optional) primary action (design §5).
export function EmptyState({
  icon: IconCmp,
  title,
  description,
  action,
  className,
}: {
  icon?: Icon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center",
        className,
      )}
    >
      {IconCmp && (
        <span className="flex size-12 items-center justify-center rounded-pill bg-brand-50 text-brand-600">
          <IconCmp className="size-6" aria-hidden />
        </span>
      )}
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-lg font-semibold text-text-primary">{title}</h3>
        {description && <p className="max-w-sm text-sm text-text-secondary">{description}</p>}
      </div>
      {action}
    </div>
  );
}

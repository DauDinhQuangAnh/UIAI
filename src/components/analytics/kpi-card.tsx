import type { Icon } from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";

// A single KPI tile (design §5). Big tabular number + label; optional icon and a
// tone accent for at-a-glance status (e.g. pending-dedup warns when non-zero).
export function KpiCard({
  label,
  value,
  icon: IconCmp,
  hint,
}: {
  label: string;
  value: number | undefined;
  icon?: Icon;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-5">
        <div className="flex items-center gap-2 text-text-secondary">
          {IconCmp && <IconCmp className="size-4" aria-hidden />}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="font-display text-3xl font-semibold text-text-primary tabular">{formatNumber(value)}</span>
        {hint && <span className="text-xs text-text-dim">{hint}</span>}
      </CardContent>
    </Card>
  );
}

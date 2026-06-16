import { CheckCircle, WarningCircle, XCircle, Spinner, type Icon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "warning" | "info" | "success" | "danger";

interface StatusMeta {
  tone: Tone;
  icon?: Icon;
  pulse?: boolean;
  label?: string;
}

// Single source of truth status->color+icon map (design §2). Covers document
// ingest states and KG candidate states. In-progress states pulse.
const STATUS_META: Record<string, StatusMeta> = {
  // Document ingest pipeline (success = "ready", verified server-side).
  queued: { tone: "warning", pulse: true, label: "Đang chờ" },
  extracting: { tone: "info", pulse: true, label: "Đang trích xuất" },
  ready: { tone: "success", icon: CheckCircle, label: "Sẵn sàng" },
  failed: { tone: "danger", icon: XCircle, label: "Thất bại" },
  // KG candidate states.
  pending: { tone: "warning", icon: WarningCircle, label: "Chờ xử lý" },
  merged: { tone: "success", icon: CheckCircle, label: "Đã hợp nhất" },
  dismissed: { tone: "neutral", label: "Đã bỏ qua" },
};

export function StatusChip({ status, className }: { status: string | undefined; className?: string }) {
  const key = (status ?? "").toLowerCase();
  const meta = STATUS_META[key] ?? { tone: "neutral" as Tone };
  const Ico = meta.icon;
  return (
    <Badge tone={meta.tone} className={cn("capitalize", className)}>
      {meta.pulse ? (
        <Spinner className="size-3.5 animate-spin" aria-hidden />
      ) : Ico ? (
        <Ico className="size-3.5" aria-hidden />
      ) : null}
      {meta.label ?? status ?? "không xác định"}
    </Badge>
  );
}

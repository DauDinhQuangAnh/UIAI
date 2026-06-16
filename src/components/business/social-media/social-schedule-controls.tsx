import { Check } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { DAYS, type DayKey, type DaySchedule, type PageSchedule } from "./social-media-data";

export function ScheduleChoice({
  title,
  selected,
  onSelect,
  children,
}: {
  title: string;
  selected: boolean;
  onSelect: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={[
        "rounded-xl border bg-surface p-3 transition-colors",
        selected ? "border-brand-600 shadow-xs" : "border-border hover:border-brand-200",
      ].join(" ")}
    >
      <button type="button" onClick={onSelect} className="flex w-full items-center justify-between gap-3 text-left">
        <span className="text-sm font-medium text-text-primary">{title}</span>
        <span
          className={[
            "flex size-6 shrink-0 items-center justify-center rounded-pill transition-colors",
            selected ? "bg-success-base text-white" : "bg-surface-2 text-transparent",
          ].join(" ")}
          aria-hidden
        >
          <Check className="size-4" weight="bold" />
        </span>
      </button>
      {children}
    </div>
  );
}

export function PartTimeScheduleGrid({
  schedule,
  onChange,
}: {
  schedule: PageSchedule;
  onChange: (schedule: PageSchedule) => void;
}) {
  const updateDay = (dayKey: DayKey, nextDay: DaySchedule) => {
    onChange({
      ...schedule,
      days: {
        ...schedule.days,
        [dayKey]: nextDay,
      },
    });
  };

  return (
    <div className="mt-3 rounded-lg bg-surface-2 p-3">
      <p className="mb-3 text-xs text-text-secondary">
        Bật các ngày chatbot hoạt động và thiết lập giờ bắt đầu, kết thúc cho từng ngày đã kích hoạt.
      </p>
      <div className="overflow-x-auto">
        <div className="grid min-w-[840px] grid-cols-7 gap-3">
          {DAYS.map((day) => {
            const daySchedule = schedule.days[day.key];
            return (
              <div key={day.key} className="grid min-w-28 gap-2">
                <button
                  type="button"
                  className={[
                    "rounded-md border px-2 py-1 text-xs font-semibold transition-colors",
                    daySchedule.enabled
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-border-strong bg-surface text-text-secondary hover:border-brand-200 hover:bg-brand-50",
                  ].join(" ")}
                  onClick={() => updateDay(day.key, { ...daySchedule, enabled: !daySchedule.enabled })}
                >
                  {day.label}
                </button>
                <Input
                  type="time"
                  value={daySchedule.start}
                  disabled={!daySchedule.enabled}
                  className="h-9 min-w-24 px-2 text-sm"
                  onChange={(event) => updateDay(day.key, { ...daySchedule, start: event.target.value })}
                />
                <Input
                  type="time"
                  value={daySchedule.end}
                  disabled={!daySchedule.enabled}
                  className="h-9 min-w-24 px-2 text-sm"
                  onChange={(event) => updateDay(day.key, { ...daySchedule, end: event.target.value })}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

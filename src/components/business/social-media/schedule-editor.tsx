import { CheckCircle } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import type { DayOfWeekName, PageScheduleDraft } from "./social-media-models";
import {
  DAY_OPTIONS,
  DEFAULT_PART_TIME_END,
  DEFAULT_PART_TIME_START,
  DEFAULT_TIMEZONE,
  FULL_TIME_END,
  FULL_TIME_START,
  defaultPartScheduleDraft,
} from "./social-media-utils";

export function ScheduleEditor({
  schedule,
  disabled,
  onChange,
}: {
  schedule: PageScheduleDraft;
  disabled?: boolean;
  onChange: (schedule: PageScheduleDraft) => void;
}) {
  const activeDayCount = Object.keys(schedule.daySchedules).length;

  const switchToFull = () => {
    onChange({ ...schedule, mode: "full", daySchedules: {} });
  };

  const switchToPart = () => {
    if (activeDayCount > 0) {
      onChange({ ...schedule, mode: "part" });
    } else {
      onChange(defaultPartScheduleDraft());
    }
  };

  return (
    <div className="grid gap-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <ModeButton
          label="Full time"
          description="Bot hoạt động toàn thời gian."
          selected={schedule.mode === "full"}
          disabled={disabled}
          onClick={switchToFull}
        />
        <ModeButton
          label="Part time"
          description="Tùy chỉnh giờ hoạt động từng ngày."
          selected={schedule.mode === "part"}
          disabled={disabled}
          onClick={switchToPart}
        />
      </div>

      {schedule.mode === "full" ? (
        <div className="flex items-center gap-2 rounded-md border border-success-border bg-success-bg px-3 py-2 text-sm font-medium text-success-fg">
          <CheckCircle className="size-5" weight="fill" aria-hidden />
          Đã chọn Full time: hệ thống sẽ lưu 7 ngày, 00:00 – 23:59.
        </div>
      ) : (
        <PartTimeTable
          schedule={schedule}
          disabled={disabled}
          onChange={onChange}
        />
      )}
    </div>
  );
}

export function PartTimeTable({
  schedule,
  disabled,
  onChange,
}: {
  schedule: PageScheduleDraft;
  disabled?: boolean;
  onChange: (schedule: PageScheduleDraft) => void;
}) {
  const toggleDay = (day: DayOfWeekName) => {
    const existing = schedule.daySchedules[day];
    const next = { ...schedule.daySchedules };
    if (existing) {
      delete next[day];
    } else {
      next[day] = { fullDay: false, startTime: DEFAULT_PART_TIME_START, endTime: DEFAULT_PART_TIME_END };
    }
    onChange({ ...schedule, mode: "part", daySchedules: next });
  };

  const toggleFullDay = (day: DayOfWeekName) => {
    const existing = schedule.daySchedules[day];
    if (!existing) return;
    onChange({
      ...schedule,
      daySchedules: {
        ...schedule.daySchedules,
        [day]: { ...existing, fullDay: !existing.fullDay },
      },
    });
  };

  const updateTime = (day: DayOfWeekName, field: "startTime" | "endTime", value: string) => {
    const existing = schedule.daySchedules[day];
    if (!existing) return;
    onChange({
      ...schedule,
      daySchedules: {
        ...schedule.daySchedules,
        [day]: { ...existing, [field]: value },
      },
    });
  };

  const updateTimezone = (timezone: string) => onChange({ ...schedule, timezone });

  return (
    <div className="grid gap-3 rounded-md border border-border bg-card p-3">
      <label className="grid gap-1 text-xs font-medium text-text-secondary">
        Timezone
        <Input
          value={schedule.timezone}
          disabled={disabled}
          placeholder={DEFAULT_TIMEZONE}
          className="h-8 text-sm"
          onChange={(e) => updateTimezone(e.target.value)}
        />
      </label>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-separate border-spacing-x-1 border-spacing-y-0">
          <thead>
            <tr>
              {DAY_OPTIONS.map((day) => {
                const active = !!schedule.daySchedules[day.value];
                return (
                  <th key={day.value} className="w-[14.28%] pb-1 text-center">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleDay(day.value)}
                      className={[
                        "w-full rounded-md border py-1 text-xs font-bold transition-colors disabled:cursor-not-allowed",
                        active
                          ? "border-brand-500 bg-brand-500 text-white"
                          : "border-border bg-surface text-text-secondary hover:border-brand-300",
                      ].join(" ")}
                    >
                      {day.shortLabel}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {/* "Cả ngày" row */}
            <tr>
              {DAY_OPTIONS.map((day) => {
                const config = schedule.daySchedules[day.value];
                return (
                  <td key={day.value} className="py-1 align-top">
                    {config ? (
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => toggleFullDay(day.value)}
                        className={[
                          "w-full rounded border px-1 py-1 text-center text-[11px] font-semibold leading-tight transition-colors disabled:cursor-not-allowed",
                          config.fullDay
                            ? "border-brand-400 bg-brand-50 text-brand-700"
                            : "border-border bg-surface text-text-secondary hover:border-brand-300",
                        ].join(" ")}
                      >
                        Cả ngày
                      </button>
                    ) : (
                      <div className="h-7 rounded border border-dashed border-border bg-surface opacity-30" />
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Start time row */}
            <tr>
              {DAY_OPTIONS.map((day) => {
                const config = schedule.daySchedules[day.value];
                return (
                  <td key={day.value} className="py-0.5 align-top">
                    {config && !config.fullDay ? (
                      <Input
                        type="time"
                        value={config.startTime}
                        disabled={disabled}
                        className="h-7 px-1 text-center text-xs"
                        onChange={(e) => updateTime(day.value, "startTime", e.target.value)}
                      />
                    ) : (
                      <div className={["h-7", config ? "" : "opacity-0"].join(" ")} />
                    )}
                  </td>
                );
              })}
            </tr>

            {/* End time row */}
            <tr>
              {DAY_OPTIONS.map((day) => {
                const config = schedule.daySchedules[day.value];
                return (
                  <td key={day.value} className="py-0.5 align-top">
                    {config && !config.fullDay ? (
                      <Input
                        type="time"
                        value={config.endTime}
                        disabled={disabled}
                        className="h-7 px-1 text-center text-xs"
                        onChange={(e) => updateTime(day.value, "endTime", e.target.value)}
                      />
                    ) : (
                      <div className={["h-7", config ? "" : "opacity-0"].join(" ")} />
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Labels row */}
            <tr>
              {DAY_OPTIONS.map((day) => {
                const config = schedule.daySchedules[day.value];
                return (
                  <td key={day.value} className="pt-0.5 text-center align-top">
                    {config && !config.fullDay && (
                      <div className="space-y-0.5">
                        <div className="text-[9px] text-text-secondary">Giờ BĐ</div>
                        <div className="text-[9px] text-text-secondary">Giờ KT</div>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ModeButton({
  label,
  description,
  selected,
  disabled,
  onClick,
}: {
  label: string;
  description: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        "grid min-h-20 rounded-md border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        selected ? "border-brand-400 bg-brand-50 text-brand-900" : "border-border bg-card hover:border-brand-200",
      ].join(" ")}
    >
      <span className="flex items-center justify-between gap-2 font-semibold">
        {label}
        {selected && <CheckCircle className="size-5 text-brand-700" weight="fill" aria-hidden />}
      </span>
      <span className="mt-1 text-sm text-text-secondary">{description}</span>
    </button>
  );
}

// Re-export for backward compat if anything imported these directly
export { FULL_TIME_START, FULL_TIME_END };

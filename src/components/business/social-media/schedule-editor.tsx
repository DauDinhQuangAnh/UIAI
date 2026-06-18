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
  const allDaysSelected = DAY_OPTIONS.every((day) => schedule.workingDays.includes(day.value));

  const toggleDay = (day: DayOfWeekName) => {
    const workingDays = schedule.workingDays.includes(day)
      ? schedule.workingDays.filter((item) => item !== day)
      : [...schedule.workingDays, day];
    onChange({ ...schedule, mode: "part", workingDays });
  };

  return (
    <div className="grid gap-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          disabled={disabled}
          className={[
            "grid min-h-20 rounded-md border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60",
            schedule.mode === "full"
              ? "border-brand-400 bg-brand-50 text-brand-900"
              : "border-border bg-card hover:border-brand-200",
          ].join(" ")}
          onClick={() =>
            onChange({
              ...schedule,
              mode: "full",
              workingDays: DAY_OPTIONS.map((day) => day.value),
              startTime: FULL_TIME_START,
              endTime: FULL_TIME_END,
            })
          }
        >
          <span className="flex items-center justify-between gap-2 font-semibold">
            Full time
            {schedule.mode === "full" && <CheckCircle className="size-5 text-brand-700" weight="fill" aria-hidden />}
          </span>
          <span className="mt-1 text-sm text-text-secondary">Bot hoạt động toàn thời gian.</span>
        </button>
        <button
          type="button"
          disabled={disabled}
          className={[
            "grid min-h-20 rounded-md border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60",
            schedule.mode === "part"
              ? "border-brand-400 bg-brand-50 text-brand-900"
              : "border-border bg-card hover:border-brand-200",
          ].join(" ")}
          onClick={() =>
            onChange({
              ...schedule,
              mode: "part",
              startTime: schedule.startTime === FULL_TIME_START ? DEFAULT_PART_TIME_START : schedule.startTime,
              endTime: schedule.endTime === FULL_TIME_END ? DEFAULT_PART_TIME_END : schedule.endTime,
              workingDays: allDaysSelected ? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] : schedule.workingDays,
            })
          }
        >
          <span className="flex items-center justify-between gap-2 font-semibold">
            Part time
            {schedule.mode === "part" && <CheckCircle className="size-5 text-brand-700" weight="fill" aria-hidden />}
          </span>
          <span className="mt-1 text-sm text-text-secondary">Chọn ngày và một khung giờ dùng chung.</span>
        </button>
      </div>

      {schedule.mode === "full" ? (
        <div className="flex items-center gap-2 rounded-md border border-success-border bg-success-bg px-3 py-2 text-sm font-medium text-success-fg">
          <CheckCircle className="size-5" weight="fill" aria-hidden />
          Đã chọn Full time: hệ thống sẽ lưu 7 ngày, 00:00 - 23:59.
        </div>
      ) : (
        <div className="grid gap-3 rounded-md border border-border bg-card p-3">
          <div className="flex flex-wrap gap-2">
            {DAY_OPTIONS.map((day) => {
              const selected = schedule.workingDays.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  disabled={disabled}
                  className={[
                    "h-9 rounded-md border px-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                    selected
                      ? "border-brand-400 bg-brand-50 text-brand-900"
                      : "border-border bg-surface text-text-secondary hover:border-brand-200",
                  ].join(" ")}
                  onClick={() => toggleDay(day.value)}
                >
                  {day.shortLabel}
                </button>
              );
            })}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1 text-sm font-medium text-text-primary">
              Bắt đầu
              <Input
                type="time"
                value={schedule.startTime}
                disabled={disabled}
                onChange={(event) => onChange({ ...schedule, startTime: event.target.value })}
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-text-primary">
              Kết thúc
              <Input
                type="time"
                value={schedule.endTime}
                disabled={disabled}
                onChange={(event) => onChange({ ...schedule, endTime: event.target.value })}
              />
            </label>
            <label className="grid gap-1 text-sm font-medium text-text-primary">
              Timezone
              <Input
                value={schedule.timezone}
                disabled={disabled}
                placeholder={DEFAULT_TIMEZONE}
                onChange={(event) => onChange({ ...schedule, timezone: event.target.value })}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}


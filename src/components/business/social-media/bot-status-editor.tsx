import { CheckCircle } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DayOfWeekName, ManageBotMode, PageScheduleDraft } from "./social-media-models";
import {
  DAY_OPTIONS,
  DEFAULT_PART_TIME_END,
  DEFAULT_PART_TIME_START,
  FULL_TIME_END,
  FULL_TIME_START,
} from "./social-media-utils";

export function ManageBotStatusEditor({
  value,
  schedule,
  disabled,
  onModeChange,
  onScheduleChange,
}: {
  value: ManageBotMode;
  schedule: PageScheduleDraft;
  disabled?: boolean;
  onModeChange: (value: ManageBotMode) => void;
  onScheduleChange: (schedule: PageScheduleDraft) => void;
}) {
  const selectMode = (mode: ManageBotMode) => {
    if (disabled) return;
    onModeChange(mode);
    if (mode === "full") {
      onScheduleChange({
        ...schedule,
        mode: "full",
        workingDays: DAY_OPTIONS.map((day) => day.value),
        startTime: FULL_TIME_START,
        endTime: FULL_TIME_END,
      });
    }
    if (mode === "part") {
      onScheduleChange({
        ...schedule,
        mode: "part",
        startTime: schedule.startTime === FULL_TIME_START ? DEFAULT_PART_TIME_START : schedule.startTime,
        endTime: schedule.endTime === FULL_TIME_END ? DEFAULT_PART_TIME_END : schedule.endTime,
        workingDays: schedule.workingDays.length > 0
          ? schedule.workingDays
          : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      });
    }
  };

  const toggleDay = (day: DayOfWeekName) => {
    const workingDays = schedule.workingDays.includes(day)
      ? schedule.workingDays.filter((item) => item !== day)
      : [...schedule.workingDays, day];
    onModeChange("part");
    onScheduleChange({ ...schedule, mode: "part", workingDays });
  };

  return (
    <div className="grid gap-2">
      <Label className="font-medium text-brand-800">Trạng thái hoạt động của Chatbot</Label>
      <BotModeRow
        label="Dừng hoạt động"
        selected={value === "inactive"}
        disabled={disabled}
        onClick={() => selectMode("inactive")}
      />
      <BotModeRow
        label="Hoạt động toàn thời gian"
        selected={value === "full"}
        disabled={disabled}
        onClick={() => selectMode("full")}
      />
      <div
        className={[
          "overflow-hidden rounded-md border bg-white shadow-xs transition-colors",
          value === "part" ? "border-[#2f63a8]" : "border-[#d6dce5]",
          disabled ? "opacity-60" : "",
        ].join(" ")}
      >
        <button
          type="button"
          disabled={disabled}
          className="flex min-h-11 w-full items-center justify-between gap-3 px-3 text-left font-medium text-text-primary disabled:cursor-not-allowed"
          onClick={() => selectMode("part")}
        >
          <span>Hoạt động bán thời gian</span>
          {value === "part" && <CheckCircle className="size-5 text-[#2f63a8]" weight="fill" aria-hidden />}
        </button>
        {value === "part" && (
          <div className="border-t border-[#d6dce5] p-3">
            <div className="grid grid-cols-7 gap-2">
              {DAY_OPTIONS.map((day) => {
                const selected = schedule.workingDays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    disabled={disabled}
                    className={[
                      "h-8 rounded-md border text-xs font-semibold transition-colors disabled:cursor-not-allowed",
                      selected
                        ? "border-[#2f63a8] bg-[#2f63a8] text-white"
                        : "border-[#d6dce5] bg-white text-text-secondary hover:border-[#2f63a8]",
                    ].join(" ")}
                    onClick={() => toggleDay(day.value)}
                  >
                    {day.shortLabel}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-medium text-brand-800">
                Giờ bắt đầu
                <Input
                  type="time"
                  value={schedule.startTime}
                  disabled={disabled}
                  onChange={(event) =>
                    onScheduleChange({ ...schedule, mode: "part", startTime: event.target.value })
                  }
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-brand-800">
                Giờ kết thúc
                <Input
                  type="time"
                  value={schedule.endTime}
                  disabled={disabled}
                  onChange={(event) =>
                    onScheduleChange({ ...schedule, mode: "part", endTime: event.target.value })
                  }
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BotModeRow({
  label,
  selected,
  disabled,
  onClick,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={[
        "flex min-h-11 items-center justify-between gap-3 rounded-md border bg-white px-3 text-left font-medium text-text-primary shadow-xs transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        selected ? "border-[#2f63a8]" : "border-[#d6dce5] hover:border-[#2f63a8]",
      ].join(" ")}
      onClick={onClick}
    >
      <span>{label}</span>
      {selected && <CheckCircle className="size-5 text-[#2f63a8]" weight="fill" aria-hidden />}
    </button>
  );
}


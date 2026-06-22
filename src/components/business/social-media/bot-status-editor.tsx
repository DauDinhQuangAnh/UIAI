import { CheckCircle } from "@phosphor-icons/react";
import type { DayOfWeekName, ManageBotMode, PageScheduleDraft } from "./social-media-models";
import {
  DAY_OPTIONS,
  DEFAULT_PART_TIME_END,
  DEFAULT_PART_TIME_START,
  FULL_TIME_END,
  FULL_TIME_START,
} from "./social-media-utils";
import { PartTimeTable } from "./schedule-editor";

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
      onScheduleChange({ ...schedule, mode: "full", daySchedules: {} });
    }
    if (mode === "part") {
      const hasDays = Object.keys(schedule.daySchedules).length > 0;
      if (hasDays) {
        onScheduleChange({ ...schedule, mode: "part" });
      } else {
        const weekdays: DayOfWeekName[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
        const daySchedules: PageScheduleDraft["daySchedules"] = {};
        for (const day of weekdays) {
          daySchedules[day] = { fullDay: false, startTime: DEFAULT_PART_TIME_START, endTime: DEFAULT_PART_TIME_END };
        }
        onScheduleChange({ ...schedule, mode: "part", daySchedules });
      }
    }
  };

  return (
    <div className="grid gap-2">
      <span className="font-medium text-brand-800">Trạng thái hoạt động của Chatbot</span>
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
            <PartTimeTable
              schedule={schedule}
              disabled={disabled}
              onChange={onScheduleChange}
            />
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

// Re-exports for anything that imported these from here directly
export { FULL_TIME_START, FULL_TIME_END, DAY_OPTIONS };

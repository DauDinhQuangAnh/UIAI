import { Check } from "@phosphor-icons/react";
import { type Dispatch, type FormEvent, type SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PartTimeScheduleGrid, ScheduleChoice } from "./social-schedule-controls";
import {
  BUSINESS_OPTIONS,
  MANAGED_PAGES,
  createDefaultSchedule,
  type AddLinkForm,
  type AddStep,
  type ManagedPage,
  type PageSchedule,
  type ScheduleState,
} from "./social-media-data";

export function AddSocialLinkDialog({
  open,
  step,
  form,
  selectedPageIds,
  schedules,
  setForm,
  setSelectedPageIds,
  setSchedules,
  onOpenChange,
  onStepChange,
  onReset,
}: {
  open: boolean;
  step: AddStep;
  form: AddLinkForm;
  selectedPageIds: string[];
  schedules: ScheduleState;
  setForm: Dispatch<SetStateAction<AddLinkForm>>;
  setSelectedPageIds: Dispatch<SetStateAction<string[]>>;
  setSchedules: Dispatch<SetStateAction<ScheduleState>>;
  onOpenChange: (open: boolean) => void;
  onStepChange: (step: AddStep) => void;
  onReset: () => void;
}) {
  const onContinueCredentials = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onStepChange("pages");
  };

  const onContinuePages = () => {
    setSchedules((current) => {
      const next: ScheduleState = {};
      for (const pageId of selectedPageIds) {
        next[pageId] = current[pageId] ?? createDefaultSchedule();
      }
      return next;
    });
    onStepChange("schedule");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={step === "schedule" ? "max-w-5xl" : "max-w-xl"}>
        {step === "credentials" ? (
          <CredentialsStep form={form} setForm={setForm} onContinue={onContinueCredentials} />
        ) : step === "pages" ? (
          <PageSelectStep
            selectedPageIds={selectedPageIds}
            onTogglePage={(pageId) =>
              setSelectedPageIds((current) =>
                current.includes(pageId)
                  ? current.filter((id) => id !== pageId)
                  : [...current, pageId],
              )
            }
            onBack={() => onStepChange("credentials")}
            onContinue={onContinuePages}
          />
        ) : (
          <ScheduleStep
            pages={MANAGED_PAGES.filter((page) => selectedPageIds.includes(page.id))}
            schedules={schedules}
            setSchedules={setSchedules}
            onBack={() => onStepChange("pages")}
            onConfirm={onReset}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CredentialsStep({
  form,
  setForm,
  onContinue,
}: {
  form: AddLinkForm;
  setForm: Dispatch<SetStateAction<AddLinkForm>>;
  onContinue: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <>
      <DialogHeader className="items-center text-center">
        <DialogTitle className="text-brand-800">Add Social Media Link</DialogTitle>
        <DialogDescription>
          Enter the app credentials for the selected business connection.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={onContinue} className="grid gap-4">
        <SocialField label="Business" htmlFor="social_business">
          <Select
            value={form.business}
            onValueChange={(business) => setForm((current) => ({ ...current, business }))}
          >
            <SelectTrigger id="social_business">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BUSINESS_OPTIONS.map((business) => (
                <SelectItem key={business} value={business}>
                  {business}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SocialField>
        <SocialField label="App ID" htmlFor="social_app_id" required>
          <Input
            id="social_app_id"
            value={form.appId}
            placeholder="htoy-yuan-1899-xjkp"
            onChange={(event) => setForm((current) => ({ ...current, appId: event.target.value }))}
            required
          />
        </SocialField>
        <SocialField label="App Secret" htmlFor="social_app_secret" required>
          <Input
            id="social_app_secret"
            type="password"
            value={form.appSecret}
            placeholder="--------------------------------"
            onChange={(event) => setForm((current) => ({ ...current, appSecret: event.target.value }))}
            required
          />
        </SocialField>
        <DialogFooter className="mt-3 sm:justify-center">
          <Button type="submit">Continue</Button>
        </DialogFooter>
      </form>
    </>
  );
}

function PageSelectStep({
  selectedPageIds,
  onTogglePage,
  onBack,
  onContinue,
}: {
  selectedPageIds: string[];
  onTogglePage: (pageId: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <>
      <DialogHeader className="items-center text-center">
        <DialogTitle className="text-brand-800">Choose Page To Link</DialogTitle>
        <DialogDescription>Select one or more managed Facebook pages to connect.</DialogDescription>
      </DialogHeader>
      <div className="mx-auto flex w-full max-w-md flex-col gap-3">
        {MANAGED_PAGES.map((page) => {
          const selected = selectedPageIds.includes(page.id);
          return (
            <button
              key={page.id}
              type="button"
              onClick={() => onTogglePage(page.id)}
              className={[
                "flex w-full items-center gap-3 rounded-lg border bg-surface p-3 text-left transition-colors",
                selected
                  ? "border-brand-600 bg-brand-50 shadow-xs"
                  : "border-border hover:border-brand-200 hover:bg-brand-50/60",
              ].join(" ")}
            >
              <span className={`flex size-12 shrink-0 items-center justify-center rounded-lg font-semibold ${page.accent}`}>
                {page.initials}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-sm font-semibold text-text-primary">{page.name}</span>
                <span className="truncate font-mono text-xs text-text-secondary">{page.handle}</span>
              </span>
              <span
                className={[
                  "flex size-6 shrink-0 items-center justify-center rounded-md border transition-colors",
                  selected
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-border-strong bg-surface text-transparent",
                ].join(" ")}
                aria-hidden
              >
                <Check className="size-4" />
              </span>
            </button>
          );
        })}
      </div>
      <DialogFooter className="mt-3 sm:justify-between">
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={onContinue} disabled={selectedPageIds.length === 0}>
          Continue
        </Button>
      </DialogFooter>
    </>
  );
}

function ScheduleStep({
  pages,
  schedules,
  setSchedules,
  onBack,
  onConfirm,
}: {
  pages: ManagedPage[];
  schedules: ScheduleState;
  setSchedules: Dispatch<SetStateAction<ScheduleState>>;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const updateSchedule = (pageId: string, updater: (schedule: PageSchedule) => PageSchedule) => {
    setSchedules((current) => ({
      ...current,
      [pageId]: updater(current[pageId] ?? createDefaultSchedule()),
    }));
  };

  return (
    <>
      <DialogHeader className="items-center text-center">
        <DialogTitle className="text-brand-800">Configure Operating Time</DialogTitle>
        <DialogDescription>Set when the chatbot should run for each selected page.</DialogDescription>
      </DialogHeader>

      <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
        {pages.map((page) => {
          const schedule = schedules[page.id] ?? createDefaultSchedule();
          return (
            <div key={page.id} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-brand-800">{page.name}</h3>
                  <p className="truncate font-mono text-xs text-text-secondary">{page.handle}</p>
                </div>
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${page.accent}`}>
                  {page.initials}
                </span>
              </div>

              <div className="grid gap-3">
                <ScheduleChoice
                  title="Full-time operation"
                  selected={schedule.mode === "full"}
                  onSelect={() => updateSchedule(page.id, (current) => ({ ...current, mode: "full" }))}
                />
                <ScheduleChoice
                  title="Part-time operation"
                  selected={schedule.mode === "partial"}
                  onSelect={() => updateSchedule(page.id, (current) => ({ ...current, mode: "partial" }))}
                >
                  {schedule.mode === "partial" && (
                    <PartTimeScheduleGrid
                      schedule={schedule}
                      onChange={(nextSchedule) => updateSchedule(page.id, () => nextSchedule)}
                    />
                  )}
                </ScheduleChoice>
              </div>
            </div>
          );
        })}
      </div>

      <DialogFooter className="mt-3 sm:justify-between">
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={onConfirm}>
          Confirm
        </Button>
      </DialogFooter>
    </>
  );
}

export function SocialField({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[8rem_1fr] sm:items-center">
      <Label htmlFor={htmlFor} className="text-brand-800">
        {label}
        {required && <span className="ml-1 text-danger-fg">*</span>}
      </Label>
      {children}
    </div>
  );
}

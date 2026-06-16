import { type FormEvent } from "react";
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
import { BUSINESS_OPTIONS, type EditLinkForm, type SocialLink } from "./social-media-data";
import { PartTimeScheduleGrid, ScheduleChoice } from "./social-schedule-controls";
import { SocialField } from "./add-social-link-dialog";

export function EditSocialLinkDialog({
  target,
  form,
  onOpenChange,
  onFormChange,
  onSubmit,
}: {
  target: SocialLink | null;
  form: EditLinkForm | null;
  onOpenChange: (open: boolean) => void;
  onFormChange: (form: EditLinkForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Dialog open={!!target && !!form} onOpenChange={onOpenChange}>
      {form && target && (
        <DialogContent className="max-w-3xl">
          <DialogHeader className="items-center text-center">
            <div className="mb-1 flex size-16 items-center justify-center rounded-2xl bg-brand-50 text-lg font-semibold text-brand-800">
              {target.page.slice(0, 2).toUpperCase()}
            </div>
            <DialogTitle className="text-brand-800">Social Media Link Information</DialogTitle>
            <DialogDescription>Review app credentials, page details, and chatbot operating status.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="grid gap-4">
            <SocialField label="Business" htmlFor="edit_social_business">
              <Select
                value={form.business}
                onValueChange={(business) => onFormChange({ ...form, business })}
              >
                <SelectTrigger id="edit_social_business">
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
            <SocialField label="App ID" htmlFor="edit_social_app_id" required>
              <Input id="edit_social_app_id" value={form.appId} disabled />
            </SocialField>
            <SocialField label="App Secret" htmlFor="edit_social_app_secret" required>
              <Input
                id="edit_social_app_secret"
                type="password"
                value={form.appSecret}
                onChange={(event) => onFormChange({ ...form, appSecret: event.target.value })}
              />
            </SocialField>
            <SocialField label="Page" htmlFor="edit_social_page">
              <Input id="edit_social_page" value={form.page} disabled />
            </SocialField>
            <SocialField label="Page ID" htmlFor="edit_social_page_id">
              <Input id="edit_social_page_id" value={form.pageId} disabled />
            </SocialField>

            <div className="grid gap-2">
              <Label className="text-brand-800">Chatbot operating status</Label>
              <ScheduleChoice
                title="Paused"
                selected={form.status === "Paused"}
                onSelect={() =>
                  onFormChange({
                    ...form,
                    status: "Paused",
                    schedule: { ...form.schedule, mode: "full" },
                  })
                }
              />
              <ScheduleChoice
                title="Full-time operation"
                selected={form.status === "Full time"}
                onSelect={() =>
                  onFormChange({
                    ...form,
                    status: "Full time",
                    schedule: { ...form.schedule, mode: "full" },
                  })
                }
              />
              <ScheduleChoice
                title="Part-time operation"
                selected={form.status === "Part time"}
                onSelect={() =>
                  onFormChange({
                    ...form,
                    status: "Part time",
                    schedule: { ...form.schedule, mode: "partial" },
                  })
                }
              >
                {form.status === "Part time" && (
                  <PartTimeScheduleGrid
                    schedule={form.schedule}
                    onChange={(schedule) => onFormChange({ ...form, schedule })}
                  />
                )}
              </ScheduleChoice>
            </div>

            <DialogFooter className="mt-2 sm:justify-between">
              <Button type="button" variant="secondary">
                Refresh Link Token
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      )}
    </Dialog>
  );
}

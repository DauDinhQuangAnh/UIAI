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
            <DialogTitle className="text-brand-800">Thông tin liên kết mạng xã hội</DialogTitle>
            <DialogDescription>Xem lại thông tin ứng dụng, chi tiết trang và trạng thái hoạt động của chatbot.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="grid gap-4">
            <SocialField label="Doanh nghiệp" htmlFor="edit_social_business">
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
            <SocialField label="Mã ứng dụng" htmlFor="edit_social_app_id" required>
              <Input id="edit_social_app_id" value={form.appId} disabled />
            </SocialField>
            <SocialField label="Khóa bí mật" htmlFor="edit_social_app_secret" required>
              <Input
                id="edit_social_app_secret"
                type="password"
                value={form.appSecret}
                onChange={(event) => onFormChange({ ...form, appSecret: event.target.value })}
              />
            </SocialField>
            <SocialField label="Trang" htmlFor="edit_social_page">
              <Input id="edit_social_page" value={form.page} disabled />
            </SocialField>
            <SocialField label="Mã trang" htmlFor="edit_social_page_id">
              <Input id="edit_social_page_id" value={form.pageId} disabled />
            </SocialField>

            <div className="grid gap-2">
              <Label className="text-brand-800">Trạng thái hoạt động của chatbot</Label>
              <ScheduleChoice
                title="Tạm dừng"
                selected={form.status === "Tạm dừng"}
                onSelect={() =>
                  onFormChange({
                    ...form,
                    status: "Tạm dừng",
                    schedule: { ...form.schedule, mode: "full" },
                  })
                }
              />
              <ScheduleChoice
                title="Hoạt động toàn thời gian"
                selected={form.status === "Toàn thời gian"}
                onSelect={() =>
                  onFormChange({
                    ...form,
                    status: "Toàn thời gian",
                    schedule: { ...form.schedule, mode: "full" },
                  })
                }
              />
              <ScheduleChoice
                title="Hoạt động bán thời gian"
                selected={form.status === "Bán thời gian"}
                onSelect={() =>
                  onFormChange({
                    ...form,
                    status: "Bán thời gian",
                    schedule: { ...form.schedule, mode: "partial" },
                  })
                }
              >
                {form.status === "Bán thời gian" && (
                  <PartTimeScheduleGrid
                    schedule={form.schedule}
                    onChange={(schedule) => onFormChange({ ...form, schedule })}
                  />
                )}
              </ScheduleChoice>
            </div>

            <DialogFooter className="mt-2 sm:justify-between">
              <Button type="button" variant="secondary">
                Làm mới token liên kết
              </Button>
              <Button type="submit">Lưu</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      )}
    </Dialog>
  );
}

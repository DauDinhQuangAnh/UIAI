import { type FormEvent, type ReactNode } from "react";
import { Plus, Trash } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
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
import type { BusinessPartner } from "@/components/business/information/business-information-data";
import type {
  CreateFormErrors,
  CreateStep,
  SocialMediaCreateForm,
  SocialMediaCreatePageDraft,
} from "./social-media-models";
import { createBlankPageDraft, pageInitials } from "./social-media-utils";
import { ScheduleEditor } from "./schedule-editor";

export function SocialMediaCreateDialog({
  open,
  step,
  form,
  errors,
  businesses,
  loading,
  onOpenChange,
  onStepChange,
  onFormChange,
  onSubmit,
}: {
  open: boolean;
  step: CreateStep;
  form: SocialMediaCreateForm;
  errors: CreateFormErrors;
  businesses: BusinessPartner[];
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  onStepChange: (step: CreateStep) => void;
  onFormChange: (form: SocialMediaCreateForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const submitLabel = step === "schedule" ? "Xác nhận" : "Tiếp tục";
  const submitDisabled = step === "pages" && form.pages.length === 0;
  const submitTitle = submitDisabled ? "Vui lòng thêm ít nhất một page." : undefined;

  const updatePageDraft = (localId: string, patch: Partial<SocialMediaCreatePageDraft>) => {
    onFormChange({
      ...form,
      pages: form.pages.map((page) => (page.localId === localId ? { ...page, ...patch } : page)),
    });
  };

  const addPageDraft = () => onFormChange({ ...form, pages: [...form.pages, createBlankPageDraft()] });
  const removePageDraft = (localId: string) =>
    onFormChange({ ...form, pages: form.pages.filter((page) => page.localId !== localId) });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader className="items-center text-center">
          <DialogTitle className="text-brand-800">Thêm liên kết mạng xã hội</DialogTitle>
          <DialogDescription>
            Nhập cấu hình Facebook App, page quản lý và lịch hoạt động bot.
          </DialogDescription>
        </DialogHeader>

        <CreateStepIndicator step={step} />

        <form className="grid gap-4" onSubmit={onSubmit}>
          {step === "config" && (
            <div className="grid gap-4">
              <SocialConfigField label="Doanh nghiệp" htmlFor="facebook_create_business" required error={errors.businessPartnerId}>
                <Select
                  value={form.businessPartnerId}
                  disabled={loading}
                  onValueChange={(businessPartnerId) => onFormChange({ ...form, businessPartnerId })}
                >
                  <SelectTrigger id="facebook_create_business" aria-label="Chọn doanh nghiệp">
                    <SelectValue placeholder="Chọn doanh nghiệp" />
                  </SelectTrigger>
                  <SelectContent>
                    {businesses.map((business) => (
                      <SelectItem key={business.id} value={business.id}>
                        {business.brandName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SocialConfigField>
              <SocialConfigField label="App ID" htmlFor="facebook_create_app_id" required error={errors.appId}>
                <Input
                  id="facebook_create_app_id"
                  value={form.appId}
                  disabled={loading}
                  invalid={!!errors.appId}
                  placeholder="facebook-app-id"
                  autoComplete="off"
                  onChange={(event) => onFormChange({ ...form, appId: event.target.value })}
                />
              </SocialConfigField>
              <SocialConfigField label="App Secret" htmlFor="facebook_create_app_secret" required error={errors.appSecret}>
                <Input
                  id="facebook_create_app_secret"
                  type="password"
                  value={form.appSecret}
                  disabled={loading}
                  invalid={!!errors.appSecret}
                  placeholder="facebook-app-secret"
                  autoComplete="new-password"
                  onChange={(event) => onFormChange({ ...form, appSecret: event.target.value })}
                />
              </SocialConfigField>
            </div>
          )}

          {step === "pages" && (
            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">Page liên kết</h3>
                  <p className="text-sm text-text-secondary">API mới tạo integration, pages và bot schedule trong một lần lưu.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="info">{form.pages.length} page</Badge>
                  <Button type="button" size="sm" variant="secondary" disabled={loading} onClick={addPageDraft}>
                    <Plus className="size-4" aria-hidden />
                    Thêm page
                  </Button>
                </div>
              </div>

              {errors.pages && <p className="text-sm font-medium text-danger-fg">{errors.pages}</p>}

              <div className="grid max-h-[58vh] gap-3 overflow-y-auto pr-1">
                {form.pages.map((page, index) => (
                  <div key={page.localId} className="rounded-md border border-border bg-surface p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                        <PageAvatar name={page.pageName || `Page ${index + 1}`} url={page.pageAvatarUrl || page.pageImageUrl} />
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-text-primary">{page.pageName || `Page ${index + 1}`}</div>
                          <div className="truncate font-mono text-xs text-text-secondary">{page.externalPageId || "-"}</div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={loading || form.pages.length <= 1}
                        title={form.pages.length <= 1 ? "Cần ít nhất một page." : "Xóa page"}
                        onClick={() => removePageDraft(page.localId)}
                      >
                        <Trash className="size-4" aria-hidden />
                      </Button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <SocialConfigField label="Page ID" htmlFor={`page_external_id_${page.localId}`} required>
                        <Input
                          id={`page_external_id_${page.localId}`}
                          value={page.externalPageId}
                          disabled={loading}
                          placeholder="123456789"
                          onChange={(event) => updatePageDraft(page.localId, { externalPageId: event.target.value })}
                        />
                      </SocialConfigField>
                      <SocialConfigField label="Tên page" htmlFor={`page_name_${page.localId}`} required>
                        <Input
                          id={`page_name_${page.localId}`}
                          value={page.pageName}
                          disabled={loading}
                          placeholder="SAR Demo Page"
                          onChange={(event) => updatePageDraft(page.localId, { pageName: event.target.value })}
                        />
                      </SocialConfigField>
                      <SocialConfigField label="Avatar URL" htmlFor={`page_avatar_${page.localId}`}>
                        <Input
                          id={`page_avatar_${page.localId}`}
                          value={page.pageAvatarUrl}
                          disabled={loading}
                          placeholder="https://example.com/avatar.png"
                          onChange={(event) => updatePageDraft(page.localId, { pageAvatarUrl: event.target.value })}
                        />
                      </SocialConfigField>
                      <SocialConfigField label="Image URL" htmlFor={`page_image_${page.localId}`}>
                        <Input
                          id={`page_image_${page.localId}`}
                          value={page.pageImageUrl}
                          disabled={loading}
                          placeholder="https://example.com/page.png"
                          onChange={(event) => updatePageDraft(page.localId, { pageImageUrl: event.target.value })}
                        />
                      </SocialConfigField>
                      <SocialConfigField label="Trạng thái" htmlFor={`page_status_${page.localId}`}>
                        <Select
                          value={page.status}
                          disabled={loading}
                          onValueChange={(status) => updatePageDraft(page.localId, { status: status as "Active" | "Inactive" })}
                        >
                          <SelectTrigger id={`page_status_${page.localId}`} aria-label="Chọn trạng thái page">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </SocialConfigField>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === "schedule" && (
            <div className="grid gap-3">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">Cấu hình hoạt động</h3>
                <p className="text-sm text-text-secondary">Mỗi page có lịch bot riêng. Part time cho phép khung giờ qua ngày.</p>
              </div>
              {errors.schedule && <p className="text-sm font-medium text-danger-fg">{errors.schedule}</p>}
              <div className="grid max-h-[58vh] gap-3 overflow-y-auto pr-1">
                {form.pages.map((page) => (
                  <div key={page.localId} className="rounded-md border border-border bg-surface p-3">
                    <div className="mb-3 grid grid-cols-[auto_1fr] items-center gap-3">
                      <PageAvatar name={page.pageName || "Facebook Page"} url={page.pageAvatarUrl || page.pageImageUrl} />
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-text-primary">{page.pageName || "Facebook Page"}</div>
                        <div className="truncate font-mono text-xs text-text-secondary">{page.externalPageId || "-"}</div>
                      </div>
                    </div>
                    <ScheduleEditor
                      schedule={page.schedule}
                      disabled={loading}
                      onChange={(schedule) => updatePageDraft(page.localId, { schedule })}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="mt-3">
            <Button type="button" variant="secondary" disabled={loading} onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            {step === "pages" && (
              <Button type="button" variant="secondary" disabled={loading} onClick={() => onStepChange("config")}>
                Quay lại
              </Button>
            )}
            {step === "schedule" && (
              <Button type="button" variant="secondary" disabled={loading} onClick={() => onStepChange("pages")}>
                Quay lại
              </Button>
            )}
            <Button type="submit" loading={loading} disabled={submitDisabled} title={submitTitle}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateStepIndicator({ step }: { step: CreateStep }) {
  const steps: { value: CreateStep; label: string }[] = [
    { value: "config", label: "App config" },
    { value: "pages", label: "Page" },
    { value: "schedule", label: "Lịch bot" },
  ];
  const activeIndex = steps.findIndex((item) => item.value === step);

  return (
    <div className="grid grid-cols-3 gap-2">
      {steps.map((item, index) => (
        <div
          key={item.value}
          className={[
            "rounded-md border px-3 py-2 text-center text-xs font-semibold uppercase",
            index <= activeIndex
              ? "border-brand-300 bg-brand-50 text-brand-800"
              : "border-border bg-surface text-text-secondary",
          ].join(" ")}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}

function SocialConfigField({
  label,
  htmlFor,
  required,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor} className="text-brand-800">
        {label}
        {required && <span className="ml-1 text-danger-fg">*</span>}
      </Label>
      <div className="grid gap-1">
        {children}
        {error && <p className="text-xs font-medium text-danger-fg">{error}</p>}
      </div>
    </div>
  );
}

function PageAvatar({ name, url }: { name: string; url?: string | null }) {
  if (url) {
    return (
      <img
        src={url}
        alt=""
        className="size-11 rounded-pill border border-border object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <span className="flex size-11 items-center justify-center rounded-pill border border-brand-100 bg-brand-50 text-sm font-semibold text-brand-700">
      {pageInitials(name)}
    </span>
  );
}

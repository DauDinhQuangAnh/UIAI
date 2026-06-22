import { type FormEvent, type ReactNode } from "react";
import { CheckCircle } from "@phosphor-icons/react";
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { BusinessPartner } from "@/components/business/information/business-information-data";
import type {
  CreateFormErrors,
  CreateStep,
  SocialMediaCreateForm,
  SocialMediaCreatePageDraft,
  SocialMediaSelectablePage,
} from "./social-media-models";
import { createPageDraftFromSelectablePage, pageInitials } from "./social-media-utils";
import { ScheduleEditor } from "./schedule-editor";

export function SocialMediaCreateDialog({
  open,
  step,
  form,
  errors,
  businesses,
  availablePages,
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
  availablePages: SocialMediaSelectablePage[];
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  onStepChange: (step: CreateStep) => void;
  onFormChange: (form: SocialMediaCreateForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const submitLabel = step === "schedule" ? "Xác nhận" : "Tiếp tục";
  const submitDisabled = step === "pages" && form.pages.length === 0;
  const submitTitle = submitDisabled ? "Vui lòng chọn ít nhất một page." : undefined;

  const updatePageDraft = (localId: string, patch: Partial<SocialMediaCreatePageDraft>) => {
    onFormChange({
      ...form,
      pages: form.pages.map((page) => (page.localId === localId ? { ...page, ...patch } : page)),
    });
  };

  const togglePage = (page: SocialMediaSelectablePage) => {
    const selected = form.pages.some((selectedPage) => selectedPage.externalPageId === page.externalPageId);
    onFormChange({
      ...form,
      pages: selected
        ? form.pages.filter((selectedPage) => selectedPage.externalPageId !== page.externalPageId)
        : [...form.pages, createPageDraftFromSelectablePage(page)],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-[540px] overflow-y-auto rounded-md border border-brand-100 bg-card p-6 shadow-xl">
        <DialogHeader className="relative items-center text-center">
          <DialogTitle className="text-base font-bold uppercase tracking-wide text-brand-700">
            Thêm liên kết social media
          </DialogTitle>
          <DialogDescription className="sr-only">Thêm liên kết social media cho doanh nghiệp.</DialogDescription>
        </DialogHeader>

        <form className="grid gap-5 pt-2" onSubmit={onSubmit}>
          {step === "config" && (
            <div className="grid gap-5 py-2">
              <SocialConfigField label="Doanh nghiệp" htmlFor="facebook_create_business" error={errors.businessPartnerId}>
                <Select
                  value={form.businessPartnerId}
                  disabled={loading}
                  onValueChange={(businessPartnerId) => onFormChange({ ...form, businessPartnerId })}
                >
                  <SelectTrigger id="facebook_create_business" aria-label="Chọn doanh nghiệp" className="h-11">
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
            </div>
          )}

          {step === "pages" && (
            <div className="grid gap-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold uppercase text-brand-700">Chọn trang muốn liên kết</h3>
                <Badge tone="info">{form.pages.length} đã chọn</Badge>
              </div>
              {errors.pages && <p className="text-sm font-medium text-danger-fg">{errors.pages}</p>}
              <div className="grid max-h-[58vh] gap-3 overflow-y-auto pr-1">
                {availablePages.length === 0 && (
                  <div className="rounded-md border border-dashed border-border bg-surface p-4 text-sm text-text-secondary">
                    Không có page nào để liên kết.
                  </div>
                )}
                {availablePages.map((page) => {
                  const selected = form.pages.some((selectedPage) => selectedPage.externalPageId === page.externalPageId);
                  return (
                    <button
                      key={page.externalPageId}
                      type="button"
                      className={[
                        "grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md border bg-surface p-3 text-left transition-colors",
                        selected
                          ? "border-brand-500 bg-brand-50 shadow-focus"
                          : "border-border hover:border-brand-200 hover:bg-surface-2",
                      ].join(" ")}
                      aria-pressed={selected}
                      disabled={loading}
                      onClick={() => togglePage(page)}
                    >
                      <PageAvatar name={page.pageName} url={page.pageAvatarUrl ?? page.pageImageUrl} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-text-primary">{page.pageName}</span>
                        <span className="block truncate text-xs text-text-secondary">{page.username || page.externalPageId}</span>
                      </span>
                      <span
                        className={[
                          "flex size-6 items-center justify-center rounded-pill border",
                          selected ? "border-brand-600 bg-brand-600 text-white" : "border-border-strong text-transparent",
                        ].join(" ")}
                        aria-hidden
                      >
                        <CheckCircle className="size-5" weight="fill" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === "schedule" && (
            <div className="grid gap-4">
              <h3 className="text-center text-sm font-bold uppercase text-brand-700">Cấu hình thời gian hoạt động</h3>
              {errors.schedule && <p className="text-sm font-medium text-danger-fg">{errors.schedule}</p>}
              <div className="grid max-h-[62vh] gap-3 overflow-y-auto pr-1">
                {form.pages.map((page) => (
                  <div key={page.localId} className="rounded-md border border-border bg-surface p-3">
                    <div className="mb-3 grid grid-cols-[auto_1fr] items-center gap-3">
                      <PageAvatar name={page.pageName || "Facebook Page"} url={page.pageAvatarUrl || page.pageImageUrl} />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-text-primary">{page.pageName || "Facebook Page"}</div>
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

          <DialogFooter className="mt-2 flex-row justify-between sm:justify-between">
            {step === "config" ? (
              <span aria-hidden />
            ) : (
              <Button type="button" variant="secondary" disabled={loading} onClick={() => onStepChange(step === "pages" ? "config" : "pages")}>
                Quay lại
              </Button>
            )}
            <Button type="submit" loading={loading} disabled={submitDisabled} title={submitTitle} className="min-w-36 bg-brand-700 text-white hover:bg-brand-800">
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SocialConfigField({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-[6.5rem_1fr] sm:items-start">
      <Label htmlFor={htmlFor} className="pt-3 text-sm font-bold text-brand-700">
        {label}
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
        className="size-12 rounded-md border border-border object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <span className="flex size-12 items-center justify-center rounded-md border border-brand-100 bg-brand-50 text-sm font-semibold text-brand-700">
      {pageInitials(name)}
    </span>
  );
}

import { type FormEvent, type ReactNode } from "react";
import { CheckCircle, LinkSimple } from "@phosphor-icons/react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import type { BusinessPartner } from "@/components/business/information/business-information-data";
import type { FacebookManagedPage } from "@/api/social-media-types";
import type {
  CreateFormErrors,
  CreateStep,
  SocialMediaCreateForm,
  SocialMediaCreatePageDraft,
} from "./social-media-models";
import { apiErrorMessage, createPageDraftFromManagedPage, pageInitials } from "./social-media-utils";
import { ScheduleEditor } from "./schedule-editor";

export function SocialMediaCreateDialog({
  open,
  step,
  form,
  errors,
  businesses,
  managedPages,
  pagesLoading,
  pagesError,
  loading,
  onOpenChange,
  onStepChange,
  onFormChange,
  onRetryPages,
  onSubmit,
}: {
  open: boolean;
  step: CreateStep;
  form: SocialMediaCreateForm;
  errors: CreateFormErrors;
  businesses: BusinessPartner[];
  managedPages: FacebookManagedPage[];
  pagesLoading: boolean;
  pagesError: unknown;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  onStepChange: (step: CreateStep) => void;
  onFormChange: (form: SocialMediaCreateForm) => void;
  onRetryPages: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const submitLabel = step === "schedule" ? "Xác nhận" : "Tiếp tục";
  const submitDisabled =
    step === "pages" && (pagesLoading || !!pagesError || form.pages.length === 0 || managedPages.length === 0);
  const submitTitle =
    step === "pages" && form.pages.length === 0
      ? "Vui lòng chọn ít nhất một page."
      : step === "pages" && pagesError
        ? "Cần tải được danh sách page trước khi tiếp tục."
        : undefined;

  const updatePageDraft = (localId: string, patch: Partial<SocialMediaCreatePageDraft>) => {
    onFormChange({
      ...form,
      pages: form.pages.map((page) => (page.localId === localId ? { ...page, ...patch } : page)),
    });
  };

  const toggleManagedPage = (managedPage: FacebookManagedPage) => {
    const selected = form.pages.some((page) => page.externalPageId === managedPage.externalPageId);
    onFormChange({
      ...form,
      pages: selected
        ? form.pages.filter((page) => page.externalPageId !== managedPage.externalPageId)
        : [...form.pages, createPageDraftFromManagedPage(managedPage)],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader className="items-center text-center">
          <DialogTitle className="text-brand-800">Thêm liên kết mạng xã hội</DialogTitle>
          <DialogDescription>
            Nhập cấu hình Facebook App, đăng nhập Facebook, chọn page quản lý và cấu hình lịch hoạt động bot.
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
                  <h3 className="text-sm font-semibold text-text-primary">Chọn trang muốn liên kết</h3>
                  <p className="text-sm text-text-secondary">Danh sách này được lấy từ tài khoản Facebook vừa ủy quyền.</p>
                </div>
                <Badge tone="info">{form.pages.length} page đã chọn</Badge>
              </div>

              {errors.pages && <p className="text-sm font-medium text-danger-fg">{errors.pages}</p>}

              {pagesLoading ? (
                <div className="grid gap-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : pagesError ? (
                <EmptyState
                  icon={LinkSimple}
                  title="Không tải được danh sách trang Facebook"
                  description={apiErrorMessage(pagesError, "Vui lòng thử lại sau.")}
                  className="py-10"
                  action={
                    <Button type="button" variant="secondary" onClick={onRetryPages}>
                      Tải lại
                    </Button>
                  }
                />
              ) : managedPages.length === 0 ? (
                <EmptyState
                  icon={LinkSimple}
                  title="Không tìm thấy trang Facebook nào"
                  description="Hãy kiểm tra tài khoản vừa ủy quyền có quyền quản lý page hay chưa."
                  className="py-10"
                />
              ) : (
                <div className="grid max-h-[56vh] gap-2 overflow-y-auto pr-1">
                  {managedPages.map((page) => {
                    const selected = form.pages.some((selectedPage) => selectedPage.externalPageId === page.externalPageId);
                    return (
                      <button
                        key={page.externalPageId}
                        type="button"
                        className={[
                          "grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md border bg-surface p-3 text-left transition-colors",
                          selected
                            ? "border-brand-300 bg-brand-50 text-brand-900"
                            : "border-border hover:border-brand-200 hover:bg-surface-2",
                        ].join(" ")}
                        onClick={() => toggleManagedPage(page)}
                        aria-pressed={selected}
                      >
                        <PageAvatar name={page.pageName || "Facebook Page"} url={page.pageAvatarUrl ?? page.avatarUrl} />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-text-primary">{page.pageName || "Facebook Page"}</span>
                          <span className="block truncate text-sm text-text-secondary">{page.username || page.externalPageId}</span>
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
              )}
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
                      <PageAvatar name={page.pageName || "Facebook Page"} url={page.pageAvatarUrl} />
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
            {step !== "config" && (
              <Button
                type="button"
                variant="secondary"
                disabled={loading}
                onClick={() => onStepChange(step === "schedule" ? "pages" : "config")}
              >
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
    <div className="grid gap-2 sm:grid-cols-[9.5rem_1fr] sm:items-start">
      <Label htmlFor={htmlFor} className="pt-2 text-brand-800">
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


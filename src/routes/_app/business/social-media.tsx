import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import { CheckCircle, LinkSimple, PencilSimple, Plus, ShieldWarning, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Badge, type BadgeProps } from "@/components/ui/badge";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { BusinessDataTable, BusinessHeadCell } from "@/components/business/business-management-table";
import { BusinessPageShell } from "@/components/business/business-page-shell";
import { EmptyState } from "@/components/common/empty-state";
import type { BusinessPartner } from "@/components/business/information/business-information-data";
import { useBusinessPartners } from "@/api/hooks/business-partners";
import {
  useBusinessPartnersIntegrations,
  useCreateSocialMediaIntegration,
  useDeleteSocialMediaIntegration,
  useDeleteSocialMediaPage,
  useStartFacebookOAuth,
  useUpdateSocialMediaPage,
} from "@/api/hooks/social-media-integrations";
import type {
  BotScheduleRequest,
  CreateSocialMediaIntegrationPageRequest,
  SocialMediaIntegrationSummary,
  SocialMediaLinkedPage,
  SocialMediaPageSchedule,
  UpdateSocialMediaPageRequest,
} from "@/api/social-media-types";
import { ApiRequestError, errorMessage } from "@/api/errors";
import { PERMISSIONS, usePermissionSet } from "@/auth/permissions";
import { storeFacebookOAuthContext } from "@/lib/facebook-oauth-context";

const BUSINESS_PAGE_SIZE = 100;
const DEFAULT_TIMEZONE = "Asia/Ho_Chi_Minh";
const FULL_TIME_START = "00:00";
const FULL_TIME_END = "23:59";
const DEFAULT_PART_TIME_START = "08:00";
const DEFAULT_PART_TIME_END = "17:30";

type ProviderFilter = "FACEBOOK" | "TIKTOK";
type CreateStep = "config" | "pages" | "schedule";
type ScheduleMode = "full" | "part";
type DayOfWeekName = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

interface PageScheduleDraft {
  mode: ScheduleMode;
  timezone: string;
  workingDays: DayOfWeekName[];
  startTime: string;
  endTime: string;
}

interface SocialMediaCreatePageDraft {
  localId: string;
  externalPageId: string;
  pageName: string;
  pageAvatarUrl: string;
  pageImageUrl: string;
  status: "Active" | "Inactive";
  schedule: PageScheduleDraft;
}

interface SocialMediaCreateForm {
  businessPartnerId: string;
  appId: string;
  appSecret: string;
  pages: SocialMediaCreatePageDraft[];
}

interface SocialMediaPageEditForm {
  status: "Active" | "Inactive";
  schedule: PageScheduleDraft;
}

type CreateFormErrors = Partial<Record<"businessPartnerId" | "appId" | "appSecret" | "pages" | "schedule", string>>;

interface SocialMediaIntegrationRow {
  business: BusinessPartner;
  integration: SocialMediaIntegrationSummary;
}

interface SocialMediaTableRow extends SocialMediaIntegrationRow {
  page: SocialMediaLinkedPage | null;
  rowKey: string;
}

const DAY_OPTIONS: { value: DayOfWeekName; label: string; shortLabel: string }[] = [
  { value: "Monday", label: "Thứ 2", shortLabel: "T2" },
  { value: "Tuesday", label: "Thứ 3", shortLabel: "T3" },
  { value: "Wednesday", label: "Thứ 4", shortLabel: "T4" },
  { value: "Thursday", label: "Thứ 5", shortLabel: "T5" },
  { value: "Friday", label: "Thứ 6", shortLabel: "T6" },
  { value: "Saturday", label: "Thứ 7", shortLabel: "T7" },
  { value: "Sunday", label: "Chủ nhật", shortLabel: "CN" },
];

export const Route = createFileRoute("/_app/business/social-media")({
  validateSearch: (search: Record<string, unknown>) => ({
    businessPartnerId: typeof search.businessPartnerId === "string" ? search.businessPartnerId : undefined,
  }),
  component: SocialMediaLinksScreen,
});

function SocialMediaLinksScreen() {
  const hasPermission = usePermissionSet();
  const canView = hasPermission(PERMISSIONS.socialMedia.facebookIntegration.view);
  const canCreate = hasPermission(PERMISSIONS.socialMedia.facebookIntegration.create);
  const canUpdate = hasPermission(PERMISSIONS.socialMedia.facebookIntegration.update);
  const canReauthorize = hasPermission(PERMISSIONS.socialMedia.facebookIntegration.reauthorize);

  if (!canView) {
    return (
      <BusinessPageShell
        title="Liên kết mạng xã hội"
        description="Quản lý các kết nối mạng xã hội theo từng business partner."
        icon={LinkSimple}
        className="max-w-7xl"
      >
        <EmptyState
          icon={ShieldWarning}
          title="Bạn không có quyền xem liên kết mạng xã hội"
          description="Cần quyền SOCIAL_MEDIA.FACEBOOK_INTEGRATION.VIEW để truy cập màn hình này."
        />
      </BusinessPageShell>
    );
  }

  return (
    <SocialMediaLinksContent
      canCreate={canCreate}
      canUpdate={canUpdate}
      canReauthorize={canReauthorize}
    />
  );
}

function SocialMediaLinksContent({
  canCreate,
  canUpdate,
  canReauthorize,
}: {
  canCreate: boolean;
  canUpdate: boolean;
  canReauthorize: boolean;
}) {
  const search = Route.useSearch();
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>("FACEBOOK");
  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState<CreateStep>("config");
  const [createForm, setCreateForm] = useState<SocialMediaCreateForm>(() => defaultCreateForm(""));
  const [createErrors, setCreateErrors] = useState<CreateFormErrors>({});
  const [manageTarget, setManageTarget] = useState<SocialMediaTableRow | null>(null);
  const [editPageTarget, setEditPageTarget] = useState<SocialMediaTableRow | null>(null);
  const [editPageForm, setEditPageForm] = useState<SocialMediaPageEditForm>(() => defaultEditPageForm(null));
  const [editPageError, setEditPageError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<SocialMediaTableRow | null>(null);
  const [oauthPendingIntegrationId, setOauthPendingIntegrationId] = useState<string | null>(null);

  const businessPartners = useBusinessPartners({
    isActive: true,
    pageNumber: 1,
    pageSize: BUSINESS_PAGE_SIZE,
  });
  const businesses = businessPartners.data?.items ?? [];
  const businessIds = useMemo(() => businesses.map((business) => business.id), [businesses]);
  const integrationQueries = useBusinessPartnersIntegrations(businessIds, !businessPartners.isLoading && !businessPartners.isError);
  const createIntegration = useCreateSocialMediaIntegration();
  const updatePage = useUpdateSocialMediaPage();
  const deleteIntegration = useDeleteSocialMediaIntegration();
  const deletePage = useDeleteSocialMediaPage();
  const startFacebookOAuth = useStartFacebookOAuth();

  const defaultBusinessId =
    search.businessPartnerId && businesses.some((business) => business.id === search.businessPartnerId)
      ? search.businessPartnerId
      : businesses[0]?.id ?? "";
  const integrationRows = useMemo<SocialMediaIntegrationRow[]>(
    () =>
      businesses.flatMap((business, index) =>
        (integrationQueries[index]?.data ?? []).map((integration) => ({ business, integration })),
      ),
    [businesses, integrationQueries],
  );
  const filteredIntegrationRows = useMemo(
    () => integrationRows.filter((row) => providerCode(row.integration) === providerFilter),
    [integrationRows, providerFilter],
  );
  const tableRows = useMemo(() => buildSocialMediaTableRows(filteredIntegrationRows), [filteredIntegrationRows]);
  const facebookCount = integrationRows.filter((row) => providerCode(row.integration) === "FACEBOOK").length;
  const tiktokCount = integrationRows.filter((row) => providerCode(row.integration) === "TIKTOK").length;
  const integrationsLoading = integrationQueries.some((query) => query.isLoading);
  const integrationsFetching = integrationQueries.some((query) => query.isFetching);
  const integrationsError = integrationQueries.find((query) => query.isError)?.error;
  const deleteSubmitting = deleteIntegration.isPending || deletePage.isPending;
  const createDisabled = !defaultBusinessId || providerFilter !== "FACEBOOK";
  const createDisabledTitle = !defaultBusinessId
    ? "Chưa có doanh nghiệp để thêm liên kết."
    : providerFilter !== "FACEBOOK"
      ? "Thêm liên kết TikTok sẽ được triển khai ở phase sau."
      : undefined;

  const openCreate = () => {
    if (createDisabled) return;
    setCreateStep("config");
    setCreateForm(defaultCreateForm(defaultBusinessId));
    setCreateErrors({});
    setCreateOpen(true);
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setCreateStep("config");
    setCreateErrors({});
    setCreateForm(defaultCreateForm(defaultBusinessId));
  };

  const goToCreateStep = (nextStep: CreateStep) => {
    const nextErrors = validateCreateUntilStep(createForm, nextStep);
    setCreateErrors(nextErrors);
    if (hasErrors(nextErrors)) return;
    setCreateStep(nextStep);
  };

  const submitCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (createStep !== "schedule") {
      goToCreateStep(createStep === "config" ? "pages" : "schedule");
      return;
    }

    const nextErrors = validateCreateForm(createForm);
    setCreateErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    createIntegration.mutate(
      {
        businessPartnerId: createForm.businessPartnerId,
        body: {
          provider: "Facebook",
          appId: createForm.appId.trim(),
          appSecret: createForm.appSecret.trim(),
          pages: createForm.pages.map(createPagePayload),
        },
      },
      {
        onSuccess: (result) => {
          toast.success(result.message || "Đã tạo liên kết Facebook.");
          closeCreate();
        },
        onError: (error) => {
          toast.error(apiErrorMessage(error, "Không thể tạo liên kết Facebook."));
          setCreateForm((current) => ({ ...current, appSecret: "" }));
        },
      },
    );
  };

  const openEditPage = (row: SocialMediaTableRow) => {
    setManageTarget(null);
    if (!row.page?.id) {
      toast.error("Liên kết này chưa có pageId để cập nhật page.");
      return;
    }
    setEditPageTarget(row);
    setEditPageForm(defaultEditPageForm(row.page));
    setEditPageError("");
  };

  const submitEditPage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editPageTarget?.page?.id) return;
    const validationError = validateScheduleDraft(editPageForm.schedule, displayPageName(editPageTarget.page, editPageTarget.integration));
    setEditPageError(validationError);
    if (validationError) return;

    updatePage.mutate(
      {
        businessPartnerId: editPageTarget.business.id,
        pageId: editPageTarget.page.id,
        body: updatePagePayload(editPageForm),
      },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật page Facebook.");
          setEditPageTarget(null);
        },
        onError: (error) => toast.error(apiErrorMessage(error, "Không thể cập nhật page Facebook.")),
      },
    );
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.page && !deleteTarget.page.id) {
      toast.error("Page này thiếu pageId nên chưa thể gọi API xóa page.");
      return;
    }
    if (deleteTarget.page?.id) {
      deletePage.mutate(
        {
          businessPartnerId: deleteTarget.business.id,
          pageId: deleteTarget.page.id,
        },
        {
          onSuccess: () => {
            toast.success("Đã xóa page khỏi liên kết.");
            setDeleteTarget(null);
          },
          onError: (error) => toast.error(apiErrorMessage(error, "Không thể xóa page khỏi liên kết.")),
        },
      );
      return;
    }

    deleteIntegration.mutate(
      {
        businessPartnerId: deleteTarget.business.id,
        integrationId: deleteTarget.integration.id,
      },
      {
        onSuccess: () => {
          toast.success("Đã xóa liên kết mạng xã hội.");
          setDeleteTarget(null);
        },
        onError: (error) => toast.error(apiErrorMessage(error, "Không thể xóa liên kết mạng xã hội.")),
      },
    );
  };

  const startOAuth = (row: SocialMediaIntegrationRow) => {
    setManageTarget(null);
    if (!isFacebookIntegration(row.integration)) return;
    setOauthPendingIntegrationId(row.integration.id);
    startFacebookOAuth.mutate(
      {
        businessPartnerId: row.business.id,
        body: { redirectUri: facebookOAuthCallbackUrl() },
      },
      {
        onSuccess: (result) => {
          if (!result.authorizationUrl) {
            toast.error("Không nhận được đường dẫn đăng nhập Facebook.");
            setOauthPendingIntegrationId(null);
            return;
          }
          storeFacebookOAuthContext({
            businessPartnerId: row.business.id,
            integrationId: row.integration.id,
            state: result.state,
            flow: "reauthorize",
            resumePageSelection: false,
          });
          toast.info("Đang chuyển sang Facebook để đăng nhập...");
          window.location.href = result.authorizationUrl;
        },
        onError: (error) => {
          toast.error(apiErrorMessage(error, "Không thể bắt đầu ủy quyền Facebook."));
          setOauthPendingIntegrationId(null);
        },
      },
    );
  };

  return (
    <BusinessPageShell
      title="Liên kết mạng xã hội"
      description="Quản lý các kết nối mạng xã hội đã cấu hình theo từng doanh nghiệp."
      icon={LinkSimple}
      className="max-w-7xl"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4">
          <Tabs value={providerFilter} onValueChange={(value) => setProviderFilter(value as ProviderFilter)}>
            <TabsList className="gap-2 bg-transparent p-0">
              <TabsTrigger
                value="FACEBOOK"
                className="h-10 min-w-32 rounded-md border border-[#1877f2] px-6 font-bold uppercase text-[#1877f2] data-[state=active]:bg-[#1877f2] data-[state=active]:text-white"
              >
                Facebook
                {facebookCount > 0 && <span className="ml-1 text-xs opacity-80">({facebookCount})</span>}
              </TabsTrigger>
              <TabsTrigger
                value="TIKTOK"
                className="h-10 min-w-32 rounded-md border border-black bg-black px-6 font-bold uppercase text-white hover:bg-neutral-900 data-[state=active]:bg-black data-[state=active]:text-white"
              >
                TikTok
                {tiktokCount > 0 && <span className="ml-1 text-xs opacity-80">({tiktokCount})</span>}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex justify-end">
            {canCreate && (
              <Button
                type="button"
                size="sm"
                disabled={createDisabled}
                title={createDisabledTitle}
                onClick={openCreate}
                className="uppercase"
              >
                <Plus className="size-4" aria-hidden />
                Thêm liên kết
              </Button>
            )}
          </div>
        </div>

        {businessPartners.isLoading ? (
          <SocialMediaLoadingState />
        ) : businessPartners.isError ? (
          <EmptyState
            icon={LinkSimple}
            title="Không tải được danh sách doanh nghiệp"
            description={apiErrorMessage(businessPartners.error, "Vui lòng thử lại sau.")}
            action={
              <Button type="button" variant="secondary" onClick={() => businessPartners.refetch()}>
                Tải lại
              </Button>
            }
          />
        ) : businesses.length === 0 ? (
          <EmptyState
            icon={LinkSimple}
            title="Chưa có doanh nghiệp để liên kết mạng xã hội."
            description="Hãy tạo business partner trước khi cấu hình các kênh social."
          />
        ) : integrationsLoading || integrationsFetching ? (
          <SocialMediaLoadingState />
        ) : integrationsError ? (
          <EmptyState
            icon={LinkSimple}
            title="Không tải được liên kết mạng xã hội"
            description={apiErrorMessage(integrationsError, "Vui lòng thử lại sau.")}
            action={
              <Button type="button" variant="secondary" onClick={() => integrationQueries.forEach((query) => query.refetch())}>
                Tải lại
              </Button>
            }
          />
        ) : integrationRows.length === 0 ? (
          <EmptyState
            icon={LinkSimple}
            title="Chưa có liên kết mạng xã hội."
            description="Thêm liên kết Facebook bằng App ID, App Secret, danh sách page và lịch bot theo API mới."
            action={
              canCreate ? (
                <Button
                  type="button"
                  disabled={createDisabled}
                  title={createDisabledTitle}
                  onClick={openCreate}
                >
                  <Plus className="size-4" aria-hidden />
                  Thêm liên kết
                </Button>
              ) : undefined
            }
          />
        ) : tableRows.length === 0 ? (
          <EmptyState
            icon={LinkSimple}
            title={`Chưa có liên kết ${providerFilter === "FACEBOOK" ? "Facebook" : "TikTok"}.`}
            description="Đổi bộ lọc hoặc thêm liên kết mới để bắt đầu."
          />
        ) : (
          <SocialMediaIntegrationsTable
            rows={tableRows}
            canDelete={canUpdate}
            onManage={setManageTarget}
            onDelete={setDeleteTarget}
          />
        )}
      </div>

      <SocialMediaCreateDialog
        open={createOpen}
        step={createStep}
        form={createForm}
        errors={createErrors}
        businesses={businesses}
        loading={createIntegration.isPending}
        onOpenChange={(open) => {
          if (!open) closeCreate();
          else setCreateOpen(true);
        }}
        onStepChange={goToCreateStep}
        onFormChange={(form) => {
          setCreateForm(form);
          setCreateErrors({});
        }}
        onSubmit={submitCreate}
      />

      <SocialMediaIntegrationManageDialog
        row={manageTarget}
        canUpdate={canUpdate}
        canReauthorize={canReauthorize}
        oauthPendingIntegrationId={oauthPendingIntegrationId}
        onOpenChange={(open) => {
          if (!open) setManageTarget(null);
        }}
        onEditPage={openEditPage}
        onStartOAuth={startOAuth}
      />

      <SocialMediaPageEditDialog
        target={editPageTarget}
        form={editPageForm}
        error={editPageError}
        loading={updatePage.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setEditPageTarget(null);
            setEditPageError("");
          }
        }}
        onFormChange={(form) => {
          setEditPageForm(form);
          setEditPageError("");
        }}
        onSubmit={submitEditPage}
      />

      <DeleteSocialMediaIntegrationDialog
        target={deleteTarget}
        loading={deleteSubmitting}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </BusinessPageShell>
  );
}

function SocialMediaCreateDialog({
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

  const updatePageDraft = (localId: string, patch: Partial<SocialMediaCreatePageDraft>) => {
    onFormChange({
      ...form,
      pages: form.pages.map((page) => (page.localId === localId ? { ...page, ...patch } : page)),
    });
  };

  const addPageDraft = () => {
    onFormChange({
      ...form,
      pages: [...form.pages, blankCreatePageDraft()],
    });
  };

  const removePageDraft = (localId: string) => {
    if (form.pages.length <= 1) {
      onFormChange({ ...form, pages: [blankCreatePageDraft()] });
      return;
    }
    onFormChange({
      ...form,
      pages: form.pages.filter((page) => page.localId !== localId),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader className="items-center text-center">
          <DialogTitle className="text-brand-800">Thêm liên kết mạng xã hội</DialogTitle>
          <DialogDescription>
            Nhập cấu hình Facebook App, danh sách page và lịch hoạt động bot theo API social-media integrations mới.
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
                  <h3 className="text-sm font-semibold text-text-primary">Page muốn liên kết</h3>
                  <p className="text-sm text-text-secondary">Có thể thêm nhiều page trước khi cấu hình lịch bot.</p>
                </div>
                <Button type="button" variant="secondary" size="sm" disabled={loading} onClick={addPageDraft}>
                  <Plus className="size-4" aria-hidden />
                  Thêm page
                </Button>
              </div>

              {errors.pages && <p className="text-sm font-medium text-danger-fg">{errors.pages}</p>}

              <div className="grid max-h-[56vh] gap-3 overflow-y-auto pr-1">
                {form.pages.map((page, index) => (
                  <div key={page.localId} className="grid gap-3 rounded-md border border-border bg-surface p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-text-primary">Page {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={loading}
                        onClick={() => removePageDraft(page.localId)}
                      >
                        Xóa page
                      </Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <SocialConfigField label="Tên page" htmlFor={`page_name_${page.localId}`} required>
                        <Input
                          id={`page_name_${page.localId}`}
                          value={page.pageName}
                          disabled={loading}
                          placeholder="SAR Demo Page"
                          onChange={(event) => updatePageDraft(page.localId, { pageName: event.target.value })}
                        />
                      </SocialConfigField>
                      <SocialConfigField label="ID page" htmlFor={`external_page_id_${page.localId}`} required>
                        <Input
                          id={`external_page_id_${page.localId}`}
                          value={page.externalPageId}
                          disabled={loading}
                          placeholder="123456789"
                          onChange={(event) => updatePageDraft(page.localId, { externalPageId: event.target.value })}
                        />
                      </SocialConfigField>
                      <SocialConfigField label="Avatar URL" htmlFor={`page_avatar_${page.localId}`}>
                        <Input
                          id={`page_avatar_${page.localId}`}
                          value={page.pageAvatarUrl}
                          disabled={loading}
                          placeholder="https://example.test/avatar.png"
                          onChange={(event) => updatePageDraft(page.localId, { pageAvatarUrl: event.target.value })}
                        />
                      </SocialConfigField>
                      <SocialConfigField label="Image URL" htmlFor={`page_image_${page.localId}`}>
                        <Input
                          id={`page_image_${page.localId}`}
                          value={page.pageImageUrl}
                          disabled={loading}
                          placeholder="https://example.test/page.png"
                          onChange={(event) => updatePageDraft(page.localId, { pageImageUrl: event.target.value })}
                        />
                      </SocialConfigField>
                      <SocialConfigField label="Trạng thái" htmlFor={`page_status_${page.localId}`}>
                        <Select
                          value={page.status}
                          disabled={loading}
                          onValueChange={(status) =>
                            updatePageDraft(page.localId, { status: status as SocialMediaCreatePageDraft["status"] })
                          }
                        >
                          <SelectTrigger id={`page_status_${page.localId}`}>
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
            <Button type="submit" loading={loading}>
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

function SocialMediaPageEditDialog({
  target,
  form,
  error,
  loading,
  onOpenChange,
  onFormChange,
  onSubmit,
}: {
  target: SocialMediaTableRow | null;
  form: SocialMediaPageEditForm;
  error?: string;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  onFormChange: (form: SocialMediaPageEditForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader className="items-center text-center">
          <DialogTitle className="text-brand-800">Cập nhật page Facebook</DialogTitle>
          <DialogDescription>
            Cập nhật trạng thái và lịch bot cho {target ? displayPageName(target.page, target.integration) : "page"}.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <SocialConfigField label="Trạng thái" htmlFor="edit_page_status">
            <Select
              value={form.status}
              disabled={loading}
              onValueChange={(status) => onFormChange({ ...form, status: status as SocialMediaPageEditForm["status"] })}
            >
              <SelectTrigger id="edit_page_status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </SocialConfigField>
          <ScheduleEditor
            schedule={form.schedule}
            disabled={loading}
            onChange={(schedule) => onFormChange({ ...form, schedule })}
          />
          {error && <p className="text-sm font-medium text-danger-fg">{error}</p>}
          <DialogFooter className="mt-3">
            <Button type="button" variant="secondary" disabled={loading} onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" loading={loading}>
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ScheduleEditor({
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

function SocialMediaIntegrationManageDialog({
  row,
  canUpdate,
  canReauthorize,
  oauthPendingIntegrationId,
  onOpenChange,
  onEditPage,
  onStartOAuth,
}: {
  row: SocialMediaTableRow | null;
  canUpdate: boolean;
  canReauthorize: boolean;
  oauthPendingIntegrationId: string | null;
  onOpenChange: (open: boolean) => void;
  onEditPage: (row: SocialMediaTableRow) => void;
  onStartOAuth: (row: SocialMediaIntegrationRow) => void;
}) {
  const integration = row?.integration;
  const page = row?.page ?? null;
  const isFacebook = integration ? isFacebookIntegration(integration) : false;
  const canEditPage = !!page?.id && isFacebook && canUpdate;
  const botActive = page?.isBotEnabled ?? (integration?.activeBotPagesCount ?? 0) > 0;

  return (
    <Dialog open={!!row} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-[500px] overflow-y-auto rounded-md p-5">
        <DialogHeader className="items-center text-center">
          <div className="mb-1 flex size-14 items-center justify-center rounded-pill border border-brand-100 bg-brand-50 text-xs font-bold text-brand-700">
            {isFacebook ? "FB" : integration ? providerCode(integration).slice(0, 2) || "SM" : "SM"}
          </div>
          <DialogTitle className="text-sm font-bold uppercase text-brand-800">Thông tin liên kết social media</DialogTitle>
          <DialogDescription className="sr-only">Chi tiết liên kết mạng xã hội</DialogDescription>
        </DialogHeader>

        {row && integration && (
          <div className="grid gap-3">
            <DetailReadOnlyField label="Doanh nghiệp" value={row.business.brandName} />
            <DetailReadOnlyField label="App ID" value={integration.appId || "-"} required mono />
            <DetailReadOnlyField label="Trang" value={displayPageName(page, integration)} />
            <DetailReadOnlyField label="ID Trang" value={page?.externalPageId || "-"} mono />

            <div className="grid gap-1.5">
              <span className="text-[11px] font-bold text-brand-800">Trạng thái hoạt động của Chatbot</span>
              <div className="rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-text-primary">
                {botActive ? "Đang hoạt động" : "Chưa bật"}
              </div>
            </div>

            <BotSchedulePreview schedules={page?.schedules} />

            <div className="grid gap-2 pt-1 sm:grid-cols-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!canEditPage}
                title={
                  !isFacebook
                    ? "Cấu hình provider này sẽ được triển khai ở phase sau."
                    : !canUpdate
                      ? "Bạn không có quyền cập nhật liên kết Facebook."
                      : !page?.id
                        ? "Liên kết này chưa có pageId để cập nhật page."
                        : undefined
                }
                onClick={() => onEditPage(row)}
              >
                Cập nhật page
              </Button>
              <Button
                type="button"
                size="sm"
                loading={oauthPendingIntegrationId === integration.id}
                disabled={!isFacebook || !canReauthorize || !!oauthPendingIntegrationId}
                title={
                  !isFacebook
                    ? "Làm mới token provider này sẽ được triển khai ở phase sau."
                    : !canReauthorize
                      ? "Bạn không có quyền ủy quyền Facebook."
                      : undefined
                }
                onClick={() => onStartOAuth(row)}
                className="bg-[#1877f2] text-white hover:bg-[#1464cc]"
              >
                Ủy quyền lại
              </Button>
            </div>

            <div className="mt-2 flex justify-end">
              <Button type="button" size="sm" onClick={() => onOpenChange(false)}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DeleteSocialMediaIntegrationDialog({
  target,
  loading,
  onOpenChange,
  onConfirm,
}: {
  target: SocialMediaTableRow | null;
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const isPageRow = !!target?.page;
  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isPageRow ? "Xóa page khỏi liên kết" : "Xóa liên kết mạng xã hội"}</DialogTitle>
          <DialogDescription>
            Bạn có chắc muốn xóa {target ? displayDeleteTargetName(target) : "liên kết này"} không? Thao tác này sẽ gọi API soft delete trong tài liệu mới.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="secondary" disabled={loading} onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type="button" variant="danger" loading={loading} onClick={onConfirm}>
            Xóa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailReadOnlyField({
  label,
  value,
  required,
  mono,
}: {
  label: string;
  value: string;
  required?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] items-center gap-2">
      <Label className="text-[11px] font-bold text-brand-800">
        {label}
        {required && <span className="ml-0.5 text-danger-fg">*</span>}
      </Label>
      <Input
        value={value}
        readOnly
        className={mono ? "h-8 bg-surface-2 font-mono text-xs" : "h-8 bg-surface-2 text-xs"}
        aria-label={label}
      />
    </div>
  );
}

function BotSchedulePreview({ schedules }: { schedules?: SocialMediaPageSchedule[] | null }) {
  const activeSchedules = (schedules ?? []).filter((schedule) => schedule.isActive !== false);
  if (activeSchedules.length === 0) {
    return (
      <div className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-secondary">
        Chưa cấu hình thời gian hoạt động.
      </div>
    );
  }

  const isFullTime =
    activeSchedules.length >= DAY_OPTIONS.length &&
    DAY_OPTIONS.every((day) =>
      activeSchedules.some(
        (schedule) =>
          normalizeDay(schedule.dayOfWeek) === day.value &&
          schedule.startTime === FULL_TIME_START &&
          schedule.endTime === FULL_TIME_END,
      ),
    );

  if (isFullTime) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-success-border bg-success-bg px-3 py-2 text-sm font-medium text-success-fg">
        <CheckCircle className="size-5" weight="fill" aria-hidden />
        Hoạt động toàn thời gian.
      </div>
    );
  }

  const firstSchedule = activeSchedules[0];
  const dayLabels = activeSchedules
    .map((schedule) => DAY_OPTIONS.find((day) => day.value === normalizeDay(schedule.dayOfWeek))?.shortLabel ?? schedule.dayOfWeek)
    .join(", ");

  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary">
      {dayLabels || "Part time"}: {firstSchedule?.startTime || "--:--"} - {firstSchedule?.endTime || "--:--"}
    </div>
  );
}

function SocialMediaIntegrationsTable({
  rows,
  canDelete,
  onManage,
  onDelete,
}: {
  rows: SocialMediaTableRow[];
  canDelete: boolean;
  onManage: (row: SocialMediaTableRow) => void;
  onDelete: (row: SocialMediaTableRow) => void;
}) {
  return (
    <BusinessDataTable className="min-w-[900px] table-fixed">
      <TableHeader className="bg-brand-700">
        <TableRow className="hover:bg-brand-700">
          <BusinessHeadCell className="w-[28%] whitespace-nowrap uppercase">Doanh nghiệp</BusinessHeadCell>
          <BusinessHeadCell className="w-[26%] whitespace-nowrap uppercase">Trang</BusinessHeadCell>
          <BusinessHeadCell className="w-[18%] whitespace-nowrap uppercase">ID trang</BusinessHeadCell>
          <BusinessHeadCell className="w-[16%] whitespace-nowrap text-center uppercase">Trạng thái</BusinessHeadCell>
          <BusinessHeadCell className="w-[12%] whitespace-nowrap text-center uppercase">Hành động</BusinessHeadCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <IntegrationTableRow
            key={row.rowKey}
            row={row}
            canDelete={canDelete}
            onManage={onManage}
            onDelete={onDelete}
          />
        ))}
      </TableBody>
    </BusinessDataTable>
  );
}

function IntegrationTableRow({
  row,
  canDelete,
  onManage,
  onDelete,
}: {
  row: SocialMediaTableRow;
  canDelete: boolean;
  onManage: (row: SocialMediaTableRow) => void;
  onDelete: (row: SocialMediaTableRow) => void;
}) {
  const { business, integration, page } = row;

  return (
    <TableRow>
      <TableCell className="h-14">
        <div className="truncate font-medium">{business.brandName}</div>
      </TableCell>
      <TableCell className="h-14">
        <span className="block truncate">{displayPageName(page, integration)}</span>
      </TableCell>
      <TableCell className="h-14 font-mono text-sm">
        <span className="block truncate">{page?.externalPageId || "-"}</span>
      </TableCell>
      <TableCell className="h-14 text-center">
        <div className="flex justify-center">
          <IntegrationStatusBadge status={page?.status || integration.status} />
        </div>
      </TableCell>
      <TableCell className="h-14 text-center">
        <div className="flex justify-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Chỉnh sửa liên kết"
            className="size-9 border border-brand-100 bg-brand-50 text-brand-700 shadow-xs hover:border-brand-300 hover:bg-brand-100 hover:text-brand-900"
            onClick={() => onManage(row)}
          >
            <PencilSimple className="size-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Xóa liên kết"
            title={!canDelete ? "Bạn không có quyền cập nhật liên kết Facebook." : undefined}
            disabled={!canDelete}
            className="size-9 border border-danger-border bg-danger-bg text-danger-fg shadow-xs hover:border-danger-base hover:bg-danger-base hover:text-white disabled:hover:border-danger-border disabled:hover:bg-danger-bg disabled:hover:text-danger-fg"
            onClick={() => onDelete(row)}
          >
            <Trash className="size-4" aria-hidden />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function IntegrationStatusBadge({ status }: { status: string }) {
  const normalized = status.trim().toLowerCase();
  const display: { label: string; tone: BadgeProps["tone"] } =
    normalized === "configured"
      ? { label: "Đã cấu hình", tone: "info" }
      : normalized === "authorized"
        ? { label: "Đã ủy quyền", tone: "success" }
        : normalized === "pendingauthorization"
          ? { label: "Chờ ủy quyền", tone: "warning" }
          : normalized === "active"
            ? { label: "Active", tone: "success" }
            : normalized === "inactive"
              ? { label: "Inactive", tone: "neutral" }
              : { label: status || "Chưa rõ", tone: "neutral" };

  return <Badge tone={display.tone}>{display.label}</Badge>;
}

function SocialMediaLoadingState() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="grid gap-3">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

function buildSocialMediaTableRows(rows: SocialMediaIntegrationRow[]): SocialMediaTableRow[] {
  return rows.flatMap((row) => {
    const pages = integrationPages(row.integration);
    if (pages.length === 0) {
      const tableRow: SocialMediaTableRow = { ...row, page: null, rowKey: `${row.business.id}:${row.integration.id}` };
      return [tableRow];
    }
    return pages.map<SocialMediaTableRow>((page) => ({
      ...row,
      page,
      rowKey: `${row.business.id}:${row.integration.id}:${page.id || page.externalPageId || page.pageName}`,
    }));
  });
}

function integrationPages(integration: SocialMediaIntegrationSummary): SocialMediaLinkedPage[] {
  if (integration.selectedPages && integration.selectedPages.length > 0) return integration.selectedPages;
  if (integration.pages && integration.pages.length > 0) return integration.pages;
  return [];
}

function displayPageName(page: SocialMediaLinkedPage | null, integration: SocialMediaIntegrationSummary): string {
  if (page?.pageName) return page.pageName;
  if (page?.username) return page.username;
  if (integration.pagesCount > 0) return `${integration.pagesCount} trang đã chọn`;
  return "Chưa chọn trang";
}

function displayDeleteTargetName(row: SocialMediaTableRow): string {
  const pageName = displayPageName(row.page, row.integration);
  return pageName === "Chưa chọn trang" ? row.business.brandName : `${row.business.brandName} / ${pageName}`;
}

function providerCode(integration: SocialMediaIntegrationSummary): string {
  const code = integration.providerCode.trim().toUpperCase();
  if (code) return code;
  return integration.providerName.trim().toUpperCase();
}

function isFacebookIntegration(integration: SocialMediaIntegrationSummary): boolean {
  return providerCode(integration) === "FACEBOOK";
}

function blankScheduleDraft(): PageScheduleDraft {
  return {
    mode: "full",
    timezone: DEFAULT_TIMEZONE,
    workingDays: DAY_OPTIONS.map((day) => day.value),
    startTime: FULL_TIME_START,
    endTime: FULL_TIME_END,
  };
}

function blankCreatePageDraft(): SocialMediaCreatePageDraft {
  return {
    localId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    externalPageId: "",
    pageName: "",
    pageAvatarUrl: "",
    pageImageUrl: "",
    status: "Active",
    schedule: blankScheduleDraft(),
  };
}

function defaultCreateForm(businessPartnerId: string): SocialMediaCreateForm {
  return {
    businessPartnerId,
    appId: "",
    appSecret: "",
    pages: [blankCreatePageDraft()],
  };
}

function defaultEditPageForm(page: SocialMediaLinkedPage | null): SocialMediaPageEditForm {
  return {
    status: pageStatusForForm(page),
    schedule: scheduleDraftFromPage(page),
  };
}

function pageStatusForForm(page: SocialMediaLinkedPage | null): SocialMediaPageEditForm["status"] {
  const normalized = page?.status?.trim().toLowerCase();
  if (normalized === "inactive" || page?.isActive === false) return "Inactive";
  return "Active";
}

function scheduleDraftFromPage(page: SocialMediaLinkedPage | null): PageScheduleDraft {
  const schedules = (page?.schedules ?? []).filter((schedule) => schedule.isActive !== false);
  if (schedules.length === 0) return blankScheduleDraft();

  const fullTime = DAY_OPTIONS.every((day) =>
    schedules.some(
      (schedule) =>
        normalizeDay(schedule.dayOfWeek) === day.value &&
        schedule.startTime === FULL_TIME_START &&
        schedule.endTime === FULL_TIME_END,
    ),
  );

  if (fullTime) return blankScheduleDraft();

  const firstSchedule = schedules[0];
  return {
    mode: "part",
    timezone: firstSchedule?.timeZoneId || DEFAULT_TIMEZONE,
    workingDays: uniqueDays(schedules.map((schedule) => normalizeDay(schedule.dayOfWeek))).filter(Boolean),
    startTime: firstSchedule?.startTime || DEFAULT_PART_TIME_START,
    endTime: firstSchedule?.endTime || DEFAULT_PART_TIME_END,
  };
}

function uniqueDays(days: string[]): DayOfWeekName[] {
  const result: DayOfWeekName[] = [];
  for (const day of days) {
    if (isDayOfWeekName(day) && !result.includes(day)) result.push(day);
  }
  return result;
}

function isDayOfWeekName(day: string): day is DayOfWeekName {
  return DAY_OPTIONS.some((item) => item.value === day);
}

function normalizeDay(day: string): string {
  const normalized = day.trim().toLowerCase();
  return DAY_OPTIONS.find((item) => item.value.toLowerCase() === normalized || item.shortLabel.toLowerCase() === normalized)?.value ?? day;
}

function createPagePayload(page: SocialMediaCreatePageDraft): CreateSocialMediaIntegrationPageRequest {
  return {
    externalPageId: page.externalPageId.trim(),
    pageName: page.pageName.trim(),
    pageAvatarUrl: nullableTrim(page.pageAvatarUrl),
    pageImageUrl: nullableTrim(page.pageImageUrl),
    status: page.status,
    botSchedule: botScheduleFromDraft(page.schedule),
  };
}

function updatePagePayload(form: SocialMediaPageEditForm): UpdateSocialMediaPageRequest {
  return {
    status: form.status,
    botSchedule: botScheduleFromDraft(form.schedule),
  };
}

function botScheduleFromDraft(draft: PageScheduleDraft): BotScheduleRequest {
  if (draft.mode === "full") {
    return {
      timezone: draft.timezone.trim() || DEFAULT_TIMEZONE,
      workingDays: DAY_OPTIONS.map((day) => day.value),
      startTime: FULL_TIME_START,
      endTime: FULL_TIME_END,
    };
  }

  return {
    timezone: draft.timezone.trim() || DEFAULT_TIMEZONE,
    workingDays: draft.workingDays,
    startTime: draft.startTime,
    endTime: draft.endTime,
  };
}

function validateCreateUntilStep(form: SocialMediaCreateForm, nextStep: CreateStep): CreateFormErrors {
  if (nextStep === "config") return {};
  if (nextStep === "pages") return validateCreateConfig(form);
  if (nextStep === "schedule") return { ...validateCreateConfig(form), ...validateCreatePages(form) };
  return validateCreateForm(form);
}

function validateCreateForm(form: SocialMediaCreateForm): CreateFormErrors {
  return {
    ...validateCreateConfig(form),
    ...validateCreatePages(form),
    ...validateCreateSchedules(form),
  };
}

function validateCreateConfig(form: SocialMediaCreateForm): CreateFormErrors {
  const errors: CreateFormErrors = {};
  if (!form.businessPartnerId) errors.businessPartnerId = "Vui lòng chọn doanh nghiệp.";
  if (!form.appId.trim()) errors.appId = "Vui lòng nhập App ID.";
  if (!form.appSecret.trim()) errors.appSecret = "Vui lòng nhập App Secret.";
  return errors;
}

function validateCreatePages(form: SocialMediaCreateForm): CreateFormErrors {
  const pageIds = new Set<string>();
  for (const [index, page] of form.pages.entries()) {
    const label = `Page ${index + 1}`;
    if (!page.pageName.trim()) return { pages: `${label}: vui lòng nhập tên page.` };
    if (!page.externalPageId.trim()) return { pages: `${label}: vui lòng nhập ID page.` };
    const externalPageId = page.externalPageId.trim();
    if (pageIds.has(externalPageId)) return { pages: `ID page ${externalPageId} bị trùng.` };
    pageIds.add(externalPageId);
  }
  return form.pages.length > 0 ? {} : { pages: "Vui lòng thêm ít nhất một page." };
}

function validateCreateSchedules(form: SocialMediaCreateForm): CreateFormErrors {
  for (const page of form.pages) {
    const error = validateScheduleDraft(page.schedule, page.pageName || page.externalPageId || "Facebook Page");
    if (error) return { schedule: error };
  }
  return {};
}

function validateScheduleDraft(draft: PageScheduleDraft, pageName: string): string {
  if (draft.mode === "part" && draft.workingDays.length === 0) {
    return `${pageName}: vui lòng chọn ít nhất một ngày hoạt động.`;
  }
  if (!isValidScheduleTime(draft.startTime) || !isValidScheduleTime(draft.endTime)) {
    return `${pageName}: giờ hoạt động phải đúng định dạng HH:mm.`;
  }
  if (draft.startTime === draft.endTime) {
    return `${pageName}: giờ bắt đầu và giờ kết thúc không được trùng nhau.`;
  }
  return "";
}

function hasErrors(errors: CreateFormErrors): boolean {
  return Object.values(errors).some(Boolean);
}

function nullableTrim(value: string): string | null {
  const trimmed = value.trim();
  return trimmed || null;
}

function isValidScheduleTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function pageInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "FB";
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

function facebookOAuthCallbackUrl(): string {
  const configured = import.meta.env.VITE_FACEBOOK_OAUTH_CALLBACK_URL?.trim();
  if (configured) return configured;
  return `${window.location.origin}/business/social-media/oauth/callback`;
}

function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError) return errorMessage(error.body, fallback);
  return fallback;
}

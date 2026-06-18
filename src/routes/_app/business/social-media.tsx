import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
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
  useCreateFacebookAppConfig,
  useDeleteSocialMediaIntegration,
  useFacebookPages,
  useSaveFacebookPages,
  useStartFacebookOAuth,
  useUpdateFacebookAppConfig,
  useUpdateSocialMediaPage,
  socialMediaKeys,
} from "@/api/hooks/social-media-integrations";
import type {
  BotScheduleRequest,
  BotWorkingScheduleRequest,
  FacebookManagedPage,
  SocialMediaIntegrationSummary,
  SocialMediaLinkedPage,
  UpdateSocialMediaPageRequest,
} from "@/api/social-media-types";
import { ApiRequestError, errorMessage } from "@/api/errors";
import { PERMISSIONS, usePermissionSet } from "@/auth/permissions";
import {
  clearFacebookOAuthContext,
  readFacebookOAuthContext,
  storeFacebookOAuthContext,
} from "@/lib/facebook-oauth-context";

const BUSINESS_PAGE_SIZE = 100;
const DEFAULT_TIMEZONE = "Asia/Ho_Chi_Minh";
const FULL_TIME_START = "00:00";
const FULL_TIME_END = "23:59";
const DEFAULT_PART_TIME_START = "08:00";
const DEFAULT_PART_TIME_END = "17:30";
const APP_SECRET_MASK = "••••••••••••••••••••••••";

type ProviderFilter = "FACEBOOK" | "TIKTOK";
type CreateStep = "config" | "pages" | "schedule";
type ScheduleMode = "full" | "part";
type ManageBotMode = "inactive" | "full" | "part";
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
  username?: string | null;
  pageAvatarUrl: string;
  pageImageUrl: string;
  pageAccessToken: string;
  status: "Active" | "Inactive";
  schedule: PageScheduleDraft;
}

interface SocialMediaCreateForm {
  businessPartnerId: string;
  appId: string;
  appSecret: string;
  pages: SocialMediaCreatePageDraft[];
}

interface ManageConfigForm {
  businessPartnerId: string;
  appSecret: string;
  botMode: ManageBotMode;
  schedule: PageScheduleDraft;
}

interface RefreshTokenForm {
  businessPartnerId: string;
  appSecret: string;
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
          description="Cần quyền SOCIAL_MEDIA.FACEBOOK_INTEGRATION.VIEW đềEtruy cập màn hình này."
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
  const queryClient = useQueryClient();
  const search = Route.useSearch();
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>("FACEBOOK");
  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState<CreateStep>("config");
  const [createForm, setCreateForm] = useState<SocialMediaCreateForm>(() => defaultCreateForm(""));
  const [createErrors, setCreateErrors] = useState<CreateFormErrors>({});
  const [manageTarget, setManageTarget] = useState<SocialMediaTableRow | null>(null);
  const [refreshTarget, setRefreshTarget] = useState<SocialMediaTableRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SocialMediaTableRow | null>(null);
  const [oauthResumeHandled, setOauthResumeHandled] = useState(false);

  const businessPartners = useBusinessPartners({
    isActive: true,
    pageNumber: 1,
    pageSize: BUSINESS_PAGE_SIZE,
  });
  const businesses = businessPartners.data?.items ?? [];
  const businessIds = useMemo(() => businesses.map((business) => business.id), [businesses]);
  const integrationQueries = useBusinessPartnersIntegrations(businessIds, !businessPartners.isLoading && !businessPartners.isError);
  const createFacebookConfig = useCreateFacebookAppConfig();
  const updateFacebookConfig = useUpdateFacebookAppConfig();
  const updatePage = useUpdateSocialMediaPage();
  const deleteIntegration = useDeleteSocialMediaIntegration();
  const startFacebookOAuth = useStartFacebookOAuth();
  const facebookPages = useFacebookPages(createForm.businessPartnerId, createOpen && createStep === "pages");
  const saveFacebookPages = useSaveFacebookPages();

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
  const deleteSubmitting = deleteIntegration.isPending;
  const manageConfigSubmitting = updateFacebookConfig.isPending || updatePage.isPending;
  const createSubmitting = createFacebookConfig.isPending || startFacebookOAuth.isPending || saveFacebookPages.isPending;
  const createDisabled = !defaultBusinessId || providerFilter !== "FACEBOOK";
  const createDisabledTitle = !defaultBusinessId
    ? "Chưa có doanh nghiệp đềEthêm liên kết."
    : providerFilter !== "FACEBOOK"
      ? "Thêm liên kết TikTok sẽ được triển khai ềEphase sau."
      : undefined;

  useEffect(() => {
    if (oauthResumeHandled || businessPartners.isLoading || integrationsLoading) return;
    const context = readFacebookOAuthContext();
    if (!context?.resumePageSelection || context.flow !== "add-link") return;

    const businessExists = businesses.some((business) => business.id === context.businessPartnerId);
    if (!businessExists) {
      if (!businessPartners.isFetching) {
        toast.error("Không tìm thấy doanh nghiệp đềEtiếp tục chọn trang Facebook.");
        clearFacebookOAuthContext();
        setOauthResumeHandled(true);
      }
      return;
    }

    setProviderFilter("FACEBOOK");
    setCreateStep("pages");
    setCreateForm({
      ...defaultCreateForm(context.businessPartnerId),
      appId: context.appId ?? "",
      appSecret: "",
      pages: [],
    });
    setCreateErrors({});
    setCreateOpen(true);
    setOauthResumeHandled(true);
  }, [
    businesses,
    businessPartners.isFetching,
    businessPartners.isLoading,
    integrationsLoading,
    oauthResumeHandled,
  ]);

  const openCreate = () => {
    if (createDisabled) return;
    setCreateStep("config");
    setCreateForm(defaultCreateForm(defaultBusinessId));
    setCreateErrors({});
    setCreateOpen(true);
  };

  const closeCreate = () => {
    const businessPartnerId = createForm.businessPartnerId;
    setCreateOpen(false);
    setCreateStep("config");
    setCreateErrors({});
    setCreateForm(defaultCreateForm(defaultBusinessId));
    clearFacebookOAuthContext();
    queryClient.removeQueries({ queryKey: socialMediaKeys.facebookPages(businessPartnerId) });
  };

  const goToCreateStep = (nextStep: CreateStep) => {
    const nextErrors = validateCreateUntilStep(createForm, nextStep);
    setCreateErrors(nextErrors);
    if (hasErrors(nextErrors)) return;
    setCreateStep(nextStep);
  };

  const submitCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (createStep === "config") {
      const nextErrors = validateCreateConfig(createForm);
      setCreateErrors(nextErrors);
      if (hasErrors(nextErrors)) return;

      const nextForm = {
        businessPartnerId: createForm.businessPartnerId,
        appId: createForm.appId.trim(),
        appSecret: createForm.appSecret.trim(),
      };

      createFacebookConfig.mutate(
        {
          businessPartnerId: nextForm.businessPartnerId,
          body: {
            appId: nextForm.appId,
            appSecret: nextForm.appSecret,
          },
        },
        {
          onSuccess: (configResult) => {
            startFacebookOAuth.mutate(
              {
                businessPartnerId: nextForm.businessPartnerId,
                body: { redirectUri: facebookOAuthCallbackUrl() },
              },
              {
                onSuccess: (oauthResult) => {
                  if (!oauthResult.authorizationUrl) {
                    toast.error("Không nhận được đường dẫn đăng nhập Facebook.");
                    return;
                  }
                  storeFacebookOAuthContext({
                    businessPartnerId: nextForm.businessPartnerId,
                    integrationId: configResult.integrationId,
                    appId: nextForm.appId,
                    state: oauthResult.state,
                    flow: "add-link",
                    resumePageSelection: false,
                  });
                  toast.info("Đang chuyển sang Facebook đềEđăng nhập...");
                  setCreateOpen(false);
                  window.location.href = oauthResult.authorizationUrl;
                },
                onError: (error) => {
                  toast.error(apiErrorMessage(error, "Không thềEbắt đầu ủy quyền Facebook."));
                  setCreateForm((current) => ({ ...current, appSecret: "" }));
                },
              },
            );
          },
          onError: (error) => {
            toast.error(apiErrorMessage(error, "Không thềElưu cấu hình Facebook App."));
            setCreateForm((current) => ({ ...current, appSecret: "" }));
          },
        },
      );
      return;
    }

    if (createStep === "pages") {
      goToCreateStep("schedule");
      return;
    }

    const nextErrors = validateCreateForm(createForm);
    setCreateErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    saveFacebookPages.mutate(
      {
        businessPartnerId: createForm.businessPartnerId,
        body: {
          pages: createForm.pages.map((page) => ({
            externalPageId: page.externalPageId,
            pageName: page.pageName,
            pageAvatarUrl: nullableTrim(page.pageAvatarUrl),
            pageAccessToken: page.pageAccessToken,
            schedules: schedulesFromDraft(page.schedule),
          })),
        },
      },
      {
        onSuccess: () => {
          toast.success("Đã lưu page Facebook và lịch hoạt động.");
          closeCreate();
        },
        onError: (error) => toast.error(apiErrorMessage(error, "Không thềElưu page Facebook và lịch hoạt động.")),
      },
    );
  };

  const saveManageConfig = async (row: SocialMediaTableRow, form: ManageConfigForm) => {
    const appSecret = form.appSecret.trim();
    if (!form.businessPartnerId) {
      toast.error("Vui long chon doanh nghiep.");
      return;
    }

    const shouldUpdateAppConfig = isEditedAppSecret(appSecret);
    const shouldUpdatePage = !!row.page?.id;
    if (!shouldUpdateAppConfig && !shouldUpdatePage) {
      toast.error("Lien ket nay chua co page de cap nhat trang thai bot.");
      return;
    }

    const validationError = form.botMode === "part"
      ? validateScheduleDraft({ ...form.schedule, mode: "part" }, displayPageName(row.page, row.integration))
      : "";
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      if (shouldUpdateAppConfig) {
        await updateFacebookConfig.mutateAsync({
          businessPartnerId: form.businessPartnerId,
          body: {
            appId: row.integration.appId,
            appSecret,
          },
        });
      }
      if (shouldUpdatePage && row.page?.id) {
        await updatePage.mutateAsync({
          businessPartnerId: row.business.id,
          pageId: row.page.id,
          body: managePagePayload(form),
        });
      }
      toast.success("Da cap nhat lien ket social media.");
      setManageTarget(null);
      integrationQueries.forEach((query) => query.refetch());
    } catch (error) {
      toast.error(apiErrorMessage(error, "Khong the cap nhat lien ket social media."));
    }
  };
  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteIntegration.mutate(
      {
        businessPartnerId: deleteTarget.business.id,
        integrationId: deleteTarget.integration.id,
      },
      {
        onSuccess: () => {
          toast.success("Da xoa mem lien ket mang xa hoi.");
          setDeleteTarget(null);
        },
        onError: (error) => toast.error(deleteSocialMediaErrorMessage(error)),
      },
    );
  };
  const openRefreshToken = (row: SocialMediaTableRow) => {
    setManageTarget(null);
    setRefreshTarget(row);
  };

  const saveRefreshTokenConfig = (row: SocialMediaTableRow, form: RefreshTokenForm) => {
    const appSecret = form.appSecret.trim();
    if (!form.businessPartnerId) {
      toast.error("Vui long chon doanh nghiep.");
      return;
    }
    if (!isEditedAppSecret(appSecret)) {
      toast.error("Vui long nhap App Secret moi neu muon cap nhat cau hinh.");
      return;
    }

    updateFacebookConfig.mutate(
      {
        businessPartnerId: form.businessPartnerId,
        body: {
          appId: row.integration.appId,
          appSecret,
        },
      },
      {
        onSuccess: () => {
          toast.success("Da luu cau hinh lam moi lien ket social media.");
          setRefreshTarget(null);
          integrationQueries.forEach((query) => query.refetch());
        },
        onError: (error) => toast.error(apiErrorMessage(error, "Khong the luu cau hinh lam moi lien ket social media.")),
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
            title="Chưa có doanh nghiệp đềEliên kết mạng xã hội."
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
            description="Đổi bềElọc hoặc thêm liên kết mới đềEbắt đầu."
          />
        ) : (
          <SocialMediaIntegrationsTable
            rows={tableRows}
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
        managedPages={facebookPages.data?.pages ?? []}
        pagesLoading={facebookPages.isLoading || facebookPages.isFetching}
        pagesError={facebookPages.error}
        loading={createSubmitting}
        onOpenChange={(open) => {
          if (!open) closeCreate();
          else setCreateOpen(true);
        }}
        onStepChange={goToCreateStep}
        onFormChange={(form) => {
          setCreateForm(form);
          setCreateErrors({});
        }}
        onRetryPages={() => facebookPages.refetch()}
        onSubmit={submitCreate}
      />

      <SocialMediaIntegrationManageDialog
        row={manageTarget}
        businesses={businesses}
        canUpdate={canUpdate}
        canReauthorize={canReauthorize}
        saving={manageConfigSubmitting}
        onOpenChange={(open) => {
          if (!open) setManageTarget(null);
        }}
        onSaveConfig={saveManageConfig}
        onRefreshToken={openRefreshToken}
      />

      <RefreshSocialMediaTokenDialog
        target={refreshTarget}
        businesses={businesses}
        loading={updateFacebookConfig.isPending}
        onOpenChange={(open) => !open && setRefreshTarget(null)}
        onSubmit={saveRefreshTokenConfig}
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
                <p className="text-sm text-text-secondary">Mỗi page có lịch bot riêng. Part time cho phép khung giềEqua ngày.</p>
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
          <span className="mt-1 text-sm text-text-secondary">Chọn ngày và một khung giềEdùng chung.</span>
        </button>
      </div>

      {schedule.mode === "full" ? (
        <div className="flex items-center gap-2 rounded-md border border-success-border bg-success-bg px-3 py-2 text-sm font-medium text-success-fg">
          <CheckCircle className="size-5" weight="fill" aria-hidden />
          Đã chọn Full time: hềEthống sẽ lưu 7 ngày, 00:00 - 23:59.
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

function ManageDialogAvatar({
  name,
  url,
  fallback,
}: {
  name: string;
  url?: string | null;
  fallback: string;
}) {
  if (url) {
    return (
      <img
        src={url}
        alt=""
        className="size-16 rounded-pill border border-[#2f63a8] bg-white object-cover p-0.5 shadow-xs"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <span className="flex size-16 items-center justify-center rounded-pill border border-[#bdd0ea] bg-[#eef5ff] text-sm font-bold text-[#24589a] shadow-xs">
      {fallback || pageInitials(name)}
    </span>
  );
}

function SocialMediaIntegrationManageDialog({
  row,
  businesses,
  canUpdate,
  canReauthorize,
  saving,
  onOpenChange,
  onSaveConfig,
  onRefreshToken,
}: {
  row: SocialMediaTableRow | null;
  businesses: BusinessPartner[];
  canUpdate: boolean;
  canReauthorize: boolean;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveConfig: (row: SocialMediaTableRow, form: ManageConfigForm) => void;
  onRefreshToken: (row: SocialMediaTableRow) => void;
}) {
  const integration = row?.integration;
  const page = row?.page ?? null;
  const isFacebook = integration ? isFacebookIntegration(integration) : false;
  const [form, setForm] = useState<ManageConfigForm>({
    businessPartnerId: "",
    appSecret: APP_SECRET_MASK,
    botMode: "inactive",
    schedule: blankScheduleDraft(),
  });

  useEffect(() => {
    setForm({
      businessPartnerId: row?.business.id ?? "",
      appSecret: appSecretDisplayValue(integration),
      botMode: manageBotModeFromPage(page),
      schedule: scheduleDraftFromPage(page),
    });
  }, [row?.business.id, row?.integration.id, page]);

  return (
    <Dialog open={!!row} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-[760px] overflow-y-auto rounded-md border border-[#d7e3f4] bg-white p-6 shadow-xl">
        <DialogHeader className="grid grid-cols-[4rem_1fr_4rem] items-start gap-3 text-center">
          <div className="justify-self-start">
            <ManageDialogAvatar
              name={row?.business.brandName ?? (isFacebook ? "Facebook" : "Social")}
              url={row?.business.logoUrl ?? page?.pageAvatarUrl}
              fallback={isFacebook ? "FB" : integration ? providerCode(integration).slice(0, 2) || "SM" : "SM"}
            />
          </div>
          <DialogTitle className="pt-2 text-base font-bold uppercase tracking-wide text-[#24589a]">
            Thông tin liên kết social media
          </DialogTitle>
          <span aria-hidden />
          <DialogDescription className="sr-only">Chi tiết liên kết mạng xã hội</DialogDescription>
        </DialogHeader>

        {row && integration && (
          <form className="grid gap-4 pt-2" onSubmit={(event) => {
            event.preventDefault();
            onSaveConfig(row, form);
          }}>
            <DetailSelectField
              label="Doanh nghiệp"
              value={form.businessPartnerId}
              disabled={saving || !canUpdate}
              businesses={businesses}
              onChange={(businessPartnerId) => setForm((current) => ({ ...current, businessPartnerId }))}
            />
            <DetailReadOnlyField label="App ID" value={integration.appId || "-"} required mono />
            <DetailSecretField
              value={form.appSecret}
              disabled={saving || !canUpdate}
              onChange={(appSecret) => setForm((current) => ({ ...current, appSecret }))}
            />
            <DetailReadOnlyField label="Trang" value={displayPageName(page, integration)} />
            <DetailReadOnlyField label="ID Trang" value={page?.externalPageId || "-"} mono />

            <ManageBotStatusEditor
              value={form.botMode}
              schedule={form.schedule}
              disabled={saving || !canUpdate || !page?.id}
              onModeChange={(botMode) => setForm((current) => ({ ...current, botMode }))}
              onScheduleChange={(schedule) => setForm((current) => ({ ...current, schedule }))}
            />
            <div className="mt-4 flex items-center justify-between gap-4">
              <Button
                type="button"
                disabled={!isFacebook || !canReauthorize || saving}
                title={
                  !isFacebook
                    ? "Làm mới token provider này sẽ được triển khai ềEphase sau."
                    : !canReauthorize
                      ? "Bạn không có quyền ủy quyền Facebook."
                      : undefined
                }
                onClick={() => onRefreshToken(row)}
                className="bg-[#bb18b8] text-white hover:bg-[#9f139d]"
              >
                Làm mới token liên kết
              </Button>
              <Button
                type="submit"
                loading={saving}
                disabled={!canUpdate}
                title={!canUpdate ? "Bạn không có quyền cập nhật liên kết Facebook." : undefined}
                className="min-w-28 bg-[#2f63a8] text-white hover:bg-[#24589a]"
              >
                Lưu
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function RefreshSocialMediaTokenDialog({
  target,
  businesses,
  loading,
  onOpenChange,
  onSubmit,
}: {
  target: SocialMediaTableRow | null;
  businesses: BusinessPartner[];
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (row: SocialMediaTableRow, form: RefreshTokenForm) => void;
}) {
  const [form, setForm] = useState<RefreshTokenForm>({ businessPartnerId: "", appSecret: APP_SECRET_MASK });

  useEffect(() => {
    setForm({ businessPartnerId: target?.business.id ?? "", appSecret: appSecretDisplayValue(target?.integration) });
  }, [target?.business.id, target?.integration.id]);

  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-md border border-[#d7e3f4] bg-white p-6 shadow-xl">
        <DialogHeader className="text-center">
          <DialogTitle className="text-base font-bold uppercase tracking-wide text-[#24589a]">
            Làm mới liên kết social media
          </DialogTitle>
          <DialogDescription className="sr-only">
            Nhập lại App Secret đềElưu cấu hình làm mới liên kết social media.
          </DialogDescription>
        </DialogHeader>

        {target && (
          <form
            className="grid gap-4 pt-2"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit(target, form);
            }}
          >
            <DetailSelectField
              label="Doanh nghiệp"
              value={form.businessPartnerId}
              disabled
              businesses={businesses}
              onChange={(businessPartnerId) => setForm((current) => ({ ...current, businessPartnerId }))}
            />
            <DetailReadOnlyField label="App ID" value={target.integration.appId || "-"} required mono />
            <DetailSecretField
              value={form.appSecret}
              disabled={loading}
              onChange={(appSecret) => setForm((current) => ({ ...current, appSecret }))}
            />
            <div className="flex justify-center pt-2">
              <Button type="submit" loading={loading} className="min-w-32 bg-[#2f63a8] text-white hover:bg-[#24589a]">
                Tiếp tục
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ManageBotStatusEditor({
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
                GiềEbắt đầu
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
                GiềEkết thúc
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
  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xoa lien ket mang xa hoi</DialogTitle>
          <DialogDescription>
            Ban co chac muon xoa mem {target ? displayDeleteTargetName(target) : "lien ket nay"} khong? Backend se soft delete integration, cac page da lien ket va lich bot thuoc integration nay.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="secondary" disabled={loading} onClick={() => onOpenChange(false)}>
            Huy
          </Button>
          <Button type="button" variant="danger" loading={loading} onClick={onConfirm}>
            Xoa
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
    <div className="grid gap-2 sm:grid-cols-[9.5rem_1fr] sm:items-center">
      <Label className="text-brand-800">
        {label}
        {required && <span className="ml-0.5 text-[#bb18b8]">*</span>}
      </Label>
      <Input
        value={value}
        readOnly
        className={[
          "border-[#d6dce5] bg-[#f7f7f7] shadow-xs focus-visible:!border-[#2f63a8] focus-visible:!shadow-[0_0_0_3px_rgba(47,99,168,0.16)]",
          mono ? "font-mono" : "",
        ].join(" ")}
        aria-label={label}
      />
    </div>
  );
}

function DetailSelectField({
  label,
  value,
  disabled,
  businesses,
  onChange,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  businesses: BusinessPartner[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[9.5rem_1fr] sm:items-center">
      <Label className="text-brand-800">{label}</Label>
      <Select value={value} disabled={disabled} onValueChange={onChange}>
        <SelectTrigger className="border-[#d6dce5] bg-white shadow-xs focus:!ring-[#2f63a8]">
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
    </div>
  );
}

function DetailSecretField({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[9.5rem_1fr] sm:items-center">
      <Label htmlFor="manage_app_secret" className="text-brand-800">
        App Secret <span className="ml-0.5 text-[#bb18b8]">*</span>
      </Label>
      <Input
        id="manage_app_secret"
        type="password"
        value={value}
        disabled={disabled}
        placeholder="App Secret"
        className="border-[#d6dce5] bg-white shadow-xs focus-visible:!border-[#2f63a8] focus-visible:!shadow-[0_0_0_3px_rgba(47,99,168,0.16)]"
        autoComplete="new-password"
        onFocus={(event) => {
          if (event.currentTarget.value === APP_SECRET_MASK) event.currentTarget.select();
        }}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function SocialMediaIntegrationsTable({
  rows,
  onManage,
  onDelete,
}: {
  rows: SocialMediaTableRow[];
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
  onManage,
  onDelete,
}: {
  row: SocialMediaTableRow;
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
            className="size-9 border border-danger-border bg-danger-bg text-danger-fg shadow-xs hover:border-danger-base hover:bg-danger-base hover:text-white"
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
          ? { label: "ChềEủy quyền", tone: "warning" }
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
  return `${row.business.brandName} / ${providerCode(row.integration)}`;
}

function providerCode(integration: SocialMediaIntegrationSummary): string {
  const code = integration.providerCode.trim().toUpperCase();
  if (code) return code;
  return integration.providerName.trim().toUpperCase();
}

function isFacebookIntegration(integration: SocialMediaIntegrationSummary): boolean {
  return providerCode(integration) === "FACEBOOK";
}

function appSecretDisplayValue(integration: SocialMediaIntegrationSummary | null | undefined): string {
  const appSecret = (integration as (SocialMediaIntegrationSummary & { appSecret?: string | null }) | null | undefined)
    ?.appSecret
    ?.trim();
  return appSecret || APP_SECRET_MASK;
}

function isEditedAppSecret(value: string): boolean {
  const trimmed = value.trim();
  return !!trimmed && trimmed !== APP_SECRET_MASK;
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

function manageBotModeFromPage(page: SocialMediaLinkedPage | null): ManageBotMode {
  const normalizedStatus = page?.status?.trim().toLowerCase();
  if (!page || normalizedStatus === "inactive" || page.isActive === false || page.isBotEnabled === false) {
    return "inactive";
  }
  return scheduleDraftFromPage(page).mode === "full" ? "full" : "part";
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
    workingDays: uniqueDays(schedules.map((schedule) => normalizeDay(schedule.dayOfWeek))),
    startTime: firstSchedule?.startTime || DEFAULT_PART_TIME_START,
    endTime: firstSchedule?.endTime || DEFAULT_PART_TIME_END,
  };
}

function managePagePayload(form: ManageConfigForm): UpdateSocialMediaPageRequest {
  return {
    status: form.botMode === "inactive" ? "Inactive" : "Active",
    botSchedule: botScheduleFromDraft(form.botMode === "full" ? blankScheduleDraft() : form.schedule),
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

function createPageDraftFromManagedPage(page: FacebookManagedPage): SocialMediaCreatePageDraft {
  const avatarUrl = page.pageAvatarUrl ?? page.avatarUrl ?? "";
  return {
    localId: page.externalPageId || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    externalPageId: page.externalPageId,
    pageName: page.pageName,
    username: page.username ?? null,
    pageAvatarUrl: avatarUrl,
    pageImageUrl: "",
    pageAccessToken: page.pageAccessToken,
    status: "Active",
    schedule: blankScheduleDraft(),
  };
}

function defaultCreateForm(businessPartnerId: string): SocialMediaCreateForm {
  return {
    businessPartnerId,
    appId: "",
    appSecret: "",
    pages: [],
  };
}

function normalizeDay(day: string): string {
  const normalized = day.trim().toLowerCase();
  return DAY_OPTIONS.find((item) => item.value.toLowerCase() === normalized || item.shortLabel.toLowerCase() === normalized)?.value ?? day;
}

function schedulesFromDraft(draft: PageScheduleDraft): BotWorkingScheduleRequest[] {
  if (draft.mode === "full") {
    return DAY_OPTIONS.map((day) => ({
      dayOfWeek: day.value,
      startTime: FULL_TIME_START,
      endTime: FULL_TIME_END,
    }));
  }

  return draft.workingDays.map((dayOfWeek) => ({
    dayOfWeek,
    startTime: draft.startTime,
    endTime: draft.endTime,
  }));
}

function validateCreateUntilStep(form: SocialMediaCreateForm, nextStep: CreateStep): CreateFormErrors {
  if (nextStep === "config") return {};
  if (nextStep === "pages") return validateCreateConfig(form);
  if (nextStep === "schedule") return validateCreatePages(form);
  return validateCreateForm(form);
}

function validateCreateForm(form: SocialMediaCreateForm): CreateFormErrors {
  return {
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
    if (!page.pageAccessToken) return { pages: `${page.pageName || label}: chưa có quyền truy cập page hợp lềE` };
    const externalPageId = page.externalPageId.trim();
    if (pageIds.has(externalPageId)) return { pages: `ID page ${externalPageId} bềEtrùng.` };
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
    return `${pageName}: giềEhoạt động phải đúng định dạng HH:mm.`;
  }
  if (draft.startTime === draft.endTime) {
    return `${pageName}: giềEbắt đầu và giềEkết thúc không được trùng nhau.`;
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
  if (error instanceof ApiRequestError) {
    const message = errorMessage(error.body, fallback);
    return message === fallback ? `${fallback} (HTTP ${error.status})` : message;
  }
  return fallback;
}

function deleteSocialMediaErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError && error.status === 405) {
    return "Backend hien chua bat DELETE /api/business-partners/{businessPartnerId}/social-media/integrations/{integrationId}. Endpoint nay la soft delete integration theo muc 5.8 DOCX.";
  }
  return apiErrorMessage(error, "Khong the xoa lien ket mang xa hoi.");
}

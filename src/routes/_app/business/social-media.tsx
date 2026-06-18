import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { LinkSimple, Plus, ShieldWarning } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BusinessPageShell } from "@/components/business/business-page-shell";
import { EmptyState } from "@/components/common/empty-state";
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
import { PERMISSIONS, usePermissionSet } from "@/auth/permissions";
import {
  clearFacebookOAuthContext,
  readFacebookOAuthContext,
  storeFacebookOAuthContext,
} from "@/lib/facebook-oauth-context";
import type {
  CreateFormErrors,
  CreateStep,
  ManageConfigForm,
  ProviderFilter,
  RefreshTokenForm,
  SocialMediaCreateForm,
  SocialMediaIntegrationRow,
  SocialMediaTableRow,
} from "@/components/business/social-media/social-media-models";
import {
  apiErrorMessage,
  buildSocialMediaTableRows,
  defaultCreateForm,
  deleteSocialMediaErrorMessage,
  displayPageName,
  facebookOAuthCallbackUrl,
  hasErrors,
  isEditedAppSecret,
  managePagePayload,
  nullableTrim,
  providerCode,
  schedulesFromDraft,
  validateCreateConfig,
  validateCreateForm,
  validateCreateUntilStep,
  validateScheduleDraft,
} from "@/components/business/social-media/social-media-utils";
import { DeleteSocialMediaIntegrationDialog } from "@/components/business/social-media/social-media-delete-dialog";
import { SocialMediaIntegrationsTable } from "@/components/business/social-media/social-media-table";
import { SocialMediaCreateDialog } from "@/components/business/social-media/social-media-create-dialog";
import { SocialMediaIntegrationManageDialog } from "@/components/business/social-media/social-media-manage-dialog";
import { RefreshSocialMediaTokenDialog } from "@/components/business/social-media/social-media-refresh-token-dialog";

const BUSINESS_PAGE_SIZE = 100;

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

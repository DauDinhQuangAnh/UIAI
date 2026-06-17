import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle, LinkSimple, PencilSimple, Plus, ShieldWarning } from "@phosphor-icons/react";
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
import { TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { BusinessDataTable, BusinessHeadCell } from "@/components/business/business-management-table";
import { BusinessPageShell } from "@/components/business/business-page-shell";
import { EmptyState } from "@/components/common/empty-state";
import type { BusinessPartner } from "@/components/business/information/business-information-data";
import { useBusinessPartners } from "@/api/hooks/business-partners";
import {
  useBusinessPartnerIntegrations,
  useCreateFacebookAppConfig,
  useFacebookPages,
  useSaveFacebookPages,
  useSocialMediaProviders,
  useStartFacebookOAuth,
  useUpdateFacebookAppConfig,
  socialMediaKeys,
} from "@/api/hooks/social-media-integrations";
import type {
  FacebookManagedPage,
  SocialMediaIntegrationSummary,
  SocialMediaProvider,
} from "@/api/social-media-types";
import { ApiRequestError, errorMessage } from "@/api/errors";
import { PERMISSIONS, usePermissionSet } from "@/auth/permissions";
import { storeFacebookOAuthContext } from "@/lib/facebook-oauth-context";

const BUSINESS_PAGE_SIZE = 100;

type FacebookConfigMode = "create" | "edit";

interface FacebookConfigForm {
  businessPartnerId: string;
  appId: string;
  appSecret: string;
}

type FacebookConfigErrors = Partial<Record<keyof FacebookConfigForm, string>>;

const EMPTY_FACEBOOK_CONFIG_FORM: FacebookConfigForm = {
  businessPartnerId: "",
  appId: "",
  appSecret: "",
};

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

  return <SocialMediaLinksContent canCreate={canCreate} canUpdate={canUpdate} canReauthorize={canReauthorize} canViewPages={canView} />;
}

function SocialMediaLinksContent({
  canCreate,
  canUpdate,
  canReauthorize,
  canViewPages,
}: {
  canCreate: boolean;
  canUpdate: boolean;
  canReauthorize: boolean;
  canViewPages: boolean;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const search = Route.useSearch();
  const [selectedBusinessId, setSelectedBusinessId] = useState(search.businessPartnerId ?? "");
  const [oauthPendingIntegrationId, setOauthPendingIntegrationId] = useState<string | null>(null);
  const [pageDialogOpen, setPageDialogOpen] = useState(false);
  const [pageTargetIntegration, setPageTargetIntegration] = useState<SocialMediaIntegrationSummary | null>(null);
  const [selectedPageIds, setSelectedPageIds] = useState<Set<string>>(new Set());
  const [pageSelectionError, setPageSelectionError] = useState("");
  const [configOpen, setConfigOpen] = useState(false);
  const [configMode, setConfigMode] = useState<FacebookConfigMode>("create");
  const [configForm, setConfigForm] = useState<FacebookConfigForm>(EMPTY_FACEBOOK_CONFIG_FORM);
  const [configErrors, setConfigErrors] = useState<FacebookConfigErrors>({});

  const businessPartners = useBusinessPartners({
    isActive: true,
    pageNumber: 1,
    pageSize: BUSINESS_PAGE_SIZE,
  });
  const providers = useSocialMediaProviders();
  const integrations = useBusinessPartnerIntegrations(selectedBusinessId || undefined);
  const createFacebookConfig = useCreateFacebookAppConfig();
  const updateFacebookConfig = useUpdateFacebookAppConfig();
  const startFacebookOAuth = useStartFacebookOAuth();
  const facebookPages = useFacebookPages(selectedBusinessId || undefined, pageDialogOpen && !!pageTargetIntegration);
  const saveFacebookPages = useSaveFacebookPages();

  const businesses = businessPartners.data?.items ?? [];
  const selectedBusiness = businesses.find((business) => business.id === selectedBusinessId) ?? null;
  const providerNameByCode = useMemo(() => buildProviderNameMap(providers.data ?? []), [providers.data]);
  const configSubmitting = createFacebookConfig.isPending || updateFacebookConfig.isPending;
  const pageSelectionCount = selectedPageIds.size;

  useEffect(() => {
    if (businessPartners.isLoading || businessPartners.isError) return;
    if (businesses.length === 0) {
      setSelectedBusinessId("");
      return;
    }

    if (search.businessPartnerId && businesses.some((business) => business.id === search.businessPartnerId)) {
      if (search.businessPartnerId !== selectedBusinessId) setSelectedBusinessId(search.businessPartnerId);
      return;
    }

    if (!selectedBusinessId || !businesses.some((business) => business.id === selectedBusinessId)) {
      setSelectedBusinessId(businesses[0].id);
    }
  }, [businessPartners.isError, businessPartners.isLoading, businesses, search.businessPartnerId, selectedBusinessId]);

  const chooseBusiness = (businessPartnerId: string) => {
    setSelectedBusinessId(businessPartnerId);
    navigate({ to: "/business/social-media", search: { businessPartnerId } });
  };

  const closeConfigDialog = () => {
    setConfigOpen(false);
    setConfigMode("create");
    setConfigForm(EMPTY_FACEBOOK_CONFIG_FORM);
    setConfigErrors({});
  };

  const openCreateConfig = () => {
    if (!selectedBusinessId) return;
    setConfigMode("create");
    setConfigForm({ businessPartnerId: selectedBusinessId, appId: "", appSecret: "" });
    setConfigErrors({});
    setConfigOpen(true);
  };

  const openUpdateConfig = (integration: SocialMediaIntegrationSummary) => {
    setConfigMode("edit");
    setConfigForm({
      businessPartnerId: selectedBusinessId,
      appId: integration.appId,
      appSecret: "",
    });
    setConfigErrors({});
    setConfigOpen(true);
  };

  const submitConfig = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextForm = {
      businessPartnerId: configForm.businessPartnerId,
      appId: configForm.appId.trim(),
      appSecret: configForm.appSecret.trim(),
    };
    const nextErrors = validateFacebookConfig(nextForm);
    setConfigErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const mutation = configMode === "create" ? createFacebookConfig : updateFacebookConfig;
    mutation.mutate(
      {
        businessPartnerId: nextForm.businessPartnerId,
        body: {
          appId: nextForm.appId,
          appSecret: nextForm.appSecret,
        },
      },
      {
        onSuccess: () => {
          toast.success(
            configMode === "create"
              ? "Đã lưu cấu hình Facebook App."
              : "Đã cập nhật cấu hình Facebook App.",
          );
          closeConfigDialog();
          if (nextForm.businessPartnerId === selectedBusinessId) integrations.refetch();
        },
        onError: (error) => {
          toast.error(apiErrorMessage(error, "Không thể lưu cấu hình Facebook App."));
          setConfigForm((current) => ({ ...current, appSecret: "" }));
        },
      },
    );
  };

  const startOAuth = (integration: SocialMediaIntegrationSummary) => {
    if (!selectedBusinessId) return;
    const redirectUri = facebookOAuthCallbackUrl();
    setOauthPendingIntegrationId(integration.id);
    startFacebookOAuth.mutate(
      {
        businessPartnerId: selectedBusinessId,
        body: { redirectUri },
      },
      {
        onSuccess: (result) => {
          if (!result.authorizationUrl) {
            toast.error("Không nhận được đường dẫn đăng nhập Facebook.");
            setOauthPendingIntegrationId(null);
            return;
          }
          storeFacebookOAuthContext({
            businessPartnerId: selectedBusinessId,
            integrationId: integration.id,
            state: result.state,
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

  const clearPageSelection = () => {
    setPageDialogOpen(false);
    setPageTargetIntegration(null);
    setSelectedPageIds(new Set());
    setPageSelectionError("");
    queryClient.removeQueries({ queryKey: socialMediaKeys.facebookPages(selectedBusinessId || undefined) });
  };

  const openPageSelection = (integration: SocialMediaIntegrationSummary) => {
    if (!selectedBusinessId) return;
    setPageTargetIntegration(integration);
    setSelectedPageIds(new Set());
    setPageSelectionError("");
    setPageDialogOpen(true);
  };

  const toggleManagedPage = (externalPageId: string) => {
    setPageSelectionError("");
    setSelectedPageIds((current) => {
      const next = new Set(current);
      if (next.has(externalPageId)) next.delete(externalPageId);
      else next.add(externalPageId);
      return next;
    });
  };

  const submitSelectedPages = () => {
    if (!selectedBusinessId) return;
    const pages = facebookPages.data?.pages ?? [];
    const selectedPages = pages.filter((page) => selectedPageIds.has(page.externalPageId));
    if (selectedPages.length === 0) {
      setPageSelectionError("Vui lòng chọn ít nhất một trang.");
      return;
    }

    saveFacebookPages.mutate(
      {
        businessPartnerId: selectedBusinessId,
        body: { pages: selectedPages },
      },
      {
        onSuccess: () => {
          toast.success("Đã lưu các trang Facebook đã chọn.");
          clearPageSelection();
          integrations.refetch();
        },
        onError: (error) => toast.error(apiErrorMessage(error, "Không thể lưu các trang Facebook đã chọn.")),
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
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-text-primary">Danh sách liên kết</h2>
            <p className="text-sm text-text-secondary">
              Chọn doanh nghiệp để tải các integration mạng xã hội đã cấu hình.
            </p>
          </div>
          {canCreate && (
            <Button
              type="button"
              size="sm"
              disabled={!selectedBusinessId}
              title={!selectedBusinessId ? "Vui lòng chọn doanh nghiệp trước khi thêm liên kết." : undefined}
              onClick={openCreateConfig}
            >
              <Plus className="size-4" aria-hidden />
              Thêm liên kết
            </Button>
          )}
        </div>

        <div className="grid gap-3 rounded-md border border-border bg-surface p-3 lg:grid-cols-[minmax(16rem,1fr)_auto] lg:items-end">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-text-primary" htmlFor="social_business_partner">
              Doanh nghiệp
            </label>
            <Select
              value={selectedBusinessId}
              disabled={businessPartners.isLoading || businesses.length === 0}
              onValueChange={chooseBusiness}
            >
              <SelectTrigger id="social_business_partner" aria-label="Chọn doanh nghiệp">
                <SelectValue placeholder={businessPartners.isLoading ? "Đang tải doanh nghiệp..." : "Chọn doanh nghiệp"} />
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
          <ProviderStatus providers={providers.data ?? []} loading={providers.isLoading} error={providers.error} onRetry={() => providers.refetch()} />
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
        ) : integrations.isLoading || integrations.isFetching ? (
          <SocialMediaLoadingState />
        ) : integrations.isError ? (
          <EmptyState
            icon={LinkSimple}
            title="Không tải được liên kết mạng xã hội"
            description={apiErrorMessage(integrations.error, "Vui lòng thử lại sau.")}
            action={
              <Button type="button" variant="secondary" onClick={() => integrations.refetch()}>
                Tải lại
              </Button>
            }
          />
        ) : (integrations.data ?? []).length === 0 ? (
          <EmptyState
            icon={LinkSimple}
            title="Doanh nghiệp này chưa có liên kết mạng xã hội."
            description="Các bước cấu hình App ID/App Secret, OAuth và chọn page sẽ được triển khai ở các phase tiếp theo."
            action={
              canCreate ? (
                <Button
                  type="button"
                  disabled={!selectedBusinessId}
                  title={!selectedBusinessId ? "Vui lòng chọn doanh nghiệp trước khi thêm liên kết." : undefined}
                  onClick={openCreateConfig}
                >
                  <Plus className="size-4" aria-hidden />
                  Thêm liên kết
                </Button>
              ) : undefined
            }
          />
        ) : (
          <SocialMediaIntegrationsTable
            business={selectedBusiness}
            integrations={integrations.data ?? []}
            providerNameByCode={providerNameByCode}
            canViewPages={canViewPages}
            canUpdate={canUpdate}
            canReauthorize={canReauthorize}
            oauthPendingIntegrationId={oauthPendingIntegrationId}
            onUpdateConfig={openUpdateConfig}
            onStartOAuth={startOAuth}
            onSelectPages={openPageSelection}
          />
        )}
      </div>
      <FacebookAppConfigDialog
        open={configOpen}
        mode={configMode}
        form={configForm}
        errors={configErrors}
        businesses={businesses}
        loading={configSubmitting}
        onOpenChange={(open) => {
          if (!open) closeConfigDialog();
          else setConfigOpen(true);
        }}
        onFormChange={(nextForm) => {
          setConfigForm(nextForm);
          setConfigErrors({});
        }}
        onSubmit={submitConfig}
      />
      <FacebookPageSelectionDialog
        open={pageDialogOpen}
        pages={facebookPages.data?.pages ?? []}
        selectedPageIds={selectedPageIds}
        selectedCount={pageSelectionCount}
        loading={facebookPages.isLoading || facebookPages.isFetching}
        saving={saveFacebookPages.isPending}
        error={facebookPages.error}
        validationError={pageSelectionError}
        canSave={canUpdate}
        onOpenChange={(open) => {
          if (!open) clearPageSelection();
          else setPageDialogOpen(true);
        }}
        onRetry={() => facebookPages.refetch()}
        onTogglePage={toggleManagedPage}
        onSubmit={submitSelectedPages}
      />
    </BusinessPageShell>
  );
}

function FacebookAppConfigDialog({
  open,
  mode,
  form,
  errors,
  businesses,
  loading,
  onOpenChange,
  onFormChange,
  onSubmit,
}: {
  open: boolean;
  mode: FacebookConfigMode;
  form: FacebookConfigForm;
  errors: FacebookConfigErrors;
  businesses: BusinessPartner[];
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  onFormChange: (form: FacebookConfigForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const title = mode === "create" ? "Thêm liên kết mạng xã hội" : "Cập nhật cấu hình Facebook App";
  const submitLabel = mode === "create" ? "Lưu cấu hình" : "Lưu thay đổi";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="items-center text-center">
          <DialogTitle className="text-brand-800">{title}</DialogTitle>
          <DialogDescription>
            Nhập App ID và App Secret của Facebook App. App Secret chỉ được dùng để gửi cấu hình và sẽ được xóa khỏi form sau khi đóng.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <SocialConfigField label="Doanh nghiệp" htmlFor="facebook_config_business" required error={errors.businessPartnerId}>
            <Select
              value={form.businessPartnerId}
              disabled={loading}
              onValueChange={(businessPartnerId) => onFormChange({ ...form, businessPartnerId })}
            >
              <SelectTrigger id="facebook_config_business" aria-label="Chọn doanh nghiệp">
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
          <SocialConfigField label="App ID" htmlFor="facebook_config_app_id" required error={errors.appId}>
            <Input
              id="facebook_config_app_id"
              value={form.appId}
              disabled={loading}
              invalid={!!errors.appId}
              placeholder="123456789"
              onChange={(event) => onFormChange({ ...form, appId: event.target.value })}
              autoComplete="off"
            />
          </SocialConfigField>
          <SocialConfigField label="App Secret" htmlFor="facebook_config_app_secret" required error={errors.appSecret}>
            <Input
              id="facebook_config_app_secret"
              type="password"
              value={form.appSecret}
              disabled={loading}
              invalid={!!errors.appSecret}
              placeholder="meta-app-secret"
              onChange={(event) => onFormChange({ ...form, appSecret: event.target.value })}
              autoComplete="new-password"
            />
          </SocialConfigField>
          <DialogFooter className="mt-3">
            <Button type="button" variant="secondary" disabled={loading} onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" loading={loading}>
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
  required,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
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

function FacebookPageSelectionDialog({
  open,
  pages,
  selectedPageIds,
  selectedCount,
  loading,
  saving,
  error,
  validationError,
  canSave,
  onOpenChange,
  onRetry,
  onTogglePage,
  onSubmit,
}: {
  open: boolean;
  pages: FacebookManagedPage[];
  selectedPageIds: Set<string>;
  selectedCount: number;
  loading: boolean;
  saving: boolean;
  error: unknown;
  validationError?: string;
  canSave: boolean;
  onOpenChange: (open: boolean) => void;
  onRetry: () => void;
  onTogglePage: (externalPageId: string) => void;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader className="items-center text-center">
          <DialogTitle className="text-brand-800">Chọn trang muốn liên kết</DialogTitle>
          <DialogDescription>
            Chọn một hoặc nhiều trang Facebook bạn quản lý để kết nối.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 py-2">
            <span className="text-sm font-medium text-text-primary">Đã chọn {selectedCount} trang</span>
            {(validationError || (!loading && !error && pages.length > 0 && selectedCount === 0)) && (
              <span className="text-sm font-medium text-danger-fg">
                {validationError || "Vui lòng chọn ít nhất một trang."}
              </span>
            )}
          </div>

          {loading ? (
            <div className="grid gap-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : error ? (
            <EmptyState
              icon={LinkSimple}
              title="Không tải được danh sách trang Facebook"
              description={apiErrorMessage(error, "Vui lòng thử lại sau.")}
              className="py-10"
              action={
                <Button type="button" variant="secondary" onClick={onRetry}>
                  Tải lại
                </Button>
              }
            />
          ) : pages.length === 0 ? (
            <EmptyState
              icon={LinkSimple}
              title="Không tìm thấy trang Facebook nào từ tài khoản đã ủy quyền."
              description="Hãy kiểm tra lại quyền truy cập trang trên Facebook rồi thử lại."
              className="py-10"
            />
          ) : (
            <div className="grid max-h-[52vh] gap-2 overflow-y-auto pr-1">
              {pages.map((page) => {
                const selected = selectedPageIds.has(page.externalPageId);
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
                    onClick={() => onTogglePage(page.externalPageId)}
                    aria-pressed={selected}
                  >
                    <PageAvatar page={page} />
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

        <DialogFooter className="mt-3">
          <Button type="button" variant="secondary" disabled={saving} onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            type="button"
            loading={saving}
            disabled={loading || !!error || selectedCount === 0 || !canSave}
            title={!canSave ? "Bạn không có quyền lưu trang Facebook." : selectedCount === 0 ? "Vui lòng chọn ít nhất một trang." : undefined}
            onClick={onSubmit}
          >
            Lưu trang đã chọn
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PageAvatar({ page }: { page: FacebookManagedPage }) {
  if (page.avatarUrl) {
    return (
      <img
        src={page.avatarUrl}
        alt=""
        className="size-11 rounded-pill border border-border object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <span className="flex size-11 items-center justify-center rounded-pill border border-brand-100 bg-brand-50 text-sm font-semibold text-brand-700">
      {pageInitials(page.pageName)}
    </span>
  );
}

function ProviderStatus({
  providers,
  loading,
  error,
  onRetry,
}: {
  providers: SocialMediaProvider[];
  loading: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  if (loading) {
    return <Skeleton className="h-10 w-full lg:w-64" />;
  }
  if (error) {
    return (
      <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
        Không tải được provider. Tải lại
      </Button>
    );
  }
  const activeProviders = providers.filter((provider) => provider.isActive).length;
  return (
    <div className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-text-secondary">
      {activeProviders} provider đang hoạt động
    </div>
  );
}

function SocialMediaIntegrationsTable({
  business,
  integrations,
  providerNameByCode,
  canViewPages,
  canUpdate,
  canReauthorize,
  oauthPendingIntegrationId,
  onUpdateConfig,
  onStartOAuth,
  onSelectPages,
}: {
  business: BusinessPartner | null;
  integrations: SocialMediaIntegrationSummary[];
  providerNameByCode: Map<string, string>;
  canViewPages: boolean;
  canUpdate: boolean;
  canReauthorize: boolean;
  oauthPendingIntegrationId: string | null;
  onUpdateConfig: (integration: SocialMediaIntegrationSummary) => void;
  onStartOAuth: (integration: SocialMediaIntegrationSummary) => void;
  onSelectPages: (integration: SocialMediaIntegrationSummary) => void;
}) {
  return (
    <BusinessDataTable className="min-w-[1460px]">
      <TableHeader>
        <TableRow>
          <BusinessHeadCell className="w-[18%] whitespace-nowrap">Doanh nghiệp</BusinessHeadCell>
          <BusinessHeadCell className="w-[15%] whitespace-nowrap">Nhà cung cấp</BusinessHeadCell>
          <BusinessHeadCell className="w-[15%] whitespace-nowrap">App ID</BusinessHeadCell>
          <BusinessHeadCell className="w-[12%] whitespace-nowrap">Trạng thái</BusinessHeadCell>
          <BusinessHeadCell className="w-[16%] whitespace-nowrap">Thời điểm ủy quyền</BusinessHeadCell>
          <BusinessHeadCell className="w-[10%] whitespace-nowrap text-right">Số page</BusinessHeadCell>
          <BusinessHeadCell className="w-[10%] whitespace-nowrap text-right">Bot bật</BusinessHeadCell>
          <BusinessHeadCell className="w-[26rem] whitespace-nowrap text-right">Thao tác</BusinessHeadCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {integrations.map((integration) => (
          <IntegrationTableRow
            key={integration.id}
            business={business}
            integration={integration}
            providerNameByCode={providerNameByCode}
            canViewPages={canViewPages}
            canUpdate={canUpdate}
            canReauthorize={canReauthorize}
            oauthPendingIntegrationId={oauthPendingIntegrationId}
            onUpdateConfig={onUpdateConfig}
            onStartOAuth={onStartOAuth}
            onSelectPages={onSelectPages}
          />
        ))}
      </TableBody>
    </BusinessDataTable>
  );
}

function IntegrationTableRow({
  business,
  integration,
  providerNameByCode,
  canViewPages,
  canUpdate,
  canReauthorize,
  oauthPendingIntegrationId,
  onUpdateConfig,
  onStartOAuth,
  onSelectPages,
}: {
  business: BusinessPartner | null;
  integration: SocialMediaIntegrationSummary;
  providerNameByCode: Map<string, string>;
  canViewPages: boolean;
  canUpdate: boolean;
  canReauthorize: boolean;
  oauthPendingIntegrationId: string | null;
  onUpdateConfig: (integration: SocialMediaIntegrationSummary) => void;
  onStartOAuth: (integration: SocialMediaIntegrationSummary) => void;
  onSelectPages: (integration: SocialMediaIntegrationSummary) => void;
}) {
  const authorized = isAuthorizedIntegration(integration);
  const canOpenPageSelection = authorized && canViewPages;
  const selectPagesTitle = !authorized
    ? "Cần ủy quyền Facebook trước khi chọn trang."
    : !canViewPages
      ? "Bạn không có quyền xem trang Facebook."
      : undefined;

  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{business?.brandName ?? "Doanh nghiệp"}</div>
      </TableCell>
      <TableCell>{providerLabel(integration, providerNameByCode)}</TableCell>
      <TableCell className="font-mono text-sm">{integration.appId || "-"}</TableCell>
      <TableCell>
        <IntegrationStatusBadge status={integration.status} />
      </TableCell>
      <TableCell>{formatDateTime(integration.authorizedAt)}</TableCell>
      <TableCell className="text-right tabular-nums">{integration.pagesCount}</TableCell>
      <TableCell className="text-right tabular-nums">{integration.activeBotPagesCount}</TableCell>
      <TableCell>
        <div className="flex justify-end gap-2">
          {isFacebookIntegration(integration) ? (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!canUpdate}
                title={!canUpdate ? "Bạn không có quyền cấu hình liên kết Facebook." : undefined}
                onClick={() => onUpdateConfig(integration)}
              >
                <PencilSimple className="size-4" aria-hidden />
                Cập nhật cấu hình
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={oauthPendingIntegrationId === integration.id}
                disabled={!canReauthorize || !!oauthPendingIntegrationId}
                title={!canReauthorize ? "Bạn không có quyền ủy quyền Facebook." : undefined}
                onClick={() => onStartOAuth(integration)}
              >
                {facebookOAuthActionLabel(integration.status)}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!canOpenPageSelection}
                title={selectPagesTitle}
                onClick={() => onSelectPages(integration)}
              >
                Chọn trang
              </Button>
            </>
          ) : (
            <Button type="button" variant="secondary" size="sm" disabled title="Phase sau sẽ triển khai thao tác cập nhật/ủy quyền lại">
              Phase sau
            </Button>
          )}
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

function buildProviderNameMap(providers: SocialMediaProvider[]): Map<string, string> {
  return new Map(providers.map((provider) => [provider.code.toLowerCase(), provider.name]));
}

function providerLabel(integration: SocialMediaIntegrationSummary, providerNameByCode: Map<string, string>): string {
  const code = integration.providerCode.trim();
  if (integration.providerName) return integration.providerName;
  if (code) return providerNameByCode.get(code.toLowerCase()) ?? code;
  return "Provider";
}

function isFacebookIntegration(integration: SocialMediaIntegrationSummary): boolean {
  return integration.providerCode.trim().toUpperCase() === "FACEBOOK" || integration.providerName.trim().toLowerCase() === "facebook";
}

function isAuthorizedIntegration(integration: SocialMediaIntegrationSummary): boolean {
  return integration.status.trim().toLowerCase() === "authorized";
}

function facebookOAuthActionLabel(status: string): string {
  return status.trim().toLowerCase() === "authorized" ? "Ủy quyền lại" : "Đăng nhập Facebook";
}

function pageInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "FB";
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("");
}

function facebookOAuthCallbackUrl(): string {
  const configured = import.meta.env.VITE_FACEBOOK_OAUTH_CALLBACK_URL?.trim();
  if (configured) return configured;
  return `${window.location.origin}/business/social-media/oauth/callback`;
}

function validateFacebookConfig(form: FacebookConfigForm): FacebookConfigErrors {
  const errors: FacebookConfigErrors = {};
  if (!form.businessPartnerId) errors.businessPartnerId = "Vui lòng chọn doanh nghiệp.";
  if (!form.appId.trim()) errors.appId = "Vui lòng nhập App ID.";
  if (!form.appSecret.trim()) errors.appSecret = "Vui lòng nhập App Secret.";
  return errors;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError) return errorMessage(error.body, fallback);
  return fallback;
}

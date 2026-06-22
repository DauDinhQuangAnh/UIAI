import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { LinkSimple, Plus, ShieldWarning } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BusinessPageShell } from "@/components/business/business-page-shell";
import { EmptyState } from "@/components/common/empty-state";
import { useBusinessPartners } from "@/api/hooks/business-partners";
import {
  useAllIntegrationDetails,
  useBusinessPartnersIntegrations,
  useDeleteSocialMediaIntegration,
} from "@/api/hooks/social-media-integrations";
import { PERMISSIONS, usePermissionSet } from "@/auth/permissions";
import type { ProviderFilter, SocialMediaIntegrationRow, SocialMediaTableRow } from "@/components/business/social-media/social-media-models";
import { apiErrorMessage, buildSocialMediaTableRows, deleteSocialMediaErrorMessage, providerCode } from "@/components/business/social-media/social-media-utils";
import { useCreateIntegrationFlow } from "@/components/business/social-media/use-create-integration-flow";
import { useManageIntegrationFlow } from "@/components/business/social-media/use-manage-integration-flow";
import { DeleteSocialMediaIntegrationDialog } from "@/components/business/social-media/social-media-delete-dialog";
import { SocialMediaIntegrationsTable } from "@/components/business/social-media/social-media-table";
import { SocialMediaCreateDialog } from "@/components/business/social-media/social-media-create-dialog";
import { SocialMediaIntegrationManageDialog } from "@/components/business/social-media/social-media-manage-dialog";
import { consumeMetaCreateOAuthResult } from "@/lib/meta-oauth-create-context";

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

  return <SocialMediaLinksContent canCreate={canCreate} canUpdate={canUpdate} />;
}

function SocialMediaLinksContent({
  canCreate,
  canUpdate,
}: {
  canCreate: boolean;
  canUpdate: boolean;
}) {
  const search = Route.useSearch();
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>("FACEBOOK");
  const [deleteTarget, setDeleteTarget] = useState<SocialMediaTableRow | null>(null);

  const businessPartners = useBusinessPartners({ isActive: true, pageNumber: 1, pageSize: BUSINESS_PAGE_SIZE });
  const businesses = businessPartners.data?.items ?? [];
  const businessIds = useMemo(() => businesses.map((b) => b.id), [businesses]);
  const integrationQueries = useBusinessPartnersIntegrations(businessIds, !businessPartners.isLoading && !businessPartners.isError);
  const deleteIntegration = useDeleteSocialMediaIntegration();

  const defaultBusinessId =
    search.businessPartnerId && businesses.some((b) => b.id === search.businessPartnerId)
      ? search.businessPartnerId
      : businesses[0]?.id ?? "";

  const integrationsLoading = integrationQueries.some((q) => q.isLoading);
  const integrationsError = integrationQueries.find((q) => q.isError)?.error;

  const createFlow = useCreateIntegrationFlow({
    businesses,
    defaultBusinessId,
  });

  useEffect(() => {
    const result = consumeMetaCreateOAuthResult();
    if (!result) return;
    createFlow.resumeFromMetaOAuth({
      businessPartnerId: result.businessPartnerId,
      pages: result.pages,
    });
  }, [createFlow]);

  const manageFlow = useManageIntegrationFlow();

  const integrationRows = useMemo<SocialMediaIntegrationRow[]>(
    () =>
      businesses.flatMap((business, index) =>
        (integrationQueries[index]?.data ?? []).map((integration) => ({ business, integration })),
      ),
    [businesses, integrationQueries],
  );

  const detailQueries = useAllIntegrationDetails(integrationRows, !integrationsLoading && !integrationsError);
  const enrichedRows = useMemo<SocialMediaIntegrationRow[]>(
    () =>
      integrationRows.map((row, index) => ({
        ...row,
        integration: detailQueries[index]?.data ?? row.integration,
      })),
    [integrationRows, detailQueries],
  );

  const filteredRows = useMemo(
    () => enrichedRows.filter((row) => providerCode(row.integration) === providerFilter),
    [enrichedRows, providerFilter],
  );
  const tableRows = useMemo(() => buildSocialMediaTableRows(filteredRows), [filteredRows]);
  const facebookCount = enrichedRows.filter((row) => providerCode(row.integration) === "FACEBOOK").length;
  const tiktokCount = enrichedRows.filter((row) => providerCode(row.integration) === "TIKTOK").length;

  const createDisabled = !defaultBusinessId || providerFilter !== "FACEBOOK";
  const createDisabledTitle = !defaultBusinessId
    ? "Chưa có doanh nghiệp để thêm liên kết."
    : providerFilter !== "FACEBOOK"
      ? "Thêm liên kết TikTok sẽ được triển khai ở phase sau."
      : undefined;

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteIntegration.mutate(
      { businessPartnerId: deleteTarget.business.id, integrationId: deleteTarget.integration.id },
      {
        onSuccess: () => { toast.success("Đã xóa liên kết mạng xã hội."); setDeleteTarget(null); },
        onError: (error) => toast.error(deleteSocialMediaErrorMessage(error)),
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
                onClick={createFlow.openCreate}
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
        ) : integrationsLoading ? (
          <SocialMediaLoadingState />
        ) : integrationsError ? (
          <EmptyState
            icon={LinkSimple}
            title="Không tải được liên kết mạng xã hội"
            description={apiErrorMessage(integrationsError, "Vui lòng thử lại sau.")}
            action={
              <Button type="button" variant="secondary" onClick={() => integrationQueries.forEach((q) => q.refetch())}>
                Tải lại
              </Button>
            }
          />
        ) : integrationRows.length === 0 ? (
          <EmptyState
            icon={LinkSimple}
            title="Chưa có liên kết mạng xã hội."
            description="Thêm liên kết Facebook bằng App ID, App Secret, danh sách page và lịch bot."
            action={
              canCreate ? (
                <Button type="button" disabled={createDisabled} title={createDisabledTitle} onClick={createFlow.openCreate}>
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
            onManage={manageFlow.setManageTarget}
            onDelete={setDeleteTarget}
          />
        )}
      </div>

      <SocialMediaCreateDialog
        open={createFlow.open}
        step={createFlow.step}
        form={createFlow.form}
        errors={createFlow.errors}
        businesses={businesses}
        availablePages={createFlow.availablePages}
        loading={createFlow.submitting}
        onOpenChange={(open) => { if (!open) createFlow.closeCreate(); }}
        onStepChange={createFlow.goToStep}
        onFormChange={createFlow.setForm}
        onSubmit={createFlow.submit}
      />

      <SocialMediaIntegrationManageDialog
        row={manageFlow.manageTarget}
        businesses={businesses}
        canUpdate={canUpdate}
        saving={manageFlow.saving}
        detailLoading={manageFlow.detailLoading}
        onOpenChange={(open) => { if (!open) manageFlow.setManageTarget(null); }}
        onSaveConfig={manageFlow.saveConfig}
      />

      <DeleteSocialMediaIntegrationDialog
        target={deleteTarget}
        loading={deleteIntegration.isPending}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
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

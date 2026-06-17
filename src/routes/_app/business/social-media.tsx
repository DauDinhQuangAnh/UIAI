import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { LinkSimple, Plus, ShieldWarning } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  useSocialMediaProviders,
} from "@/api/hooks/social-media-integrations";
import type {
  SocialMediaIntegrationSummary,
  SocialMediaProvider,
} from "@/api/social-media-types";
import { ApiRequestError, errorMessage } from "@/api/errors";
import { PERMISSIONS, usePermissionSet } from "@/auth/permissions";

const BUSINESS_PAGE_SIZE = 100;

export const Route = createFileRoute("/_app/business/social-media")({
  component: SocialMediaLinksScreen,
});

function SocialMediaLinksScreen() {
  const hasPermission = usePermissionSet();
  const canView = hasPermission(PERMISSIONS.socialMedia.facebookIntegration.view);
  const canCreate = hasPermission(PERMISSIONS.socialMedia.facebookIntegration.create);

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

  return <SocialMediaLinksContent canCreate={canCreate} />;
}

function SocialMediaLinksContent({ canCreate }: { canCreate: boolean }) {
  const [selectedBusinessId, setSelectedBusinessId] = useState("");

  const businessPartners = useBusinessPartners({
    isActive: true,
    pageNumber: 1,
    pageSize: BUSINESS_PAGE_SIZE,
  });
  const providers = useSocialMediaProviders();
  const integrations = useBusinessPartnerIntegrations(selectedBusinessId || undefined);

  const businesses = businessPartners.data?.items ?? [];
  const selectedBusiness = businesses.find((business) => business.id === selectedBusinessId) ?? null;
  const providerNameByCode = useMemo(() => buildProviderNameMap(providers.data ?? []), [providers.data]);

  useEffect(() => {
    if (businessPartners.isLoading || businessPartners.isError) return;
    if (businesses.length === 0) {
      setSelectedBusinessId("");
      return;
    }
    if (!selectedBusinessId || !businesses.some((business) => business.id === selectedBusinessId)) {
      setSelectedBusinessId(businesses[0].id);
    }
  }, [businessPartners.isError, businessPartners.isLoading, businesses, selectedBusinessId]);

  const showPhaseTwoToast = () => {
    toast.info("Phase 2 sẽ triển khai cấu hình Facebook App ID/App Secret.");
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
            <Button type="button" size="sm" onClick={showPhaseTwoToast}>
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
              onValueChange={setSelectedBusinessId}
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
                <Button type="button" onClick={showPhaseTwoToast}>
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
          />
        )}
      </div>
    </BusinessPageShell>
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
}: {
  business: BusinessPartner | null;
  integrations: SocialMediaIntegrationSummary[];
  providerNameByCode: Map<string, string>;
}) {
  return (
    <BusinessDataTable className="min-w-[1180px]">
      <TableHeader>
        <TableRow>
          <BusinessHeadCell className="w-[18%] whitespace-nowrap">Doanh nghiệp</BusinessHeadCell>
          <BusinessHeadCell className="w-[15%] whitespace-nowrap">Nhà cung cấp</BusinessHeadCell>
          <BusinessHeadCell className="w-[15%] whitespace-nowrap">App ID</BusinessHeadCell>
          <BusinessHeadCell className="w-[12%] whitespace-nowrap">Trạng thái</BusinessHeadCell>
          <BusinessHeadCell className="w-[16%] whitespace-nowrap">Thời điểm ủy quyền</BusinessHeadCell>
          <BusinessHeadCell className="w-[10%] whitespace-nowrap text-right">Số page</BusinessHeadCell>
          <BusinessHeadCell className="w-[10%] whitespace-nowrap text-right">Bot bật</BusinessHeadCell>
          <BusinessHeadCell className="w-28 whitespace-nowrap text-right">Thao tác</BusinessHeadCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {integrations.map((integration) => (
          <TableRow key={integration.id}>
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
            <TableCell className="text-right">
              <Button type="button" variant="secondary" size="sm" disabled title="Phase sau sẽ triển khai thao tác cập nhật/ủy quyền lại">
                Phase sau
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </BusinessDataTable>
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

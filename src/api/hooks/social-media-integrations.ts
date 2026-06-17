import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client";
import { unwrap } from "../errors";
import type {
  SocialMediaIntegrationDetail,
  SocialMediaIntegrationSummary,
  SocialMediaProvider,
} from "../social-media-types";

export const socialMediaKeys = {
  all: ["social-media"] as const,
  providers: () => [...socialMediaKeys.all, "providers"] as const,
  integrations: (businessPartnerId: string | undefined) =>
    [...socialMediaKeys.all, "integrations", businessPartnerId ?? "missing"] as const,
  integrationDetail: (businessPartnerId: string | undefined, integrationId: string | undefined) =>
    [...socialMediaKeys.integrations(businessPartnerId), "detail", integrationId ?? "missing"] as const,
};

export function useSocialMediaProviders() {
  return useQuery({
    queryKey: socialMediaKeys.providers(),
    queryFn: async (): Promise<SocialMediaProvider[]> =>
      (unwrap(await apiClient.GET("/api/social-media/providers")) ?? []).map(normalizeProvider),
  });
}

export function useBusinessPartnerIntegrations(businessPartnerId: string | undefined) {
  return useQuery({
    queryKey: socialMediaKeys.integrations(businessPartnerId),
    enabled: !!businessPartnerId,
    queryFn: async (): Promise<SocialMediaIntegrationSummary[]> =>
      (
        unwrap(
          await apiClient.GET("/api/business-partners/{businessPartnerId}/social-media/integrations", {
            params: { path: { businessPartnerId: businessPartnerId! } },
          }),
        ) ?? []
      ).map(normalizeIntegration),
  });
}

export function useBusinessPartnerIntegrationDetail(
  businessPartnerId: string | undefined,
  integrationId: string | undefined,
) {
  return useQuery({
    queryKey: socialMediaKeys.integrationDetail(businessPartnerId, integrationId),
    enabled: !!businessPartnerId && !!integrationId,
    queryFn: async (): Promise<SocialMediaIntegrationDetail> =>
      normalizeIntegrationDetail(
        unwrap(
          await apiClient.GET("/api/business-partners/{businessPartnerId}/social-media/integrations/{integrationId}", {
            params: { path: { businessPartnerId: businessPartnerId!, integrationId: integrationId! } },
          }),
        ),
      ),
  });
}

function normalizeProvider(provider: SocialMediaProvider): SocialMediaProvider {
  return {
    id: provider.id ?? provider.code ?? "",
    code: provider.code ?? "",
    name: provider.name ?? provider.code ?? "Provider",
    isActive: provider.isActive ?? true,
  };
}

function normalizeIntegration(integration: SocialMediaIntegrationSummary): SocialMediaIntegrationSummary {
  return {
    id: integration.id ?? "",
    providerName: integration.providerName ?? integration.providerCode ?? "Provider",
    providerCode: integration.providerCode ?? "",
    appId: integration.appId ?? "",
    status: integration.status ?? "",
    authorizedAt: integration.authorizedAt ?? null,
    pagesCount: integration.pagesCount ?? 0,
    activeBotPagesCount: integration.activeBotPagesCount ?? 0,
  };
}

function normalizeIntegrationDetail(integration: SocialMediaIntegrationDetail): SocialMediaIntegrationDetail {
  return {
    ...normalizeIntegration(integration),
    createdAt: integration.createdAt ?? null,
    updatedAt: integration.updatedAt ?? null,
  };
}

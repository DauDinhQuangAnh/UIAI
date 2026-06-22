import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { ApiRequestError, unwrap } from "../errors";
import type {
  CreateSocialMediaIntegrationRequest,
  CreateSocialMediaIntegrationResponse,
  MetaLoginUrlResponse,
  MetaOAuthCallbackRequest,
  MetaOAuthCallbackResponse,
  MetaOAuthPage,
  SocialMediaIntegrationDetail,
  SocialMediaIntegrationSummary,
  SocialMediaLinkedPage,
  SocialMediaPageSchedule,
  SocialMediaProvider,
  UpdateSocialMediaPageRequest,
  UpdateSocialMediaPageResponse,
} from "../social-media-types";

export const socialMediaKeys = {
  all: ["social-media"] as const,
  providers: () => [...socialMediaKeys.all, "providers"] as const,
  integrations: (businessPartnerId: string | undefined) =>
    [...socialMediaKeys.all, "integrations", businessPartnerId ?? "missing"] as const,
  integrationDetail: (businessPartnerId: string | undefined, integrationId: string | undefined) =>
    [...socialMediaKeys.integrations(businessPartnerId), "detail", integrationId ?? "missing"] as const,
};

export function useIntegrationDetail(
  businessPartnerId: string | undefined,
  integrationId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: socialMediaKeys.integrationDetail(businessPartnerId, integrationId),
    enabled: enabled && !!businessPartnerId && !!integrationId,
    queryFn: async (): Promise<SocialMediaIntegrationSummary> =>
      normalizeIntegration(
        unwrap(
          await apiClient.GET("/api/business-partners/{businessPartnerId}/social-media/integrations/{integrationId}", {
            params: { path: { businessPartnerId: businessPartnerId!, integrationId: integrationId! } },
          }),
        ),
      ),
  });
}

export function useBusinessPartnersIntegrations(businessPartnerIds: string[], enabled = true) {
  return useQueries({
    queries: businessPartnerIds.map((businessPartnerId) => ({
      queryKey: socialMediaKeys.integrations(businessPartnerId),
      enabled: enabled && !!businessPartnerId,
      queryFn: () => fetchBusinessPartnerIntegrations(businessPartnerId),
    })),
  });
}

export function useAllIntegrationDetails(
  rows: Array<{ business: { id: string }; integration: { id: string } }>,
  enabled = true,
) {
  return useQueries({
    queries: rows.map((row) => ({
      queryKey: socialMediaKeys.integrationDetail(row.business.id, row.integration.id),
      enabled: enabled && !!row.business.id && !!row.integration.id,
      queryFn: async (): Promise<SocialMediaIntegrationSummary> =>
        normalizeIntegration(
          unwrap(
            await apiClient.GET(
              "/api/business-partners/{businessPartnerId}/social-media/integrations/{integrationId}",
              { params: { path: { businessPartnerId: row.business.id, integrationId: row.integration.id } } },
            ),
          ),
        ),
    })),
  });
}

export function useSocialMediaProviders() {
  return useQuery({
    queryKey: socialMediaKeys.providers(),
    queryFn: async (): Promise<SocialMediaProvider[]> =>
      (unwrap(await apiClient.GET("/api/social-media/providers")) ?? []).map(normalizeProvider),
  });
}

export async function fetchBusinessPartnerIntegrations(businessPartnerId: string): Promise<SocialMediaIntegrationSummary[]> {
  return (
    unwrap(
      await apiClient.GET("/api/business-partners/{businessPartnerId}/social-media/integrations", {
        params: { path: { businessPartnerId } },
      }),
    ) ?? []
  ).map(normalizeIntegration);
}

export function useCreateSocialMediaIntegration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      businessPartnerId,
      body,
    }: {
      businessPartnerId: string;
      body: CreateSocialMediaIntegrationRequest;
    }): Promise<CreateSocialMediaIntegrationResponse> =>
      normalizeCreateSocialMediaIntegrationResponse(
        unwrap(
          await apiClient.POST("/api/business-partners/{businessPartnerId}/social-media/integrations", {
            params: { path: { businessPartnerId } },
            body,
          }),
        ),
      ),
    onSuccess: (result, variables) => {
      invalidateIntegrationQueries(queryClient, variables.businessPartnerId, result.integrationId);
    },
  });
}

export function useCreateMetaLoginUrl() {
  return useMutation({
    mutationFn: async ({
      appId,
      redirectUrl,
      forceRerequest = false,
    }: {
      appId: string;
      redirectUrl: string;
      forceRerequest?: boolean;
    }): Promise<MetaLoginUrlResponse> =>
      normalizeMetaLoginUrlResponse(
        unwrap(
          await apiClient.GET("/api/integrations/meta/login-url", {
            params: { query: { appId, redirectUrl, forceRerequest } },
          }),
        ),
      ),
  });
}

export async function completeMetaOAuthCallback(body: MetaOAuthCallbackRequest): Promise<MetaOAuthCallbackResponse> {
  return normalizeMetaOAuthCallbackResponse(
    unwrap(
      await apiClient.POST("/api/integrations/meta/oauth/callback", {
        body,
      }),
    ),
  );
}

export function useUpdateSocialMediaPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      businessPartnerId,
      pageId,
      body,
    }: {
      businessPartnerId: string;
      pageId: string;
      body: UpdateSocialMediaPageRequest;
    }): Promise<UpdateSocialMediaPageResponse> =>
      normalizeUpdateSocialMediaPageResponse(
        unwrap(
          await apiClient.PUT("/api/business-partners/{businessPartnerId}/social-media/pages/{pageId}", {
            params: { path: { businessPartnerId, pageId } },
            body,
          }),
        ),
      ),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: socialMediaKeys.integrations(variables.businessPartnerId) });
      queryClient.invalidateQueries({ queryKey: socialMediaKeys.all });
    },
  });
}

export function useDeleteSocialMediaIntegration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ businessPartnerId, integrationId }: { businessPartnerId: string; integrationId: string }): Promise<void> => {
      const { error, response } = await apiClient.DELETE(
        "/api/business-partners/{businessPartnerId}/social-media/integrations/{integrationId}",
        { params: { path: { businessPartnerId, integrationId } } },
      );
      if (error || !response.ok) throw new ApiRequestError(response.status, error);
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: socialMediaKeys.integrations(variables.businessPartnerId) });
      queryClient.invalidateQueries({ queryKey: socialMediaKeys.all });
    },
  });
}

export function useDeleteSocialMediaPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ businessPartnerId, pageId }: { businessPartnerId: string; pageId: string }): Promise<void> => {
      const { error, response } = await apiClient.DELETE(
        "/api/business-partners/{businessPartnerId}/social-media/pages/{pageId}",
        { params: { path: { businessPartnerId, pageId } } },
      );
      if (error || !response.ok) throw new ApiRequestError(response.status, error);
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: socialMediaKeys.integrations(variables.businessPartnerId) });
      queryClient.invalidateQueries({ queryKey: socialMediaKeys.all });
    },
  });
}

function normalizeProvider(provider: SocialMediaProvider): SocialMediaProvider {
  return {
    id: provider.id ?? "",
    code: provider.code ?? "",
    name: provider.name ?? provider.code ?? "Provider",
    description: provider.description ?? null,
    isActive: provider.isActive ?? false,
  };
}

function normalizeIntegration(integration: SocialMediaIntegrationSummary | SocialMediaIntegrationDetail): SocialMediaIntegrationSummary {
  const provider = (integration as SocialMediaIntegrationDetail).provider;
  return {
    id: integration.id ?? "",
    providerName: integration.providerName ?? provider?.name ?? integration.providerCode ?? provider?.code ?? "Provider",
    providerCode: integration.providerCode ?? provider?.code ?? "",
    appId: integration.appId ?? "",
    status: integration.status ?? "",
    authorizedAt: integration.authorizedAt ?? null,
    businessPartnerId: integration.businessPartnerId ?? null,
    lastSyncedAt: integration.lastSyncedAt ?? null,
    externalUserId: integration.externalUserId ?? null,
    externalUserName: integration.externalUserName ?? null,
    pagesCount: integration.pagesCount ?? 0,
    activeBotPagesCount: integration.activeBotPagesCount ?? 0,
    pages: normalizeLinkedPages(integration.pages),
    selectedPages: normalizeLinkedPages(integration.selectedPages),
  };
}

function normalizeCreateSocialMediaIntegrationResponse(
  response: CreateSocialMediaIntegrationResponse,
): CreateSocialMediaIntegrationResponse {
  return {
    businessPartnerId: response.businessPartnerId ?? "",
    integrationId: response.integrationId ?? "",
    providerCode: response.providerCode ?? "FACEBOOK",
    appId: response.appId ?? "",
    status: response.status ?? "",
    pages: (response.pages ?? []).map((page) => ({
      id: page.id ?? "",
      externalPageId: page.externalPageId ?? "",
      pageName: page.pageName ?? "",
      isBotEnabled: page.isBotEnabled ?? false,
      isActive: page.isActive ?? false,
      schedulesCount: page.schedulesCount ?? 0,
    })),
    message: response.message ?? null,
  };
}

function normalizeMetaLoginUrlResponse(response: MetaLoginUrlResponse): MetaLoginUrlResponse {
  return {
    loginUrl: response.loginUrl ?? "",
    state: response.state ?? "",
    expiresAt: response.expiresAt ?? null,
  };
}

function normalizeMetaOAuthCallbackResponse(response: MetaOAuthCallbackResponse): MetaOAuthCallbackResponse {
  return {
    success: response.success ?? false,
    message: response.message ?? null,
    pages: (response.pages ?? []).map(normalizeMetaOAuthPage),
  };
}

function normalizeMetaOAuthPage(page: MetaOAuthPage): MetaOAuthPage {
  return {
    pageId: page.pageId ?? "",
    pageName: page.pageName ?? page.pageId ?? "Facebook Page",
    avatarUrl: page.avatarUrl ?? null,
    hasAccessToken: page.hasAccessToken ?? false,
  };
}

function normalizeLinkedPages(pages: SocialMediaLinkedPage[] | undefined): SocialMediaLinkedPage[] | undefined {
  if (!Array.isArray(pages)) return undefined;
  return pages.map((page) => ({
    id: page.id,
    externalPageId: page.externalPageId ?? "",
    pageName: page.pageName ?? "",
    username: page.username ?? null,
    pageAvatarUrl: page.pageAvatarUrl ?? null,
    isBotEnabled: page.isBotEnabled ?? false,
    isActive: page.isActive ?? (page.status ? page.status.toLowerCase() === "active" : undefined),
    status: page.status ?? null,
    schedules: normalizeSchedules(page.schedules),
  }));
}

function normalizeSchedules(schedules: SocialMediaPageSchedule[] | null | undefined): SocialMediaPageSchedule[] | null {
  if (!Array.isArray(schedules)) return null;
  return schedules.map((schedule) => ({
    id: schedule.id,
    dayOfWeek: schedule.dayOfWeek ?? "",
    startTime: schedule.startTime ?? "",
    endTime: schedule.endTime ?? "",
    timeZoneId: schedule.timeZoneId ?? null,
    isActive: schedule.isActive ?? true,
  }));
}

function normalizeUpdateSocialMediaPageResponse(response: UpdateSocialMediaPageResponse): UpdateSocialMediaPageResponse {
  return {
    pageId: response.pageId ?? "",
    status: response.status ?? "",
    schedules: normalizeSchedules(response.schedules) ?? [],
  };
}

function invalidateIntegrationQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  businessPartnerId: string,
  integrationId: string,
) {
  queryClient.invalidateQueries({ queryKey: socialMediaKeys.integrations(businessPartnerId) });
  if (integrationId) {
    queryClient.invalidateQueries({
      queryKey: socialMediaKeys.integrationDetail(businessPartnerId, integrationId),
    });
  }
}

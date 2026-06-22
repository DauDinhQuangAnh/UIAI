import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { ApiRequestError, unwrap } from "../errors";
import type {
  FacebookAppConfigRequest,
  FacebookAppConfigResponse,
  FacebookManagedPage,
  FacebookOAuthCallbackResponse,
  FacebookOAuthStartRequest,
  FacebookOAuthStartResponse,
  FacebookPagesResponse,
  SaveFacebookPagesRequest,
  SaveFacebookPagesResponse,
  SocialMediaIntegrationSummary,
  SocialMediaLinkedPage,
  SocialMediaPageSchedule,
  UpdateSocialMediaPageRequest,
  UpdateSocialMediaPageResponse,
} from "../social-media-types";

export const socialMediaKeys = {
  all: ["social-media"] as const,
  integrations: (businessPartnerId: string | undefined) =>
    [...socialMediaKeys.all, "integrations", businessPartnerId ?? "missing"] as const,
  integrationDetail: (businessPartnerId: string | undefined, integrationId: string | undefined) =>
    [...socialMediaKeys.integrations(businessPartnerId), "detail", integrationId ?? "missing"] as const,
  facebookPages: (businessPartnerId: string | undefined) =>
    [...socialMediaKeys.all, "facebook-pages", businessPartnerId ?? "missing"] as const,
};

export function useBusinessPartnersIntegrations(businessPartnerIds: string[], enabled = true) {
  return useQueries({
    queries: businessPartnerIds.map((businessPartnerId) => ({
      queryKey: socialMediaKeys.integrations(businessPartnerId),
      enabled: enabled && !!businessPartnerId,
      queryFn: () => fetchBusinessPartnerIntegrations(businessPartnerId),
    })),
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

export function useCreateFacebookAppConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      businessPartnerId,
      body,
    }: {
      businessPartnerId: string;
      body: FacebookAppConfigRequest;
    }): Promise<FacebookAppConfigResponse> =>
      normalizeFacebookAppConfigResponse(
        unwrap(
          await apiClient.POST("/api/business-partners/{businessPartnerId}/social-media/facebook/app-config", {
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

export function useUpdateFacebookAppConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      businessPartnerId,
      body,
    }: {
      businessPartnerId: string;
      body: FacebookAppConfigRequest;
    }): Promise<FacebookAppConfigResponse> =>
      normalizeFacebookAppConfigResponse(
        unwrap(
          await apiClient.PUT("/api/business-partners/{businessPartnerId}/social-media/facebook/app-config", {
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

export function useStartFacebookOAuth() {
  return useMutation({
    mutationFn: async ({
      businessPartnerId,
      body,
    }: {
      businessPartnerId: string;
      body: FacebookOAuthStartRequest;
    }): Promise<FacebookOAuthStartResponse> =>
      normalizeFacebookOAuthStartResponse(
        unwrap(
          await apiClient.POST("/api/business-partners/{businessPartnerId}/social-media/facebook/oauth/start", {
            params: { path: { businessPartnerId } },
            body,
          }),
        ),
      ),
  });
}

export function useFacebookPages(businessPartnerId: string | undefined, enabled = false) {
  return useQuery({
    queryKey: socialMediaKeys.facebookPages(businessPartnerId),
    enabled: enabled && !!businessPartnerId,
    gcTime: 0,
    queryFn: async (): Promise<FacebookPagesResponse> =>
      normalizeFacebookPagesResponse(
        unwrap(
          await apiClient.GET("/api/business-partners/{businessPartnerId}/social-media/facebook/pages", {
            params: { path: { businessPartnerId: businessPartnerId! } },
          }),
        ),
      ),
  });
}

export function useSaveFacebookPages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      businessPartnerId,
      body,
    }: {
      businessPartnerId: string;
      body: SaveFacebookPagesRequest;
    }): Promise<SaveFacebookPagesResponse> =>
      normalizeSaveFacebookPagesResponse(
        unwrap(
          await apiClient.POST("/api/business-partners/{businessPartnerId}/social-media/facebook/pages", {
            params: { path: { businessPartnerId } },
            body,
          }),
        ),
      ),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: socialMediaKeys.integrations(variables.businessPartnerId) });
      queryClient.removeQueries({ queryKey: socialMediaKeys.facebookPages(variables.businessPartnerId) });
    },
  });
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

export async function completeFacebookOAuthCallback({
  code,
  state,
}: {
  code: string;
  state: string;
}): Promise<FacebookOAuthCallbackResponse> {
  return normalizeFacebookOAuthCallbackResponse(
    unwrap(
      await apiClient.GET("/api/social-media/facebook/oauth/callback", {
        params: { query: { code, state } },
      }),
    ),
  );
}

function normalizeIntegration(integration: SocialMediaIntegrationSummary): SocialMediaIntegrationSummary {
  const provider = (integration as SocialMediaIntegrationSummary & { provider?: { name?: string; code?: string } | null }).provider;
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

function normalizeFacebookAppConfigResponse(response: FacebookAppConfigResponse): FacebookAppConfigResponse {
  return {
    integrationId: response.integrationId ?? "",
    businessPartnerId: response.businessPartnerId ?? "",
    providerCode: response.providerCode ?? "FACEBOOK",
    appId: response.appId ?? "",
    status: response.status ?? "Configured",
  };
}

function normalizeFacebookOAuthStartResponse(response: FacebookOAuthStartResponse): FacebookOAuthStartResponse {
  return {
    authorizationUrl: response.authorizationUrl ?? "",
    state: response.state ?? "",
  };
}

function normalizeFacebookOAuthCallbackResponse(response: FacebookOAuthCallbackResponse): FacebookOAuthCallbackResponse {
  return {
    success: response.success ?? false,
    businessPartnerId: response.businessPartnerId ?? null,
    integrationId: response.integrationId ?? null,
    status: response.status ?? null,
    message: response.message ?? null,
  };
}

function normalizeFacebookPagesResponse(response: FacebookPagesResponse): FacebookPagesResponse {
  return {
    integrationId: response.integrationId ?? "",
    pages: (response.pages ?? []).map(normalizeFacebookManagedPage),
  };
}

function normalizeFacebookManagedPage(page: FacebookManagedPage): FacebookManagedPage {
  const avatarUrl = page.avatarUrl ?? page.pageAvatarUrl ?? null;
  return {
    externalPageId: page.externalPageId ?? "",
    pageName: page.pageName ?? "",
    username: page.username ?? null,
    avatarUrl,
    pageAvatarUrl: page.pageAvatarUrl ?? avatarUrl,
    pageAccessToken: page.pageAccessToken ?? "",
    isSelected: page.isSelected ?? false,
    isBotEnabled: page.isBotEnabled ?? false,
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

function normalizeSaveFacebookPagesResponse(response: SaveFacebookPagesResponse): SaveFacebookPagesResponse {
  return {
    message: response.message ?? "Facebook pages saved.",
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

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { ApiRequestError, unwrap } from "../errors";
import type { components } from "../schema";
import type {
  BusinessPartner,
  BusinessPartnerCreate,
  BusinessPartnerList,
  BusinessPartnerUpdate,
} from "@/components/business/information/business-information-data";

type ApiBusinessPartner = components["schemas"]["BusinessPartner"];
type ApiBusinessPartnerList = components["schemas"]["BusinessPartnerList"];

export interface BusinessPartnerListParams {
  keyword?: string;
  isActive?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export const businessPartnerKeys = {
  all: ["business-partners"] as const,
  list: (params: BusinessPartnerListParams) => [...businessPartnerKeys.all, "list", params] as const,
  detail: (id: string) => [...businessPartnerKeys.all, "detail", id] as const,
};

export function useBusinessPartners(params: BusinessPartnerListParams) {
  return useQuery({
    queryKey: businessPartnerKeys.list(params),
    queryFn: () => fetchBusinessPartners(params),
  });
}

export async function fetchBusinessPartners(params: BusinessPartnerListParams): Promise<BusinessPartnerList> {
  return normalizeList(
    unwrap(
      await apiClient.GET("/api/business-partners", {
        params: {
          query: {
            keyword: params.keyword || undefined,
            isActive: params.isActive,
            pageNumber: params.pageNumber ?? 1,
            pageSize: params.pageSize ?? 20,
          },
        },
      }),
    ),
  );
}

export function useBusinessPartner(id: string | undefined) {
  return useQuery({
    queryKey: id ? businessPartnerKeys.detail(id) : [...businessPartnerKeys.all, "detail", "missing"],
    enabled: !!id,
    queryFn: async (): Promise<BusinessPartner> =>
      normalizePartner(
        unwrap(await apiClient.GET("/api/business-partners/{businessPartnerId}", { params: { path: { businessPartnerId: id! } } })),
      ),
  });
}

export function useCreateBusinessPartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: BusinessPartnerCreate): Promise<BusinessPartner> =>
      normalizePartner(unwrap(await apiClient.POST("/api/business-partners", { body }))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessPartnerKeys.all });
    },
  });
}

export function useUpdateBusinessPartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: BusinessPartnerUpdate }): Promise<BusinessPartner> =>
      normalizePartner(
        unwrap(await apiClient.PUT("/api/business-partners/{businessPartnerId}", { params: { path: { businessPartnerId: id } }, body })),
      ),
    onSuccess: (partner) => {
      queryClient.invalidateQueries({ queryKey: businessPartnerKeys.all });
      queryClient.setQueryData(businessPartnerKeys.detail(partner.id), partner);
    },
  });
}

export function useDeleteBusinessPartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error, response } = await apiClient.DELETE("/api/business-partners/{businessPartnerId}", {
        params: { path: { businessPartnerId: id } },
      });
      if (error || !response.ok) throw new ApiRequestError(response.status, error);
    },
    onSuccess: (_data, id) => {
      queryClient.setQueriesData<BusinessPartnerList>({ queryKey: businessPartnerKeys.all }, (current) => {
        if (!current?.items) return current;
        const nextItems = current.items.filter((partner) => partner.id !== id);
        return {
          ...current,
          items: nextItems,
          totalCount: Math.max(0, (current.totalCount ?? current.items.length) - (current.items.length - nextItems.length)),
        };
      });
      queryClient.invalidateQueries({ queryKey: businessPartnerKeys.all });
    },
  });
}

function normalizeList(list: ApiBusinessPartnerList): BusinessPartnerList {
  const items = (list.items ?? [])
    .filter((item): item is ApiBusinessPartner & { id: string } => !!item.id)
    .map(normalizePartner);

  return {
    items,
    pageNumber: list.pageNumber,
    pageSize: list.pageSize,
    totalCount: list.totalCount,
  };
}

function normalizePartner(partner: ApiBusinessPartner & { id?: string }): BusinessPartner {
  return {
    id: partner.id ?? "",
    brandName: partner.brandName ?? "",
    logoUrl: partner.logoUrl ?? null,
    email: partner.email ?? "",
    phone: partner.phone ?? "",
    representativeName: partner.representativeName ?? "",
    representativeEmail: partner.representativeEmail ?? "",
    isActive: partner.isActive ?? false,
    createdAt: partner.createdAt,
    updatedAt: partner.updatedAt,
    accountCreated: partner.accountCreated,
    representativeEmailSent: partner.representativeEmailSent,
    businessOwnerEmailSent: partner.businessOwnerEmailSent,
    usersCount: partner.usersCount,
    integrationsCount: partner.integrationsCount,
  };
}

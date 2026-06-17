import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { ApiRequestError, unwrap } from "../errors";
import type { Feature, FeatureCreate, FeatureUpdate } from "../permission-types";
import { normalizeFeature } from "./permission-normalizers";

export interface FeatureListParams {
  keyword?: string;
  isActive?: boolean;
}

export const featureKeys = {
  all: ["permission-features"] as const,
  list: (params: FeatureListParams) => [...featureKeys.all, "list", params] as const,
  detail: (id: string, includePages?: boolean) => [...featureKeys.all, "detail", id, includePages] as const,
};

export function usePermissionFeatures(params: FeatureListParams = {}) {
  return useQuery({
    queryKey: featureKeys.list(params),
    queryFn: async (): Promise<Feature[]> =>
      (unwrap(
        await apiClient.GET("/api/features", {
          params: { query: { keyword: params.keyword || undefined, isActive: params.isActive } },
        }),
      ) ?? []).map(normalizeFeature),
  });
}

export function usePermissionFeature(id: string | undefined, includePages = false) {
  return useQuery({
    queryKey: id ? featureKeys.detail(id, includePages) : [...featureKeys.all, "detail", "missing"],
    enabled: !!id,
    queryFn: async (): Promise<Feature> =>
      normalizeFeature(
        unwrap(
          await apiClient.GET("/api/features/{featureId}", {
            params: { path: { featureId: id! }, query: { includePages } },
          }),
        ),
      ),
  });
}

export function useCreatePermissionFeature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: FeatureCreate): Promise<Feature> => normalizeFeature(unwrap(await apiClient.POST("/api/features", { body }))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: featureKeys.all }),
  });
}

export function useUpdatePermissionFeature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: FeatureUpdate }): Promise<Feature> =>
      normalizeFeature(unwrap(await apiClient.PUT("/api/features/{featureId}", { params: { path: { featureId: id } }, body }))),
    onSuccess: (feature) => {
      queryClient.invalidateQueries({ queryKey: featureKeys.all });
      queryClient.setQueryData(featureKeys.detail(feature.id), feature);
    },
  });
}

export function useDeletePermissionFeature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error, response } = await apiClient.DELETE("/api/features/{featureId}", { params: { path: { featureId: id } } });
      if (error || !response.ok) throw new ApiRequestError(response.status, error);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: featureKeys.all }),
  });
}

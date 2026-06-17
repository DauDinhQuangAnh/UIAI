import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { ApiRequestError, unwrap } from "../errors";
import type { Page, PageCreate, PageUpdate } from "../permission-types";
import { normalizePage } from "./permission-normalizers";

export interface PageListParams {
  featureId?: string;
  keyword?: string;
  isActive?: boolean;
  isMenuVisible?: boolean;
}

export const pageKeys = {
  all: ["permission-pages"] as const,
  list: (params: PageListParams) => [...pageKeys.all, "list", params] as const,
  detail: (id: string, includeActions?: boolean) => [...pageKeys.all, "detail", id, includeActions] as const,
};

export function usePermissionPages(params: PageListParams = {}) {
  return useQuery({
    queryKey: pageKeys.list(params),
    queryFn: async (): Promise<Page[]> =>
      (unwrap(
        await apiClient.GET("/api/pages", {
          params: {
            query: {
              featureId: params.featureId || undefined,
              keyword: params.keyword || undefined,
              isActive: params.isActive,
              isMenuVisible: params.isMenuVisible,
            },
          },
        }),
      ) ?? []).map(normalizePage),
  });
}

export function usePermissionPage(id: string | undefined, includeActions = false) {
  return useQuery({
    queryKey: id ? pageKeys.detail(id, includeActions) : [...pageKeys.all, "detail", "missing"],
    enabled: !!id,
    queryFn: async (): Promise<Page> =>
      normalizePage(
        unwrap(
          await apiClient.GET("/api/pages/{pageId}", {
            params: { path: { pageId: id! }, query: { includeActions } },
          }),
        ),
      ),
  });
}

export function useCreatePermissionPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: PageCreate): Promise<Page> => normalizePage(unwrap(await apiClient.POST("/api/pages", { body }))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: pageKeys.all }),
  });
}

export function useUpdatePermissionPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: PageUpdate }): Promise<Page> =>
      normalizePage(unwrap(await apiClient.PUT("/api/pages/{pageId}", { params: { path: { pageId: id } }, body }))),
    onSuccess: (page) => {
      queryClient.invalidateQueries({ queryKey: pageKeys.all });
      queryClient.setQueryData(pageKeys.detail(page.id), page);
    },
  });
}

export function useDeletePermissionPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error, response } = await apiClient.DELETE("/api/pages/{pageId}", { params: { path: { pageId: id } } });
      if (error || !response.ok) throw new ApiRequestError(response.status, error);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: pageKeys.all }),
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { ApiRequestError, unwrap } from "../errors";
import type { PageAction, PageActionCreate, PageActionUpdate } from "../permission-types";
import { normalizePageAction } from "./permission-normalizers";

export interface PageActionListParams {
  featureId?: string;
  pageId?: string;
  permissionActionId?: string;
  keyword?: string;
  isActive?: boolean;
}

export const pageActionKeys = {
  all: ["page-actions"] as const,
  list: (params: PageActionListParams) => [...pageActionKeys.all, "list", params] as const,
};

export function usePageActions(params: PageActionListParams = {}) {
  return useQuery({
    queryKey: pageActionKeys.list(params),
    queryFn: async (): Promise<PageAction[]> =>
      (unwrap(
        await apiClient.GET("/api/page-actions", {
          params: {
            query: {
              featureId: params.featureId || undefined,
              pageId: params.pageId || undefined,
              permissionActionId: params.permissionActionId || undefined,
              keyword: params.keyword || undefined,
              isActive: params.isActive,
            },
          },
        }),
      ) ?? []).map(normalizePageAction),
  });
}

export function useCreatePageAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: PageActionCreate): Promise<PageAction> => normalizePageAction(unwrap(await apiClient.POST("/api/page-actions", { body }))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: pageActionKeys.all }),
  });
}

export function useUpdatePageAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: PageActionUpdate }): Promise<PageAction> =>
      normalizePageAction(unwrap(await apiClient.PUT("/api/page-actions/{pageActionId}", { params: { path: { pageActionId: id } }, body }))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: pageActionKeys.all }),
  });
}

export function useDeletePageAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error, response } = await apiClient.DELETE("/api/page-actions/{pageActionId}", { params: { path: { pageActionId: id } } });
      if (error || !response.ok) throw new ApiRequestError(response.status, error);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: pageActionKeys.all }),
  });
}

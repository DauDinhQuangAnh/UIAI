import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { ApiRequestError, unwrap } from "../errors";
import type { PermissionAction, PermissionActionCreate, PermissionActionUpdate } from "../permission-types";
import { normalizePermissionAction } from "./permission-normalizers";

export interface PermissionActionListParams {
  keyword?: string;
  isActive?: boolean;
}

export const permissionActionKeys = {
  all: ["permission-actions"] as const,
  list: (params: PermissionActionListParams) => [...permissionActionKeys.all, "list", params] as const,
};

export function usePermissionActions(params: PermissionActionListParams = {}) {
  return useQuery({
    queryKey: permissionActionKeys.list(params),
    queryFn: async (): Promise<PermissionAction[]> =>
      (unwrap(
        await apiClient.GET("/api/permission-actions", {
          params: { query: { keyword: params.keyword || undefined, isActive: params.isActive } },
        }),
      ) ?? []).map(normalizePermissionAction),
  });
}

export function useCreatePermissionAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: PermissionActionCreate): Promise<PermissionAction> =>
      normalizePermissionAction(unwrap(await apiClient.POST("/api/permission-actions", { body }))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: permissionActionKeys.all }),
  });
}

export function useUpdatePermissionAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: PermissionActionUpdate }): Promise<PermissionAction> =>
      normalizePermissionAction(
        unwrap(await apiClient.PUT("/api/permission-actions/{permissionActionId}", { params: { path: { permissionActionId: id } }, body })),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: permissionActionKeys.all }),
  });
}

export function useDeletePermissionAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error, response } = await apiClient.DELETE("/api/permission-actions/{permissionActionId}", {
        params: { path: { permissionActionId: id } },
      });
      if (error || !response.ok) throw new ApiRequestError(response.status, error);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: permissionActionKeys.all }),
  });
}

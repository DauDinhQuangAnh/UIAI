import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { ApiRequestError, unwrap } from "../errors";
import type {
  PermissionList,
  PermissionUpdateResult,
  ReplaceRolePermissionsRequest,
  Role,
  RoleCreate,
  RolePermissionMatrix,
  RoleUpdate,
  UnknownRecord,
} from "../permission-types";
import { normalizeRole, normalizeRoleList, normalizeRolePermissionMatrix } from "./permission-normalizers";

export interface RoleListParams {
  keyword?: string;
  isActive?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export const roleKeys = {
  all: ["roles"] as const,
  list: (params: RoleListParams) => [...roleKeys.all, "list", params] as const,
  detail: (id: string) => [...roleKeys.all, "detail", id] as const,
  matrix: (id: string) => [...roleKeys.all, "matrix", id] as const,
};

export function useRoles(params: RoleListParams) {
  return useQuery({
    queryKey: roleKeys.list(params),
    queryFn: () => fetchRoles(params),
  });
}

export async function fetchRoles(params: RoleListParams): Promise<PermissionList<Role>> {
  return normalizeRoleList(
    unwrap(
      await apiClient.GET("/api/roles", {
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

export function useRole(id: string | undefined) {
  return useQuery({
    queryKey: id ? roleKeys.detail(id) : [...roleKeys.all, "detail", "missing"],
    enabled: !!id,
    queryFn: async (): Promise<Role> =>
      normalizeRole(unwrap(await apiClient.GET("/api/roles/{roleId}", { params: { path: { roleId: id! } } }))),
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: RoleCreate): Promise<Role> => normalizeRole(unwrap(await apiClient.POST("/api/roles", { body }))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roleKeys.all }),
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: RoleUpdate }): Promise<Role> =>
      normalizeRole(unwrap(await apiClient.PUT("/api/roles/{roleId}", { params: { path: { roleId: id } }, body }))),
    onSuccess: (role) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
      queryClient.setQueryData(roleKeys.detail(role.id), role);
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error, response } = await apiClient.DELETE("/api/roles/{roleId}", { params: { path: { roleId: id } } });
      if (error || !response.ok) throw new ApiRequestError(response.status, error);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: roleKeys.all }),
  });
}

export function useRolePermissionMatrix(roleId: string | undefined) {
  return useQuery({
    queryKey: roleId ? roleKeys.matrix(roleId) : [...roleKeys.all, "matrix", "missing"],
    enabled: !!roleId,
    queryFn: async (): Promise<RolePermissionMatrix> => {
      const raw = unwrap(
        await apiClient.GET("/api/roles/{roleId}/permissions/matrix", { params: { path: { roleId: roleId! } } }),
      ) as UnknownRecord;
      return normalizeRolePermissionMatrix(roleId!, raw);
    },
  });
}

export function useReplaceRolePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ roleId, body }: { roleId: string; body: ReplaceRolePermissionsRequest }): Promise<PermissionUpdateResult> =>
      unwrap(await apiClient.PUT("/api/roles/{roleId}/permissions", { params: { path: { roleId } }, body })),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.matrix(variables.roleId) });
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}

export function useCopyRolePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ targetRoleId, sourceRoleId }: { targetRoleId: string; sourceRoleId: string }): Promise<PermissionUpdateResult> =>
      unwrap(
        await apiClient.POST("/api/roles/{targetRoleId}/permissions/copy-from/{sourceRoleId}", {
          params: { path: { targetRoleId, sourceRoleId } },
        }),
      ),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.matrix(variables.targetRoleId) });
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
    },
  });
}

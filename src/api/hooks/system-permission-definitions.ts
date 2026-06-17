import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client";
import { unwrap } from "../errors";
import type { SystemActionDefinition, SystemModuleDefinition, SystemPageDefinition } from "../permission-types";
import { normalizeSystemAction, normalizeSystemModule, normalizeSystemPage } from "./permission-normalizers";

export const systemPermissionDefinitionKeys = {
  all: ["system-permission-definitions"] as const,
  modules: () => [...systemPermissionDefinitionKeys.all, "modules"] as const,
  pages: (moduleId: string) => [...systemPermissionDefinitionKeys.all, "pages", moduleId] as const,
  actions: () => [...systemPermissionDefinitionKeys.all, "actions"] as const,
};

export function useSystemModuleDefinitions() {
  return useQuery({
    queryKey: systemPermissionDefinitionKeys.modules(),
    queryFn: async (): Promise<SystemModuleDefinition[]> =>
      (unwrap(await apiClient.GET("/api/system-module-definitions")) ?? []).map(normalizeSystemModule),
  });
}

export function useSystemPageDefinitions(moduleDefinitionId: string | undefined) {
  return useQuery({
    queryKey: moduleDefinitionId
      ? systemPermissionDefinitionKeys.pages(moduleDefinitionId)
      : [...systemPermissionDefinitionKeys.all, "pages", "missing"],
    enabled: !!moduleDefinitionId,
    queryFn: async (): Promise<SystemPageDefinition[]> =>
      (unwrap(
        await apiClient.GET("/api/system-module-definitions/{id}/page-definitions", {
          params: { path: { id: moduleDefinitionId! } },
        }),
      ) ?? []).map(normalizeSystemPage),
  });
}

export function useSystemActionDefinitions() {
  return useQuery({
    queryKey: systemPermissionDefinitionKeys.actions(),
    queryFn: async (): Promise<SystemActionDefinition[]> =>
      (unwrap(await apiClient.GET("/api/system-action-definitions")) ?? []).map(normalizeSystemAction),
  });
}

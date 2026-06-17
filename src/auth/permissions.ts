import { useSession } from "./session-store";

export const PERMISSIONS = {
  roles: {
    view: "ROLE_MANAGEMENT.ROLE_LIST.VIEW",
    create: "ROLE_MANAGEMENT.ROLE_LIST.CREATE",
    update: "ROLE_MANAGEMENT.ROLE_LIST.UPDATE",
    delete: "ROLE_MANAGEMENT.ROLE_LIST.DELETE",
  },
  features: {
    view: "PERMISSION_MANAGEMENT.FEATURE_CONFIG.VIEW",
    create: "PERMISSION_MANAGEMENT.FEATURE_CONFIG.CREATE",
    update: "PERMISSION_MANAGEMENT.FEATURE_CONFIG.UPDATE",
    delete: "PERMISSION_MANAGEMENT.FEATURE_CONFIG.DELETE",
  },
  pages: {
    view: "PERMISSION_MANAGEMENT.PAGE_CONFIG.VIEW",
    create: "PERMISSION_MANAGEMENT.PAGE_CONFIG.CREATE",
    update: "PERMISSION_MANAGEMENT.PAGE_CONFIG.UPDATE",
    delete: "PERMISSION_MANAGEMENT.PAGE_CONFIG.DELETE",
  },
  actions: {
    view: "PERMISSION_MANAGEMENT.ACTION_CONFIG.VIEW",
    create: "PERMISSION_MANAGEMENT.ACTION_CONFIG.CREATE",
    update: "PERMISSION_MANAGEMENT.ACTION_CONFIG.UPDATE",
    delete: "PERMISSION_MANAGEMENT.ACTION_CONFIG.DELETE",
  },
  pageActions: {
    view: "PERMISSION_MANAGEMENT.PAGE_ACTION_CONFIG.VIEW",
    create: "PERMISSION_MANAGEMENT.PAGE_ACTION_CONFIG.CREATE",
    update: "PERMISSION_MANAGEMENT.PAGE_ACTION_CONFIG.UPDATE",
    delete: "PERMISSION_MANAGEMENT.PAGE_ACTION_CONFIG.DELETE",
  },
  rolePermissions: {
    view: "PERMISSION_MANAGEMENT.ROLE_PERMISSION_CONFIG.VIEW",
    update: "PERMISSION_MANAGEMENT.ROLE_PERMISSION_CONFIG.UPDATE",
  },
  socialMedia: {
    facebookIntegration: {
      view: "SOCIAL_MEDIA.FACEBOOK_INTEGRATION.VIEW",
      create: "SOCIAL_MEDIA.FACEBOOK_INTEGRATION.CREATE",
      update: "SOCIAL_MEDIA.FACEBOOK_INTEGRATION.UPDATE",
    },
  },
} as const;

export function hasPermission(permissions: string[], code: string): boolean {
  return permissions.includes(code);
}

export function useHasPermission(code: string): boolean {
  const permissions = useSession((s) => s.permissions);
  return hasPermission(permissions, code);
}

export function usePermissionSet() {
  const permissions = useSession((s) => s.permissions);
  return (code: string) => hasPermission(permissions, code);
}

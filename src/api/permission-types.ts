export interface PermissionList<TItem> {
  items: TItem[];
  pageNumber?: number;
  pageSize?: number;
  totalCount?: number;
}

export interface PermissionResource {
  id: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
}

export interface Role extends PermissionResource {
  isSystemRole: boolean;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface RoleCreate {
  name: string;
  code: string;
  description?: string | null;
}

export interface RoleUpdate {
  name: string;
  description?: string | null;
  isActive: boolean;
}

export interface Feature extends PermissionResource {
  systemModuleDefinitionId: string;
  displayOrder: number;
  isSystemDefined: boolean;
  pages?: Page[] | null;
}

export interface FeatureCreate {
  systemModuleDefinitionId: string;
  name: string;
  description?: string | null;
  displayOrder: number;
}

export interface FeatureUpdate extends FeatureCreate {
  isActive: boolean;
}

export interface Page extends PermissionResource {
  featureId: string;
  featureName: string;
  featureCode: string;
  featureIsSystemDefined: boolean;
  systemPageDefinitionId: string;
  route: string;
  icon: string;
  displayOrder: number;
  isMenuVisible: boolean;
  isSystemDefined: boolean;
  actions?: PageAction[] | null;
}

export interface PageCreate {
  featureId: string;
  systemPageDefinitionId: string;
  name: string;
  route: string;
  icon?: string | null;
  displayOrder: number;
  isMenuVisible: boolean;
}

export interface PageUpdate extends PageCreate {
  isActive: boolean;
}

export interface PermissionAction extends PermissionResource {
  systemActionDefinitionId: string;
  isSystemDefined: boolean;
}

export interface PermissionActionCreate {
  systemActionDefinitionId: string;
  name: string;
  description?: string | null;
}

export interface PermissionActionUpdate extends PermissionActionCreate {
  isActive: boolean;
}

export interface PageAction {
  id: string;
  featureId: string;
  featureName: string;
  featureCode: string;
  pageId: string;
  pageName: string;
  pageCode: string;
  permissionActionId: string;
  actionName: string;
  actionCode: string;
  permissionCode: string;
  description: string;
  isSystemDefined: boolean;
  isActive: boolean;
}

export interface PageActionCreate {
  pageId: string;
  permissionActionId: string;
  description?: string | null;
}

export interface PageActionUpdate extends PageActionCreate {
  isActive: boolean;
}

export interface SystemModuleDefinition extends PermissionResource {}

export interface SystemPageDefinition extends PermissionResource {
  route?: string | null;
  icon?: string | null;
  displayOrder?: number | null;
}

export interface SystemActionDefinition extends PermissionResource {}

export interface ReplaceRolePermissionsRequest {
  pageActionIds: string[];
}

export interface PatchRolePermissionsRequest {
  grantPageActionIds?: string[];
  revokePageActionIds?: string[];
}

export interface PermissionUpdateResult {
  roleId: string;
  totalGrantedPermissions: number;
  grantedPermissionCodes: string[];
}

export interface RolePermissionActionNode {
  id: string;
  name: string;
  code: string;
  permissionCode: string;
  description?: string;
  isGranted: boolean;
  isActive: boolean;
}

export interface RolePermissionPageNode {
  id: string;
  name: string;
  code: string;
  route?: string;
  actions: RolePermissionActionNode[];
}

export interface RolePermissionFeatureNode {
  id: string;
  name: string;
  code: string;
  pages: RolePermissionPageNode[];
}

export interface RolePermissionMatrix {
  roleId: string;
  features: RolePermissionFeatureNode[];
  grantedPageActionIds: string[];
}

export type UnknownRecord = Record<string, unknown>;

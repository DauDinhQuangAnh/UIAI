import type {
  Feature,
  Page,
  PageAction,
  PermissionAction,
  PermissionList,
  Role,
  RolePermissionActionNode,
  RolePermissionFeatureNode,
  RolePermissionMatrix,
  RolePermissionPageNode,
  SystemActionDefinition,
  SystemModuleDefinition,
  SystemPageDefinition,
  UnknownRecord,
} from "../permission-types";

export function normalizeRole(role: Partial<Role>): Role {
  return {
    id: stringValue(role.id),
    name: stringValue(role.name),
    code: stringValue(role.code),
    description: stringValue(role.description),
    isSystemRole: booleanValue(role.isSystemRole),
    isActive: role.isActive ?? true,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt ?? null,
  };
}

export function normalizeRoleList(list: Partial<PermissionList<Partial<Role>>>): PermissionList<Role> {
  return {
    items: (list.items ?? []).filter((role) => !!role.id).map(normalizeRole),
    pageNumber: list.pageNumber,
    pageSize: list.pageSize,
    totalCount: list.totalCount,
  };
}

export function normalizeFeature(feature: Partial<Feature>): Feature {
  return {
    id: stringValue(feature.id),
    systemModuleDefinitionId: stringValue(feature.systemModuleDefinitionId),
    name: stringValue(feature.name),
    code: stringValue(feature.code),
    description: stringValue(feature.description),
    displayOrder: numberValue(feature.displayOrder),
    isSystemDefined: booleanValue(feature.isSystemDefined),
    isActive: feature.isActive ?? true,
    pages: feature.pages?.map(normalizePage) ?? null,
  };
}

export function normalizePage(page: Partial<Page>): Page {
  return {
    id: stringValue(page.id),
    featureId: stringValue(page.featureId),
    featureName: stringValue(page.featureName),
    featureCode: stringValue(page.featureCode),
    featureIsSystemDefined: booleanValue(page.featureIsSystemDefined),
    systemPageDefinitionId: stringValue(page.systemPageDefinitionId),
    name: stringValue(page.name),
    code: stringValue(page.code),
    description: stringValue(page.description),
    route: stringValue(page.route),
    icon: stringValue(page.icon),
    displayOrder: numberValue(page.displayOrder),
    isMenuVisible: page.isMenuVisible ?? true,
    isSystemDefined: booleanValue(page.isSystemDefined),
    isActive: page.isActive ?? true,
    actions: page.actions?.map(normalizePageAction) ?? null,
  };
}

export function normalizePermissionAction(action: Partial<PermissionAction>): PermissionAction {
  return {
    id: stringValue(action.id),
    systemActionDefinitionId: stringValue(action.systemActionDefinitionId),
    name: stringValue(action.name),
    code: stringValue(action.code),
    description: stringValue(action.description),
    isSystemDefined: booleanValue(action.isSystemDefined),
    isActive: action.isActive ?? true,
  };
}

export function normalizePageAction(action: Partial<PageAction>): PageAction {
  return {
    id: stringValue(action.id),
    featureId: stringValue(action.featureId),
    featureName: stringValue(action.featureName),
    featureCode: stringValue(action.featureCode),
    pageId: stringValue(action.pageId),
    pageName: stringValue(action.pageName),
    pageCode: stringValue(action.pageCode),
    permissionActionId: stringValue(action.permissionActionId),
    actionName: stringValue(action.actionName),
    actionCode: stringValue(action.actionCode),
    permissionCode: stringValue(action.permissionCode),
    description: stringValue(action.description),
    isSystemDefined: booleanValue(action.isSystemDefined),
    isActive: action.isActive ?? true,
  };
}

export function normalizeSystemModule(definition: Partial<SystemModuleDefinition>): SystemModuleDefinition {
  return {
    id: stringValue(definition.id),
    name: stringValue(definition.name),
    code: stringValue(definition.code),
    description: stringValue(definition.description),
    isActive: definition.isActive ?? true,
  };
}

export function normalizeSystemPage(definition: Partial<SystemPageDefinition>): SystemPageDefinition {
  return {
    id: stringValue(definition.id),
    name: stringValue(definition.name),
    code: stringValue(definition.code),
    description: stringValue(definition.description),
    isActive: definition.isActive ?? true,
    route: typeof definition.route === "string" ? definition.route : null,
    icon: typeof definition.icon === "string" ? definition.icon : null,
    displayOrder: typeof definition.displayOrder === "number" ? definition.displayOrder : null,
  };
}

export function normalizeSystemAction(definition: Partial<SystemActionDefinition>): SystemActionDefinition {
  return {
    id: stringValue(definition.id),
    name: stringValue(definition.name),
    code: stringValue(definition.code),
    description: stringValue(definition.description),
    isActive: definition.isActive ?? true,
  };
}

export function normalizeRolePermissionMatrix(roleId: string, raw: UnknownRecord): RolePermissionMatrix {
  const root = raw as UnknownRecord;
  const grantedIds = new Set(readStringArray(root, ["grantedPageActionIds", "pageActionIds", "selectedPageActionIds"]));
  const grantedCodes = new Set(readStringArray(root, ["grantedPermissionCodes", "permissionCodes", "selectedPermissionCodes"]));
  const featuresRaw = readArray(root, ["features", "modules", "items"]);
  const features = featuresRaw.map((feature) => normalizeMatrixFeature(feature, grantedIds, grantedCodes)).filter((feature) => feature.pages.length > 0);

  if (features.length === 0) {
    throw new Error("permission_matrix_shape_unsupported");
  }

  return {
    roleId: stringValue(root.roleId) || roleId,
    features,
    grantedPageActionIds: features.flatMap((feature) =>
      feature.pages.flatMap((page) => page.actions.filter((action) => action.isGranted).map((action) => action.id)),
    ),
  };
}

function normalizeMatrixFeature(raw: unknown, grantedIds: Set<string>, grantedCodes: Set<string>): RolePermissionFeatureNode {
  const record = asRecord(raw);
  const pages = readArray(record, ["pages", "children"]).map((page) => normalizeMatrixPage(page, grantedIds, grantedCodes));
  return {
    id: stringValue(record.id ?? record.featureId),
    name: stringValue(record.name ?? record.featureName),
    code: stringValue(record.code ?? record.featureCode),
    pages: pages.filter((page) => page.actions.length > 0),
  };
}

function normalizeMatrixPage(raw: unknown, grantedIds: Set<string>, grantedCodes: Set<string>): RolePermissionPageNode {
  const record = asRecord(raw);
  const actions = readArray(record, ["actions", "pageActions", "permissions"]).map((action) =>
    normalizeMatrixAction(action, grantedIds, grantedCodes),
  );
  return {
    id: stringValue(record.id ?? record.pageId),
    name: stringValue(record.name ?? record.pageName),
    code: stringValue(record.code ?? record.pageCode),
    route: stringValue(record.route),
    actions: actions.filter((action) => !!action.id),
  };
}

function normalizeMatrixAction(raw: unknown, grantedIds: Set<string>, grantedCodes: Set<string>): RolePermissionActionNode {
  const record = asRecord(raw);
  const id = stringValue(record.id ?? record.pageActionId);
  const permissionCode = stringValue(record.permissionCode);
  const explicitGranted =
    typeof record.isGranted === "boolean" ? record.isGranted :
    typeof record.granted === "boolean" ? record.granted :
    typeof record.selected === "boolean" ? record.selected :
    undefined;
  return {
    id,
    name: stringValue(record.name ?? record.actionName),
    code: stringValue(record.code ?? record.actionCode),
    permissionCode,
    description: stringValue(record.description),
    isGranted: explicitGranted ?? (grantedIds.has(id) || grantedCodes.has(permissionCode)),
    isActive: record.isActive !== false,
  };
}

function readArray(record: UnknownRecord, keys: string[]): unknown[] {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function readStringArray(record: UnknownRecord, keys: string[]): string[] {
  return readArray(record, keys).filter((value): value is string => typeof value === "string");
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function booleanValue(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

function numberValue(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

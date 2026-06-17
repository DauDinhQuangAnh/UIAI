import type {
  Feature,
  FeatureCreate,
  FeatureUpdate,
  Page,
  PageAction,
  PageActionCreate,
  PageActionUpdate,
  PageCreate,
  PageUpdate,
  PatchRolePermissionsRequest,
  PermissionAction,
  PermissionActionCreate,
  PermissionActionUpdate,
  PermissionList,
  PermissionUpdateResult,
  ReplaceRolePermissionsRequest,
  Role,
  RoleCreate,
  RoleUpdate,
  SystemActionDefinition,
  SystemModuleDefinition,
  SystemPageDefinition,
  UnknownRecord,
} from "./permission-types";

type JsonResponse<T> = {
  headers: { [name: string]: unknown };
  content: { "application/json": T };
};

type EmptyResponse = {
  headers: { [name: string]: unknown };
  content?: never;
};

type NoParams = {
  query?: never;
  header?: never;
  path?: never;
  cookie?: never;
};

type QueryParams<T> = {
  query?: T;
  header?: never;
  path?: never;
  cookie?: never;
};

type PathParams<T> = {
  query?: never;
  header?: never;
  path: T;
  cookie?: never;
};

type PathQueryParams<TPath, TQuery> = {
  query?: TQuery;
  header?: never;
  path: TPath;
  cookie?: never;
};

type PathItem<TGet = never, TPost = never, TPut = never, TDelete = never, TPatch = never> = {
  parameters: NoParams;
  get: TGet;
  post: TPost;
  put: TPut;
  delete: TDelete;
  patch: TPatch;
  options?: never;
  head?: never;
  trace?: never;
};

declare module "./schema" {
  interface paths {
    "/api/roles": PathItem<
      {
        parameters: QueryParams<{ keyword?: string; isActive?: boolean; pageNumber?: number; pageSize?: number }>;
        responses: { 200: JsonResponse<PermissionList<Role>> };
      },
      {
        parameters: NoParams;
        requestBody: { content: { "application/json": RoleCreate } };
        responses: { 201: JsonResponse<Role>; 200: JsonResponse<Role> };
      }
    >;
    "/api/roles/{roleId}": PathItem<
      {
        parameters: PathParams<{ roleId: string }>;
        responses: { 200: JsonResponse<Role> };
      },
      never,
      {
        parameters: PathParams<{ roleId: string }>;
        requestBody: { content: { "application/json": RoleUpdate } };
        responses: { 200: JsonResponse<Role> };
      },
      {
        parameters: PathParams<{ roleId: string }>;
        responses: { 204: EmptyResponse };
      }
    >;
    "/api/roles/{roleId}/permissions/matrix": PathItem<{
      parameters: PathParams<{ roleId: string }>;
      responses: { 200: JsonResponse<UnknownRecord> };
    }>;
    "/api/roles/{roleId}/permissions": PathItem<
      never,
      never,
      {
        parameters: PathParams<{ roleId: string }>;
        requestBody: { content: { "application/json": ReplaceRolePermissionsRequest } };
        responses: { 200: JsonResponse<PermissionUpdateResult> };
      },
      never,
      {
        parameters: PathParams<{ roleId: string }>;
        requestBody: { content: { "application/json": PatchRolePermissionsRequest } };
        responses: { 200: JsonResponse<PermissionUpdateResult> };
      }
    >;
    "/api/roles/{targetRoleId}/permissions/copy-from/{sourceRoleId}": PathItem<
      never,
      {
        parameters: PathParams<{ targetRoleId: string; sourceRoleId: string }>;
        responses: { 200: JsonResponse<PermissionUpdateResult> };
      }
    >;
    "/api/features": PathItem<
      {
        parameters: QueryParams<{ keyword?: string; isActive?: boolean }>;
        responses: { 200: JsonResponse<Feature[]> };
      },
      {
        parameters: NoParams;
        requestBody: { content: { "application/json": FeatureCreate } };
        responses: { 201: JsonResponse<Feature>; 200: JsonResponse<Feature> };
      }
    >;
    "/api/features/{featureId}": PathItem<
      {
        parameters: PathQueryParams<{ featureId: string }, { includePages?: boolean }>;
        responses: { 200: JsonResponse<Feature> };
      },
      never,
      {
        parameters: PathParams<{ featureId: string }>;
        requestBody: { content: { "application/json": FeatureUpdate } };
        responses: { 200: JsonResponse<Feature> };
      },
      {
        parameters: PathParams<{ featureId: string }>;
        responses: { 204: EmptyResponse };
      }
    >;
    "/api/pages": PathItem<
      {
        parameters: QueryParams<{ featureId?: string; keyword?: string; isActive?: boolean; isMenuVisible?: boolean }>;
        responses: { 200: JsonResponse<Page[]> };
      },
      {
        parameters: NoParams;
        requestBody: { content: { "application/json": PageCreate } };
        responses: { 201: JsonResponse<Page>; 200: JsonResponse<Page> };
      }
    >;
    "/api/pages/{pageId}": PathItem<
      {
        parameters: PathQueryParams<{ pageId: string }, { includeActions?: boolean }>;
        responses: { 200: JsonResponse<Page> };
      },
      never,
      {
        parameters: PathParams<{ pageId: string }>;
        requestBody: { content: { "application/json": PageUpdate } };
        responses: { 200: JsonResponse<Page> };
      },
      {
        parameters: PathParams<{ pageId: string }>;
        responses: { 204: EmptyResponse };
      }
    >;
    "/api/permission-actions": PathItem<
      {
        parameters: QueryParams<{ keyword?: string; isActive?: boolean }>;
        responses: { 200: JsonResponse<PermissionAction[]> };
      },
      {
        parameters: NoParams;
        requestBody: { content: { "application/json": PermissionActionCreate } };
        responses: { 201: JsonResponse<PermissionAction>; 200: JsonResponse<PermissionAction> };
      }
    >;
    "/api/permission-actions/{permissionActionId}": PathItem<
      never,
      never,
      {
        parameters: PathParams<{ permissionActionId: string }>;
        requestBody: { content: { "application/json": PermissionActionUpdate } };
        responses: { 200: JsonResponse<PermissionAction> };
      },
      {
        parameters: PathParams<{ permissionActionId: string }>;
        responses: { 204: EmptyResponse };
      }
    >;
    "/api/page-actions": PathItem<
      {
        parameters: QueryParams<{
          featureId?: string;
          pageId?: string;
          permissionActionId?: string;
          keyword?: string;
          isActive?: boolean;
        }>;
        responses: { 200: JsonResponse<PageAction[]> };
      },
      {
        parameters: NoParams;
        requestBody: { content: { "application/json": PageActionCreate } };
        responses: { 201: JsonResponse<PageAction>; 200: JsonResponse<PageAction> };
      }
    >;
    "/api/page-actions/{pageActionId}": PathItem<
      never,
      never,
      {
        parameters: PathParams<{ pageActionId: string }>;
        requestBody: { content: { "application/json": PageActionUpdate } };
        responses: { 200: JsonResponse<PageAction> };
      },
      {
        parameters: PathParams<{ pageActionId: string }>;
        responses: { 204: EmptyResponse };
      }
    >;
    "/api/system-module-definitions": PathItem<{
      parameters: NoParams;
      responses: { 200: JsonResponse<SystemModuleDefinition[]> };
    }>;
    "/api/system-module-definitions/{id}/page-definitions": PathItem<{
      parameters: PathParams<{ id: string }>;
      responses: { 200: JsonResponse<SystemPageDefinition[]> };
    }>;
    "/api/system-action-definitions": PathItem<{
      parameters: NoParams;
      responses: { 200: JsonResponse<SystemActionDefinition[]> };
    }>;
  }
}

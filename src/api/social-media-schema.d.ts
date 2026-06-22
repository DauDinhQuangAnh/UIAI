import type {
  CreateSocialMediaIntegrationRequest,
  CreateSocialMediaIntegrationResponse,
  FacebookAppConfigRequest,
  FacebookAppConfigResponse,
  FacebookPagesResponse,
  SocialMediaIntegrationDetail,
  SocialMediaIntegrationSummary,
  SocialMediaProvider,
  UpdateSocialMediaPageRequest,
  UpdateSocialMediaPageResponse,
} from "./social-media-types";

type JsonResponse<T> = {
  headers: { [name: string]: unknown };
  content: { "application/json": T };
};

type NoParams = {
  query?: never;
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

type PathItem<TGet = never> = {
  parameters: NoParams;
  get: TGet;
  put?: never;
  post?: never;
  delete?: never;
  patch?: never;
  options?: never;
  head?: never;
  trace?: never;
};

type GetPostPathItem<TGet = never, TPost = never> = {
  parameters: NoParams;
  get: TGet;
  post: TPost;
  put?: never;
  delete?: never;
  patch?: never;
  options?: never;
  head?: never;
  trace?: never;
};

type GetDeletePathItem<TGet = never, TDelete = never> = {
  parameters: NoParams;
  get: TGet;
  delete: TDelete;
  put?: never;
  post?: never;
  patch?: never;
  options?: never;
  head?: never;
  trace?: never;
};

type AppConfigPathItem<TPost = never, TPut = never> = {
  parameters: NoParams;
  get?: never;
  post: TPost;
  put: TPut;
  delete?: never;
  patch?: never;
  options?: never;
  head?: never;
  trace?: never;
};

type PutDeletePathItem<TPut = never, TDelete = never> = {
  parameters: NoParams;
  put: TPut;
  delete: TDelete;
  get?: never;
  post?: never;
  patch?: never;
  options?: never;
  head?: never;
  trace?: never;
};

declare module "./schema" {
  interface paths {
    "/api/social-media/providers": PathItem<{
      parameters: NoParams;
      responses: { 200: JsonResponse<SocialMediaProvider[]> };
    }>;
    "/api/business-partners/{businessPartnerId}/social-media/integrations": GetPostPathItem<
      {
        parameters: PathParams<{ businessPartnerId: string }>;
        responses: { 200: JsonResponse<SocialMediaIntegrationSummary[]> };
      },
      {
        parameters: PathParams<{ businessPartnerId: string }>;
        requestBody: { content: { "application/json": CreateSocialMediaIntegrationRequest } };
        responses: { 200: JsonResponse<CreateSocialMediaIntegrationResponse> };
      }
    >;
    "/api/business-partners/{businessPartnerId}/social-media/integrations/{integrationId}": GetDeletePathItem<
      {
        parameters: PathParams<{ businessPartnerId: string; integrationId: string }>;
        responses: { 200: JsonResponse<SocialMediaIntegrationDetail> };
      },
      {
        parameters: PathParams<{ businessPartnerId: string; integrationId: string }>;
        responses: { 204: { headers: { [name: string]: unknown }; content?: never } };
      }
    >;
    "/api/business-partners/{businessPartnerId}/social-media/facebook/app-config": AppConfigPathItem<
      {
        parameters: PathParams<{ businessPartnerId: string }>;
        requestBody: { content: { "application/json": FacebookAppConfigRequest } };
        responses: { 200: JsonResponse<FacebookAppConfigResponse>; 201: JsonResponse<FacebookAppConfigResponse> };
      },
      {
        parameters: PathParams<{ businessPartnerId: string }>;
        requestBody: { content: { "application/json": FacebookAppConfigRequest } };
        responses: { 200: JsonResponse<FacebookAppConfigResponse> };
      }
    >;
    "/api/business-partners/{businessPartnerId}/social-media/facebook/pages": PathItem<{
      parameters: PathParams<{ businessPartnerId: string }>;
      responses: { 200: JsonResponse<FacebookPagesResponse> };
    }>;
    "/api/business-partners/{businessPartnerId}/social-media/pages/{pageId}": PutDeletePathItem<
      {
        parameters: PathParams<{ businessPartnerId: string; pageId: string }>;
        requestBody: { content: { "application/json": UpdateSocialMediaPageRequest } };
        responses: { 200: JsonResponse<UpdateSocialMediaPageResponse> };
      },
      {
        parameters: PathParams<{ businessPartnerId: string; pageId: string }>;
        responses: { 204: { headers: { [name: string]: unknown }; content?: never } };
      }
    >;
  }
}

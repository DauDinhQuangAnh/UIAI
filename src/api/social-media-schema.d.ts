import type {
  FacebookAppConfigRequest,
  FacebookAppConfigResponse,
  FacebookPagesResponse,
  FacebookOAuthCallbackResponse,
  FacebookOAuthStartRequest,
  FacebookOAuthStartResponse,
  SaveFacebookPagesRequest,
  SaveFacebookPagesResponse,
  SocialMediaIntegrationDetail,
  SocialMediaIntegrationSummary,
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

type QueryParams<T> = {
  query?: T;
  header?: never;
  path?: never;
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

type GetPostDeletePathItem<TGet = never, TPost = never, TDelete = never> = {
  parameters: NoParams;
  get: TGet;
  post: TPost;
  delete: TDelete;
  put?: never;
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

type PutPathItem<TPut = never> = {
  parameters: NoParams;
  put: TPut;
  delete?: never;
  get?: never;
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

type PostOnlyPathItem<TPost = never> = {
  parameters: NoParams;
  get?: never;
  post: TPost;
  put?: never;
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

declare module "./schema" {
  interface paths {
    "/api/business-partners/{businessPartnerId}/social-media/integrations": PathItem<{
      parameters: PathParams<{ businessPartnerId: string }>;
      responses: { 200: JsonResponse<SocialMediaIntegrationSummary[]> };
    }>;
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
    "/api/business-partners/{businessPartnerId}/social-media/pages/{pageId}": PutPathItem<
      {
        parameters: PathParams<{ businessPartnerId: string; pageId: string }>;
        requestBody: { content: { "application/json": UpdateSocialMediaPageRequest } };
        responses: { 200: JsonResponse<UpdateSocialMediaPageResponse> };
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
    "/api/business-partners/{businessPartnerId}/social-media/facebook/oauth/start": PostOnlyPathItem<{
      parameters: PathParams<{ businessPartnerId: string }>;
      requestBody: { content: { "application/json": FacebookOAuthStartRequest } };
      responses: { 200: JsonResponse<FacebookOAuthStartResponse> };
    }>;
    "/api/social-media/facebook/oauth/callback": PathItem<{
      parameters: QueryParams<{ code: string; state: string }>;
      responses: { 200: JsonResponse<FacebookOAuthCallbackResponse> };
    }>;
    "/api/business-partners/{businessPartnerId}/social-media/facebook/pages": GetPostPathItem<
      {
        parameters: PathParams<{ businessPartnerId: string }>;
        responses: { 200: JsonResponse<FacebookPagesResponse> };
      },
      {
        parameters: PathParams<{ businessPartnerId: string }>;
        requestBody: { content: { "application/json": SaveFacebookPagesRequest } };
        responses: { 200: JsonResponse<SaveFacebookPagesResponse> };
      }
    >;
  }
}

import type {
  SocialMediaIntegrationDetail,
  SocialMediaIntegrationSummary,
  SocialMediaProvider,
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

declare module "./schema" {
  interface paths {
    "/api/social-media/providers": PathItem<{
      parameters: NoParams;
      responses: { 200: JsonResponse<SocialMediaProvider[]> };
    }>;
    "/api/business-partners/{businessPartnerId}/social-media/integrations": PathItem<{
      parameters: PathParams<{ businessPartnerId: string }>;
      responses: { 200: JsonResponse<SocialMediaIntegrationSummary[]> };
    }>;
    "/api/business-partners/{businessPartnerId}/social-media/integrations/{integrationId}": PathItem<{
      parameters: PathParams<{ businessPartnerId: string; integrationId: string }>;
      responses: { 200: JsonResponse<SocialMediaIntegrationDetail> };
    }>;
  }
}

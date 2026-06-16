import type { components } from "./schema";

export type ApiError = components["schemas"]["Error"];

// The API error body is flat: { error: { code, message } } — there is NO field
// array. Forms map by error.code to a form-level message (not field-level).
export function errorCode(error: unknown): string | undefined {
  if (error && typeof error === "object" && "error" in error) {
    const inner = (error as ApiError).error;
    return inner?.code ?? undefined;
  }
  return undefined;
}

export function errorMessage(error: unknown, fallback = "Đã xảy ra lỗi"): string {
  if (error && typeof error === "object" && "error" in error) {
    const inner = (error as ApiError).error;
    if (inner?.message) return inner.message;
  }
  return fallback;
}

// Carries HTTP status + parsed body so resource hooks can branch on status
// (404/409/422/503) and screens can map error.code to form-level messages.
export class ApiRequestError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown) {
    super(`api_request_failed_${status}`);
    this.name = "ApiRequestError";
    this.status = status;
    this.body = body;
  }
  get code(): string | undefined {
    return errorCode(this.body);
  }
}

// Unwrap an openapi-fetch result, throwing ApiRequestError on a non-2xx so
// TanStack Query mutations/queries land in onError with status + code intact.
export function unwrap<T>(result: {
  data?: T;
  error?: unknown;
  response: Response;
}): T {
  if (result.error !== undefined || result.data === undefined) {
    throw new ApiRequestError(result.response.status, result.error);
  }
  return result.data;
}

import type { components } from "./schema";

export type ApiError = components["schemas"]["Error"];

interface SarErrorBody {
  statusCode?: number;
  message?: string;
  traceId?: string;
  errors?: string[];
}

// Supports both the legacy generated schema shape ({ error: { code, message } })
// and the SAR Platform error shape ({ statusCode, message, traceId, errors }).
export function errorCode(error: unknown): string | undefined {
  if (error && typeof error === "object" && "error" in error) {
    const inner = (error as ApiError).error;
    return inner?.code ?? undefined;
  }
  return undefined;
}

export function errorMessage(error: unknown, fallback = "Đã xảy ra lỗi"): string {
  if (isSarError(error)) {
    const detail =
      Array.isArray(error.errors) && error.errors.length > 0
        ? error.errors.join(", ")
        : error.message;
    if (detail && error.traceId) return `${detail} (traceId: ${error.traceId})`;
    if (detail) return detail;
    if (error.traceId) return `${fallback} (traceId: ${error.traceId})`;
  }
  if (error && typeof error === "object" && "error" in error) {
    const inner = (error as ApiError).error;
    if (inner?.message) return inner.message;
  }
  return fallback;
}

function isSarError(error: unknown): error is SarErrorBody {
  return !!error && typeof error === "object" && ("statusCode" in error || "traceId" in error || "errors" in error);
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

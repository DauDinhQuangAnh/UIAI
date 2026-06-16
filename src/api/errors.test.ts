import { describe, it, expect } from "vitest";
import { errorCode, errorMessage, ApiRequestError, unwrap } from "./errors";

// The API error body is flat { error: { code, message } } — no field array. Forms
// map by code to a form-level message, so code extraction must be exact.
describe("API error mapping (code-keyed, form-level)", () => {
  it("extracts code and message from the flat error body", () => {
    const body = { error: { code: "kg_infra_unavailable", message: "KG is down" } };
    expect(errorCode(body)).toBe("kg_infra_unavailable");
    expect(errorMessage(body)).toBe("KG is down");
  });

  it("falls back when the body is missing or malformed", () => {
    expect(errorCode(undefined)).toBeUndefined();
    expect(errorCode({})).toBeUndefined();
    expect(errorMessage(null, "fallback")).toBe("fallback");
  });

  it("ApiRequestError carries status and exposes code", () => {
    const err = new ApiRequestError(422, { error: { code: "merge_not_applied", message: "no" } });
    expect(err.status).toBe(422);
    expect(err.code).toBe("merge_not_applied");
  });

  it("unwrap throws ApiRequestError with status on a non-2xx result", () => {
    const result = { error: { error: { code: "conflict" } }, response: { status: 409 } as Response };
    expect(() => unwrap(result)).toThrowError(ApiRequestError);
    try {
      unwrap(result);
    } catch (e) {
      expect((e as ApiRequestError).status).toBe(409);
      expect((e as ApiRequestError).code).toBe("conflict");
    }
  });

  it("unwrap returns data on success", () => {
    expect(unwrap({ data: { ok: true }, response: { status: 200 } as Response })).toEqual({ ok: true });
  });
});

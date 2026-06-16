import { describe, it, expect } from "vitest";
import { normalizeForwardCursor, normalizeBackwardCursor } from "./cursors";

// next_cursor is non-nullable in the schema but the server omits the id on the last
// page. "No id" MUST normalize to undefined so pagination stops instead of looping.
describe("cursor normalization (pagination stop-guard)", () => {
  it("keeps a forward cursor that has an after_id", () => {
    const c = { after_created_at: "2026-01-01T00:00:00Z", after_id: "abc" };
    expect(normalizeForwardCursor(c)).toBe(c);
  });

  it("stops (undefined) when the forward cursor has no after_id", () => {
    expect(normalizeForwardCursor({ after_created_at: "2026-01-01T00:00:00Z" })).toBeUndefined();
    expect(normalizeForwardCursor({})).toBeUndefined();
    expect(normalizeForwardCursor(undefined)).toBeUndefined();
  });

  it("keeps a backward cursor that has a before_id", () => {
    const c = { before_activity_at: "2026-01-01T00:00:00Z", before_id: "xyz" };
    expect(normalizeBackwardCursor(c)).toBe(c);
  });

  it("stops (undefined) when the backward cursor has no before_id", () => {
    expect(normalizeBackwardCursor({ before_activity_at: "2026-01-01T00:00:00Z" })).toBeUndefined();
    expect(normalizeBackwardCursor({})).toBeUndefined();
    expect(normalizeBackwardCursor(undefined)).toBeUndefined();
  });
});

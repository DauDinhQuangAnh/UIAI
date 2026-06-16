import type { components } from "./schema";

export type ForwardCursor = components["schemas"]["Cursor"]; // after_created_at + after_id
export type BackwardCursor = components["schemas"]["BeforeCursor"]; // before_activity_at + before_id

// next_cursor is non-nullable in the schema but the server omits it on the last
// page (and may send an empty object). Treat "no id" as the stop signal so
// pagination halts instead of looping on an empty cursor.
export function normalizeForwardCursor(cursor: ForwardCursor | undefined): ForwardCursor | undefined {
  return cursor?.after_id ? cursor : undefined;
}

export function normalizeBackwardCursor(
  cursor: BackwardCursor | undefined,
): BackwardCursor | undefined {
  return cursor?.before_id ? cursor : undefined;
}

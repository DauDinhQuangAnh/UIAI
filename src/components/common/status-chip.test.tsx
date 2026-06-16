import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusChip } from "./status-chip";

// The status->color+icon map is the single source of truth for both document ingest
// and KG candidate states. "ready" (not "ingested") is the document success literal.
describe("StatusChip mapping", () => {
  it("renders the document success state 'ready'", () => {
    render(<StatusChip status="ready" />);
    expect(screen.getByText("ready")).toBeInTheDocument();
  });

  it.each(["queued", "extracting", "failed", "pending", "merged", "dismissed"])(
    "renders the known status %s with its own label",
    (status) => {
      render(<StatusChip status={status} />);
      expect(screen.getByText(status)).toBeInTheDocument();
    },
  );

  it("falls back to 'unknown' for an undefined status (defensive)", () => {
    render(<StatusChip status={undefined} />);
    expect(screen.getByText("unknown")).toBeInTheDocument();
  });

  it("renders an unmapped status verbatim with the neutral fallback", () => {
    render(<StatusChip status="archived" />);
    expect(screen.getByText("archived")).toBeInTheDocument();
  });
});

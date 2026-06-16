import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CandidateCard } from "./candidate-card";
import type { Candidate } from "@/api/hooks/knowledge";

const candidate: Candidate = {
  id: "cand-1",
  agent_id: "agent-1",
  entity_a_id: "ENTITY_A",
  entity_b_id: "ENTITY_B",
  similarity: 0.91,
  status: "pending",
};

function renderCard(admin: boolean) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const onResolved = vi.fn();
  render(
    <QueryClientProvider client={client}>
      <CandidateCard agentId="agent-1" candidate={candidate} admin={admin} onResolved={onResolved} />
    </QueryClientProvider>,
  );
  return { onResolved };
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ ...candidate, status: "merged" }), { status: 200 })),
  );
});
afterEach(() => vi.restoreAllMocks());

describe("CandidateCard — irreversible-merge safeguards", () => {
  it("disables Merge until an entity is explicitly chosen to keep", async () => {
    const user = userEvent.setup();
    renderCard(true);

    const mergeBtn = screen.getByRole("button", { name: /^merge$/i });
    expect(mergeBtn).toBeDisabled(); // no keep/drop chosen yet -> cannot merge

    await user.click(screen.getByRole("radio", { name: /entity a/i }));
    expect(mergeBtn).toBeEnabled();
  });

  it("sends {keep_id, drop_id} matching the chosen direction, after confirm", async () => {
    const user = userEvent.setup();
    const { onResolved } = renderCard(true);

    await user.click(screen.getByRole("radio", { name: /entity a/i })); // keep A, drop B
    await user.click(screen.getByRole("button", { name: /^merge$/i }));

    // Confirm dialog must appear before any destructive call.
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /merge & drop/i }));

    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const req = fetchMock.mock.calls[0][0] as Request;
    expect(req.url).toContain("/api/kg/candidates/cand-1/merge");
    const body = JSON.parse(await req.text());
    expect(body).toEqual({ keep_id: "ENTITY_A", drop_id: "ENTITY_B" });
    await vi.waitFor(() => expect(onResolved).toHaveBeenCalledWith("cand-1"));
  });

  it("gives members no merge/dismiss controls (read-only)", () => {
    renderCard(false);
    expect(screen.queryByRole("button", { name: /^merge$/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /dismiss/i })).toBeNull();
  });
});

import { describe, it, expect } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useKeysetQuery, type KeysetPage } from "./use-keyset-query";

interface Row {
  id: string;
}
interface FwdCursor {
  after_id?: string;
}

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe("useKeysetQuery (cursor-direction-agnostic infinite list)", () => {
  it("accumulates pages and stops when fetchPage returns an undefined cursor", async () => {
    const pages: Record<string, KeysetPage<Row, FwdCursor>> = {
      "": { items: [{ id: "a" }, { id: "b" }], nextCursor: { after_id: "b" } },
      b: { items: [{ id: "c" }], nextCursor: undefined }, // last page -> stop
    };
    const { result } = renderHook(
      () =>
        useKeysetQuery<Row, FwdCursor>({
          queryKey: ["t1"],
          getId: (r) => r.id,
          fetchPage: (cursor) => Promise.resolve(pages[cursor?.after_id ?? ""]),
        }),
      { wrapper: wrapper() },
    );

    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(result.current.hasNextPage).toBe(true);

    await act(async () => {
      await result.current.fetchNextPage();
    });

    await waitFor(() => expect(result.current.items.map((r) => r.id)).toEqual(["a", "b", "c"]));
    expect(result.current.hasNextPage).toBe(false); // undefined cursor halted it
  });

  it("dedups a boundary row repeated across pages", async () => {
    const pages: Record<string, KeysetPage<Row, FwdCursor>> = {
      "": { items: [{ id: "a" }, { id: "b" }], nextCursor: { after_id: "b" } },
      b: { items: [{ id: "b" }, { id: "c" }], nextCursor: undefined }, // b repeats
    };
    const { result } = renderHook(
      () =>
        useKeysetQuery<Row, FwdCursor>({
          queryKey: ["t2"],
          getId: (r) => r.id,
          fetchPage: (cursor) => Promise.resolve(pages[cursor?.after_id ?? ""]),
        }),
      { wrapper: wrapper() },
    );

    await waitFor(() => expect(result.current.items).toHaveLength(2));
    await act(async () => {
      await result.current.fetchNextPage();
    });

    await waitFor(() => expect(result.current.items.map((r) => r.id)).toEqual(["a", "b", "c"])); // no dup b
  });

  it("works identically for a backward (before_*) cursor shape", async () => {
    interface BwdCursor {
      before_id?: string;
    }
    const pages: Record<string, KeysetPage<Row, BwdCursor>> = {
      "": { items: [{ id: "z" }, { id: "y" }], nextCursor: { before_id: "y" } },
      y: { items: [{ id: "x" }], nextCursor: undefined },
    };
    const { result } = renderHook(
      () =>
        useKeysetQuery<Row, BwdCursor>({
          queryKey: ["t3"],
          getId: (r) => r.id,
          fetchPage: (cursor) => Promise.resolve(pages[cursor?.before_id ?? ""]),
        }),
      { wrapper: wrapper() },
    );

    await waitFor(() => expect(result.current.items).toHaveLength(2));
    await act(async () => {
      await result.current.fetchNextPage();
    });

    await waitFor(() => expect(result.current.items.map((r) => r.id)).toEqual(["z", "y", "x"]));
    expect(result.current.hasNextPage).toBe(false);
  });
});

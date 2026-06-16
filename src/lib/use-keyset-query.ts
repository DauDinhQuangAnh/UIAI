import { useInfiniteQuery, type QueryKey } from "@tanstack/react-query";

// A page of a keyset-paginated list. `nextCursor` MUST be undefined when the
// server omits/empties the cursor — that is the stop signal (the schema cursor is
// non-nullable, so callers normalize an absent/empty cursor to undefined).
export interface KeysetPage<TItem, TCursor> {
  items: TItem[];
  nextCursor: TCursor | undefined;
}

interface UseKeysetQueryArgs<TItem, TCursor> {
  queryKey: QueryKey;
  // Fetch one page given the cursor (undefined for the first page). The caller
  // owns cursor direction — forward (after_*) vs backward (before_*, conversations)
  // — by applying `cursor` to the correct query params and returning the next one.
  fetchPage: (cursor: TCursor | undefined) => Promise<KeysetPage<TItem, TCursor>>;
  getId: (item: TItem) => string;
  enabled?: boolean;
  staleTime?: number;
}

/**
 * Cursor-direction-agnostic infinite list core: dedups accumulated items by id
 * (servers can repeat a boundary row across pages) and stops when fetchPage
 * returns an undefined nextCursor. Direction lives entirely in fetchPage.
 */
export function useKeysetQuery<TItem, TCursor>({
  queryKey,
  fetchPage,
  getId,
  enabled = true,
  staleTime,
}: UseKeysetQueryArgs<TItem, TCursor>) {
  const query = useInfiniteQuery({
    queryKey,
    enabled,
    staleTime,
    initialPageParam: undefined as TCursor | undefined,
    queryFn: ({ pageParam }) => fetchPage(pageParam as TCursor | undefined),
    // Returning undefined ends pagination — TanStack Query treats it as "no more".
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const items = dedupeById(query.data?.pages.flatMap((p) => p.items) ?? [], getId);

  return {
    items,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  };
}

function dedupeById<TItem>(items: TItem[], getId: (item: TItem) => string): TItem[] {
  const seen = new Set<string>();
  const out: TItem[] = [];
  for (const item of items) {
    const id = getId(item);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(item);
  }
  return out;
}

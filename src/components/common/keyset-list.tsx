import { Button } from "@/components/ui/button";

interface KeysetListProps<TItem> {
  items: TItem[];
  isLoading: boolean;
  isError?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage: () => void;
  onRetry?: () => void;
  // Render the accumulated items (table body, card grid, etc.).
  children: (items: TItem[]) => React.ReactNode;
  skeleton: React.ReactNode;
  empty: React.ReactNode;
}

/**
 * Presentational shell for any keyset-paginated list: loading skeleton, error
 * retry, empty state, the caller's item rendering, and a "Load more" button
 * (never offset pagination). Cursor mechanics live in useKeysetQuery.
 */
export function KeysetList<TItem>({
  items,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  onRetry,
  children,
  skeleton,
  empty,
}: KeysetListProps<TItem>) {
  if (isLoading) return <>{skeleton}</>;

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-danger-border bg-danger-bg px-6 py-12 text-center">
        <p className="text-sm text-danger-fg">Không thể tải danh sách này.</p>
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Thử lại
          </Button>
        )}
      </div>
    );
  }

  if (items.length === 0) return <>{empty}</>;

  return (
    <div className="flex flex-col gap-4">
      {children(items)}
      {hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchNextPage()}
            loading={isFetchingNextPage}
          >
            Xem thêm
          </Button>
        </div>
      )}
    </div>
  );
}

import { Link } from "@tanstack/react-router";
import { Warning, MagnifyingGlass } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

// Full-page fallback for an uncaught render/loader error (router defaultErrorComponent).
// Offers retry (reset) and an escape hatch back to the app.
export function ErrorFallback({ reset }: { reset?: () => void }) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 p-8 text-center">
      <span className="flex size-14 items-center justify-center rounded-pill bg-danger-bg text-danger-fg">
        <Warning className="size-7" aria-hidden />
      </span>
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold text-text-primary">Đã xảy ra lỗi</h1>
        <p className="max-w-md text-sm text-text-secondary">
          Đã xảy ra lỗi không mong muốn. Bạn có thể thử lại hoặc quay về danh sách Agents.
        </p>
      </div>
      <div className="flex gap-3">
        {reset && (
          <Button variant="secondary" onClick={reset}>
            Thử lại
          </Button>
        )}
        <Button asChild>
          <Link to="/agents">Quay lại danh sách Agents</Link>
        </Button>
      </div>
    </div>
  );
}

// Full-page fallback for an unmatched route (router defaultNotFoundComponent).
export function NotFound() {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 p-8 text-center">
      <span className="flex size-14 items-center justify-center rounded-pill bg-brand-50 text-brand-600">
        <MagnifyingGlass className="size-7" aria-hidden />
      </span>
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-semibold text-text-primary">Không tìm thấy trang</h1>
        <p className="max-w-md text-sm text-text-secondary">
          Trang bạn đang tìm không tồn tại hoặc đã được di chuyển.
        </p>
      </div>
      <Button asChild>
        <Link to="/agents">Quay lại danh sách Agents</Link>
      </Button>
    </div>
  );
}

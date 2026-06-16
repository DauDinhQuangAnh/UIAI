import { useState } from "react";
import { X } from "@phosphor-icons/react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

// Sidebar fixed >=1024px; collapsible overlay drawer below. min-h-[100dvh] keeps
// mobile viewport correct (design §7).
export function AppShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-[100dvh] bg-background">
      {/* Persistent sidebar (desktop). */}
      <aside className="hidden lg:block">
        <Sidebar />
      </aside>

      {/* Mobile drawer. */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-[rgba(28,26,34,0.5)]"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <div className="absolute left-0 top-0 h-full shadow-lg">
            <Sidebar onNavigate={() => setDrawerOpen(false)} />
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
          aria-label="Đóng điều hướng"
              className="absolute right-2 top-3 rounded-md p-1.5 text-text-secondary hover:bg-surface-2 focus-visible:outline-none focus-visible:shadow-focus"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenNav={() => setDrawerOpen(true)} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

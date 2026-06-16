import { Link, useNavigate } from "@tanstack/react-router";
import { List, UserCircle, SignOut, Gear } from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { AgentSwitcher } from "./agent-switcher";
import { useSession } from "@/auth/session-store";
import { useLogout } from "@/api/hooks/auth";
import { isAdmin } from "@/auth/guards";

export function Topbar({ onOpenNav }: { onOpenNav: () => void }) {
  const navigate = useNavigate();
  const user = useSession((s) => s.user);
  const logout = useLogout();

  const onLogout = () =>
    logout.mutate(undefined, { onSettled: () => navigate({ to: "/login" }) });

  return (
    <header className="flex h-14 items-center gap-3 border-b border-border bg-surface px-4">
      <button
        type="button"
        onClick={onOpenNav}
        aria-label="Mở điều hướng"
        className="rounded-md p-1.5 text-text-secondary hover:bg-surface-2 focus-visible:outline-none focus-visible:shadow-focus lg:hidden"
      >
        <List className="size-5" aria-hidden />
      </button>

      <AgentSwitcher />

      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-pill px-2 py-1 text-sm text-text-secondary hover:bg-surface-2 focus-visible:outline-none focus-visible:shadow-focus">
            <UserCircle className="size-6 text-text-dim" aria-hidden />
            <span className="hidden max-w-[10rem] truncate sm:inline">
              {user?.display_name || user?.email || "Tài khoản"}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-1">
                <span className="truncate text-sm text-text-primary">{user?.email}</span>
                {user?.role && (
                  <Badge tone={isAdmin(user.role) ? "brand" : "neutral"} className="w-fit">
                    {user.role}
                  </Badge>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/account">
                <Gear className="size-4" aria-hidden /> Tài khoản
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onLogout}>
              <SignOut className="size-4" aria-hidden /> Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

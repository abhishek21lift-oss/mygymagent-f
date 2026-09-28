"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { ChevronsLeft, ChevronsRight, LogOut, Menu, Moon, Sun, User as UserIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AICommandBar } from "@/components/app-shell/ai-command-bar";
import { NotificationCenter } from "@/components/app-shell/notification-center";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/auth-context";

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export function Topbar({
  onOpenMobileNav,
  sidebarCollapsed = false,
  onToggleSidebar,
}: {
  onOpenMobileNav: () => void;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    // Sticky rather than fixed, and translucent: the canvas scrolls
    // underneath it, so the bar refracts the aurora instead of sitting
    // on a flat band of the page colour. It floats — inset from the
    // edges, rounded on all four corners — which is what makes it read
    // as a separate pane instead of as the header of a document.
    <header className="sticky top-0 z-40 shrink-0 px-2 pt-2 sm:px-3">
      <div className="glass flex h-[var(--header-height)] items-center gap-2 rounded-3xl px-2 sm:px-3">
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="hidden size-10 rounded-2xl md:inline-flex"
            onClick={onToggleSidebar}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <ChevronsRight className="size-[1.15rem]" aria-hidden="true" />
            ) : (
              <ChevronsLeft className="size-[1.15rem]" aria-hidden="true" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-10 rounded-2xl md:hidden"
            onClick={onOpenMobileNav}
            aria-label="Open navigation"
          >
            <Menu className="size-[1.15rem]" aria-hidden="true" />
          </Button>
        </div>

        <div className="flex min-w-0 flex-1 justify-end sm:justify-start">
          <div className="w-full max-w-2xl">
            <AICommandBar />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <NotificationCenter />
          <Button
            variant="ghost"
            size="icon"
            className="size-10 rounded-2xl"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            <Sun className="size-[1.15rem] dark:hidden" aria-hidden="true" />
            <Moon className="hidden size-[1.15rem] dark:block" aria-hidden="true" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-11 gap-2 rounded-2xl px-1.5"
                aria-label={user ? `Account: ${user.firstName} ${user.lastName}` : "Account"}
              >
                <Avatar className="size-8 border border-border">
                  <AvatarFallback className="bg-primary text-[11px] font-bold text-primary-foreground">
                    {user ? (
                      initials(user.firstName, user.lastName)
                    ) : (
                      <UserIcon className="size-4" aria-hidden="true" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden pr-1 text-sm font-semibold tracking-tight sm:inline">
                  {user ? `${user.firstName} ${user.lastName}` : ""}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-1.5">
              <DropdownMenuLabel className="px-3 py-2.5 font-normal">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold tracking-tight">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" className="min-h-11" onClick={handleLogout}>
                <LogOut aria-hidden="true" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { ChevronsLeft, ChevronsRight, LogOut, Menu, Moon, Sun, User as UserIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AICommandBar } from "@/components/app-shell/ai-command-bar";
import { TopbarSearch } from "@/components/app-shell/topbar-search";
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

/** WhatsApp brand glyph (inline SVG, no extra dependency). */
function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.074-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
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
  const { user, hasPermission, logout } = useAuth();
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
    // viewport-fit=cover draws the page under the status bar / notch
    // (installed app, landscape), so the bar starts below it.
    <header className="sticky top-0 z-40 shrink-0 px-2 pt-[calc(0.5rem+env(safe-area-inset-top))] sm:px-3">
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
            <TopbarSearch />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {hasPermission("whatsapp.read") && (
            <Link
              href="/whatsapp"
              aria-label="WhatsApp dashboard"
              title="WhatsApp dashboard"
              className="flex size-10 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-sm transition-colors hover:bg-[#1EBE5B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:bg-[#189A4B] active:scale-95"
            >
              <WhatsAppGlyph className="size-[1.15rem]" />
            </Link>
          )}
          <AICommandBar />
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

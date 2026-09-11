"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { ChevronsLeft, ChevronsRight, LogOut, Menu, Moon, Sun, User as UserIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AICommandBar } from "@/components/app-shell/ai-command-bar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/auth-context";

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export function Topbar({ onOpenMobileNav, sidebarCollapsed = false, onToggleSidebar }: { onOpenMobileNav: () => void; sidebarCollapsed?: boolean; onToggleSidebar?: () => void }) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-white/90 bg-gradient-to-r from-white/88 via-violet-50/85 to-cyan-50/85 shadow-[0_16px_45px_-30px_rgba(79,70,229,.4)] backdrop-blur-xl dark:border-white/10 dark:from-background/95 dark:via-primary/10 dark:to-ai/10">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-violet-500/50 to-fuchsia-500/40" aria-hidden="true" />
      <div className="mx-auto flex min-h-[3.35rem] w-full items-center gap-2 px-3 py-1.5 pt-[calc(env(safe-area-inset-top)+0.375rem)] sm:min-h-[3.75rem] sm:px-5 sm:py-1.5 sm:pt-1.5">
        <div className="flex shrink-0 items-center gap-1 rounded-[19px] border border-white/90 bg-white/85 p-1 shadow-[0_16px_45px_-30px_rgba(79,70,229,.4)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
          <Button variant="ghost" size="icon" className="hidden min-h-11 min-w-11 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 md:inline-flex" onClick={onToggleSidebar} aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {sidebarCollapsed ? <ChevronsRight className="size-4.5" aria-hidden="true" /> : <ChevronsLeft className="size-4.5" aria-hidden="true" />}
          </Button>
          <Button variant="ghost" size="icon" className="min-h-11 min-w-11 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 md:hidden" onClick={onOpenMobileNav} aria-label="Open navigation">
            <Menu className="size-4.5" aria-hidden="true" />
          </Button>
        </div>

        <div className="hidden min-w-0 flex-1 md:block">
          <AICommandBar />
        </div>
        <div className="flex-1 md:hidden" />

        <div className="flex shrink-0 items-center gap-1 rounded-[19px] border border-white/90 bg-white/85 p-1 shadow-[0_16px_45px_-30px_rgba(79,70,229,.4)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
          <Button variant="ghost" size="icon" className="min-h-11 min-w-11 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme">
            <Sun className="size-4 dark:hidden" aria-hidden="true" /><Moon className="hidden size-4 dark:block" aria-hidden="true" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="min-h-11 gap-2 rounded-2xl border border-transparent bg-white/60 p-1 pr-1.5 pl-1 shadow-sm hover:border-violet-200 hover:bg-white/95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 sm:pl-1 dark:bg-white/5 dark:hover:bg-white/10">
                <Avatar className="size-9 border border-white/80 shadow-md shadow-violet-500/20"><AvatarFallback className="bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-xs font-black text-white">{user ? initials(user.firstName, user.lastName) : <UserIcon className="size-4" aria-hidden="true" />}</AvatarFallback></Avatar>
                <span className="hidden text-sm font-bold tracking-tight text-stone-900 sm:inline dark:text-stone-100">{user ? `${user.firstName} ${user.lastName}` : ""}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-[22px] border-white/90 bg-white/95 p-1.5 shadow-[0_28px_70px_-38px_rgba(79,70,229,.5)] backdrop-blur-xl dark:border-white/10 dark:bg-card/95">
              <DropdownMenuLabel className="rounded-2xl bg-gradient-to-r from-violet-50/80 via-white to-cyan-50/60 px-3 py-2.5 font-normal dark:from-white/5 dark:via-transparent dark:to-transparent">
                <div className="flex flex-col gap-0.5"><span className="text-sm font-extrabold tracking-tight text-stone-950 dark:text-white">{user?.firstName} {user?.lastName}</span><span className="text-xs font-medium text-stone-600 dark:text-stone-300">{user?.email}</span></div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" className="min-h-11 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500" onClick={handleLogout}><LogOut aria-hidden="true" />Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

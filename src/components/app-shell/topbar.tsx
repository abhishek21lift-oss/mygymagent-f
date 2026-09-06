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
    <header className="sticky top-0 z-40 flex h-[4.5rem] shrink-0 items-center gap-3 border-b border-white/70 bg-white/72 px-3 shadow-[0_8px_30px_rgba(64,40,120,0.06)] backdrop-blur-2xl sm:px-5 dark:border-white/10 dark:bg-background/75">
      <Button variant="ghost" size="icon" className="hidden shrink-0 rounded-2xl border border-transparent hover:border-primary/10 md:inline-flex" onClick={onToggleSidebar} aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
        {sidebarCollapsed ? <ChevronsRight className="size-5" /> : <ChevronsLeft className="size-5" />}
      </Button>
      <Button variant="ghost" size="icon" className="shrink-0 rounded-2xl md:hidden" onClick={onOpenMobileNav}>
        <Menu className="size-5" /><span className="sr-only">Open navigation</span>
      </Button>

      <AICommandBar />
      <div className="flex-1 md:hidden" />

      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="icon" className="rounded-2xl" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme">
          <Sun className="size-4 dark:hidden" /><Moon className="hidden size-4 dark:block" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 rounded-2xl border border-transparent bg-white/45 pr-2 pl-1.5 shadow-sm hover:border-primary/10 hover:bg-white/80 dark:bg-white/5">
              <Avatar className="size-8 border border-primary/15 shadow-sm"><AvatarFallback className="bg-gradient-to-br from-primary/15 to-ai/15 text-xs font-bold text-primary">{user ? initials(user.firstName, user.lastName) : <UserIcon className="size-4" />}</AvatarFallback></Avatar>
              <span className="hidden text-sm font-semibold sm:inline">{user ? `${user.firstName} ${user.lastName}` : ""}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 rounded-2xl border-white/80 bg-white/92 p-1.5 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-card/95">
            <DropdownMenuLabel className="rounded-xl px-3 py-2.5 font-normal">
              <div className="flex flex-col gap-0.5"><span className="text-sm font-semibold">{user?.firstName} {user?.lastName}</span><span className="text-xs text-muted-foreground">{user?.email}</span></div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" className="rounded-xl" onClick={handleLogout}><LogOut />Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

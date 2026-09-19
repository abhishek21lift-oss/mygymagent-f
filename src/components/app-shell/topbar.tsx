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
    <header className="relative z-40 shrink-0 border-b border-[#241a08] bg-gradient-to-b from-[#f4ecd4] via-[#d9cba4] to-[#a89a76] shadow-[inset_0_1px_0_#fffdf2,0_4px_14px_rgba(0,0,0,0.45)] dark:from-[#453b28] dark:via-[#332a1c] dark:to-[#241d12]">
      {/* brushing + rivets */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.06)_0_1px,transparent_1px_2px)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-3 top-1/2 hidden h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-[#5c4f38]/40 to-transparent sm:block" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10px_50%,#fff6d8_0_1.5px,#8a6a2f_2.5px,#241a08_3.5px,transparent_4.5px),radial-gradient(circle_at_calc(100%-10px)_50%,#fff6d8_0_1.5px,#8a6a2f_2.5px,#241a08_3.5px,transparent_4.5px)] bg-no-repeat" />
      {/* engraved bottom groove */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-b from-[#4a3f2a] to-[#241a08]" aria-hidden="true" />

      <div className="relative mx-auto flex min-h-[3.6rem] w-full items-center gap-2 px-3 py-1.5 pt-[calc(env(safe-area-inset-top)+0.375rem)] sm:min-h-[4rem] sm:px-5 sm:py-1.5 sm:pt-1.5">
        <div className="flex shrink-0 items-center gap-1 rounded-[12px] border border-[#5c4f38] bg-gradient-to-b from-[#efe6cc] to-[#b7a87f] p-1 shadow-[inset_0_1px_0_#fff,0_3px_0_#4a3f2a,0_6px_12px_rgba(0,0,0,0.35)]">
          <Button variant="ghost" size="icon" className="hidden min-h-10 min-w-10 rounded-[9px] md:inline-flex" onClick={onToggleSidebar} aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {sidebarCollapsed ? <ChevronsRight className="size-4.5" aria-hidden="true" /> : <ChevronsLeft className="size-4.5" aria-hidden="true" />}
          </Button>
          <Button variant="ghost" size="icon" className="min-h-10 min-w-10 rounded-[9px] md:hidden" onClick={onOpenMobileNav} aria-label="Open navigation">
            <Menu className="size-4.5" aria-hidden="true" />
          </Button>
        </div>

        <div className="flex min-w-0 flex-1 justify-end sm:justify-start">
          <AICommandBar />
        </div>

        <div className="flex shrink-0 items-center gap-1 rounded-[12px] border border-[#5c4f38] bg-gradient-to-b from-[#efe6cc] to-[#b7a87f] p-1 shadow-[inset_0_1px_0_#fff,0_3px_0_#4a3f2a,0_6px_12px_rgba(0,0,0,0.35)]">
          <Button variant="ghost" size="icon" className="min-h-10 min-w-10 rounded-[9px]" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme">
            <Sun className="size-4 dark:hidden" aria-hidden="true" /><Moon className="hidden size-4 dark:block" aria-hidden="true" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="min-h-10 gap-2 rounded-[9px] border border-[#4a360f] bg-gradient-to-b from-[#ffedb0] via-[#c99b3f] to-[#8a6420] p-1 pr-2 pl-1 text-[#241a08] shadow-[inset_0_1px_0_rgba(255,250,220,0.9),0_2px_0_#3a2a0c]">
                <Avatar className="size-8 border border-[#241a08] shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]"><AvatarFallback className="bg-gradient-to-b from-[#2b2114] to-[#170e07] text-[11px] font-black text-[#ffe9a8]">{user ? initials(user.firstName, user.lastName) : <UserIcon className="size-4" aria-hidden="true" />}</AvatarFallback></Avatar>
                <span className="hidden text-sm font-black tracking-tight sm:inline" style={{ textShadow: "0 1px 0 rgba(255,245,200,0.8)" }}>{user ? `${user.firstName} ${user.lastName}` : ""}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-[12px] p-1.5">
              <DropdownMenuLabel className="rounded-[9px] border border-[#4a360f] bg-gradient-to-b from-[#3a2c1a] to-[#241a0e] px-3 py-2.5 font-normal shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">
                <div className="flex flex-col gap-0.5"><span className="text-sm font-black tracking-tight text-[#ffe9a8]" style={{ textShadow: "0 -1px 0 #000" }}>{user?.firstName} {user?.lastName}</span><span className="font-mono text-xs text-[#c9b586]">{user?.email}</span></div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" className="min-h-11 rounded-[9px]" onClick={handleLogout}><LogOut aria-hidden="true" />Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

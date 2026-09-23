"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { ChevronsLeft, ChevronsRight, LogOut, Menu, Moon, Sun, User as UserIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AICommandBar } from "@/components/app-shell/ai-command-bar";
import { NotificationCenter } from "@/components/app-shell/notification-center";
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
 <header className="relative z-40 shrink-0 border-b border-border/60 bg-background">
 <div className="mx-auto flex h-[var(--header-height)] w-full items-center gap-2 px-3 py-0 pt-[calc(env(safe-area-inset-top)+0.5rem)] sm:px-4 sm:pt-2">
 <div className="flex shrink-0 items-center gap-1">
 <Button variant="ghost" size="icon" className="hidden size-9 rounded-md hover:bg-muted md:inline-flex" onClick={onToggleSidebar} aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
 {sidebarCollapsed ? <ChevronsRight className="size-4" aria-hidden="true" /> : <ChevronsLeft className="size-4" aria-hidden="true" />}
 </Button>
 <Button variant="ghost" size="icon" className="size-9 rounded-md hover:bg-muted md:hidden" onClick={onOpenMobileNav} aria-label="Open navigation">
 <Menu className="size-4" aria-hidden="true" />
 </Button>
 </div>
 <div className="flex min-w-0 flex-1 justify-end sm:justify-start"><div className="w-full max-w-2xl"><AICommandBar /></div></div>
 <div className="flex shrink-0 items-center gap-1">
 <NotificationCenter />
 <Button variant="ghost" size="icon" className="size-9 rounded-md hover:bg-muted" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme">
 <Sun className="size-4 dark:hidden" aria-hidden="true" /><Moon className="hidden size-4 dark:block" aria-hidden="true" />
 </Button>
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="ghost" className="h-9 gap-2 rounded-md px-2 hover:bg-muted" aria-label={user ? `Account: ${user.firstName} ${user.lastName}` : "Account"}>
 <Avatar className="size-8 border border-border/60 shadow-sm"><AvatarFallback className="bg-primary/15 text-xs font-bold">{user ? initials(user.firstName, user.lastName) : <UserIcon className="size-4" aria-hidden="true" />}</AvatarFallback></Avatar>
 <span className="hidden text-sm font-semibold tracking-tight sm:inline">{user ? `${user.firstName} ${user.lastName}` : ""}</span>
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-64 rounded-lg border-border/60 p-1.5 shadow-sm ">
 <DropdownMenuLabel className="px-3 py-2.5 font-normal">
 <div className="flex flex-col gap-0.5"><span className="text-sm font-semibold tracking-tight">{user?.firstName} {user?.lastName}</span><span className="font-mono text-xs text-muted-foreground">{user?.email}</span></div>
 </DropdownMenuLabel>
 <DropdownMenuSeparator />
 <DropdownMenuItem variant="destructive" className="min-h-11 rounded-xl" onClick={handleLogout}><LogOut aria-hidden="true" />Log out</DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 </div>
 </header>
 );
}

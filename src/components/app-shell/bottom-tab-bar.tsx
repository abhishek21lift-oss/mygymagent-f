"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { CalendarCheck, LayoutDashboard, Menu, Sparkles, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import { isNavItemActive } from "@/lib/nav-config";

interface TabItem {
 title: string;
 href: string;
 icon: LucideIcon;
 permission?: string | string[];
}

const leftTabs: TabItem[] = [
 { title: "Home", href: "/dashboard", icon: LayoutDashboard },
 { title: "Members", href: "/members", icon: Users, permission: ["members.read", "members.read_assigned"] },
];

const rightTabs: TabItem[] = [
 { title: "Attendance", href: "/attendance", icon: CalendarCheck, permission: "attendance.read" },
];

function TabLink({ tab, active }: { tab: TabItem; active: boolean }) {
 const Icon = tab.icon;
 return (
 <Link href={tab.href} aria-current={active ? "page" : undefined} className={cn( "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 touch-manipulation rounded-xl transition-all duration-200 focus-visible:outline-2 focus-visible:outline-ring",
 active ? "bg-primary/12 font-semibold text-primary" : "font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground",
 )}>
 {active && <span aria-hidden="true" className="absolute top-1 h-1 w-7 rounded-full bg-primary" />}
 <Icon className="size-5 shrink-0" aria-hidden="true" strokeWidth={active ? 2.5 : 2} />
 <span className="text-xs tracking-tight">{tab.title}</span>
 </Link>
 );
}

export function BottomTabBar({ onOpenMore }: { onOpenMore: () => void }) {
 const pathname = usePathname();
 const { hasPermission } = useAuth();
 const visibleLeft = leftTabs.filter((tab) => !tab.permission || hasPermission(tab.permission));
 const visibleRight = rightTabs.filter((tab) => !tab.permission || hasPermission(tab.permission));
 const aiActive = isNavItemActive(pathname, "/ai") || isNavItemActive(pathname, "/ai-actions");

 return (
 <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/80 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(0,0,0,0.06)] md:hidden">
 <div className="relative mx-auto flex max-w-lg items-stretch justify-between gap-1 px-2 py-1.5">
 {visibleLeft.map((tab) => <TabLink key={tab.href} tab={tab} active={isNavItemActive(pathname, tab.href)} />)}
 <Link href="/ai" aria-label="AI Agent" aria-current={aiActive ? "page" : undefined} className="relative -mt-6 flex flex-1 touch-manipulation flex-col items-center justify-end gap-1 rounded-xl pb-1 focus-visible:outline-2 focus-visible:outline-ring">
 <span className={cn("flex size-14 items-center justify-center rounded-full border shadow-lg transition-transform", aiActive ? "scale-105 border-violet-400 bg-violet-500 text-white" : "border-border bg-violet-500 text-white")}>
 <Sparkles className="size-5" aria-hidden="true" strokeWidth={2.5} />
 </span>
 <span className={cn("rounded-full border px-2 py-0.5 text-xs font-semibold tracking-tight", aiActive ? "border-violet-300/60 bg-violet-500/10 text-violet-700 dark:text-violet-200" : "border-border bg-background/90 text-muted-foreground")}>AI</span>
 </Link>
 {visibleRight.map((tab) => <TabLink key={tab.href} tab={tab} active={isNavItemActive(pathname, tab.href)} />)}
 <button type="button" onClick={onOpenMore} className="flex min-h-14 flex-1 touch-manipulation flex-col items-center justify-center gap-0.5 rounded-xl font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring" aria-label="More navigation">
 <Menu className="size-5 shrink-0" aria-hidden="true" />
 <span className="text-xs tracking-tight">More</span>
 </button>
 </div>
 </nav>
 );
}

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
  { title: "Home", href: "/command-center", icon: LayoutDashboard },
  { title: "Members", href: "/members", icon: Users, permission: ["members.read", "members.read_assigned"] },
];

const rightTabs: TabItem[] = [
  { title: "Attendance", href: "/attendance", icon: CalendarCheck, permission: "attendance.read" },
];

function TabLink({ tab, active }: { tab: TabItem; active: boolean }) {
  const Icon = tab.icon;
  return (
    <Link
      href={tab.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 touch-manipulation transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-violet-600",
        active ? "text-violet-700 dark:text-violet-300" : "text-sidebar-foreground/55 active:text-violet-700",
      )}
    >
      {active && (
        <span aria-hidden="true" className="absolute top-0.5 h-1 w-6 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600" />
      )}
      <Icon className="size-5 shrink-0" aria-hidden="true" />
      <span className="text-[10px] font-bold tracking-tight">{tab.title}</span>
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
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/90 bg-white/92 pb-[env(safe-area-inset-bottom)] shadow-[0_-16px_40px_-28px_rgba(79,70,229,.35)] backdrop-blur-xl md:hidden dark:border-white/10 dark:bg-card/95"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-between px-1">
        {visibleLeft.map((tab) => (
          <TabLink key={tab.href} tab={tab} active={isNavItemActive(pathname, tab.href)} />
        ))}

        <Link
          href="/ai"
          aria-label="AI Agent"
          aria-current={aiActive ? "page" : undefined}
          className="relative -mt-5 flex flex-1 touch-manipulation flex-col items-center justify-end gap-1 pb-1.5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-violet-600"
        >
          <span
            className={cn(
              "flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/40 ring-4 ring-white transition-transform dark:ring-card",
              aiActive && "scale-105",
            )}
          >
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <span
            className={cn(
              "text-[10px] font-bold tracking-tight",
              aiActive ? "text-violet-700 dark:text-violet-300" : "text-sidebar-foreground/55",
            )}
          >
            AI
          </span>
        </Link>

        {visibleRight.map((tab) => (
          <TabLink key={tab.href} tab={tab} active={isNavItemActive(pathname, tab.href)} />
        ))}

        <button
          type="button"
          onClick={onOpenMore}
          className="flex min-h-14 flex-1 touch-manipulation flex-col items-center justify-center gap-0.5 text-sidebar-foreground/55 transition-colors active:text-violet-700 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-violet-600"
          aria-label="More navigation"
        >
          <Menu className="size-5 shrink-0" aria-hidden="true" />
          <span className="text-[10px] font-bold tracking-tight">More</span>
        </button>
      </div>
    </nav>
  );
}

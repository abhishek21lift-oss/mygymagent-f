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
  {
    title: "Members",
    href: "/members",
    icon: Users,
    permission: ["members.read", "members.read_assigned"],
  },
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
        "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 touch-manipulation rounded-2xl px-1 transition-all duration-200",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        active
          ? "font-semibold text-foreground"
          : "font-medium text-muted-foreground hover:bg-surface-hover hover:text-foreground",
      )}
      style={active ? { background: "var(--accent)", color: "var(--accent-foreground)" } : undefined}
    >
      <Icon className="size-5 shrink-0" aria-hidden="true" strokeWidth={active ? 2.4 : 2} />
      <span className="text-[11px] tracking-tight">{tab.title}</span>
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
    // Floating, inset from the edges, glass. The previous version was a
    // full-bleed band pinned to the bottom edge with a hard top border,
    // which on a phone with a home indicator left the last 20px of
    // content permanently underneath it. Insetting and rounding it means
    // the safe area reads as space, not as a bar sitting on the UI.
    <nav
      aria-label="Primary"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] md:hidden"
    >
      <div className="glass pointer-events-auto mx-auto flex max-w-lg items-stretch justify-between gap-1 rounded-3xl p-1.5">
        {visibleLeft.map((tab) => (
          <TabLink key={tab.href} tab={tab} active={isNavItemActive(pathname, tab.href)} />
        ))}

        {/* The agent is the one destination a gym owner opens to be told
            what to do, so it is the one that breaks the bar's line: a
            raised gradient disc, the way a camera or a record button
            breaks a toolbar. */}
        <Link
          href="/ai"
          aria-label="AI Agent"
          aria-current={aiActive ? "page" : undefined}
          className="relative -mt-7 flex flex-1 touch-manipulation flex-col items-center justify-end gap-1 rounded-3xl pb-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <span
            className={cn(
              "flex size-14 items-center justify-center rounded-full border-2 border-background text-white shadow-lg transition-transform duration-200",
              aiActive ? "scale-105" : "",
            )}
            style={{ backgroundImage: "var(--brand-grad)" }}
          >
            <Sparkles className="size-5" aria-hidden="true" strokeWidth={2.5} />
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-tight",
              aiActive ? "text-foreground" : "text-muted-foreground",
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
          className="flex min-h-14 flex-1 touch-manipulation flex-col items-center justify-center gap-1 rounded-2xl px-1 font-medium text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          aria-label="More navigation"
        >
          <Menu className="size-5 shrink-0" aria-hidden="true" />
          <span className="text-[11px] tracking-tight">More</span>
        </button>
      </div>
    </nav>
  );
}

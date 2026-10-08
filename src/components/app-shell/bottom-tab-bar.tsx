"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { CalendarCheck, LayoutDashboard, Menu, Sparkles, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import { accentForPath } from "@/lib/section-accent";
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
  const accent = accentForPath(tab.href);
  return (
    <Link
      href={tab.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex min-h-14 flex-1 touch-manipulation flex-col items-center justify-center gap-1 rounded-2xl px-1 transition-all duration-200",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        active
          ? "font-semibold text-foreground"
          : "font-medium text-muted-foreground hover:text-foreground",
      )}
      style={
        active
          ? {
              background: `linear-gradient(135deg, color-mix(in oklab, var(--a-${accent}-grad-1) 18%, var(--card)) 0%, color-mix(in oklab, var(--a-${accent}-grad-2) 12%, var(--card)) 100%)`,
              boxShadow: `inset 0 0 0 1px color-mix(in oklab, var(--a-${accent}) 22%, transparent)`,
            }
          : undefined
      }
    >
      {/* Active: solid gradient icon; inactive: muted icon */}
      <span
        className={cn(
          "flex size-6 items-center justify-center transition-transform duration-200",
          active && "scale-110",
        )}
        style={active ? { color: `var(--a-${accent}-ink)` } : undefined}
      >
        <Icon className="size-5 shrink-0" aria-hidden="true" strokeWidth={active ? 2.4 : 2} />
      </span>
      <span
        className="text-[11px] tracking-tight"
        style={active ? { color: `var(--a-${accent}-ink)` } : undefined}
      >
        {tab.title}
      </span>
    </Link>
  );
}

export function BottomTabBar({ onOpenMore }: { onOpenMore: () => void }) {
  const pathname = usePathname();
  const { hasPermission } = useAuth();
  const visibleLeft  = leftTabs.filter((tab) => !tab.permission || hasPermission(tab.permission));
  const visibleRight = rightTabs.filter((tab) => !tab.permission || hasPermission(tab.permission));
  const aiActive = isNavItemActive(pathname, "/ai") || isNavItemActive(pathname, "/ai-actions");

  return (
    /**
     * Floating bar, inset from screen edges so the safe-area bottom
     * reads as space rather than a bar sitting on the content. The
     * glass class (globals.css) provides the surface, border and
     * shadow — no extra visual props needed here.
     */
    <nav
      aria-label="Primary"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] md:hidden"
    >
      <div className="glass pointer-events-auto mx-auto flex max-w-lg items-stretch justify-between gap-1 rounded-3xl p-1.5">

        {visibleLeft.map((tab) => (
          <TabLink key={tab.href} tab={tab} active={isNavItemActive(pathname, tab.href)} />
        ))}

        {/* The AI button breaks the bar's line: a raised gradient disc,
            consistent with how the brand-neon disc works on the sign-in
            screen. Lifted with a negative top margin so it visually
            floats above the bar. */}
        <Link
          href="/ai"
          aria-label="AI Agent"
          aria-current={aiActive ? "page" : undefined}
          className={cn(
            "relative -mt-7 flex flex-1 touch-manipulation flex-col items-center justify-end gap-1 rounded-3xl pb-1",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          )}
        >
          <span
            className={cn(
              "flex size-14 items-center justify-center rounded-full border-2 border-background text-white",
              "shadow-[0_8px_24px_-8px_var(--brand-2)]",
              "transition-transform duration-200",
              aiActive ? "scale-105" : "",
            )}
            style={{ backgroundImage: "var(--brand-grad)" }}
          >
            <Sparkles className="size-5" aria-hidden="true" strokeWidth={2.5} />
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-tight transition-colors",
              aiActive ? "text-foreground" : "text-muted-foreground",
            )}
          >
            AI
          </span>
        </Link>

        {visibleRight.map((tab) => (
          <TabLink key={tab.href} tab={tab} active={isNavItemActive(pathname, tab.href)} />
        ))}

        {/* "More" opens the mobile drawer */}
        <button
          type="button"
          onClick={onOpenMore}
          className={cn(
            "flex min-h-14 flex-1 touch-manipulation flex-col items-center justify-center gap-1 rounded-2xl px-1",
            "font-medium text-muted-foreground transition-colors",
            "hover:bg-surface-hover hover:text-foreground",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          )}
          aria-label="More navigation"
        >
          <Menu className="size-5 shrink-0" aria-hidden="true" />
          <span className="text-[11px] tracking-tight">More</span>
        </button>

      </div>
    </nav>
  );
}

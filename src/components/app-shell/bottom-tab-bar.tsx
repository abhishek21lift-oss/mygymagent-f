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
        "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 touch-manipulation rounded-[10px] border transition-all focus-visible:outline-2 focus-visible:outline-[#8a6420]",
        active
          ? "border-[#4a360f] bg-gradient-to-b from-[#ffedb0] via-[#c99b3f] to-[#8a6420] text-[#241a08] shadow-[inset_0_1px_0_rgba(255,250,220,0.9),0_2px_0_#241a08]"
          : "border-transparent text-[#8f8163] active:text-[#3a2a0c]",
      )}
      style={active ? { textShadow: "0 1px 0 rgba(255,245,200,0.9)" } : { textShadow: "0 1px 0 rgba(255,255,255,0.6)" }}
    >
      {active && (
        <span aria-hidden="true" className="absolute top-1 h-1 w-8 rounded-full bg-[#241a08] shadow-[inset_0_1px_2px_rgba(0,0,0,0.9)]" />
      )}
      <Icon className="size-5 shrink-0" aria-hidden="true" strokeWidth={active ? 2.5 : 2} />
      <span className="text-[10px] font-black tracking-tight">{tab.title}</span>
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
      className="fixed inset-x-0 bottom-0 z-40 border-t-[3px] border-[#241a08] bg-gradient-to-b from-[#f4ecd4] via-[#d9cba4] to-[#a89a76] pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(0,0,0,0.45),inset_0_1px_0_#fffdf2] md:hidden"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.06)_0_1px,transparent_1px_2px)]" />
      <div className="relative mx-auto flex max-w-lg items-stretch justify-between gap-1 px-2 py-1.5">
        {visibleLeft.map((tab) => (
          <TabLink key={tab.href} tab={tab} active={isNavItemActive(pathname, tab.href)} />
        ))}

        <Link
          href="/ai"
          aria-label="AI Agent"
          aria-current={aiActive ? "page" : undefined}
          className="relative -mt-6 flex flex-1 touch-manipulation flex-col items-center justify-end gap-1 pb-1 focus-visible:outline-2 focus-visible:outline-[#8a6420]"
        >
          <span
            className={cn(
              "flex size-14 items-center justify-center rounded-full border-[3px] text-[#241a08] transition-transform",
              aiActive
                ? "border-[#241a08] bg-gradient-to-b from-[#ffedb0] via-[#e8c25e] to-[#7a5a1e] shadow-[inset_0_2px_0_rgba(255,250,220,0.95),0_4px_0_#241a08,0_10px_22px_rgba(0,0,0,0.5),0_0_16px_rgba(255,200,80,0.5)] scale-105"
                : "border-[#241a08] bg-gradient-to-b from-[#ffedb0] via-[#c99b3f] to-[#6b5226] shadow-[inset_0_2px_0_rgba(255,250,220,0.95),0_4px_0_#241a08,0_10px_22px_rgba(0,0,0,0.5)]",
            )}
            style={{ textShadow: "0 1px 0 rgba(255,245,200,0.9)" }}
          >
            <Sparkles className="size-5" aria-hidden="true" strokeWidth={2.5} />
          </span>
          <span
            className={cn(
              "rounded-[6px] border px-2 py-0.5 text-[10px] font-black tracking-tight",
              aiActive ? "border-[#4a360f] bg-[#241a08] text-[#ffe9a8]" : "border-[#5c4f38] bg-[#efe6cc] text-[#3a2a0c]",
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
          className="flex min-h-14 flex-1 touch-manipulation flex-col items-center justify-center gap-0.5 rounded-[10px] border border-transparent text-[#8f8163] transition-colors active:text-[#3a2a0c] focus-visible:outline-2 focus-visible:outline-[#8a6420]"
          aria-label="More navigation"
        >
          <Menu className="size-5 shrink-0" aria-hidden="true" />
          <span className="text-[10px] font-black tracking-tight">More</span>
        </button>
      </div>
    </nav>
  );
}

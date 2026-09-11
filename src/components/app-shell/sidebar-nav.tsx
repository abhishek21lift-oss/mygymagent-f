"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import { primaryNav, comingSoonNav, settingsNav, type NavItem } from "@/lib/nav-config";
import { Badge } from "@/components/ui/badge";

/* Athletic Luxe — one vivid gradient per section. Literal strings only. */
function activeToneFor(href: string): string {
  if (href.startsWith("/ai")) return "from-violet-600 via-purple-600 to-fuchsia-600 shadow-violet-500/30";
  if (href.startsWith("/intelligence")) return "from-violet-600 via-purple-600 to-fuchsia-600 shadow-violet-500/30";
  if (href.startsWith("/crm")) return "from-blue-600 to-cyan-500 shadow-blue-500/30";
  if (href.startsWith("/pt-operations")) return "from-rose-500 to-orange-500 shadow-rose-500/30";
  if (href.startsWith("/workouts")) return "from-rose-500 to-orange-500 shadow-rose-500/30";
  if (href.startsWith("/workout-sessions")) return "from-rose-500 to-orange-500 shadow-rose-500/30";
  if (href.startsWith("/nutrition")) return "from-emerald-500 to-teal-600 shadow-emerald-500/30";
  if (href.startsWith("/billing")) return "from-emerald-500 to-teal-600 shadow-emerald-500/30";
  if (href.startsWith("/membership")) return "from-emerald-500 to-teal-600 shadow-emerald-500/30";
  if (href.startsWith("/attendance")) return "from-cyan-500 to-blue-600 shadow-cyan-500/30";
  if (href.startsWith("/calendar")) return "from-cyan-500 to-blue-600 shadow-cyan-500/30";
  if (href.startsWith("/inventory")) return "from-amber-500 to-orange-600 shadow-amber-500/30";
  if (href.startsWith("/staff")) return "from-indigo-500 to-violet-600 shadow-indigo-500/30";
  if (href.startsWith("/branches")) return "from-indigo-500 to-violet-600 shadow-indigo-500/30";
  if (href.startsWith("/owner-os")) return "from-amber-500 to-orange-600 shadow-amber-500/30";
  if (href.startsWith("/members")) return "from-violet-600 to-purple-600 shadow-violet-500/30";
  if (href.startsWith("/settings")) return "from-stone-700 to-stone-900 shadow-stone-500/25";
  if (href.startsWith("/command-center")) return "from-violet-600 via-purple-600 to-fuchsia-600 shadow-violet-500/30";
  return "from-violet-600 via-purple-600 to-fuchsia-600 shadow-violet-500/30";
}

function NavLink({ item, active, nested = false, collapsed = false, onNavigate, itemRef }: { item: NavItem; active: boolean; nested?: boolean; collapsed?: boolean; onNavigate?: () => void; itemRef?: React.RefObject<HTMLAnchorElement | null> }) {
  const Icon = item.icon;
  const tone = activeToneFor(item.href);
  return (
    <Link
      ref={itemRef}
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.title : undefined}
      className={cn(
        "group relative flex min-h-11 items-center overflow-hidden touch-manipulation transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600",
        collapsed ? "justify-center rounded-[19px] px-2 py-3" : nested ? "ml-3 gap-3 rounded-xl px-3 py-2.5 text-xs" : "gap-3 rounded-[19px] px-3 py-3 text-sm",
        active
          ? `bg-gradient-to-r text-white shadow-lg ${tone}`
          : "text-sidebar-foreground/70 hover:bg-white/70 hover:text-sidebar-foreground hover:shadow-sm dark:hover:bg-white/10",
        item.accent === "ai" && !active && "bg-gradient-to-r from-violet-500/10 via-fuchsia-500/5 to-transparent text-violet-700 hover:from-violet-500/15 dark:text-violet-300",
      )}
    >
      {active && <span aria-hidden="true" className="absolute inset-y-2 left-0 w-1 rounded-full bg-white/80" />}
      <span
        aria-hidden="true"
        className={cn(
          "flex shrink-0 items-center justify-center rounded-[13px] transition-transform duration-200 group-hover:scale-110",
          nested ? "size-7" : "size-9",
          active
            ? "bg-white/20 text-white ring-1 ring-white/25"
            : item.accent === "ai"
              ? "bg-gradient-to-br from-violet-500/15 to-fuchsia-500/15 text-violet-700 dark:text-violet-300"
              : "bg-stone-500/10 text-sidebar-foreground/50 group-hover:text-sidebar-foreground",
        )}
      >
        <Icon className={cn(nested ? "size-3.5" : "size-4", "shrink-0")} aria-hidden="true" />
      </span>
      {!collapsed && (
        <>
          <span className="flex-1 truncate font-semibold tracking-[-0.01em]">{item.title}</span>
          {item.comingSoon && <Badge variant="secondary" className="rounded-full px-2 py-0 text-[9px] font-bold uppercase tracking-wider">Soon</Badge>}
        </>
      )}
    </Link>
  );
}

function permissionVisible(item: NavItem, hasPermission: (permission: string | string[]) => boolean) {
  return !item.permission || hasPermission(item.permission);
}

export function SidebarNav({ className, collapsed = false, onNavigate, mobile = false, scrollToActive = false }: { className?: string; collapsed?: boolean; onNavigate?: () => void; mobile?: boolean; scrollToActive?: boolean }) {
  const pathname = usePathname();
  const { hasPermission } = useAuth();
  const activeRef = React.useRef<HTMLAnchorElement | null>(null);
  const visiblePrimary = primaryNav.filter((item) => permissionVisible(item, hasPermission));
  const visibleComingSoon = comingSoonNav.filter((item) => permissionVisible(item, hasPermission));
  const showSettings = permissionVisible(settingsNav, hasPermission);

  React.useEffect(() => {
    if (!mobile || !scrollToActive || collapsed) return;
    const frame = window.requestAnimationFrame(() => {
      activeRef.current?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [mobile, scrollToActive, collapsed, pathname]);

  return (
    <nav className={cn("flex h-full min-h-0 flex-col border-white/90 bg-gradient-to-b from-white/88 via-stone-50/90 to-violet-50/60 p-3 shadow-[0_20px_60px_-38px_rgba(79,70,229,.35)] backdrop-blur-xl dark:from-card/95 dark:via-card/90 dark:to-primary/10", className)}>
      <Link href="/command-center" onClick={onNavigate} title={collapsed ? "MyGymAgent" : undefined} className={cn("mb-4 flex shrink-0 items-center rounded-[22px] border border-white/90 bg-white/85 py-2.5 shadow-[0_16px_45px_-30px_rgba(79,70,229,.4)] backdrop-blur-xl transition hover:-translate-y-px hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 dark:bg-white/5", collapsed ? "justify-center px-1.5" : "gap-2.5 px-2.5")}>
        <span aria-hidden="true" className="rounded-[15px] bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-[2px] shadow-lg shadow-violet-500/25">
          <span className="flex size-9 items-center justify-center rounded-[13px] bg-white">
            <Image src="/logo-mark.webp" alt="" width={38} height={38} className="size-7 shrink-0 object-contain" priority />
          </span>
        </span>
        {!collapsed && <div className="min-w-0"><div className="truncate font-serif text-[17px] font-semibold tracking-tight text-stone-950 dark:text-white">MyGymAgent</div><div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-[9px] font-black uppercase tracking-[0.2em] text-transparent">Gym OS</div></div>}
      </Link>
      {!collapsed && <div className="mb-2 shrink-0 px-3 text-[9px] font-black uppercase tracking-[0.2em] text-stone-600 dark:text-stone-300">Workspace</div>}
      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain pr-0.5 pb-2 [scrollbar-width:thin]">
        {visiblePrimary.map((item) => {
          const active = pathname.startsWith(item.href);
          const children = (item.children ?? []).filter((child) => permissionVisible(child, hasPermission));
          return (
            <div key={item.href} data-mobile-nav-section={mobile ? "true" : undefined} className="shrink-0">
              <NavLink item={item} active={active} collapsed={collapsed} onNavigate={onNavigate} itemRef={mobile && !collapsed && active ? activeRef : undefined} />
              {!collapsed && active && children.length > 0 && (
                <div className="mt-1 mb-2 space-y-0.5 border-l-2 border-violet-200/70 pl-1 dark:border-white/15">
                  {children.map((child) => <NavLink key={child.href} item={child} active={pathname.startsWith(child.href)} nested onNavigate={onNavigate} />)}
                </div>
              )}
            </div>
          );
        })}
        {!collapsed && visibleComingSoon.length > 0 && <div className="mt-5 shrink-0"><div className="mb-2 px-3 text-[9px] font-black uppercase tracking-[0.2em] text-stone-600 dark:text-stone-300">Coming soon</div><div className="space-y-1">{visibleComingSoon.map((item) => <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} onNavigate={onNavigate} />)}</div></div>}
        {collapsed && visibleComingSoon.map((item) => <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} collapsed onNavigate={onNavigate} />)}
      </div>
      <div className="mt-3 shrink-0 border-t border-stone-200/70 pt-3 dark:border-white/10">{showSettings && <NavLink item={settingsNav} active={pathname.startsWith(settingsNav.href)} collapsed={collapsed} onNavigate={onNavigate} />}</div>
    </nav>
  );
}

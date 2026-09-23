"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import { primaryNav, comingSoonNav, settingsNav, isNavItemActive, type NavItem } from "@/lib/nav-config";
import { Badge } from "@/components/ui/badge";
import { PRODUCT_LOGO_ALT, PRODUCT_LOGO_DATA_URI } from "@/lib/brand";

function NavLink({ item, active, nested = false, collapsed = false, onNavigate, itemRef }: { item: NavItem; active: boolean; nested?: boolean; collapsed?: boolean; onNavigate?: () => void; itemRef?: React.RefObject<HTMLAnchorElement | null> }) {
  const Icon = item.icon;
  const isAi = item.accent === "ai";
  return (
    <Link
      ref={itemRef}
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.title : undefined}
      aria-label={collapsed ? item.title : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex min-h-10 items-center touch-manipulation overflow-hidden rounded-xl border transition-all duration-200 focus-visible:outline-2 focus-visible:outline-sidebar-ring",
        collapsed ? "justify-center px-2 py-2.5" : nested ? "ml-3 gap-2.5 px-3 py-2 text-[13px]" : "gap-3 px-2.5 py-2.5 text-sm",
        active
          ? isAi
            ? "border-violet-300/70 bg-gradient-to-r from-violet-500/15 via-fuchsia-500/10 to-cyan-400/10 font-semibold text-violet-800 shadow-sm dark:text-violet-200"
            : "border-sidebar-primary/20 bg-gradient-to-r from-sidebar-primary/15 via-sidebar-primary/8 to-transparent font-semibold text-sidebar-foreground shadow-sm"
          : isAi
            ? "border-transparent text-sidebar-foreground/75 hover:border-violet-300/40 hover:bg-gradient-to-r hover:from-violet-500/10 hover:to-cyan-400/10 hover:text-sidebar-foreground"
            : "border-transparent font-medium text-sidebar-foreground/70 hover:border-sidebar-border/60 hover:bg-white/60 hover:text-sidebar-foreground dark:hover:bg-white/5",
      )}
    >
      {active && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-y-2 left-0 w-0.5 rounded-full",
            isAi ? "bg-gradient-to-b from-violet-500 via-fuchsia-500 to-cyan-400" : "bg-sidebar-primary",
          )}
        />
      )}
      <span
        aria-hidden="true"
        className={cn(
          "relative flex shrink-0 items-center justify-center rounded-lg border transition-all duration-200",
          nested ? "size-7" : "size-8",
          active
            ? isAi
              ? "border-violet-300/50 bg-gradient-to-br from-violet-500/20 to-cyan-400/15 text-violet-700 dark:text-violet-200"
              : "border-sidebar-primary/15 bg-sidebar-primary/10 text-sidebar-primary"
            : isAi
              ? "border-violet-200/50 bg-gradient-to-br from-violet-500/10 to-cyan-400/5 text-violet-600 dark:text-violet-300"
              : "border-sidebar-border/50 bg-sidebar-accent/60 text-sidebar-foreground/70 group-hover:text-sidebar-foreground",
        )}
      >
        <Icon className={cn(nested ? "size-3.5" : "size-4", "shrink-0")} aria-hidden="true" />
      </span>
      {!collapsed && (
        <>
          <span className="flex-1 truncate tracking-[-0.01em]">{item.title}</span>
          {isAi && !nested && <span aria-hidden="true" className="size-1.5 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 shadow-[0_0_10px_rgba(139,92,246,0.45)]" />}
          {item.comingSoon && <Badge variant="secondary" className="px-1.5 py-0 text-xs">Soon</Badge>}
        </>
      )}
    </Link>
  );
}

function permissionVisible(item: NavItem, hasPermission: (permission: string | string[]) => boolean) {
  return !item.permission || hasPermission(item.permission);
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-2 px-2.5">
      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-sidebar-foreground/45">{children}</span>
      <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-sidebar-border/70 to-transparent" />
    </div>
  );
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
      activeRef.current?.scrollIntoView({ block: "center", inline: "nearest" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [mobile, scrollToActive, collapsed, pathname]);

  return (
    <nav aria-label="Primary" className={cn("relative flex h-full min-h-0 flex-col bg-gradient-to-b from-sidebar via-sidebar to-sidebar-accent/20 text-sidebar-foreground", className)}>
      <Link
        href="/command-center"
        onClick={onNavigate}
        title={collapsed ? PRODUCT_LOGO_ALT : undefined}
        className={cn(
          "group relative mb-4 flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-sidebar-border/60 bg-white/45 px-2.5 py-2.5 shadow-sm backdrop-blur-xl transition-all hover:border-sidebar-primary/20 hover:bg-white/70 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]",
          collapsed ? "justify-center px-1.5" : "gap-2.5",
        )}
      >
        <span aria-hidden="true" className="absolute -right-5 -top-6 size-16 rounded-full bg-violet-400/15 blur-2xl" />
        <span aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-sidebar-primary/15 bg-white/70 shadow-sm dark:bg-white/[0.06]">
          <Image
            src={PRODUCT_LOGO_DATA_URI}
            alt={PRODUCT_LOGO_ALT}
            width={64}
            height={64}
            unoptimized
            className="size-12 shrink-0 object-contain"
            priority
          />
        </span>
      </Link>

      {!collapsed && <SectionLabel>Workspace</SectionLabel>}
      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain pr-0.5 pb-2">
        {visiblePrimary.map((item, index) => {
          const children = (item.children ?? []).filter((child) => permissionVisible(child, hasPermission));
          const active = isNavItemActive(pathname, item.href) || children.some((child) => isNavItemActive(pathname, child.href));
          const isAi = item.accent === "ai";
          // The divider heads the AI group, so it belongs to the first AI
          // item only -- rendering it per item printed "AI Layer" twice.
          const startsAiGroup = isAi && visiblePrimary[index - 1]?.accent !== "ai";
          return (
            <div key={item.href} data-mobile-nav-section={mobile ? "true" : undefined} className={cn("shrink-0", startsAiGroup && !collapsed && "mt-1")}>
              {!collapsed && startsAiGroup && <div className="mb-1 flex items-center gap-1.5 px-2.5 text-[9px] font-bold uppercase tracking-[0.16em] text-violet-600/70 dark:text-violet-300/70"><span className="size-1.5 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" />AI Layer</div>}
              <NavLink item={item} active={active} collapsed={collapsed} onNavigate={onNavigate} itemRef={mobile && !collapsed && active ? activeRef : undefined} />
              {!collapsed && active && children.length > 0 && (
                <ul aria-label={`${item.title} sub-pages`} className={cn("mt-1 mb-2 ml-4 space-y-0.5 rounded-xl border p-1", isAi ? "border-violet-200/50 bg-gradient-to-br from-violet-500/[0.05] via-fuchsia-500/[0.03] to-cyan-400/[0.05]" : "border-sidebar-border/50 bg-sidebar-accent/30")}>
                  {children.map((child) => (
                    <li key={child.href}><NavLink item={child} active={isNavItemActive(pathname, child.href)} nested onNavigate={onNavigate} /></li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
        {!collapsed && visibleComingSoon.length > 0 && (
          <div className="mt-4 shrink-0">
            <SectionLabel>Coming soon</SectionLabel>
            <div className="space-y-1 opacity-80">{visibleComingSoon.map((item) => <NavLink key={item.href} item={item} active={isNavItemActive(pathname, item.href)} onNavigate={onNavigate} />)}</div>
          </div>
        )}
        {collapsed && visibleComingSoon.map((item) => <NavLink key={item.href} item={item} active={isNavItemActive(pathname, item.href)} collapsed onNavigate={onNavigate} />)}
      </div>

      <div className="mt-3 shrink-0 rounded-2xl border border-sidebar-border/60 bg-white/45 p-1.5 shadow-sm backdrop-blur-xl dark:bg-white/[0.03]">
        {showSettings && <NavLink item={settingsNav} active={isNavItemActive(pathname, settingsNav.href)} collapsed={collapsed} onNavigate={onNavigate} />}
      </div>
    </nav>
  );
}

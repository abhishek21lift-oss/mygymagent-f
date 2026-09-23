"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import { primaryNav, secondaryNav, comingSoonNav, settingsNav, isNavItemActive, type NavItem } from "@/lib/nav-config";
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
            ? "border-transparent bg-ai/15 font-semibold text-ai dark:text-violet-200"
            : "border-transparent bg-sidebar-accent font-semibold text-sidebar-foreground shadow-sm"
          : isAi
            ? "border-transparent text-sidebar-foreground/75 hover:border-transparent hover:bg-sidebar-accent/60 hover:text-cyan-400/10 hover:text-sidebar-foreground"
            : "border-transparent font-medium text-sidebar-foreground/70 hover:border-transparent hover:bg-sidebar-accent/60 hover:text-sidebar-foreground dark:hover:bg-white/5",
      )}
    >
      {active && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-y-2 left-0 w-0.5 rounded-full",
            isAi ? "bg-ai" : "bg-sidebar-primary",
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
              ? "border-transparent bg-ai/20 text-ai"
              : "border-sidebar-primary/15 bg-sidebar-primary/10 text-sidebar-primary"
            : isAi
              ? "border-transparent bg-ai/10 text-ai"
              : "border-sidebar-border/50 bg-sidebar-accent/60 text-sidebar-foreground/70 group-hover:text-sidebar-foreground",
        )}
      >
        <Icon className={cn(nested ? "size-3.5" : "size-4", "shrink-0")} aria-hidden="true" />
      </span>
      {!collapsed && (
        <>
          <span className="flex-1 truncate tracking-[-0.01em]">{item.title}</span>
          {isAi && !nested && <span aria-hidden="true" className="size-1.5 rounded-full bg-ai shadow-[0_0_10px_rgba(139,92,246,0.45)]" />}
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
  const visibleSecondary = secondaryNav.filter((item) => permissionVisible(item, hasPermission));
  const visibleComingSoon = comingSoonNav.filter((item) => permissionVisible(item, hasPermission));
  const showSettings = permissionVisible(settingsNav, hasPermission);

  /** One renderer for both lists: the markup is identical, and the only
   * thing that differed was which array it looped over. */
  const renderGroup = (items: NavItem[]) =>
    items.map((item, index) => {
      const children = (item.children ?? []).filter((child) => permissionVisible(child, hasPermission));
      const active = isNavItemActive(pathname, item.href) || children.some((child) => isNavItemActive(pathname, child.href));
      const isAi = item.accent === "ai";
      // The rule heads the AI group, so it belongs to the first AI item
      // only -- rendering it per item printed the label twice.
      const startsAiGroup = isAi && items[index - 1]?.accent !== "ai";
      return (
        <div key={item.href} data-mobile-nav-section={mobile ? "true" : undefined} className={cn("shrink-0", startsAiGroup && !collapsed && "mt-1")}>
          <NavLink item={item} active={active} collapsed={collapsed} onNavigate={onNavigate} itemRef={mobile && !collapsed && active ? activeRef : undefined} />
          {!collapsed && active && children.length > 0 && (
            <ul aria-label={`${item.title} sub-pages`} className={cn("mt-1 mb-2 ml-4 space-y-0.5 rounded-lg border border-sidebar-border/50 bg-sidebar-accent/30 p-1")}>
              {children.map((child) => (
                <li key={child.href}><NavLink item={child} active={isNavItemActive(pathname, child.href)} nested onNavigate={onNavigate} /></li>
              ))}
            </ul>
          )}
        </div>
      );
    });

  React.useEffect(() => {
    if (!mobile || !scrollToActive || collapsed) return;
    const frame = window.requestAnimationFrame(() => {
      activeRef.current?.scrollIntoView({ block: "center", inline: "nearest" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [mobile, scrollToActive, collapsed, pathname]);

  return (
    <nav aria-label="Primary" className={cn("relative flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground", className)}>
      <Link
        href="/dashboard"
        onClick={onNavigate}
        title={collapsed ? PRODUCT_LOGO_ALT : undefined}
        className={cn(
          "group relative mb-3 flex shrink-0 items-center justify-center overflow-hidden rounded-lg px-2 py-1.5 transition-all hover:border-sidebar-primary/20 hover:bg-white/70 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]",
          collapsed ? "justify-center px-1.5" : "gap-2.5",
        )}
      >
        <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-lg">
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
        {renderGroup(visiblePrimary)}

        {visibleSecondary.length > 0 && (
          <div className="mt-3 shrink-0 border-t border-sidebar-border/60 pt-3">
            {!collapsed && <SectionLabel>Tools</SectionLabel>}
            {renderGroup(visibleSecondary)}
          </div>
        )}
        {!collapsed && visibleComingSoon.length > 0 && (
          <div className="mt-4 shrink-0">
            <SectionLabel>Coming soon</SectionLabel>
            <div className="space-y-1 opacity-80">{visibleComingSoon.map((item) => <NavLink key={item.href} item={item} active={isNavItemActive(pathname, item.href)} onNavigate={onNavigate} />)}</div>
          </div>
        )}
        {collapsed && visibleComingSoon.map((item) => <NavLink key={item.href} item={item} active={isNavItemActive(pathname, item.href)} collapsed onNavigate={onNavigate} />)}
      </div>

      <div className="mt-3 shrink-0 border-t border-sidebar-border/60 pt-3">
        {showSettings && <NavLink item={settingsNav} active={isNavItemActive(pathname, settingsNav.href)} collapsed={collapsed} onNavigate={onNavigate} />}
      </div>
    </nav>
  );
}

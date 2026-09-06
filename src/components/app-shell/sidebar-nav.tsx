"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import { primaryNav, comingSoonNav, settingsNav, type NavItem } from "@/lib/nav-config";
import { Badge } from "@/components/ui/badge";

function NavLink({ item, active, nested = false, collapsed = false, onNavigate, itemRef }: { item: NavItem; active: boolean; nested?: boolean; collapsed?: boolean; onNavigate?: () => void; itemRef?: React.RefObject<HTMLAnchorElement | null> }) {
  const Icon = item.icon;
  return (
    <Link
      ref={itemRef}
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.title : undefined}
      className={cn(
        "group relative flex min-h-11 items-center overflow-hidden touch-manipulation transition-all duration-200",
        collapsed ? "justify-center rounded-2xl px-2 py-3" : nested ? "ml-3 gap-3 rounded-xl px-3 py-2.5 text-xs" : "gap-3 rounded-2xl px-3 py-3 text-sm",
        active
          ? "bg-gradient-to-r from-primary via-primary/90 to-ai text-primary-foreground shadow-lg shadow-primary/20"
          : "text-sidebar-foreground/70 hover:bg-white/65 hover:text-sidebar-foreground hover:shadow-sm",
        item.accent === "ai" && !active && "bg-gradient-to-r from-primary/10 via-ai/5 to-transparent text-primary hover:from-primary/15",
      )}
    >
      {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-white/80" />}
      <Icon className={cn(nested ? "size-3.5" : "size-4", "shrink-0 transition-transform duration-200 group-hover:scale-110", active ? "text-primary-foreground" : item.accent === "ai" ? "text-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground")} />
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
    <nav className={cn("flex h-full min-h-0 flex-col bg-gradient-to-b from-white/90 via-stone-50/92 to-violet-50/55 p-3 backdrop-blur-2xl", className)}>
      <Link href="/command-center" onClick={onNavigate} title={collapsed ? "MyGymAgent" : undefined} className={cn("mb-4 flex shrink-0 items-center rounded-2xl border border-white/80 bg-white/60 py-2.5 shadow-sm backdrop-blur-xl", collapsed ? "justify-center px-1.5" : "gap-2.5 px-2.5")}>
        <Image src="/logo-mark.webp" alt="" width={38} height={38} className="size-9 shrink-0 object-contain" priority />
        {!collapsed && <div className="min-w-0"><div className="truncate text-[15px] font-bold tracking-tight">MyGymAgent</div><div className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary/60">Gym OS</div></div>}
      </Link>
      {!collapsed && <div className="mb-2 shrink-0 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-sidebar-foreground/40">Workspace</div>}
      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain pr-0.5 pb-2 [scrollbar-width:thin]">
        {visiblePrimary.map((item) => {
          const active = pathname.startsWith(item.href);
          const children = (item.children ?? []).filter((child) => permissionVisible(child, hasPermission));
          return (
            <div key={item.href} data-mobile-nav-section={mobile ? "true" : undefined} className="shrink-0">
              <NavLink item={item} active={active} collapsed={collapsed} onNavigate={onNavigate} itemRef={mobile && !collapsed && active ? activeRef : undefined} />
              {!collapsed && active && children.length > 0 && (
                <div className="mt-1 mb-2 space-y-0.5 border-l border-primary/15 pl-1">
                  {children.map((child) => <NavLink key={child.href} item={child} active={pathname.startsWith(child.href)} nested onNavigate={onNavigate} />)}
                </div>
              )}
            </div>
          );
        })}
        {!collapsed && visibleComingSoon.length > 0 && <div className="mt-5 shrink-0"><div className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-sidebar-foreground/40">Coming soon</div><div className="space-y-1">{visibleComingSoon.map((item) => <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} onNavigate={onNavigate} />)}</div></div>}
        {collapsed && visibleComingSoon.map((item) => <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} collapsed onNavigate={onNavigate} />)}
      </div>
      <div className="mt-3 shrink-0 border-t border-sidebar-border/70 pt-3">{showSettings && <NavLink item={settingsNav} active={pathname.startsWith(settingsNav.href)} collapsed={collapsed} onNavigate={onNavigate} />}</div>
    </nav>
  );
}

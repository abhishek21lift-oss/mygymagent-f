"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import { primaryNav, comingSoonNav, settingsNav, isNavItemActive, type NavItem } from "@/lib/nav-config";
import { Badge } from "@/components/ui/badge";

function NavLink({ item, active, nested = false, collapsed = false, onNavigate, itemRef }: { item: NavItem; active: boolean; nested?: boolean; collapsed?: boolean; onNavigate?: () => void; itemRef?: React.RefObject<HTMLAnchorElement | null> }) {
 const Icon = item.icon;
 return (
  <Link
   ref={itemRef}
   href={item.href}
   onClick={onNavigate}
   title={collapsed ? item.title : undefined}
   aria-label={collapsed ? item.title : undefined}
   aria-current={active ? "page" : undefined}
   className={cn(
    "group relative flex min-h-10 items-center touch-manipulation rounded-md transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-sidebar-ring",
    collapsed ? "justify-center px-2 py-2.5" : nested ? "ml-4 gap-2.5 px-3 py-2 text-[13px]" : "gap-3 px-3 py-2.5 text-sm",
    active
     ? "bg-sidebar-primary font-semibold text-sidebar-primary-foreground shadow-sm"
     : "font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
   )}
  >
   <span
    aria-hidden="true"
    className={cn(
     "flex shrink-0 items-center justify-center rounded-md transition-transform duration-150",
     nested ? "size-7" : "size-8",
     active ? "bg-sidebar-primary-foreground/15" : "bg-sidebar-accent/60 group-hover:bg-sidebar-accent",
    )}
   >
    <Icon className={cn(nested ? "size-3.5" : "size-4", "shrink-0")} aria-hidden="true" />
   </span>
   {!collapsed && (
    <>
     <span className="flex-1 truncate tracking-[-0.01em]">{item.title}</span>
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
  <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">{children}</p>
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
  <nav
   aria-label="Primary"
   className={cn(
    "relative flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground",
    className,
   )}
  >
   <Link
    href="/command-center"
    onClick={onNavigate}
    title={collapsed ? "MyGymAgent" : undefined}
    className={cn(
     "mb-4 flex shrink-0 items-center rounded-lg px-2.5 py-2.5 transition-colors hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-sidebar-ring",
     collapsed ? "justify-center px-1.5" : "gap-2.5",
    )}
   >
    <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary/15">
     <Image src="/logo-mark.webp" alt="" width={38} height={38} className="size-7 shrink-0 object-contain" priority />
    </span>
    {!collapsed && (
     <div className="min-w-0">
      <div className="truncate text-[16px] font-bold tracking-tight">MyGymAgent</div>
      <div className="text-xs font-semibold uppercase tracking-widest text-sidebar-foreground/60">Gym OS</div>
     </div>
    )}
   </Link>

   {!collapsed && <SectionLabel>Workspace</SectionLabel>}
   <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain pr-0.5 pb-2">
    {visiblePrimary.map((item) => {
     const children = (item.children ?? []).filter((child) => permissionVisible(child, hasPermission));
     const active = isNavItemActive(pathname, item.href) || children.some((child) => isNavItemActive(pathname, child.href));
     return (
      <div key={item.href} data-mobile-nav-section={mobile ? "true" : undefined} className="shrink-0">
       <NavLink item={item} active={active} collapsed={collapsed} onNavigate={onNavigate} itemRef={mobile && !collapsed && active ? activeRef : undefined} />
       {!collapsed && active && children.length > 0 && (
        <ul aria-label={`${item.title} sub-pages`} className="mt-1 mb-2 ml-5 space-y-0.5 rounded-md border border-sidebar-border/60 bg-sidebar-accent/40 p-1">
         {children.map((child) => (
          <li key={child.href}>
           <NavLink item={child} active={isNavItemActive(pathname, child.href)} nested onNavigate={onNavigate} />
          </li>
         ))}
        </ul>
       )}
      </div>
     );
    })}
    {!collapsed && visibleComingSoon.length > 0 && (
     <div className="mt-4 shrink-0">
      <SectionLabel>Coming soon</SectionLabel>
      <div className="space-y-0.5 opacity-80">{visibleComingSoon.map((item) => <NavLink key={item.href} item={item} active={isNavItemActive(pathname, item.href)} onNavigate={onNavigate} />)}</div>
     </div>
    )}
    {collapsed && visibleComingSoon.map((item) => <NavLink key={item.href} item={item} active={isNavItemActive(pathname, item.href)} collapsed onNavigate={onNavigate} />)}
   </div>

   <div className="mt-3 shrink-0 rounded-lg border border-sidebar-border/60 bg-sidebar-accent/40 p-1">
    {showSettings && <NavLink item={settingsNav} active={isNavItemActive(pathname, settingsNav.href)} collapsed={collapsed} onNavigate={onNavigate} />}
   </div>
  </nav>
 );
}

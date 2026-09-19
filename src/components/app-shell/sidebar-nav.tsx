"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import { primaryNav, comingSoonNav, settingsNav, isNavItemActive, type NavItem } from "@/lib/nav-config";
import { Badge } from "@/components/ui/badge";

/* Skeuomorphism — stitched leather sidebar, brass active plates. */

function NavLink({ item, active, nested = false, collapsed = false, onNavigate, itemRef }: { item: NavItem; active: boolean; nested?: boolean; collapsed?: boolean; onNavigate?: () => void; itemRef?: React.RefObject<HTMLAnchorElement | null> }) {
  const Icon = item.icon;
  return (
    <Link
      ref={itemRef}
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.title : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex min-h-11 items-center overflow-hidden touch-manipulation transition-all duration-150",
        collapsed ? "justify-center rounded-[12px] px-2 py-3" : nested ? "ml-4 gap-2.5 rounded-[10px] px-3 py-2 text-xs" : "gap-3 rounded-[12px] px-3 py-2.5 text-sm",
        active
          ? "border border-[#4a360f] bg-gradient-to-b from-[#ffedb0] via-[#c99b3f] to-[#8a6420] text-[#241a08] shadow-[inset_0_1px_0_rgba(255,250,220,0.95),inset_0_-2px_4px_rgba(70,45,10,0.5),0_3px_0_#241a08,0_6px_14px_rgba(0,0,0,0.5)]"
          : "border border-transparent text-[#e9dcb8]/80 shadow-[inset_0_0_0_transparent] hover:border-[#4a3f2a] hover:bg-gradient-to-b hover:from-[#4a3a26] hover:to-[#2b2114] hover:text-[#ffe9a8] hover:shadow-[inset_0_1px_0_rgba(255,240,200,0.2),inset_0_-1px_3px_rgba(0,0,0,0.5)]",
        item.accent === "ai" && !active && "border-[#6b5226]/60 bg-gradient-to-b from-[#4a3a1a]/60 to-[#2b2114]/60 text-[#ffe9a8]",
      )}
      style={active ? { textShadow: "0 1px 0 rgba(255,245,200,0.9)" } : { textShadow: "0 -1px 0 rgba(0,0,0,0.8)" }}
    >
      {/* pressed LED strip on active */}
      {active && <span aria-hidden="true" className="absolute inset-y-1.5 left-1 w-1 rounded-full bg-[#241a08] shadow-[0_0_6px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,240,200,0.6)]" />}
      <span
        aria-hidden="true"
        className={cn(
          "flex shrink-0 items-center justify-center rounded-[9px] border transition-transform duration-150 group-hover:scale-105",
          nested ? "size-7" : "size-9",
          active
            ? "border-[#4a360f] bg-gradient-to-b from-[#fff8e2] to-[#c9a44f] text-[#3a2a0c] shadow-[inset_0_1px_0_#fff,0_2px_4px_rgba(0,0,0,0.4)]"
            : "border-[#170e07] bg-gradient-to-b from-[#5a4c38] to-[#2b2415] text-[#e9dcb8] shadow-[inset_0_1px_0_rgba(255,240,200,0.25),0_2px_4px_rgba(0,0,0,0.5)]",
        )}
      >
        <Icon className={cn(nested ? "size-3.5" : "size-4", "shrink-0")} aria-hidden="true" />
      </span>
      {!collapsed && (
        <>
          <span className="flex-1 truncate font-bold tracking-[-0.01em]">{item.title}</span>
          {item.comingSoon && <Badge variant="secondary" className="rounded-[6px] px-1.5 py-0 text-[9px]">Soon</Badge>}
          {active && <span aria-hidden="true" className="size-2 rounded-full bg-[#3a2a0c] shadow-[inset_0_1px_2px_rgba(0,0,0,0.9),0_1px_0_rgba(255,245,200,0.6)]" />}
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
    <div className="mb-2 flex items-center gap-2 px-3">
      <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-transparent via-[#8a6f3a]/70 to-transparent shadow-[0_1px_0_rgba(255,240,200,0.15)]" />
      <span className="text-[9px] font-black uppercase tracking-[0.24em] text-[#c9a44f]" style={{ textShadow: "0 -1px 0 rgba(0,0,0,0.9), 0 1px 0 rgba(255,240,200,0.12)" }}>{children}</span>
      <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-transparent via-[#8a6f3a]/70 to-transparent shadow-[0_1px_0_rgba(255,240,200,0.15)]" />
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
      activeRef.current?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [mobile, scrollToActive, collapsed, pathname]);

  return (
    <nav
      className={cn(
        "skeuo-leather relative flex h-full min-h-0 flex-col p-3",
        className,
      )}
    >
      {/* stitched inset border */}
      <span aria-hidden="true" className="skeuo-stitch pointer-events-none absolute inset-2" />
      {/* top brass screws */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_14px_14px,#fff6d8_0_1.5px,#c9a44f_2.5px,#241a08_3.5px,transparent_4.5px),radial-gradient(circle_at_calc(100%-14px)_14px,#fff6d8_0_1.5px,#c9a44f_2.5px,#241a08_3.5px,transparent_4.5px)] bg-no-repeat" />

      <Link
        href="/command-center"
        onClick={onNavigate}
        title={collapsed ? "MyGymAgent" : undefined}
        className={cn(
          "relative z-10 mb-4 flex shrink-0 items-center rounded-[12px] border border-[#4a360f] bg-gradient-to-b from-[#ffedb0] via-[#c99b3f] to-[#7a5a1e] px-2.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,250,220,0.95),inset_0_-2px_4px_rgba(70,45,10,0.5),0_3px_0_#170e07,0_8px_18px_rgba(0,0,0,0.5)] transition hover:brightness-105 active:translate-y-[1px] active:shadow-[inset_0_2px_6px_rgba(40,25,10,0.5)]",
          collapsed ? "justify-center px-1.5" : "gap-2.5",
        )}
      >
        <span aria-hidden="true" className="flex size-9 items-center justify-center rounded-[9px] border border-[#241a08] bg-gradient-to-b from-[#2b2114] to-[#170e07] shadow-[inset_0_1px_3px_rgba(0,0,0,0.9),0_1px_0_rgba(255,245,200,0.5)]">
          <Image src="/logo-mark.webp" alt="" width={38} height={38} className="size-7 shrink-0 object-contain" priority />
        </span>
        {!collapsed && (
          <div className="min-w-0">
            <div className="truncate text-[17px] font-black tracking-tight text-[#241a08]" style={{ textShadow: "0 1px 0 rgba(255,245,200,0.9)" }}>MyGymAgent</div>
            <div className="text-[9px] font-black uppercase tracking-[0.24em] text-[#3a2a0c]" style={{ textShadow: "0 1px 0 rgba(255,245,200,0.7)" }}>Gym OS &bull; Mk II</div>
          </div>
        )}
      </Link>

      {!collapsed && <SectionLabel>Workspace</SectionLabel>}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain pr-0.5 pb-2 [scrollbar-width:thin]">
        {visiblePrimary.map((item) => {
          const children = (item.children ?? []).filter((child) => permissionVisible(child, hasPermission));
          const active = isNavItemActive(pathname, item.href) || children.some((child) => isNavItemActive(pathname, child.href));
          return (
            <div key={item.href} data-mobile-nav-section={mobile ? "true" : undefined} className="shrink-0">
              <NavLink item={item} active={active} collapsed={collapsed} onNavigate={onNavigate} itemRef={mobile && !collapsed && active ? activeRef : undefined} />
              {!collapsed && active && children.length > 0 && (
                <div className="mt-1 mb-2 ml-5 space-y-0.5 rounded-[10px] border border-[#170e07] bg-[#1c140b]/70 p-1 shadow-[inset_0_2px_6px_rgba(0,0,0,0.7),0_1px_0_rgba(255,240,200,0.12)]">
                  {children.map((child) => <NavLink key={child.href} item={child} active={isNavItemActive(pathname, child.href)} nested onNavigate={onNavigate} />)}
                </div>
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

      {/* bottom riveted steel strip */}
      <div className="relative z-10 mt-3 shrink-0 rounded-[10px] border border-[#170e07] bg-gradient-to-b from-[#5a4c38] to-[#2b2415] p-1 shadow-[inset_0_1px_0_rgba(255,240,200,0.2),0_2px_6px_rgba(0,0,0,0.5)]">
        {showSettings && <NavLink item={settingsNav} active={isNavItemActive(pathname, settingsNav.href)} collapsed={collapsed} onNavigate={onNavigate} />}
        {!collapsed && <div className="px-3 py-1.5 text-center text-[8px] font-bold uppercase tracking-[0.2em] text-[#8f7748]" style={{ textShadow: "0 -1px 0 #000" }}>Calibrated &bull; Iron &amp; Leather</div>}
      </div>
    </nav>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import { primaryNav, comingSoonNav, settingsNav, type NavItem } from "@/lib/nav-config";
import { Badge } from "@/components/ui/badge";

function NavLink({ item, active, nested = false }: { item: NavItem; active: boolean; nested?: boolean }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} className={cn("group flex items-center gap-3 transition-all duration-200", nested ? "ml-4 rounded-lg px-3 py-1.5 text-xs" : "rounded-xl px-3 py-2.5 text-sm", active ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground", item.accent === "ai" && !active && "bg-gradient-to-r from-primary/10 to-transparent text-primary hover:from-primary/15")}>
      <Icon className={cn(nested ? "size-3.5" : "size-4", "shrink-0 transition-transform duration-200 group-hover:scale-105", active ? "text-primary-foreground" : item.accent === "ai" ? "text-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground")} />
      <span className="flex-1 truncate font-medium">{item.title}</span>
      {item.comingSoon && <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">Soon</Badge>}
    </Link>
  );
}

function permissionVisible(item: NavItem, hasPermission: (permission: string | string[]) => boolean) {
  return !item.permission || hasPermission(item.permission);
}

export function SidebarNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const { hasPermission } = useAuth();
  const visiblePrimary = primaryNav.filter((item) => permissionVisible(item, hasPermission));
  const visibleComingSoon = comingSoonNav.filter((item) => permissionVisible(item, hasPermission));
  const showSettings = permissionVisible(settingsNav, hasPermission);

  return (
    <nav className={cn("flex h-full flex-col bg-sidebar text-sidebar-foreground p-3", className)}>
      <Link href="/command-center" className="mb-6 flex items-center gap-2.5 rounded-xl px-2 py-1.5">
        <Image src="/logo-mark.webp" alt="" width={36} height={36} className="size-9 shrink-0 object-contain" priority />
        <div className="min-w-0"><div className="truncate text-[15px] font-bold tracking-tight">MyGymAgent</div><div className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Gym OS</div></div>
      </Link>
      <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/40">Workspace</div>
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {visiblePrimary.map((item) => {
          const active = pathname.startsWith(item.href);
          const children = (item.children ?? []).filter((child) => permissionVisible(child, hasPermission));
          return <div key={item.href}><NavLink item={item} active={active} />{active && children.length > 0 && <div className="mt-1 mb-2 space-y-0.5 border-l border-primary/15 pl-1">{children.map((child) => <NavLink key={child.href} item={child} active={pathname.startsWith(child.href)} nested />)}</div>}</div>;
        })}
        {visibleComingSoon.length > 0 && <div className="mt-5"><div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/40">Coming soon</div><div className="space-y-1">{visibleComingSoon.map((item) => <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} />)}</div></div>}
      </div>
      <div className="mt-3 border-t border-sidebar-border pt-3">{showSettings && <NavLink item={settingsNav} active={pathname.startsWith(settingsNav.href)} />}</div>
    </nav>
  );
}

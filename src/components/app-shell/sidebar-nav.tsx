"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import { primaryNav, comingSoonNav, settingsNav, type NavItem } from "@/lib/nav-config";
import { Badge } from "@/components/ui/badge";

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1 truncate">{item.title}</span>
      {item.comingSoon && (
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          Soon
        </Badge>
      )}
    </Link>
  );
}

export function SidebarNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const { hasPermission } = useAuth();

  const visiblePrimary = primaryNav.filter((item) => !item.permission || hasPermission(item.permission));
  const visibleComingSoon = comingSoonNav.filter(
    (item) => !item.permission || hasPermission(item.permission),
  );
  const showSettings = !settingsNav.permission || hasPermission(settingsNav.permission);

  return (
    <nav className={cn("flex h-full flex-col gap-6 bg-sidebar text-sidebar-foreground p-4", className)}>
      <Link href="/dashboard" className="flex items-center gap-2 px-2 font-semibold">
        <div className="flex size-7 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          <Dumbbell className="size-4" />
        </div>
        MyGymAgent
      </Link>

      <div className="flex flex-col gap-1">
        {visiblePrimary.map((item) => (
          <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} />
        ))}
      </div>

      {visibleComingSoon.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="px-3 text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/50">
            Coming soon
          </p>
          {visibleComingSoon.map((item) => (
            <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} />
          ))}
        </div>
      )}

      <div className="mt-auto flex flex-col gap-1 border-t border-sidebar-border pt-4">
        {showSettings && <NavLink item={settingsNav} active={pathname.startsWith(settingsNav.href)} />}
      </div>
    </nav>
  );
}

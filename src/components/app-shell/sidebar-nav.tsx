"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0 transition-colors",
          active ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground",
        )}
      />
      <span className="flex-1 truncate">{item.title}</span>
      {item.comingSoon && (
        <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
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
      <Link href="/dashboard" className="flex items-center gap-2.5 px-2 py-1">
        <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg shadow-sm">
          <Image src="/logo-icon.webp" alt="" width={32} height={32} className="size-full object-cover" priority />
        </div>
        <span className="text-[15px] font-semibold tracking-tight">MyGymAgent</span>
      </Link>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto">
        <div className="flex flex-col gap-0.5">
          {visiblePrimary.map((item) => (
            <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} />
          ))}
        </div>

        {visibleComingSoon.length > 0 && (
          <div className="flex flex-col gap-0.5">
            <p className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-sidebar-foreground/40 uppercase">
              Coming soon
            </p>
            {visibleComingSoon.map((item) => (
              <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-0.5 border-t border-sidebar-border pt-3">
        {showSettings && <NavLink item={settingsNav} active={pathname.startsWith(settingsNav.href)} />}
      </div>
    </nav>
  );
}

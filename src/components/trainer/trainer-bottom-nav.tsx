"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Bot, Dumbbell, House, ScanLine, Users } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The dark tab bar.
 *
 * The reference's nav is a black bar with five line icons over tiny
 * uppercase labels, and it is the one place the trainer surface goes
 * dark. It replaced the existing `bottom-tab-bar.tsx` on this surface
 * rather than being restyled: that one is a light, permission-filtered
 * three-tab strip for the staff app, and it has a different shape for a
 * different job.
 *
 * The tab set is the reference's five. AI Coach and Check-in have no
 * dedicated routes yet, so they point at the closest existing pages
 * (`/ai` and `/attendance`) rather than dead-ending. The items are
 * permission-free here because the reference shows all five regardless
 * of role -- the server still gates the pages they link to, so a member
 * without `attendance.read` gets a 403 rather than a hidden tab that
 * would make the bar change shape per user.
 */

const TABS: Array<{ href: string; label: string; Icon: LucideIcon }> = [
  { href: "/trainer", label: "Home", Icon: House },
  { href: "/members", label: "Clients", Icon: Users },
  { href: "/ai", label: "AI Coach", Icon: Bot },
  { href: "/pt-operations/sessions", label: "Sessions", Icon: Dumbbell },
  { href: "/attendance", label: "Check-in", Icon: ScanLine },
];

export function TrainerBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="sticky bottom-0 z-30 mt-auto border-t border-white/5 bg-[var(--t-nav-bg)]"
      // env(safe-area-inset-bottom) rather than a fixed pad: on a device
      // with a home indicator the reference's bar grows, and on one
      // without it stays flush.
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {TABS.map(({ href, label, Icon }) => {
          // Prefix match so /trainer/exercises keeps Home lit, which is
          // what the reference implies: it is one app, not a set of
          // sibling destinations.
          const active = href === "/trainer" ? pathname === "/trainer" || pathname.startsWith("/trainer/") : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[3.75rem] touch-manipulation flex-col items-center justify-center gap-1 px-1 py-2.5 transition-colors",
                  active ? "text-[var(--t-nav-ink-active)]" : "text-[var(--t-nav-ink)]",
                )}
              >
                <Icon
                  className={cn("size-7", active && "text-[var(--t-nav-ink-active-accent)]")}
                  strokeWidth={active ? 2.5 : 2}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    "text-[0.6875rem] uppercase tracking-[0.06em]",
                    active ? "font-extrabold" : "font-bold",
                  )}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

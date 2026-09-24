"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarCheck,
  CalendarDays,
  Dumbbell,
  LogOut,
  Salad,
  Settings,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { PRODUCT_LOGO_ALT, PRODUCT_LOGO_SRC } from "@/lib/brand";
import { useAuth } from "@/lib/auth/auth-context";
import { usePortalMe } from "@/lib/hooks/use-portal";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/portal", label: "Home", icon: User },
  { href: "/portal/classes", label: "Classes", icon: CalendarDays },
  { href: "/portal/plan", label: "Training", icon: Dumbbell },
  { href: "/portal/nutrition", label: "Nutrition", icon: Salad },
  { href: "/portal/visits", label: "Visits", icon: CalendarCheck },
];

/**
 * The member's shell — deliberately not the staff one.
 *
 * A member and a receptionist share a session mechanism but nothing
 * else: no branch switcher, no six work areas, no org search. Four
 * destinations, because that is how many a member has.
 *
 * Members authenticate through the same `/auth/login` as staff (a linked
 * `User` carrying the MEMBER role), so this reuses the session rather
 * than running a second auth stack. What distinguishes them is whether
 * `GET /portal/me` resolves: a staff account has no linked member and is
 * sent to the staff app instead of being shown an empty portal.
 */
export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const me = usePortalMe();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  // A signed-in staff account has no linked member, so `/portal/me`
  // 403s. Send them to the app they actually have, rather than leaving
  // them on a portal that will never have anything in it.
  React.useEffect(() => {
    if (me.isError) router.replace("/dashboard");
  }, [me.isError, router]);

  if (isLoading || !isAuthenticated || me.isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
        <div
          role="status"
          aria-label="Loading your portal"
          className="flex w-full max-w-sm flex-col gap-3 rounded-lg border border-border bg-card p-6"
        >
          <Skeleton className="h-8 w-40 rounded-lg" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-2/3 rounded" />
        </div>
      </div>
    );
  }

  if (me.isError) return null;

  const member = me.data?.member;

  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            {/* The member's half of the product is still the product.
                Small and quiet here -- this header belongs to them, not
                to the brand. */}
            <Image
              src={PRODUCT_LOGO_SRC}
              alt={PRODUCT_LOGO_ALT}
              width={96}
              height={96}
              className="size-9 shrink-0 rounded-full object-contain"
              priority
            />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                {member?.primaryBranch?.name ?? "Your gym"}
              </p>
              <p className="truncate text-sm font-semibold">
                {member?.firstName} {member?.lastName}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {/* Beside sign-out rather than a sixth tab: six do not fit a
                phone, and settings are not somewhere you go often. */}
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="min-h-11 rounded-lg"
            >
              <Link href="/portal/account">
                <Settings className="size-4" aria-hidden="true" />
                <span className="sr-only">Account settings</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void logout()}
              className="min-h-11 rounded-lg"
            >
              <LogOut className="size-4" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">Sign out</span>
            </Button>
          </div>
        </div>

        <nav
          aria-label="Member portal"
          className="mx-auto flex w-full max-w-3xl gap-1 overflow-x-auto px-3 pb-2"
        >
          {TABS.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/portal"
                ? pathname === "/portal"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5">
        {children}
      </main>
    </div>
  );
}

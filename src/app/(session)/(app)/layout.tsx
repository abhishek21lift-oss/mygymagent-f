"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

import { accentForPath } from "@/lib/section-accent";
import { useSectionAttribute } from "@/lib/use-section-attribute";
import { useAuth } from "@/lib/auth/auth-context";
import { homeRouteFor } from "@/lib/auth/home-route";
import { refreshWebPush } from "@/lib/push/web-push";
import { listenForNativeTaps } from "@/lib/push/native-push";
import { MfaRequiredGate } from "@/components/security/mfa-required-gate";
import { MfaGraceBanner } from "@/components/security/mfa-grace-banner";
import { SidebarNav } from "@/components/app-shell/sidebar-nav";
import { Topbar } from "@/components/app-shell/topbar";
import { MobileNav } from "@/components/app-shell/mobile-nav";
import { BottomTabBar } from "@/components/app-shell/bottom-tab-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { PullToRefresh } from "@/components/shared/pull-to-refresh";

/**
 * Tablet widths, where the rail shows but the full 18rem rail would leave
 * the page about 480px: less than the `sm:` (640px) layouts assume, so
 * rows built for "wider than a phone" ran off the side.
 */
const TABLET_QUERY = "(min-width: 768px) and (max-width: 1023.98px)";

function subscribeTablet(onChange: () => void) {
  const mq = window.matchMedia(TABLET_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, mfaEnrolment, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  // Also on <html>, so portalled dialogs and toasts wear the same hue.
  useSectionAttribute(pathname);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  // The rail starts icon-only on a tablet and full on a desktop; once
  // someone toggles it, their choice holds.
  const isTablet = React.useSyncExternalStore(
    subscribeTablet,
    () => window.matchMedia(TABLET_QUERY).matches,
    () => false,
  );
  const [collapsedChoice, setCollapsedChoice] = React.useState<boolean | null>(null);
  const sidebarCollapsed = collapsedChoice ?? isTablet;
  const mainRef = React.useRef<HTMLElement | null>(null);

  // A gym member has no staff permissions at all, so this shell would
  // render a sidebar of pages that would all 403. Send them to the portal
  // instead -- the mirror of what /portal does to a staff account.
  const isMember = Boolean(user?.memberId);

  React.useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (isMember) router.replace(homeRouteFor(user));
  }, [isLoading, isAuthenticated, isMember, user, router]);

  // FCM rotates tokens occasionally; re-register once per session for a
  // browser that already opted in. Never prompts, and does nothing for one
  // that has not.
  const userId = user?.id;
  const confined = mfaEnrolment?.state === "ENFORCED";
  React.useEffect(() => {
    if (!userId || isMember || confined) return;
    void refreshWebPush().catch(() => undefined);
  }, [userId, isMember, confined]);

  // In the Android app, a tapped notification opens its page. A no-op in
  // a browser, where the service worker handles the click.
  React.useEffect(() => {
    listenForNativeTaps((path) => router.push(path));
  }, [router]);

  if (isLoading || !isAuthenticated || isMember) {
    return (
      <div className="page-ambient flex h-svh items-center justify-center px-4">
        <div
          role="status"
          aria-label="Loading application"
          className="glass relative flex w-full max-w-sm flex-col gap-3 overflow-hidden rounded-2xl p-6"
        >
          <span
            aria-hidden="true"
            className="absolute -right-10 -top-10 size-32 rounded-full opacity-60 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, var(--section-grad-2), transparent 70%)",
            }}
          />
          <Skeleton className="h-10 w-40 rounded-xl" />
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="h-4 w-2/3 rounded-lg" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Loading…
          </p>
        </div>
      </div>
    );
  }

  // The backend has confined this session to enrolment, so every other
  // request would 403. Show the one thing that can be done instead of an
  // application shell full of errors.
  if (mfaEnrolment?.state === "ENFORCED") {
    return <MfaRequiredGate />;
  }

  return (
    // The section hue is published here, once, as CSS variables the whole
    // subtree inherits. Everything below -- tiles, tables, panels, the
    // canvas itself -- reads `var(--section)` and never has to know what
    // route it is on, which is what keeps them all server-renderable.
    <div
      data-section={accentForPath(pathname)}
      // Landscape phones put the notch at a side: keep the shell inside it.
      className="page-ambient flex h-svh overflow-hidden pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
    >
      {/* The rail floats: a rounded glass pane inset from the edge of the
          window, rather than a full-bleed dark column. This is the single
          biggest change to the shell's shape, and it is what makes the
          app read as a set of panes over a canvas rather than as a
          document with a sidebar. */}
      <div
        className={
          "hidden shrink-0 p-2 transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:block " +
          (sidebarCollapsed ? "w-[5.5rem]" : "w-[18rem]")
        }
      >
        <SidebarNav collapsed={sidebarCollapsed} className="glass rounded-3xl" />
      </div>

      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          onOpenMobileNav={() => setMobileNavOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setCollapsedChoice(!sidebarCollapsed)}
        />
        <main ref={mainRef} className="relative min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
          <PullToRefresh scrollRef={mainRef}>
            <div className="relative mx-auto w-full max-w-[var(--content-max-width)] px-4 pb-[var(--mobile-tabbar-clearance)] pt-2 sm:px-5 md:pb-8 lg:px-8">
              <MfaGraceBanner />
              {children}
            </div>
          </PullToRefresh>
        </main>
        <BottomTabBar onOpenMore={() => setMobileNavOpen(true)} />
      </div>
    </div>
  );
}

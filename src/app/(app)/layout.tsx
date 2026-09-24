"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

import { accentForPath } from "@/lib/section-accent";
import { useSectionAttribute } from "@/lib/use-section-attribute";
import { useAuth } from "@/lib/auth/auth-context";
import { homeRouteFor } from "@/lib/auth/home-route";
import { MfaRequiredGate } from "@/components/security/mfa-required-gate";
import { MfaGraceBanner } from "@/components/security/mfa-grace-banner";
import { SidebarNav } from "@/components/app-shell/sidebar-nav";
import { Topbar } from "@/components/app-shell/topbar";
import { MobileNav } from "@/components/app-shell/mobile-nav";
import { BottomTabBar } from "@/components/app-shell/bottom-tab-bar";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppLayout({ children }: { children: React.ReactNode }) {
 const { isAuthenticated, isLoading, mfaEnrolment, user } = useAuth();
 const router = useRouter();
 const pathname = usePathname();
 // Also on <html>, so portalled dialogs and toasts wear the same hue.
 useSectionAttribute(pathname);
 const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
 const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

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

 if (isLoading || !isAuthenticated || isMember) {
 return (
 <div className="flex h-svh items-center justify-center bg-background px-4">
 <div role="status" aria-label="Loading application" className="relative flex w-full max-w-sm flex-col gap-3 overflow-hidden rounded-lg border border-sidebar-border bg-card/80 p-6 shadow-sm">
 <span aria-hidden="true" className="absolute -right-8 -top-8 size-24 rounded-full bg-violet-500/10 blur-2xl" />
 <Skeleton className="h-10 w-40 rounded-xl" />
 <Skeleton className="h-4 w-full rounded-md" />
 <Skeleton className="h-4 w-2/3 rounded-md" />
 <p className="font-mono text-xs font-medium uppercase tracking-widest text-muted-foreground">Loading...</p>
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
 // The section hue is published here, once, as a CSS variable the whole
 // subtree inherits. Everything below -- tiles, tables, panels, the
 // canvas itself -- reads `var(--section)` and never has to know what
 // route it is on, which is what keeps them all server-renderable.
 <div
 data-section={accentForPath(pathname)}
 className="flex h-svh overflow-hidden bg-background"
 >
 <div className={"hidden shrink-0 border-r border-sidebar-border bg-sidebar p-2 transition-[width] duration-300 md:block " + (sidebarCollapsed ? "w-[88px]" : "w-72")}>
 <SidebarNav collapsed={sidebarCollapsed} className="rounded-lg" />
 </div>
 <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
 <div className="flex min-w-0 flex-1 flex-col">
 <Topbar onOpenMobileNav={() => setMobileNavOpen(true)} sidebarCollapsed={sidebarCollapsed} onToggleSidebar={() => setSidebarCollapsed((value) => !value)} />
 <main className="page-ambient relative min-h-0 flex-1 overflow-y-auto">
 <div className="relative mx-auto w-full max-w-[var(--content-max-width)] px-4 pt-4 pb-24 sm:px-5 md:pb-6 lg:px-6"><MfaGraceBanner />{children}</div>
 </main>
 <BottomTabBar onOpenMore={() => setMobileNavOpen(true)} />
 </div>
 </div>
 );
}

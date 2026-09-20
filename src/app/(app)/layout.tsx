"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth/auth-context";
import { SidebarNav } from "@/components/app-shell/sidebar-nav";
import { Topbar } from "@/components/app-shell/topbar";
import { MobileNav } from "@/components/app-shell/mobile-nav";
import { BottomTabBar } from "@/components/app-shell/bottom-tab-bar";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-svh items-center justify-center bg-background px-4">
        <div role="status" aria-label="Loading application" className="relative flex w-full max-w-sm flex-col gap-3 overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-6 shadow-xl backdrop-blur-xl">
          <span aria-hidden="true" className="absolute -right-8 -top-8 size-24 rounded-full bg-violet-500/10 blur-2xl" />
          <Skeleton className="h-10 w-40 rounded-xl" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-2/3 rounded-md" />
          <p className="font-mono text-xs font-medium uppercase tracking-widest text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-svh overflow-hidden bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.05),transparent_28%),radial-gradient(circle_at_bottom_right,hsl(190_90%_55%/0.05),transparent_30%)] bg-background">
      <div className={"hidden shrink-0 border-r border-border/60 bg-sidebar/85 p-2 shadow-[8px_0_30px_rgba(0,0,0,0.035)] backdrop-blur-xl transition-[width] duration-300 md:block " + (sidebarCollapsed ? "w-[88px]" : "w-72")}>
        <SidebarNav collapsed={sidebarCollapsed} className="rounded-2xl" />
      </div>
      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMobileNav={() => setMobileNavOpen(true)} sidebarCollapsed={sidebarCollapsed} onToggleSidebar={() => setSidebarCollapsed((value) => !value)} />
        <main className="page-ambient relative min-h-0 flex-1 overflow-y-auto">
          <div className="relative mx-auto w-full max-w-[100rem] px-3 pt-4 pb-24 sm:px-6 sm:pt-6 md:pb-6 lg:px-8 lg:pt-6">{children}</div>
        </main>
        <BottomTabBar onOpenMore={() => setMobileNavOpen(true)} />
      </div>
    </div>
  );
}

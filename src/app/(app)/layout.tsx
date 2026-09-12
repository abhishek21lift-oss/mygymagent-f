"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth/auth-context";
import { SidebarNav } from "@/components/app-shell/sidebar-nav";
import { Topbar } from "@/components/app-shell/topbar";
import { MobileNav } from "@/components/app-shell/mobile-nav";
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
      <div className="flex h-svh items-center justify-center bg-background">
        <div className="premium-glass flex w-full max-w-sm flex-col gap-3 rounded-[28px] border-white/90 bg-white/85 p-7 shadow-[0_28px_70px_-38px_rgba(79,70,229,.42)] backdrop-blur-xl">
          <span
            aria-hidden="true"
            className="h-1.5 w-16 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400"
          />
          <Skeleton className="h-10 w-40 rounded-[19px]" />
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="h-4 w-2/3 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      <SidebarNav
        collapsed={sidebarCollapsed}
        className={"hidden shrink-0 border-r border-sidebar-border/70 transition-[width] duration-300 md:flex " + (sidebarCollapsed ? "w-[78px]" : "w-[260px]")}
      />
      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMobileNav={() => setMobileNavOpen(true)} sidebarCollapsed={sidebarCollapsed} onToggleSidebar={() => setSidebarCollapsed((value) => !value)} />
        <main className="page-ambient relative min-h-0 flex-1 overflow-y-auto">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 top-10 size-72 rounded-full bg-violet-400/15 blur-3xl motion-safe:animate-blob"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-20 bottom-10 size-72 rounded-full bg-cyan-400/15 blur-3xl motion-safe:animate-blob motion-safe:[animation-delay:2.5s]"
          />
          <div className="relative mx-auto w-full max-w-[1720px] px-3 pb-6 pt-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

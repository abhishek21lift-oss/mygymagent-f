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
      <div className="flex h-svh items-center justify-center">
        <div className="skeuo-plate skeuo-screws flex w-full max-w-sm flex-col gap-3 rounded-[14px] border p-7">
          <span
            aria-hidden="true"
            className="relative z-10 h-2 w-20 rounded-full border border-[#4a3f2a] bg-[repeating-linear-gradient(90deg,#6b5d42_0_6px,#3a3222_6px_12px)]"
          />
          <Skeleton className="h-10 w-40 rounded-[10px] border border-[#5c4f38]" />
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="h-4 w-2/3 rounded-lg" />
          <p className="relative z-10 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#5c4f38]">Warming up the tubes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-svh overflow-hidden">
      <div className={"hidden shrink-0 p-2 pr-0 transition-[width] duration-300 md:block " + (sidebarCollapsed ? "w-[94px]" : "w-[276px]")}>
        <SidebarNav
          collapsed={sidebarCollapsed}
          className="rounded-[16px] border border-[#170e07] shadow-[0_16px_40px_rgba(0,0,0,0.5)]"
        />
      </div>
      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-2">
        <div className="overflow-hidden rounded-[14px] border border-[#241a08] shadow-[0_10px_28px_rgba(0,0,0,0.45)]">
          <Topbar onOpenMobileNav={() => setMobileNavOpen(true)} sidebarCollapsed={sidebarCollapsed} onToggleSidebar={() => setSidebarCollapsed((value) => !value)} />
        </div>
        <main className="page-ambient relative min-h-0 flex-1 overflow-y-auto rounded-[16px] border border-[#170e07] shadow-[inset_0_2px_12px_rgba(0,0,0,0.6)]">
          {/* felt mat stitching */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-2 rounded-[12px] outline-2 outline-dashed outline-[#c9a44f]/25 outline-offset-[-6px]" />
          {/* hanging shop lamp glow */}
          <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-24 w-[42rem] max-w-full -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(255,225,160,0.18),transparent_70%)]" />
          <div className="relative mx-auto w-full max-w-[1720px] px-3 pt-4 pb-24 sm:px-6 sm:pt-6 md:pb-6 lg:px-8 lg:pt-8 lg:pb-8">{children}</div>
        </main>
        <BottomTabBar onOpenMore={() => setMobileNavOpen(true)} />
      </div>
    </div>
  );
}

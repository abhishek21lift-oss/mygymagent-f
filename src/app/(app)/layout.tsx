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
   <div className="flex h-svh items-center justify-center bg-background">
    <div role="status" aria-label="Loading application" className="flex w-full max-w-sm flex-col gap-3 rounded-xl border bg-card p-6 shadow-sm">
     <Skeleton className="h-10 w-40 rounded-md" />
     <Skeleton className="h-4 w-full rounded-md" />
     <Skeleton className="h-4 w-2/3 rounded-md" />
     <p className="font-mono text-xs font-medium uppercase tracking-widest text-muted-foreground">Loading...</p>
    </div>
   </div>
  );
 }

 return (
  <div className="flex h-svh overflow-hidden bg-background">
   <div className={"hidden shrink-0 border-r bg-sidebar p-2 transition-[width] duration-200 md:block " + (sidebarCollapsed ? "w-[88px]" : "w-68")}>
    <SidebarNav
     collapsed={sidebarCollapsed}
     className="rounded-lg"
    />
   </div>
   <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
   <div className="flex min-w-0 flex-1 flex-col">
    <Topbar onOpenMobileNav={() => setMobileNavOpen(true)} sidebarCollapsed={sidebarCollapsed} onToggleSidebar={() => setSidebarCollapsed((value) => !value)} />
    <main className="relative min-h-0 flex-1 overflow-y-auto">
     <div className="relative mx-auto w-full max-w-[100rem] px-3 pt-4 pb-24 sm:px-6 sm:pt-6 md:pb-6 lg:px-8 lg:pt-6">{children}</div>
    </main>
    <BottomTabBar onOpenMore={() => setMobileNavOpen(true)} />
   </div>
  </div>
 );
}

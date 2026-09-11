"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SidebarNav } from "@/components/app-shell/sidebar-nav";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

export function MobileNav({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const pathname = usePathname();
  const activeParentRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      const active = document.querySelector<HTMLElement>(
        `[data-mobile-nav-parent="true"][data-active="true"]`,
      );
      activeParentRef.current = active;
      active?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [open, pathname]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-0 left-0 h-[100svh] w-[min(20rem,88vw)] max-w-none translate-x-0 translate-y-0 overflow-hidden rounded-r-[28px] border-white/90 bg-white/95 p-0 shadow-[0_35px_110px_-48px_rgba(79,70,229,.55)] backdrop-blur-xl data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left sm:max-w-none dark:border-white/10 dark:bg-card/95"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1.5 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400" />
        <VisuallyHidden>
          <DialogTitle>Navigation</DialogTitle>
        </VisuallyHidden>
        <SidebarNav
          className="h-full border-0 shadow-none"
          mobile
          onNavigate={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

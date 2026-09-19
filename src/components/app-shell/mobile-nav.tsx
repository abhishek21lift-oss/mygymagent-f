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
        className="skeuo-leather top-0 left-0 h-[100svh] w-[min(20rem,88vw)] max-w-none translate-x-0 translate-y-0 overflow-hidden rounded-r-[14px] border-[3px] border-[#6b5226] p-0 shadow-[0_0_0_6px_rgba(43,30,16,0.9),0_30px_80px_rgba(0,0,0,0.65)] data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left sm:max-w-none"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-10 h-2 bg-gradient-to-b from-[#ffedb0] via-[#c99b3f] to-[#7a5a1e] shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
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

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
        className="top-0 left-0 h-[100svh] w-[min(20rem,88vw)] max-w-none translate-x-0 translate-y-0 rounded-none border-r border-white/80 bg-background/95 p-0 shadow-2xl backdrop-blur-2xl data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left sm:max-w-none"
      >
        <VisuallyHidden>
          <DialogTitle>Navigation</DialogTitle>
        </VisuallyHidden>
        <SidebarNav
          className="h-full"
          mobile
          onNavigate={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

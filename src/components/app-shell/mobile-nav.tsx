"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SidebarNav } from "@/components/app-shell/sidebar-nav";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

export function MobileNav({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const pathname = usePathname();

  React.useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      const active = document.querySelector<HTMLElement>(
        `[data-mobile-nav-section="true"] [aria-current="page"]`,
      );
      active?.scrollIntoView({ block: "center" });
    });
    return () => cancelAnimationFrame(frame);
  }, [open, pathname]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="top-0 left-0 h-[100svh] w-[min(20rem,88vw)] max-w-none translate-x-0 translate-y-0 overflow-hidden rounded-r-xl border-r p-0 data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left sm:max-w-none"
      >
        <VisuallyHidden>
          <DialogTitle>Navigation</DialogTitle>
          <DialogDescription>Primary application navigation</DialogDescription>
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

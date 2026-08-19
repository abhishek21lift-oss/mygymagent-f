"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SidebarNav } from "@/components/app-shell/sidebar-nav";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

export function MobileNav({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-0 left-0 h-full w-72 max-w-[85vw] translate-x-0 translate-y-0 rounded-none border-r p-0 sm:max-w-[85vw] data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left"
      >
        <VisuallyHidden>
          <DialogTitle>Navigation</DialogTitle>
        </VisuallyHidden>
        <SidebarNav className="h-full" />
      </DialogContent>
    </Dialog>
  );
}

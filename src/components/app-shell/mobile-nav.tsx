"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SidebarNav } from "@/components/app-shell/sidebar-nav";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

/**
 * The navigation drawer, on a phone.
 *
 * It carries `data-surface="rail"` instead of a `bg-sidebar` utility.
 * Two rules in `globals.css` claim `[data-slot="dialog-content"]` -- one
 * sets `--card`, a later one paints a white glass gradient -- and both
 * land after Tailwind's utilities in the same cascade layer, so the
 * utility lost and this drawer rendered as a white sheet. The nav inside
 * it still wore `--sidebar-foreground`, a near-white meant for dark
 * leather, so every label except the selected one was white on white:
 * the whole menu was legible only by its icons. The attribute is styled
 * after both of those rules and wins outright.
 */
export function MobileNav({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
 const pathname = usePathname();

 React.useEffect(() => {
 if (!open) return;
 const frame = requestAnimationFrame(() => {
 const active = document.querySelector<HTMLElement>(`[data-mobile-nav-section="true"] [aria-current="page"]`);
 active?.scrollIntoView({ block: "center" });
 });
 return () => cancelAnimationFrame(frame);
 }, [open, pathname]);

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent
 showCloseButton={false}
 aria-describedby={undefined}
 data-surface="rail"
 className="top-0 left-0 h-[100svh] w-[min(21rem,90vw)] max-w-none translate-x-0 translate-y-0 overflow-hidden rounded-r-2xl p-0 data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left sm:max-w-none"
 >
 <VisuallyHidden>
 <DialogTitle>Navigation</DialogTitle>
 <DialogDescription>Primary application navigation</DialogDescription>
 </VisuallyHidden>
 <SidebarNav className="h-full border-0 bg-transparent px-2 py-2 shadow-none" mobile onNavigate={() => onOpenChange(false)} />
 </DialogContent>
 </Dialog>
 );
}

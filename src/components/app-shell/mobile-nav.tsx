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
 * Several rules in `globals.css` claim every
 * `[data-slot="dialog-content"]` -- one sets `--card`, another paints a
 * glass gradient -- and all of them land after Tailwind's utilities in
 * the same cascade layer, so a `bg-sidebar/95` here would lose the
 * cascade and render as a white sheet. The nav inside it still wore
 * `--sidebar-foreground`, a near-white once built for dark leather, so
 * every label except the selected one was white on white: the whole
 * menu was legible only by its icons. The attribute is styled after
 * those rules and wins outright.
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
 className="top-0 left-0 h-[100svh] max-h-none w-[min(21rem,88vw)] max-w-none translate-x-0 translate-y-0 overflow-hidden rounded-r-3xl border-l-0 p-0 data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left sm:max-w-none"
 >
 <VisuallyHidden>
 <DialogTitle>Navigation</DialogTitle>
 <DialogDescription>Primary application navigation</DialogDescription>
 </VisuallyHidden>
 <SidebarNav
 className="h-full px-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[calc(env(safe-area-inset-top)+1rem)]"
 mobile
 onNavigate={() => onOpenChange(false)}
 />
 </DialogContent>
 </Dialog>
 );
}

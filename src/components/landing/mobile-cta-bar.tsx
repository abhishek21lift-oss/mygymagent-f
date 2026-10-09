"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * On a phone, the sign-up button stays within thumb's reach once the
 * hero has scrolled away, and steps aside again at the closing call,
 * which has its own.
 */
export function MobileCtaBar({ startAfterId, stopAtId }: { startAfterId: string; stopAtId: string }) {
 const [show, setShow] = React.useState(false);

 React.useEffect(() => {
 const start = document.getElementById(startAfterId);
 const stop = document.getElementById(stopAtId);
 if (!start || !stop || typeof IntersectionObserver === "undefined") return;
 let pastStart = false;
 let atStop = false;
 const update = () => setShow(pastStart && !atStop);
 const startObs = new IntersectionObserver(([e]) => {
 pastStart = !e.isIntersecting && e.boundingClientRect.top < 0;
 update();
 });
 const stopObs = new IntersectionObserver(([e]) => {
 atStop = e.isIntersecting || e.boundingClientRect.top < 0;
 update();
 });
 startObs.observe(start);
 stopObs.observe(stop);
 return () => {
 startObs.disconnect();
 stopObs.disconnect();
 };
 }, [startAfterId, stopAtId]);

 return (
 <div
 aria-hidden={!show}
 className={cn(
 "fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden",
 show ? "" : "hidden",
 )}
 >
 <div className="flex items-center gap-3 rounded-full border border-black/5 bg-white p-1.5 pl-5 shadow-[0_18px_50px_-15px_rgba(20,10,60,0.45)] dark:border-white/10 dark:bg-[#12121c]">
 <p className="min-w-0 flex-1 text-sm font-semibold text-foreground">Free trial, no card</p>
 <Link
 href="/register"
 tabIndex={show ? 0 : -1}
 className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-500 px-5 text-sm font-semibold text-white"
 >
 Start free
 <ArrowRight className="size-4" aria-hidden="true" />
 </Link>
 </div>
 </div>
 );
}

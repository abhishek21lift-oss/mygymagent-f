"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";

import { homeRouteFor } from "@/lib/auth/home-route";
import { useAuth } from "@/lib/auth/auth-context";
import { PRODUCT_LOGO_ALT, PRODUCT_LOGO_SRC, PRODUCT_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

export const NAV_LINKS = [
 { href: "#features", label: "Features" },
 { href: "#tour", label: "Tour" },
 { href: "#automation", label: "Automation" },
 { href: "#how-it-works", label: "How it works" },
 { href: "#pricing", label: "Pricing" },
 { href: "#faq", label: "FAQ" },
] as const;

/** Signed in already: one tap back into the app instead of a sign-up pitch. */
function AccountActions({ onNavigate, stacked = false }: { onNavigate?: () => void; stacked?: boolean }) {
 const { user, isLoading } = useAuth();
 const primary =
 "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-foreground px-5 text-sm font-semibold text-background shadow-lg shadow-black/10 transition hover:opacity-90 active:scale-[0.98]";
 if (!isLoading && user) {
 return (
 <Link href={homeRouteFor(user)} onClick={onNavigate} className={primary}>
 Open the app
 <ArrowRight className="size-4" aria-hidden="true" />
 </Link>
 );
 }
 return (
 <div className={cn("flex items-center gap-2", stacked && "flex-col items-stretch")}>
 <Link
 href="/login"
 onClick={onNavigate}
 className="inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold text-foreground/80 transition hover:text-foreground"
 >
 Sign in
 </Link>
 <Link href="/register" onClick={onNavigate} className={primary}>
 Start free trial
 </Link>
 </div>
 );
}

export function LandingNav() {
 const [scrolled, setScrolled] = React.useState(false);
 const [open, setOpen] = React.useState(false);

 React.useEffect(() => {
 const onScroll = () => setScrolled(window.scrollY > 8);
 onScroll();
 window.addEventListener("scroll", onScroll, { passive: true });
 return () => window.removeEventListener("scroll", onScroll);
 }, []);

 React.useEffect(() => {
 if (!open) return;
 const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
 window.addEventListener("keydown", onKey);
 return () => window.removeEventListener("keydown", onKey);
 }, [open]);

 return (
 <header className="fixed inset-x-0 top-0 z-50 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
 <nav
 aria-label="Main"
 className={cn(
 "mx-auto flex max-w-6xl items-center gap-3 rounded-full border px-3 py-2 transition-all duration-300 sm:px-4",
 scrolled || open
 ? "border-black/5 bg-white/75 shadow-[0_10px_40px_-12px_rgba(20,10,60,0.25)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#12121c]/75"
 : "border-transparent bg-transparent",
 )}
 >
 <Link href="/" className="flex items-center gap-2 rounded-full pr-2 outline-none focus-visible:ring-2 focus-visible:ring-ring">
 <Image src={PRODUCT_LOGO_SRC} alt={PRODUCT_LOGO_ALT} width={34} height={34} priority className="rounded-full" />
 <span className="text-[15px] font-bold tracking-tight text-foreground">{PRODUCT_NAME}</span>
 </Link>
 <ul className="ml-4 hidden items-center gap-1 lg:flex">
 {NAV_LINKS.map((link) => (
 <li key={link.href}>
 <a
 href={link.href}
 className="rounded-full px-3 py-2 text-sm font-medium text-foreground/70 transition hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
 >
 {link.label}
 </a>
 </li>
 ))}
 </ul>
 <div className="ml-auto hidden lg:block">
 <AccountActions />
 </div>
 <button
 type="button"
 className="ml-auto flex size-11 items-center justify-center rounded-full text-foreground transition hover:bg-black/5 lg:hidden dark:hover:bg-white/10"
 aria-expanded={open}
 aria-controls="landing-menu"
 aria-label={open ? "Close menu" : "Open menu"}
 onClick={() => setOpen((v) => !v)}
 >
 {open ? <X className="size-5" /> : <Menu className="size-5" />}
 </button>
 </nav>
 <div
 id="landing-menu"
 hidden={!open}
 className="mx-auto mt-2 max-w-6xl rounded-3xl border border-black/5 bg-white/90 p-3 shadow-2xl backdrop-blur-2xl lg:hidden dark:border-white/10 dark:bg-[#12121c]/90"
 >
 <ul className="flex flex-col">
 {NAV_LINKS.map((link) => (
 <li key={link.href}>
 <a
 href={link.href}
 onClick={() => setOpen(false)}
 className="flex min-h-12 items-center rounded-2xl px-4 text-base font-medium text-foreground transition hover:bg-black/5 dark:hover:bg-white/10"
 >
 {link.label}
 </a>
 </li>
 ))}
 </ul>
 <div className="mt-2 border-t border-black/5 pt-3 dark:border-white/10">
 <AccountActions stacked onNavigate={() => setOpen(false)} />
 </div>
 </div>
 </header>
 );
}

/** The hero's buttons: the same account-aware choice as the nav. */
export function HeroActions() {
 const { user, isLoading } = useAuth();
 const signedIn = !isLoading && user;
 return (
 <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
 <Link
 href={signedIn ? homeRouteFor(user) : "/register"}
 className="group inline-flex min-h-[52px] items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-500 px-7 text-base font-semibold text-white shadow-[0_18px_40px_-12px_rgba(168,85,247,0.7)] transition hover:brightness-110 active:scale-[0.98]"
 >
 {signedIn ? "Open your dashboard" : "Start your free trial"}
 <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
 </Link>
 <a
 href="#features"
 className="inline-flex min-h-[52px] items-center rounded-full border border-black/10 bg-white/60 px-7 text-base font-semibold text-foreground backdrop-blur transition hover:bg-white dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10"
 >
 See what it does
 </a>
 </div>
 );
}

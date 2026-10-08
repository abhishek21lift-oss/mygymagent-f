"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import {
 ArrowUpRight,
 BadgeCheck,
 CalendarPlus,
 Check,
 CheckCheck,
 LayoutDashboard,
 MessageCircle,
 QrCode,
 RefreshCw,
 Smartphone,
 Snowflake,
 UserCog,
 UserRound,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A guided look at four real screens, drawn as UI rather than shipped as
 * screenshots. Every panel is in the HTML (inactive ones are `hidden`),
 * so search engines read all four. It changes only when someone picks a
 * tab; it no longer advances on its own.
 */

type Tab = {
 id: string;
 label: string;
 icon: LucideIcon;
 title: string;
 body: string;
 points: string[];
 accent: string;
 screen: React.ReactNode;
};

function Window({ children }: { children: React.ReactNode }) {
 return (
 <div className="overflow-hidden rounded-[22px] border border-black/5 bg-white shadow-[0_40px_90px_-30px_rgba(40,20,90,0.45)] dark:border-white/10 dark:bg-[#171724]">
 <div className="flex items-center gap-1.5 border-b border-black/5 px-4 py-3 dark:border-white/10">
 <span className="size-2.5 rounded-full bg-[#ff5f57]" />
 <span className="size-2.5 rounded-full bg-[#febc2e]" />
 <span className="size-2.5 rounded-full bg-[#28c840]" />
 </div>
 <div className="p-4 sm:p-5">{children}</div>
 </div>
 );
}

function DashboardScreen() {
 const bars = [42, 55, 48, 66, 61, 74, 69, 83, 78, 92];
 return (
 <Window>
 <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
 {[
 ["Revenue · Oct", "₹4,82,300", "text-emerald-600 dark:text-emerald-400", "from-emerald-500/15"],
 ["Active", "1,284", "text-violet-600 dark:text-violet-400", "from-violet-500/15"],
 ["Due this week", "37", "text-amber-600 dark:text-amber-400", "from-amber-500/15"],
 ["At risk", "12", "text-rose-600 dark:text-rose-400", "from-rose-500/15"],
 ].map(([label, value, ink, from]) => (
 <div key={label} className={cn("rounded-2xl bg-gradient-to-br to-transparent p-3", from)}>
 <p className="text-[10px] font-semibold uppercase tracking-wider text-black/45 dark:text-white/50">{label}</p>
 <p className={cn("mt-1 text-lg font-bold tabular-nums tracking-tight", ink)}>{value}</p>
 </div>
 ))}
 </div>
 <div className="mt-3 rounded-2xl bg-black/[0.03] p-3 dark:bg-white/[0.04]">
 <p className="text-xs font-semibold text-foreground">Revenue, last 10 weeks</p>
 <div className="mt-3 flex h-28 items-end gap-2">
 {bars.map((h, i) => (
 <span key={i} className="flex-1 rounded-t-lg bg-gradient-to-t from-violet-500 via-fuchsia-500 to-orange-400" style={{ height: `${h}%` }} />
 ))}
 </div>
 </div>
 <div className="mt-3 grid gap-2 sm:grid-cols-2">
 {[
 ["Renewals due today", "8 members · ₹19,992", "bg-amber-500"],
 ["Checked in so far", "312 · busiest 6–8 AM", "bg-sky-500"],
 ].map(([t, s, dot]) => (
 <div key={t} className="flex items-center gap-2.5 rounded-xl bg-black/[0.03] px-3 py-2.5 dark:bg-white/[0.04]">
 <span className={cn("size-2 rounded-full", dot)} />
 <div className="min-w-0">
 <p className="text-xs font-semibold text-foreground">{t}</p>
 <p className="text-[11px] text-muted-foreground">{s}</p>
 </div>
 </div>
 ))}
 </div>
 </Window>
 );
}

function Member360Screen() {
 return (
 <Window>
 <div className="flex items-center gap-3">
 <span className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-fuchsia-600 text-base font-bold text-white">PS</span>
 <div className="min-w-0">
 <p className="font-semibold text-foreground">Priya Sharma</p>
 <p className="text-xs text-muted-foreground">#M-1042 · Coach Ravi · joined Mar 2025</p>
 </div>
 <span className="ml-auto rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">Gold · 64d left</span>
 </div>
 <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
 {[
 { title: "Membership", tone: "from-emerald-500 to-teal-500", items: [[Snowflake, "Freeze"], [CalendarPlus, "Extend"], [RefreshCw, "Renew"]] },
 { title: "Personal training", tone: "from-violet-500 to-fuchsia-500", items: [[UserCog, "Change PT"], [BadgeCheck, "Add PT package"]] },
 { title: "Trial", tone: "from-rose-500 to-orange-500", items: [[Check, "Joined after a trial"]] },
 ].map((group) => (
 <div key={group.title} className="rounded-2xl border border-black/5 bg-black/[0.02] p-2.5 dark:border-white/10 dark:bg-white/[0.03]">
 <p className="flex items-center gap-1.5 px-1 text-xs font-semibold text-foreground">
 <span className={cn("size-2.5 rounded-full bg-gradient-to-br", group.tone)} />
 {group.title}
 </p>
 <ul className="mt-2 space-y-1">
 {group.items.map(([Icon, label]) => {
 const I = Icon as LucideIcon;
 return (
 <li key={label as string} className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-2 text-[12px] font-medium text-foreground shadow-sm dark:bg-white/[0.06]">
 <I className="size-3.5 text-muted-foreground" aria-hidden="true" />
 {label as string}
 </li>
 );
 })}
 </ul>
 </div>
 ))}
 </div>
 <div className="mt-3 grid grid-cols-3 gap-2 text-center">
 {[["14", "visits this month"], ["9 days", "streak"], ["₹12,497", "paid"]].map(([v, l]) => (
 <div key={l} className="rounded-xl bg-black/[0.03] py-2.5 dark:bg-white/[0.04]">
 <p className="text-sm font-bold tabular-nums text-foreground">{v}</p>
 <p className="text-[10px] text-muted-foreground">{l}</p>
 </div>
 ))}
 </div>
 </Window>
 );
}

function WhatsAppScreen() {
 const bubble = "max-w-[82%] rounded-2xl px-3 py-2 text-[12px] leading-snug shadow-sm";
 return (
 <Window>
 <div className="rounded-2xl bg-[#efe7dd] p-3 dark:bg-[#0b141a]">
 <div className="space-y-2">
 <p className={cn(bubble, "rounded-tl-sm bg-white text-[#111b21] dark:bg-[#202c33] dark:text-[#e9edef]")}>Fees kitna hai monthly?</p>
 <p className={cn(bubble, "ml-auto rounded-tr-sm bg-[#d9fdd3] text-[#111b21] dark:bg-[#005c4b] dark:text-[#e9edef]")}>
 Our plans 💪
 <br />• Monthly ₹2,000
 <br />• 3 Months ₹5,500
 <br />• 12 Months ₹24,999
 <span className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-70">
 auto-reply <CheckCheck className="size-3 text-sky-500" />
 </span>
 </p>
 <p className={cn(bubble, "rounded-tl-sm bg-white text-[#111b21] dark:bg-[#202c33] dark:text-[#e9edef]")}>Gym kab khulta hai?</p>
 <p className={cn(bubble, "ml-auto rounded-tr-sm bg-[#d9fdd3] text-[#111b21] dark:bg-[#005c4b] dark:text-[#e9edef]")}>
 We&apos;re open 5:30 AM – 10:30 PM, Monday to Saturday 🕔
 <span className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-70">
 auto-reply <CheckCheck className="size-3 text-sky-500" />
 </span>
 </p>
 <p className={cn(bubble, "ml-auto rounded-tr-sm bg-[#d9fdd3] text-[#111b21] dark:bg-[#005c4b] dark:text-[#e9edef]")}>
 Hi Arjun, your membership ends on 12 Oct. Renew now and keep your 21-day streak going 🔥
 <span className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-70">
 renewal reminder <CheckCheck className="size-3 text-sky-500" />
 </span>
 </p>
 </div>
 </div>
 </Window>
 );
}

function MemberAppScreen() {
 return (
 <div className="mx-auto w-[230px] rounded-[40px] border-[6px] border-[#14141c] bg-[#14141c] shadow-[0_40px_90px_-30px_rgba(40,20,90,0.6)]">
 <div className="overflow-hidden rounded-[34px] bg-gradient-to-b from-violet-600 via-fuchsia-600 to-orange-500 p-4 text-white">
 <div className="mx-auto mb-4 h-5 w-20 rounded-full bg-black/70" />
 <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">Good morning, Priya</p>
 <p className="mt-0.5 text-base font-bold">Gold · 3 months</p>
 <div className="relative mx-auto my-4 size-24">
 <svg viewBox="0 0 36 36" className="size-full -rotate-90" aria-hidden="true">
 <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3.5" />
 <circle cx="18" cy="18" r="15.5" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="70 100" />
 </svg>
 <span className="absolute inset-0 flex flex-col items-center justify-center">
 <span className="text-2xl font-bold leading-none">64</span>
 <span className="text-[9px] text-white/80">days left</span>
 </span>
 </div>
 {[
 [QrCode, "Check in", "Show this at the desk"],
 [UserRound, "Today's workout", "Upper body · 45 min"],
 [ArrowUpRight, "PT sessions", "Next: Thu, 6:00 PM"],
 ].map(([Icon, t, s]) => {
 const I = Icon as LucideIcon;
 return (
 <div key={t as string} className="mt-2 flex items-center gap-2.5 rounded-2xl bg-white/20 p-2.5">
 <I className="size-5 shrink-0" aria-hidden="true" />
 <div>
 <p className="text-[11px] font-semibold">{t as string}</p>
 <p className="text-[9px] text-white/80">{s as string}</p>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 );
}

const TABS: Tab[] = [
 {
 id: "dashboard",
 label: "Dashboard",
 icon: LayoutDashboard,
 title: "Your whole gym, at a glance",
 body: "Revenue, renewals due, check-ins and members at risk, the moment you open the app, in your branch's time zone.",
 points: ["Revenue and dues by branch", "Who to call today", "Busiest hours and attendance"],
 accent: "from-indigo-500 to-violet-500",
 screen: <DashboardScreen />,
 },
 {
 id: "member-360",
 label: "Member 360",
 icon: UserRound,
 title: "Everything about a member, and everything you can do",
 body: "One profile with their plan, payments, visits, coach and history, and only the actions that make sense for them right now.",
 points: ["Freeze, extend, upgrade, renew in a tap", "Assign a coach, sell PT packages", "Book a trial, convert it to a plan"],
 accent: "from-violet-500 to-fuchsia-500",
 screen: <Member360Screen />,
 },
 {
 id: "whatsapp",
 label: "WhatsApp",
 icon: MessageCircle,
 title: "WhatsApp that answers for you, instantly",
 body: "Members ask in English, Hindi or Hinglish and get an instant answer from your real plans, timings and classes. Anything else goes to your team, and reminders go out on their own.",
 points: ["Instant replies: plans, fees, timings, classes", "Renewal and payment reminders", "From your gym's own number"],
 accent: "from-emerald-500 to-teal-500",
 screen: <WhatsAppScreen />,
 },
 {
 id: "member-app",
 label: "Member app",
 icon: Smartphone,
 title: "An app your members actually open",
 body: "Their plan and days left, QR check-in, workouts and diet plans, on iPhone, Android and the web, with your gym's name on it.",
 points: ["QR check-in at the desk", "Workout and diet plans", "Push reminders"],
 accent: "from-orange-500 to-rose-500",
 screen: <MemberAppScreen />,
 },
];

export function ProductTour() {
 const [active, setActive] = React.useState(0);
 const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

 function choose(index: number, focus = false) {
 setActive(index);
 if (focus) tabRefs.current[index]?.focus();
 }

 function onKey(event: React.KeyboardEvent) {
 const last = TABS.length - 1;
 const next =
 event.key === "ArrowRight" ? (active === last ? 0 : active + 1)
 : event.key === "ArrowLeft" ? (active === 0 ? last : active - 1)
 : event.key === "Home" ? 0
 : event.key === "End" ? last
 : null;
 if (next === null) return;
 event.preventDefault();
 choose(next, true);
 }

 return (
 <div className="mx-auto mt-12 max-w-6xl">
 <div
 role="tablist"
 aria-label="Product tour"
 onKeyDown={onKey}
 className="mx-auto grid w-full max-w-sm grid-cols-2 gap-1 rounded-[26px] border border-black/5 bg-white/70 p-1.5 shadow-sm sm:flex sm:w-fit sm:max-w-full sm:rounded-full dark:border-white/10 dark:bg-white/5"
 >
 {TABS.map((tab, i) => (
 <button
 key={tab.id}
 ref={(el) => {
 tabRefs.current[i] = el;
 }}
 role="tab"
 id={`tour-tab-${tab.id}`}
 aria-selected={i === active}
 aria-controls={`tour-panel-${tab.id}`}
 tabIndex={i === active ? 0 : -1}
 onClick={() => choose(i)}
 className={cn(
 "flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition",
 i === active ? "bg-foreground text-background shadow-md" : "text-foreground/70 hover:text-foreground",
 )}
 >
 <tab.icon className="size-4" aria-hidden="true" />
 {tab.label}
 </button>
 ))}
 </div>

 {TABS.map((tab, i) => (
 <div
 key={tab.id}
 role="tabpanel"
 id={`tour-panel-${tab.id}`}
 aria-labelledby={`tour-tab-${tab.id}`}
 hidden={i !== active}
 className="mt-10 grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]"
 >
 <div>
 <span className={cn("inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg", tab.accent)}>
 <tab.icon className="size-6" aria-hidden="true" />
 </span>
 <h3 className="mt-5 text-balance text-3xl font-bold tracking-[-0.03em] text-foreground sm:text-4xl">{tab.title}</h3>
 <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">{tab.body}</p>
 <ul className="mt-6 space-y-3">
 {tab.points.map((p) => (
 <li key={p} className="flex items-center gap-3 text-foreground">
 <span className={cn("flex size-6 items-center justify-center rounded-full bg-gradient-to-br text-white", tab.accent)}>
 <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
 </span>
 {p}
 </li>
 ))}
 </ul>
 </div>
 <div className="[perspective:1600px]" aria-hidden="true">
 <div className="[transform:rotateY(-8deg)_rotateX(4deg)]">
 {tab.screen}
 </div>
 </div>
 </div>
 ))}
 </div>
 );
}

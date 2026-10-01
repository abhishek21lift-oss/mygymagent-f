import type { CSSProperties, ReactNode } from "react";
import {
 BarChart3,
 Bell,
 CalendarCheck,
 Check,
 CreditCard,
 Dumbbell,
 Home,
 MessageCircle,
 QrCode,
 Sparkles,
 Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { TiltStage } from "./motion";
import styles from "./landing.module.css";

/**
 * The hero's 3D product shot, drawn in HTML rather than shipped as an
 * image: it stays sharp at any size, costs no download, and every layer
 * can sit at its own depth. Decorative -- the page text says all of it.
 * The figures are an illustration, not anyone's real gym.
 */

const z = (depth: number, x = 0, y = 0): CSSProperties => ({
 transform: `translate3d(${x}px, ${y}px, ${depth}px)`,
});

const BARS = [38, 52, 44, 63, 58, 72, 66, 81, 77, 90, 84, 97];

function Glass({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
 return (
 <div
 style={style}
 className={cn(
 "rounded-[22px] border border-white/60 bg-white/80 shadow-[0_30px_60px_-20px_rgba(30,20,80,0.35),0_0_0_1px_rgba(255,255,255,0.4)_inset] backdrop-blur-xl dark:border-white/10 dark:bg-[#1b1b2b]/85",
 className,
 )}
 >
 {children}
 </div>
 );
}

function Dashboard() {
 return (
 <Glass className="absolute inset-x-[4%] top-[6%] h-[78%] overflow-hidden rounded-[26px] p-0">
 {/* Window chrome */}
 <div className="flex items-center gap-1.5 border-b border-black/5 px-4 py-3 dark:border-white/10">
 <span className="size-2.5 rounded-full bg-[#ff5f57]" />
 <span className="size-2.5 rounded-full bg-[#febc2e]" />
 <span className="size-2.5 rounded-full bg-[#28c840]" />
 <span className="ml-3 h-2 w-28 rounded-full bg-black/10 dark:bg-white/15" />
 </div>
 <div className="flex h-full">
 {/* Sidebar */}
 <div className="hidden w-14 flex-col items-center gap-3 border-r border-black/5 py-4 sm:flex dark:border-white/10">
 {[
 { icon: Home, c: "from-indigo-500 to-violet-500" },
 { icon: Users, c: "from-violet-500 to-fuchsia-500" },
 { icon: MessageCircle, c: "from-emerald-500 to-teal-500" },
 { icon: Dumbbell, c: "from-orange-500 to-rose-500" },
 { icon: CreditCard, c: "from-amber-400 to-orange-500" },
 { icon: BarChart3, c: "from-sky-500 to-cyan-500" },
 ].map(({ icon: Icon, c }, i) => (
 <span key={i} className={cn("flex size-8 items-center justify-center rounded-[10px] bg-gradient-to-br text-white shadow-sm", c)}>
 <Icon className="size-4" strokeWidth={2.4} />
 </span>
 ))}
 </div>
 {/* Content */}
 <div className="flex-1 space-y-3 p-4">
 <div className="grid grid-cols-3 gap-2.5">
 {[
 { label: "Revenue · Oct", value: "₹4,82,300", c: "from-emerald-500/15 to-teal-500/10", ink: "text-emerald-600 dark:text-emerald-400" },
 { label: "Active members", value: "1,284", c: "from-violet-500/15 to-fuchsia-500/10", ink: "text-violet-600 dark:text-violet-400" },
 { label: "Check-ins today", value: "312", c: "from-sky-500/15 to-cyan-500/10", ink: "text-sky-600 dark:text-sky-400" },
 ].map((k) => (
 <div key={k.label} className={cn("rounded-2xl bg-gradient-to-br p-3", k.c)}>
 <p className="text-[9px] font-semibold uppercase tracking-wider text-black/45 dark:text-white/50">{k.label}</p>
 <p className={cn("mt-1 text-[15px] font-bold tabular-nums tracking-tight sm:text-lg", k.ink)}>{k.value}</p>
 </div>
 ))}
 </div>
 <div className="rounded-2xl bg-black/[0.03] p-3 dark:bg-white/[0.04]">
 <div className="mb-2 flex items-center justify-between">
 <span className="h-2 w-20 rounded-full bg-black/15 dark:bg-white/20" />
 <span className="h-2 w-10 rounded-full bg-black/10 dark:bg-white/15" />
 </div>
 <div className="flex h-24 items-end gap-1.5 sm:h-28">
 {BARS.map((h, i) => (
 <span
 key={i}
 className={cn("flex-1 rounded-t-md bg-gradient-to-t from-violet-500 via-fuchsia-500 to-orange-400", styles.bar)}
 style={{ height: `${h}%`, animationDelay: `${300 + i * 60}ms` }}
 />
 ))}
 </div>
 </div>
 <div className="space-y-2">
 {[
 { n: "PS", c: "bg-rose-500", w: "w-24" },
 { n: "AK", c: "bg-indigo-500", w: "w-20" },
 { n: "RM", c: "bg-amber-500", w: "w-28" },
 ].map((r) => (
 <div key={r.n} className="flex items-center gap-2.5 rounded-xl bg-black/[0.03] px-2.5 py-2 dark:bg-white/[0.04]">
 <span className={cn("flex size-6 items-center justify-center rounded-full text-[9px] font-bold text-white", r.c)}>{r.n}</span>
 <span className={cn("h-2 rounded-full bg-black/15 dark:bg-white/20", r.w)} />
 <span className="ml-auto rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-semibold text-emerald-700 dark:text-emerald-300">Renewed</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 </Glass>
 );
}

function Phone() {
 return (
 <div className="h-[300px] w-[150px] rounded-[34px] border-[5px] border-[#14141c] bg-[#14141c] shadow-[0_40px_80px_-24px_rgba(20,10,60,0.6)] sm:h-[340px] sm:w-[170px]">
 <div className="relative h-full overflow-hidden rounded-[28px] bg-gradient-to-b from-violet-600 via-fuchsia-600 to-orange-500 p-3 text-white">
 <div className="mx-auto mb-3 h-4 w-14 rounded-full bg-black/70" />
 <p className="text-[9px] font-semibold uppercase tracking-wider text-white/70">Your membership</p>
 <p className="mt-0.5 text-sm font-bold">Gold · 3 months</p>
 <div className="relative mx-auto my-3 size-20">
 <svg viewBox="0 0 36 36" className="size-full -rotate-90">
 <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3.5" />
 <circle cx="18" cy="18" r="15.5" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="70 100" />
 </svg>
 <span className="absolute inset-0 flex flex-col items-center justify-center">
 <span className="text-lg font-bold leading-none">64</span>
 <span className="text-[8px] text-white/80">days left</span>
 </span>
 </div>
 <div className="flex items-center gap-2 rounded-2xl bg-white/20 p-2 backdrop-blur">
 <QrCode className="size-7" />
 <div>
 <p className="text-[10px] font-semibold">Check in</p>
 <p className="text-[8px] text-white/80">Show at the desk</p>
 </div>
 </div>
 <div className="mt-2 flex items-center gap-2 rounded-2xl bg-white/20 p-2 backdrop-blur">
 <Dumbbell className="size-5" />
 <p className="text-[10px] font-semibold">Leg day · 6 PM</p>
 </div>
 </div>
 </div>
 );
}

export function HeroScene() {
 return (
 <TiltStage className="relative mx-auto h-[340px] w-full max-w-[920px] sm:h-[500px] lg:h-[560px]">
 <div className={styles.layer} style={{ inset: 0, ...z(0) }}>
 <Dashboard />
 </div>

 {/* WhatsApp renewal reminder */}
 <div className={styles.layer} style={{ left: "1%", top: "8%", ...z(150) }}>
 <div className={styles.bob}>
 <Glass className="w-[190px] p-3 sm:w-[250px]">
 <div className="flex items-center gap-2">
 <span className="flex size-7 items-center justify-center rounded-full bg-[#25d366] text-white">
 <MessageCircle className="size-4" />
 </span>
 <p className="text-[11px] font-semibold text-foreground">WhatsApp · sent 9:00 AM</p>
 </div>
 <p className="mt-2 rounded-2xl rounded-tl-sm bg-[#dcf8c6] px-3 py-2 text-[11px] leading-snug text-[#0b3d1f] sm:text-xs">
 Hi Priya 👋 your Gold membership renews on 12 Oct. Tap to renew and keep your streak going.
 </p>
 <p className="mt-1 flex items-center justify-end gap-0.5 text-[9px] text-sky-500">
 <Check className="size-3" />
 <Check className="-ml-2 size-3" /> Read
 </p>
 </Glass>
 </div>
 </div>

 {/* Check-in toast */}
 <div className={styles.layer} style={{ right: "-1%", top: "2%", ...z(120) }}>
 <div className={styles.bobSlow}>
 <Glass className="flex items-center gap-2.5 p-3 pr-4">
 <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 text-white">
 <CalendarCheck className="size-5" />
 </span>
 <div>
 <p className="text-[12px] font-semibold text-foreground">Rahul checked in</p>
 <p className="text-[10px] text-muted-foreground">QR at the front desk · 6:42 AM</p>
 </div>
 </Glass>
 </div>
 </div>

 {/* AI insight */}
 <div className={styles.layer} style={{ left: "5%", bottom: "2%", ...z(190) }}>
 <div className={styles.bobFast}>
 <Glass className="w-[190px] p-3 sm:w-[240px]">
 <div className="flex items-center gap-2">
 <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white">
 <Sparkles className="size-4" />
 </span>
 <p className="text-[11px] font-semibold text-foreground">AI agent</p>
 </div>
 <p className="mt-2 text-[11px] leading-snug text-muted-foreground sm:text-xs">
 <span className="font-semibold text-foreground">3 members</span> haven&apos;t visited in 10 days. Send them a win-back message?
 </p>
 <div className="mt-2 flex gap-1.5">
 <span className="rounded-full bg-violet-600 px-2.5 py-1 text-[10px] font-semibold text-white">Send</span>
 <span className="rounded-full bg-black/5 px-2.5 py-1 text-[10px] font-semibold text-foreground dark:bg-white/10">Review</span>
 </div>
 </Glass>
 </div>
 </div>

 {/* Member app */}
 <div className={cn(styles.layer, "hidden sm:block")} style={{ right: "3%", bottom: "-4%", ...z(230) }}>
 <div className={styles.bobSlow}>
 <Phone />
 </div>
 </div>

 {/* Payment received */}
 <div className={cn(styles.layer, "hidden md:block")} style={{ right: "26%", top: "-4%", ...z(80) }}>
 <div className={styles.bob}>
 <Glass className="flex items-center gap-2 px-3 py-2">
 <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500 text-white">
 <Check className="size-3.5" strokeWidth={3} />
 </span>
 <p className="text-[11px] font-semibold text-foreground">₹2,499 received · UPI</p>
 <Bell className="size-3.5 text-amber-500" />
 </Glass>
 </div>
 </div>
 </TiltStage>
 );
}

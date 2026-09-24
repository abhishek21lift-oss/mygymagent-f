"use client";

import Link from "next/link";
import {
 AlertTriangle,
 ArrowRight,
 ArrowUpRight,
 BarChart3,
 CalendarCheck,
 Check,
 CreditCard,
 Dumbbell,
 Package,
 RefreshCw,
 Sparkles,
 TrendingUp,
 Users,
 Wallet,
 Zap,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/shared/page-hero";
import { useAuth } from "@/lib/auth/auth-context";
import { useDailyBriefing } from "@/lib/hooks/use-daily-briefing";
import { StatCard, toStatTone } from "@/components/shared/stat-card";

function money(value: string | undefined, currency: string) {
 const amount = Number(value ?? 0);
 return Number.isFinite(amount)
 ? `${currency} ${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
 : `${currency} 0`;
}

/* ------------------------------------------------------------------ */
/* Vivid premium system — literal Tailwind strings (no dynamic color). */
/* One radius family (22–34px), one space rhythm, 5 gradient families. */
/* ------------------------------------------------------------------ */

type StatTone = "cyan" | "emerald" | "rose" | "violet";

const STAT_TONES: Record<
 StatTone,
 { bar: string; tile: string; softBg: string; cardRing: string; orb: string }
> = {
 cyan: {
 bar: "bg-cyan-400",
 tile: "bg-cyan-500 shadow-cyan-500/30",
 softBg: "bg-cyan-50 text-cyan-700",
 cardRing: "hover:border-cyan-200 hover:shadow-cyan-500/10",
 orb: "bg-cyan-400/20",
 },
 emerald: {
 bar: "bg-emerald-400",
 tile: "bg-emerald-500 shadow-emerald-500/30",
 softBg: "bg-emerald-50 text-emerald-700",
 cardRing: "hover:border-emerald-200 hover:shadow-emerald-500/10",
 orb: "bg-emerald-400/20",
 },
 rose: {
 bar: "bg-rose-500",
 tile: "bg-rose-500 shadow-rose-500/30",
 softBg: "bg-rose-50 text-rose-700",
 cardRing: "hover:border-rose-200 hover:shadow-rose-500/10",
 orb: "bg-rose-400/20",
 },
 violet: {
 bar: "bg-violet-600",
 tile: "bg-violet-600 shadow-violet-500/30",
 softBg: "bg-violet-50 text-violet-700",
 cardRing: "hover:border-violet-200 hover:shadow-violet-500/10",
 orb: "bg-fuchsia-400/20",
 },
};

function Stat({ label, value, hint, loading, tone, delta }: { icon?: unknown; label: string; value: React.ReactNode; hint?: string; loading?: boolean; tone?: string; delta?: React.ReactNode }) {
 // `delta` folds into the hint line rather than earning its own decorated
 // slot; it is a qualifier on the number, not a second number.
 const detail = [hint, typeof delta === "string" ? delta : undefined].filter(Boolean).join(" · ");
 return <StatCard title={label} value={typeof value === "string" || typeof value === "number" ? value : String(value ?? "")} isLoading={Boolean(loading)} hint={detail || undefined} tone={toStatTone(tone)} />;
}

/* ------------------------------------------------------------------ */
/* Decision queue — each severity owns one vivid hue + icon + tick. */
/* ------------------------------------------------------------------ */

type Severity = "risk" | "sales" | "stock" | "ai";

const SEVERITY_STYLES: Record<
 Severity,
 { chip: string; tick: string; hover: string; soft: string }
> = {
 risk: {
 chip: "bg-rose-500 shadow-rose-500/25",
 tick: "bg-rose-500",
 hover: "hover:border-rose-200 hover:bg-rose-50/60",
 soft: "bg-rose-50 text-rose-700",
 },
 sales: {
 chip: "bg-blue-600 shadow-blue-500/25",
 tick: "bg-blue-600",
 hover: "hover:border-blue-200 hover:bg-blue-50/60",
 soft: "bg-blue-50 text-blue-700",
 },
 stock: {
 chip: "bg-amber-500 shadow-amber-500/25",
 tick: "bg-amber-500",
 hover: "hover:border-amber-200 hover:bg-amber-50/60",
 soft: "bg-amber-50 text-amber-800",
 },
 ai: {
 chip: "bg-violet-600 shadow-violet-500/25",
 tick: "bg-violet-600",
 hover: "hover:border-violet-200 hover:bg-violet-50/60",
 soft: "bg-violet-50 text-violet-700",
 },
};

function PriorityRow({
 index,
 href,
 icon: Icon,
 title,
 detail,
 action,
 severity,
}: {
 index: number;
 href: string;
 icon: typeof AlertTriangle;
 title: string;
 detail: string;
 action: string;
 severity: Severity;
}) {
 const s = SEVERITY_STYLES[severity];
 return (
 <Link
 href={href}
 className={`group/pri relative flex items-center gap-4 overflow-hidden rounded-xl border border-transparent px-3 py-3.5 transition-all duration-200 hover:-translate-y-px hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 ${s.hover}`}
 >
 <span
 className={`absolute inset-y-3 left-0 w-1 rounded-full ${s.tick}`}
 aria-hidden="true"
 />
 <span className="w-8 shrink-0 pl-2 font-mono text-xs font-bold text-stone-400 tabular-nums">
 {String(index + 1).padStart(2, "0")}
 </span>
 <span
 className={`flex size-11 shrink-0 items-center justify-center rounded-lg text-white shadow-md transition-transform duration-200 group-hover/pri:scale-110 ${s.chip}`}
 >
 <Icon className="size-5" aria-hidden="true" />
 </span>
 <span className="min-w-0 flex-1">
 <span className="block truncate text-sm font-extrabold text-stone-900">
 {title}
 </span>
 <span className="mt-0.5 block truncate text-xs font-medium text-stone-600">
 {detail}
 </span>
 </span>
 <span className="hidden min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-card px-3 text-xs font-extrabold text-stone-700 shadow-sm ring-1 ring-stone-200/70 transition group-hover/pri:bg-stone-950 group-hover/pri:text-white group-hover/pri:ring-stone-950 sm:flex">
 {action}
 <ArrowRight
 className="size-3.5 transition-transform duration-200 group-hover/pri:translate-x-0.5"
 aria-hidden="true"
 />
 </span>
 </Link>
 );
}

/* ------------------------------------------------------------------ */
/* Watchlists — tinted headers, pill figures, hairline rows. */
/* ------------------------------------------------------------------ */

type WatchTone = "rose" | "amber" | "cyan";

const WATCH_STYLES: Record<
 WatchTone,
 { header: string; tile: string; pill: string; footer: string }
> = {
 rose: {
 header: "bg-rose-50/90",
 tile: "bg-rose-500 shadow-rose-500/25",
 pill: "bg-rose-500/10 text-rose-700 ring-rose-200/60",
 footer: "bg-rose-50/70 text-rose-700 ring-rose-100",
 },
 amber: {
 header: "bg-amber-50/90",
 tile: "bg-amber-500 shadow-amber-500/25",
 pill: "bg-amber-500/15 text-amber-800 ring-amber-200/60",
 footer: "bg-amber-50/70 text-amber-800 ring-amber-100",
 },
 cyan: {
 header: "bg-cyan-50/90",
 tile: "bg-cyan-500 shadow-cyan-500/25",
 pill: "bg-cyan-500/10 text-cyan-800 ring-cyan-200/60",
 footer: "bg-cyan-50/70 text-cyan-800 ring-cyan-100",
 },
};

function ListRow({
 primary,
 secondary,
 figure,
 tone,
}: {
 primary: string;
 secondary?: string;
 figure: string;
 tone: WatchTone;
}) {
 const w = WATCH_STYLES[tone];
 return (
 <div className="flex items-center justify-between gap-3 border-b border-stone-100 py-3 last:border-0">
 <div className="min-w-0">
 <p className="truncate text-sm font-bold text-stone-900">{primary}</p>
 {secondary && (
 <p className="mt-0.5 truncate text-xs font-medium text-stone-600">
 {secondary}
 </p>
 )}
 </div>
 <span
 className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-xs font-bold tabular-nums ring-1 ${w.pill}`}
 >
 {figure}
 </span>
 </div>
 );
}

function WatchlistCard({
 id,
 title,
 caption,
 href,
 actionLabel,
 icon: Icon,
 tone,
 children,
 footer,
}: {
 id: string;
 title: string;
 caption?: string;
 href: string;
 actionLabel: string;
 icon: typeof Users;
 tone: WatchTone;
 children: React.ReactNode;
 footer?: React.ReactNode;
}) {
 const w = WATCH_STYLES[tone];
 return (
 <Card className="overflow-hidden border-border bg-card">
 <div
 className={`flex items-start gap-3 border-b border-border px-5 py-5 ${w.header}`}
 >
 <span
 className={`flex size-11 shrink-0 items-center justify-center rounded-lg text-white shadow-md ${w.tile}`}
 >
 <Icon className="size-5" aria-hidden="true" />
 </span>
 <div className="min-w-0 flex-1">
 <h3 id={id} className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
 {title}
 </h3>
 {caption ? <p className="mt-0.5 text-xs font-medium text-stone-600">{caption}</p> : null}
 </div>
 </div>
 <CardContent className="p-5">
 {children}
 {footer && (
 <p
 className={`mt-4 rounded-xl px-3 py-2 text-center text-xs font-bold ring-1 ${w.footer}`}
 >
 {footer}
 </p>
 )}
 <Link
 href={href}
 aria-label={actionLabel}
 className="group/wl mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 py-2 text-xs font-extrabold text-stone-700 transition hover:bg-stone-950 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
 >
 {actionLabel}
 <ArrowUpRight
 className="size-4 transition-transform duration-200 group-hover/wl:-translate-y-0.5 group-hover/wl:translate-x-0.5"
 aria-hidden="true"
 />
 </Link>
 </CardContent>
 </Card>
 );
}

/* ------------------------------------------------------------------ */
/* Shortcut tiles — one vivid gradient per destination. */
/* ------------------------------------------------------------------ */

function Shortcut({
 href,
 icon: Icon,
 label,
 sublabel,
 tile,
 hoverRing,
}: {
 href: string;
 icon: typeof Users;
 label: string;
 sublabel?: string;
 tile: string;
 hoverRing: string;
}) {
 return (
 <Link
 href={href}
 className={`group/sc flex min-h-11 flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-[0_16px_45px_-30px_rgba(79,70,229,.4)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_-30px_rgba(79,70,229,.5)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 ${hoverRing}`}
 >
 <span
 className={`flex size-11 items-center justify-center rounded-lg text-white shadow-md transition-transform duration-300 group-hover/sc:scale-110 group-hover/sc:-rotate-3 ${tile}`}
 >
 <Icon className="size-5" aria-hidden="true" />
 </span>
 <span>
 <span className="block text-sm font-extrabold tracking-tight text-stone-950">
 {label}
 </span>
 {sublabel ? (
 <span className="mt-0.5 block text-xs font-medium text-stone-600">
 {sublabel}
 </span>
 ) : null}
 </span>
 </Link>
 );
}

function EmptyState({ text, action }: { text: string; action?: React.ReactNode }) {
 return (
 <div className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-stone-200 bg-stone-50/60 p-5 text-center">
 <span className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
 <Check className="size-5" aria-hidden="true" />
 </span>
 <p className="text-xs font-semibold text-stone-600">{text}</p>
 {action}
 </div>
 );
}

/* ------------------------------------------------------------------ */
/* Page */
/* ------------------------------------------------------------------ */

export default function CommandCenterPage() {
 const { hasPermission } = useAuth();
 const briefing = useDailyBriefing();
 const data = briefing.data;
 const currency = data?.revenue.revenue[0]?.currency ?? "INR";
 const revenue = data?.revenue.revenue.find((item) => item.currency === currency);
 const outstanding = data?.revenue.outstanding.find((item) => item.currency === currency);

 type Priority = Omit<Parameters<typeof PriorityRow>[0], "index"> & { key: string };
 const priorities: Priority[] = data
 ? (
 [
 data.atRiskMembers.count > 0 && {
 key: "risk",
 severity: "risk" as const,
 href: "/members",
 icon: AlertTriangle,
 title: `${data.atRiskMembers.count} members need attention`,
 detail: "Retention risk detected from recent activity.",
 action: "Review members",
 },
 data.salesFunnel.followUps.total > 0 && {
 key: "sales",
 severity: "sales" as const,
 href: "/crm",
 icon: TrendingUp,
 title: `${data.salesFunnel.followUps.total} follow-ups in the pipeline`,
 detail: `${data.salesFunnel.followUps.completionRatePct}% completed so far.`,
 action: "Open Sales",
 },
 data.lowStock.count > 0 && {
 key: "stock",
 severity: "stock" as const,
 href: "/inventory",
 icon: Package,
 title: `${data.lowStock.count} products below reorder level`,
 detail: "Protect availability before the next stockout.",
 action: "Review stock",
 },
 data.pendingAiActions > 0 && {
 key: "ai",
 severity: "ai" as const,
 href: "/ai-actions",
 icon: Sparkles,
 title: `${data.pendingAiActions} AI actions await approval`,
 detail: "Review before anything is executed.",
 action: "Review actions",
 },
 ].filter(Boolean) as Priority[]
 )
 : [];

 const followUpPct = data ? Number(data.salesFunnel.followUps.completionRatePct) || 0 : 0;
 const conversionPct = data ? Number(data.salesFunnel.conversionRatePct) || 0 : 0;

 return (
 <div className="pb-4">
 {/* Ambient canvas — matches PT OS / premium surfaces */}
 <div className="flex flex-col gap-5">
 {/* ------------------------------------------ Hero: compact midnight */}
 <PageHero
 id="cc-title"
 icon={Zap}
 title="Command centre"
 actions={
 <>
 <Link
 href="/ai"
 className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-indigo-950 shadow-[0_16px_40px_-16px_rgba(255,255,255,.5)] transition duration-300 hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
 >
 <Sparkles className="size-4" aria-hidden="true" />
 Ask THE CULT CLIENT
 <ArrowRight className="size-4" aria-hidden="true" />
 </Link>
 <Link
 href="/owner-os"
 className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/25 bg-card px-4 py-2.5 text-sm font-bold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
 >
 <BarChart3 className="size-4" aria-hidden="true" />
 Owner Insights
 </Link>
 </>
 }
 >
 <div className="grid gap-2 sm:grid-cols-3">
 <div className="rounded-lg border border-white/10 bg-card p-3">
 <div className="flex items-baseline justify-between gap-2">
 <span className="text-xs font-bold text-white/70">Check-ins</span>
 <span className="font-mono text-xl font-black tabular-nums">
 {briefing.isLoading ? "—" : (data?.today.checkIns ?? 0)}
 </span>
 </div>
 <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-card" role="presentation">
 <div
 className="h-full rounded-full bg-cyan-300 transition-all duration-700"
 style={{ width: `${Math.min(100, ((data?.today.checkIns ?? 0) / 50) * 100)}%` }}
 />
 </div>
 </div>
 <div className="rounded-lg border border-white/10 bg-card p-3">
 <div className="flex items-baseline justify-between gap-2">
 <span className="text-xs font-bold text-white/70">Follow-ups done</span>
 <span className="font-mono text-xl font-black tabular-nums">
 {data ? `${followUpPct}%` : "—"}
 </span>
 </div>
 <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-card" role="presentation">
 <div
 className="h-full rounded-full bg-amber-300 transition-all duration-700"
 style={{ width: `${Math.min(100, followUpPct)}%` }}
 />
 </div>
 </div>
 <div className="rounded-lg border border-white/10 bg-card p-3">
 <div className="flex items-baseline justify-between gap-2">
 <span className="text-xs font-bold text-white/70">Lead conversion</span>
 <span className="font-mono text-xl font-black tabular-nums">
 {data ? `${conversionPct}%` : "—"}
 </span>
 </div>
 <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-card" role="presentation">
 <div
 className="h-full rounded-full bg-fuchsia-300 transition-all duration-700"
 style={{ width: `${Math.min(100, conversionPct)}%` }}
 />
 </div>
 </div>
 </div>
 <Link
 href="/intelligence"
 className="mt-2 flex min-h-10 items-center justify-center gap-2 rounded-xl bg-card px-4 py-2.5 text-xs font-extrabold text-white ring-1 ring-white/20 transition hover:bg-white hover:text-indigo-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
 >
 Intelligence
 <ArrowUpRight className="size-4" aria-hidden="true" />
 </Link>
 </PageHero>

 {/* Error path — recoverable, with retry (UX state matrix) */}
 {briefing.isError && (
 <div
 role="alert"
 className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-muted/40 p-5 sm:flex-row sm:items-center"
 >
 <div className="min-w-0 flex-1">
 <p className="text-sm font-extrabold text-stone-900">
 Couldn&apos;t load the briefing
 </p>
 <p className="mt-0.5 text-xs font-medium text-stone-600">
 Check your connection — your navigation still works. Retry to refresh
 every number on this page.
 </p>
 </div>
 <Button
 type="button"
 onClick={() => briefing.refetch()}
 className="min-h-11 rounded-lg px-5 text-sm"
 disabled={briefing.isFetching}
 aria-busy={briefing.isFetching}
 >
 <RefreshCw
 className={`size-4 ${briefing.isFetching ? "animate-spin" : ""}`}
 aria-hidden="true"
 />
 {briefing.isFetching ? "Retrying…" : "Retry"}
 </Button>
 </div>
 )}

 {/* ------------------------------------------ Stat band */}
 <section aria-labelledby="cc-pulse" className="">
 <div className="mb-4 flex items-end justify-between gap-4">
 <div>
 <h2 id="cc-pulse" className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
 Business pulse
 </h2>
 </div>
 <Link
 href="/intelligence"
 className="hidden min-h-11 items-center gap-1 text-xs font-extrabold text-violet-700 hover:text-violet-900 sm:inline-flex"
 >
 View insights <ArrowUpRight className="size-3.5" aria-hidden="true" />
 </Link>
 </div>
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
 <Stat
 icon={CalendarCheck}
 label="Check-ins today"
 value={String(data?.today.checkIns ?? 0)}
 loading={briefing.isLoading}
 tone="cyan"
 delta="LIVE"
 />
 <Stat
 icon={Wallet}
 label="Net revenue"
 value={money(revenue?.netRevenue, currency)}
 hint={revenue ? `${revenue.paymentCount} payments` : undefined}
 loading={briefing.isLoading}
 tone="emerald"
 delta={revenue ? `${revenue.paymentCount} txns` : undefined}
 />
 <Stat
 icon={Users}
 label="Members at risk"
 value={String(data?.atRiskMembers.count ?? 0)}
 loading={briefing.isLoading}
 tone="rose"
 delta={data && data.atRiskMembers.count > 0 ? "ACT NOW" : undefined}
 />
 <Stat
 icon={Sparkles}
 label="Pending AI actions"
 value={String(data?.pendingAiActions ?? 0)}
 loading={briefing.isLoading}
 tone="violet"
 delta={data && data.pendingAiActions > 0 ? "REVIEW" : undefined}
 />
 </div>
 </section>

 {/* ------------------------------------------ Decision queue + Sales health */}
 <section
 aria-labelledby="cc-decisions"
 className="grid gap-5 xl:grid-cols-[1.35fr_0.9fr]"
 >
 <Card className="overflow-hidden border-border bg-card">
 <div className="flex items-center justify-between gap-3 border-b border-border bg-white px-6 py-5">
 <div className="flex items-center gap-3">
 <span className="flex size-11 items-center justify-center rounded-lg bg-violet-600 text-white shadow-lg shadow-violet-500/25">
 <Zap className="size-5" aria-hidden="true" />
 </span>
 <div>
 <h2 id="cc-decisions" className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
 Decision queue
 </h2>
 </div>
 </div>
 {data && priorities.length > 0 && (
 <span className="rounded-full bg-violet-600 px-3 py-1 font-mono text-xs font-black text-white tabular-nums shadow-md shadow-fuchsia-500/20">
 {priorities.length}
 </span>
 )}
 </div>
 <CardContent className="p-3 sm:p-4">
 {briefing.isLoading ? (
 <div className="space-y-2" aria-label="Loading priorities">
 {[1, 2, 3].map((item) => (
 <div key={item} className="h-[68px] animate-pulse rounded-xl bg-muted/40" />
 ))}
 </div>
 ) : priorities.length ? (
 <div className="flex flex-col gap-1">
 {priorities.map(({ key, ...item }, index) => (
 <PriorityRow key={key} {...item} index={index} />
 ))}
 </div>
 ) : (
 <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-200 bg-muted/40 px-5 py-10 text-center">
 <span className="flex size-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
 <Check className="size-6" aria-hidden="true" />
 </span>
 <p className="text-sm font-extrabold text-stone-900">All caught up</p>
 <p className="text-xs font-medium text-stone-600">
 No priority items need attention right now. Enjoy the calm.
 </p>
 </div>
 )}
 </CardContent>
 </Card>

 {/* Vivid gradient hero — sales health */}
 <div className="relative flex h-full flex-col overflow-hidden rounded-xl bg-[linear-gradient(145deg,#172554,#3730a3_45%,#a21caf)] p-4 text-white shadow-[0_28px_75px_-38px_rgba(79,70,229,.78)] sm:p-5">
 <div className="pointer-events-none absolute -right-12 -top-16 size-56 rounded-full bg-fuchsia-400/25 blur-3xl" aria-hidden="true" />
 <div className="pointer-events-none absolute -bottom-16 -left-10 size-56 rounded-full bg-cyan-400/20 blur-3xl" aria-hidden="true" />
 <div className="relative flex items-center gap-3">
 <span className="flex size-11 items-center justify-center rounded-lg bg-card ring-1 ring-white/20">
 <TrendingUp className="size-5" aria-hidden="true" />
 </span>
 <div>
 <h2 className="text-sm font-semibold tracking-tight">Sales health</h2>
 </div>
 </div>
 <div className="relative mt-4 grid grid-cols-2 gap-2">
 {(
 [
 ["Total leads", data ? String(data.salesFunnel.totalLeads) : "—", "bg-cyan-400/25"],
 ["Won leads", data ? String(data.salesFunnel.wonLeads) : "—", "bg-emerald-400/25"],
 ["Conversion", data ? `${data.salesFunnel.conversionRatePct}%` : "—", "bg-fuchsia-400/25"],
 ["Follow-ups", data ? `${data.salesFunnel.followUps.completionRatePct}%` : "—", "bg-amber-300/25"],
 ] as const
 ).map(([label, value, tint]) => (
 <div
 key={label}
 className={`rounded-lg border border-white/15 p-3 ${tint}`}
 >
 <p className="text-xs font-black uppercase tracking-[.16em] text-white/60">
 {label}
 </p>
 <p className="mt-1 font-mono text-2xl font-black leading-none tabular-nums">
 {value}
 </p>
 </div>
 ))}
 </div>
 <Link
 href="/crm"
 className="group/ink relative mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-indigo-950 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
 >
 Open Sales OS
 <ArrowRight
 className="size-4 transition-transform duration-300 group-hover/ink:translate-x-1"
 aria-hidden="true"
 />
 </Link>
 </div>
 </section>

 {/* ------------------------------------------ Money movement */}
 <section aria-labelledby="cc-money" className="[animation-delay:150ms]">
 <div className="mb-4 flex items-end justify-between gap-4">
 <div className="flex items-center gap-3">
 <span className="flex size-11 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
 <CreditCard className="size-5" aria-hidden="true" />
 </span>
 <div>
 <h2 id="cc-money" className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
 Money movement
 </h2>
 {data ? (
 <p className="mt-0.5 text-xs font-medium text-stone-600">
 {`${new Date(data.revenue.period.from).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${new Date(data.revenue.period.to).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
 </p>
 ) : null}
 </div>
 </div>
 <Link
 href="/billing"
 className="group/mm hidden min-h-11 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold text-emerald-700 transition hover:bg-emerald-500/10 sm:inline-flex"
 >
 Open billing
 <ArrowUpRight className="size-4 transition-transform duration-200 group-hover/mm:-translate-y-0.5 group-hover/mm:translate-x-0.5" aria-hidden="true" />
 </Link>
 </div>
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
 {(
 [
 {
 label: "Net revenue",
 value: money(revenue?.netRevenue, currency),
 hint: revenue ? `${revenue.paymentCount} payments` : "—",
 icon: Wallet,
 card: "from-emerald-50/90 via-white to-teal-50/50 hover:border-emerald-200",
 tile: "bg-emerald-500 shadow-emerald-500/25",
 bar: "bg-emerald-400",
 },
 {
 label: "Membership revenue",
 value: money(revenue?.membershipRevenue, currency),
 icon: Users,
 card: "from-violet-50/90 via-white to-blue-50/50 hover:border-violet-200",
 tile: "bg-violet-600 shadow-violet-500/25",
 bar: "bg-violet-500",
 },
 {
 label: "Outstanding",
 value: money(outstanding?.outstandingBalance, currency),
 hint: outstanding
 ? `${outstanding.membershipsWithBalance} memberships with balance`
 : "—",
 icon: CreditCard,
 card: "from-amber-50/90 via-white to-orange-50/50 hover:border-amber-200",
 tile: "bg-amber-500 shadow-amber-500/25",
 bar: "bg-amber-400",
 },
 ] as const
 ).map((item) => (
 <Card
 key={item.label}
 className={`relative overflow-hidden border-border shadow-[0_20px_60px_-38px_rgba(79,70,229,.35)] transition duration-300 hover:-translate-y-1 ${item.card}`}
 >
 <span className={`absolute inset-x-0 top-0 h-1.5 ${item.bar}`} aria-hidden="true" />
 <CardContent className="flex items-center gap-4 p-5 lg:p-6">
 <span className={`flex size-14 shrink-0 items-center justify-center rounded-lg text-white shadow-lg ${item.tile}`}>
 <item.icon className="size-6" aria-hidden="true" />
 </span>
 <div className="min-w-0">
 <p className="text-xs font-black uppercase tracking-[.18em] text-stone-500">
 {item.label}
 </p>
 <p className="mt-1 truncate text-2xl font-black tracking-tight text-stone-950 tabular-nums">
 {item.value}
 </p>
 {"hint" in item && item.hint ? <p className="mt-1 text-xs font-medium text-stone-600">{item.hint}</p> : null}
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 <Link
 href="/billing"
 className="group/collect mt-4 flex items-center gap-4 rounded-xl border border-amber-200/80 bg-muted/40 px-5 py-4 shadow-sm transition-all duration-200 hover:-translate-y-px hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 lg:px-6"
 >
 <span className="min-w-0 flex-1">
 <span className="block text-sm font-extrabold text-stone-900">
 Keep collections moving
 </span>
 </span>
 <ArrowRight
 className="size-5 shrink-0 text-amber-700 transition-transform duration-200 group-hover/collect:translate-x-1"
 aria-hidden="true"
 />
 </Link>
 </section>

 {/* ------------------------------------------ Watchlists */}
 <section aria-label="Watchlists" className="grid gap-5 lg:grid-cols-3">
 <WatchlistCard
 id="cc-risk"
 title="At-risk members"
 href="/members"
 actionLabel="Members"
 icon={AlertTriangle}
 tone="rose"
 footer={data ? `${data.atRiskMembers.count} total on watchlist` : undefined}
 >
 {briefing.isLoading ? (
 <div className="space-y-2" aria-label="Loading at-risk members">
 {[1, 2, 3].map((i) => (
 <div key={i} className="h-12 animate-pulse rounded-xl bg-stone-100" />
 ))}
 </div>
 ) : data?.atRiskMembers.top.length ? (
 data.atRiskMembers.top.map((member) => (
 <ListRow
 key={member.id}
 primary={`${member.firstName} ${member.lastName}`}
 secondary={
 member.neverCheckedIn
 ? "Never checked in"
 : `${member.daysSinceLastVisit} days since visit`
 }
 figure="Risk"
 tone="rose"
 />
 ))
 ) : (
 <EmptyState text="No at-risk members." />
 )}
 </WatchlistCard>

 <WatchlistCard
 id="cc-stock"
 title="Low stock"
 href="/inventory"
 actionLabel="Inventory"
 icon={Package}
 tone="amber"
 footer={data ? `${data.lowStock.count} products below reorder level` : undefined}
 >
 {briefing.isLoading ? (
 <div className="space-y-2" aria-label="Loading low stock">
 {[1, 2, 3].map((i) => (
 <div key={i} className="h-12 animate-pulse rounded-xl bg-stone-100" />
 ))}
 </div>
 ) : data?.lowStock.top.length ? (
 data.lowStock.top.map((product) => (
 <ListRow
 key={product.productId}
 primary={product.name}
 secondary={`${product.sku} · reorder at ${product.reorderLevel}`}
 figure={String(product.quantityOnHand)}
 tone="amber"
 />
 ))
 ) : (
 <EmptyState text="Inventory levels look healthy." />
 )}
 </WatchlistCard>

 <WatchlistCard
 id="cc-trainers"
 title="Trainer workload"
 href="/staff"
 actionLabel="Staff"
 icon={Users}
 tone="cyan"
 footer={
 data
 ? `${data.trainerWorkload.trainerCount} trainers · plans assigned last 30 days`
 : undefined
 }
 >
 {briefing.isLoading ? (
 <div className="space-y-2" aria-label="Loading trainer workload">
 {[1, 2, 3].map((i) => (
 <div key={i} className="h-12 animate-pulse rounded-xl bg-stone-100" />
 ))}
 </div>
 ) : data?.trainerWorkload.top.length ? (
 data.trainerWorkload.top.map((trainer) => (
 <ListRow
 key={trainer.userId}
 primary={`${trainer.firstName} ${trainer.lastName}`}
 secondary={`${trainer.assignedMemberCount} assigned members`}
 figure={`${trainer.workoutPlansAssignedLast30Days + trainer.dietPlansAssignedLast30Days} plans`}
 tone="cyan"
 />
 ))
 ) : (
 <EmptyState text="No trainer workload data yet." />
 )}
 </WatchlistCard>
 </section>

 {/* ------------------------------------------ Shortcuts */}
 <section aria-labelledby="cc-fast" className="[animation-delay:250ms]">
 <div className="mb-4 flex items-center gap-3">
 <span className="flex size-11 items-center justify-center rounded-lg bg-cyan-500 text-white shadow-lg shadow-violet-500/25">
 <Zap className="size-5" aria-hidden="true" />
 </span>
 <div>
 <h2 id="cc-fast" className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
 Move faster
 </h2>
 </div>
 </div>
 <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
 {hasPermission("attendance.read") && (
 <Shortcut
 href="/attendance"
 icon={CalendarCheck}
 label="Attendance"
 tile="bg-cyan-500 shadow-cyan-500/25"
 hoverRing="hover:border-cyan-200 hover:shadow-cyan-500/10"
 />
 )}
 {hasPermission("members.read") && (
 <Shortcut
 href="/members"
 icon={Users}
 label="Members"
 tile="bg-violet-600 shadow-violet-500/25"
 hoverRing="hover:border-violet-200 hover:shadow-violet-500/10"
 />
 )}
 {hasPermission("payments.read") && (
 <Shortcut
 href="/billing"
 icon={Wallet}
 label="Billing"
 tile="bg-emerald-500 shadow-emerald-500/25"
 hoverRing="hover:border-emerald-200 hover:shadow-emerald-500/10"
 />
 )}
 {hasPermission("workouts.edit") && (
 <Shortcut
 href="/workouts"
 icon={Dumbbell}
 label="Workout OS"
 tile="bg-rose-500 shadow-rose-500/25"
 hoverRing="hover:border-rose-200 hover:shadow-rose-500/10"
 />
 )}
 <Shortcut
 href="/owner-os"
 icon={BarChart3}
 label="Owner Insights"
 tile="bg-amber-500 shadow-amber-500/25"
 hoverRing="hover:border-amber-200 hover:shadow-amber-500/10"
 />
 <Shortcut
 href="/crm"
 icon={TrendingUp}
 label="Sales OS"
 tile="bg-blue-600 shadow-blue-500/25"
 hoverRing="hover:border-blue-200 hover:shadow-blue-500/10"
 />
 <Shortcut
 href="/inventory"
 icon={Package}
 label="Inventory OS"
 tile="bg-orange-500 shadow-orange-500/25"
 hoverRing="hover:border-orange-200 hover:shadow-orange-500/10"
 />
 <Shortcut
 href="/ai"
 icon={Sparkles}
 label="THE CULT CLIENT AI"
 tile="bg-fuchsia-600 shadow-fuchsia-500/25"
 hoverRing="hover:border-fuchsia-200 hover:shadow-fuchsia-500/10"
 />
 </div>
 </section>

 {data && (
 <p className="text-xs font-medium text-stone-500">
 Briefing generated {new Date(data.generatedAt).toLocaleString("en-IN")}.
 </p>
 )}
 </div>
 </div>
 );
}

"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Dumbbell,
  Package,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";
import { useDailyBriefing } from "@/lib/hooks/use-daily-briefing";

function money(value: string | undefined, currency: string) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount)
    ? `${currency} ${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
    : `${currency} 0`;
}

const tones = {
  cyan: {
    icon: "bg-gradient-to-br from-cyan-400 to-cyan-600 text-white shadow-lg shadow-cyan-500/30",
    value: "text-transparent bg-clip-text bg-gradient-to-r from-cyan-700 to-cyan-900",
  },
  emerald: {
    icon: "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/30",
    value: "text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 to-emerald-900",
  },
  amber: {
    icon: "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/30",
    value: "text-transparent bg-clip-text bg-gradient-to-r from-amber-700 to-amber-900",
  },
  violet: {
    icon: "bg-gradient-to-br from-violet-400 to-violet-600 text-white shadow-lg shadow-violet-500/30",
    value: "text-transparent bg-clip-text bg-gradient-to-r from-violet-700 to-violet-900",
  },
};

const toneGlow: Record<keyof typeof tones, string> = {
  cyan: "bg-gradient-to-br from-cyan-300/30 via-cyan-400/15 to-transparent",
  emerald: "bg-gradient-to-br from-emerald-300/30 via-emerald-400/15 to-transparent",
  amber: "bg-gradient-to-br from-amber-300/30 via-amber-400/15 to-transparent",
  violet: "bg-gradient-to-br from-violet-300/30 via-violet-400/15 to-transparent",
};

function Metric({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: React.ReactNode;
  hint: string;
  tone: keyof typeof tones;
}) {
  const t = tones[tone];
  const glow = toneGlow[tone];
  return (
    <Card className="group relative overflow-hidden border-white/60 bg-white/90 shadow-xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-primary/10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className={`pointer-events-none absolute -right-6 -top-6 h-40 w-40 rounded-full ${glow} blur-2xl transition-transform duration-700 group-hover:scale-125`} />
      <div className="pointer-events-none absolute -bottom-3 -left-3 h-24 w-24 rounded-full bg-gradient-to-tr from-stone-200/20 to-transparent blur-xl" />
      <CardContent className="relative flex items-center gap-4 p-6">
        <span className={`flex size-14 shrink-0 items-center justify-center rounded-2xl ${t.icon}`}>
          <Icon className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-stone-500">
            {label}
          </p>
          <p className={`mt-1.5 truncate text-2xl font-black tracking-tight ${t.value}`}>
            {value}
          </p>
          <p className="mt-1 text-[11px] font-medium text-stone-400">{hint}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionHeader({
  eyebrow,
  title,
  action,
  href,
}: {
  eyebrow: string;
  title: string;
  action?: string;
  href?: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 px-1">
      <div>
        <p className="bg-gradient-to-r from-primary to-ai bg-clip-text text-[10px] font-black uppercase tracking-[.24em] text-transparent">
          {eyebrow}
        </p>
        <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-stone-900 sm:text-[28px]">
          {title}
        </h2>
      </div>
      {action && href && (
        <Link
          href={href}
          className="group inline-flex items-center gap-2 rounded-full border border-stone-200/80 bg-white/80 px-4 py-2.5 text-xs font-bold text-stone-600 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary hover:shadow-md"
        >
          {action}
          <ChevronRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex min-h-28 items-center justify-center rounded-2xl border-2 border-dashed border-stone-200/80 bg-gradient-to-br from-stone-50/50 to-stone-100/30 p-5 text-center text-xs font-medium text-stone-500">
      {text}
    </div>
  );
}

function PriorityLink({
  href,
  cls,
  iconBg,
  icon: Icon,
  title,
  detail,
  action,
}: {
  href: string;
  cls: string;
  iconBg: string;
  icon: typeof AlertTriangle;
  title: string;
  detail: string;
  action: string;
}) {
  return (
    <Link
      href={href}
      className={`group/pri flex items-center gap-4 rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${cls}`}
    >
      <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/90 shadow-md ${iconBg}`}>
        <Icon className="size-5 text-stone-700" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-stone-900">{title}</span>
        <span className="mt-0.5 block text-xs text-stone-500">{detail}</span>
      </span>
      <span className="hidden items-center gap-1.5 text-xs font-bold text-stone-600 sm:flex">
        {action}
        <ArrowRight className="size-3.5 transition-transform duration-300 group-hover/pri:translate-x-1" />
      </span>
    </Link>
  );
}

function ShortcutLink({
  href,
  bgFrom,
  bgTo,
  border,
  iconBg,
  icon: Icon,
  label,
  sublabel,
}: {
  href: string;
  bgFrom: string;
  bgTo: string;
  border: string;
  iconBg: string;
  icon: typeof CalendarCheck;
  label: string;
  sublabel: string;
}) {
  return (
    <Link
      href={href}
      className={`group/short group/card relative overflow-hidden rounded-2xl border ${border} bg-gradient-to-br ${bgFrom} ${bgTo} p-5 shadow-lg backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl`}
    >
      <div className="absolute -right-4 -bottom-4 size-20 rounded-full bg-gradient-to-br from-stone-200/20 to-stone-300/10 blur-xl transition-transform duration-700 group-hover/card:scale-125" />
      <span className={`relative flex size-12 items-center justify-center rounded-2xl ${iconBg} shadow-lg`}>
        <Icon className="size-6" />
      </span>
      <div className="mt-4">
        <p className="text-sm font-black text-stone-900">{label}</p>
        <p className="mt-0.5 text-xs text-stone-500">{sublabel}</p>
      </div>
      <ChevronRight className="absolute bottom-4 right-4 size-4 text-stone-400 transition-transform duration-300 group-hover/short:translate-x-1" />
    </Link>
  );
}

function OSLink({
  href,
  bgFrom,
  bgTo,
  border,
  iconBg,
  icon: Icon,
  label,
  sublabel,
  cta,
}: {
  href: string;
  bgFrom: string;
  bgTo: string;
  border: string;
  iconBg: string;
  icon: typeof BarChart3;
  label: string;
  sublabel: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className={`group/card relative overflow-hidden rounded-3xl border ${border} bg-gradient-to-br ${bgFrom} ${bgTo} p-6 shadow-xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl`}
    >
      <div className="absolute -right-6 -top-6 size-28 rounded-full bg-gradient-to-br from-stone-300/20 to-stone-400/10 blur-2xl transition-transform duration-700 group-hover/card:scale-125" />
      <div className="relative">
        <span className={`flex size-12 items-center justify-center rounded-2xl ${iconBg} shadow-xl`}>
          <Icon className="size-6" />
        </span>
        <p className="mt-5 text-base font-black text-stone-900">{label}</p>
        <p className="mt-1.5 text-xs text-stone-500">{sublabel}</p>
        <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-primary">
          {cta}
          <ChevronRight className="size-3.5 transition-transform duration-300 group-hover/card:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}

export default function CommandCenterPage() {
  const { hasPermission } = useAuth();
  const briefing = useDailyBriefing();
  const data = briefing.data;
  const currency = data?.revenue.revenue[0]?.currency ?? "INR";
  const revenue = data?.revenue.revenue.find((item) => item.currency === currency);
  const outstanding = data?.revenue.outstanding.find((item) => item.currency === currency);

  const priorities = data
    ? [
        data.atRiskMembers.count > 0 && {
          href: "/members",
          cls: "bg-gradient-to-br from-rose-50/90 to-red-50/70 border-rose-200/60",
          iconBg: "bg-gradient-to-br from-rose-400 to-red-500 text-white",
          icon: AlertTriangle as typeof AlertTriangle,
          title: `${data.atRiskMembers.count} members need attention`,
          detail: "Retention risk detected from recent activity.",
          action: "Review members",
        },
        data.salesFunnel.followUps.total > 0 && {
          href: "/crm",
          cls: "bg-gradient-to-br from-blue-50/90 to-indigo-50/70 border-blue-200/60",
          iconBg: "bg-gradient-to-br from-blue-400 to-indigo-500 text-white",
          icon: TrendingUp as typeof AlertTriangle,
          title: `${data.salesFunnel.followUps.total} follow-ups in the pipeline`,
          detail: `${data.salesFunnel.followUps.completionRatePct}% completed so far.`,
          action: "Open Sales",
        },
        data.lowStock.count > 0 && {
          href: "/inventory",
          cls: "bg-gradient-to-br from-amber-50/90 to-orange-50/70 border-amber-200/60",
          iconBg: "bg-gradient-to-br from-amber-400 to-orange-500 text-white",
          icon: Package as typeof AlertTriangle,
          title: `${data.lowStock.count} products below reorder level`,
          detail: "Protect availability before the next stockout.",
          action: "Review stock",
        },
        data.pendingAiActions > 0 && {
          href: "/ai-actions",
          cls: "bg-gradient-to-br from-violet-50/90 to-fuchsia-50/70 border-violet-200/60",
          iconBg: "bg-gradient-to-br from-violet-400 to-fuchsia-500 text-white",
          icon: Sparkles as typeof AlertTriangle,
          title: `${data.pendingAiActions} AI actions await approval`,
          detail: "Review before anything is executed.",
          action: "Review actions",
        },
      ].filter(Boolean)
    : [];

  return (
    <div className="relative -mx-2 min-h-full overflow-hidden pb-12 sm:-mx-3 lg:-mx-5">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="animate-blob absolute -left-20 -top-32 size-[28rem] rounded-full bg-gradient-to-br from-cyan-400/25 via-blue-400/20 to-transparent blur-3xl" />
        <div className="animate-blob absolute -right-20 -top-20 size-[26rem] rounded-full bg-gradient-to-br from-violet-400/20 via-fuchsia-400/15 to-transparent blur-3xl" style={{ animationDelay: "2s" }} />
        <div className="animate-blob absolute left-[30%] -top-40 size-[32rem] rounded-full bg-gradient-to-br from-amber-400/15 via-rose-400/12 to-transparent blur-3xl" style={{ animationDelay: "4s" }} />
        <div className="animate-blob absolute -bottom-40 left-[10%] size-[28rem] rounded-full bg-gradient-to-tr from-emerald-400/15 via-teal-400/12 to-transparent blur-3xl" style={{ animationDelay: "3s" }} />
        <div className="animate-blob absolute -bottom-20 right-[15%] size-[24rem] rounded-full bg-gradient-to-tl from-indigo-400/20 via-blue-400/12 to-transparent blur-3xl" style={{ animationDelay: "5s" }} />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[38rem] bg-gradient-to-b from-white/95 via-white/60 to-transparent" />

      <div className="mx-auto flex max-w-[1680px] flex-col gap-10 px-2 sm:px-4 lg:px-6">
        {/* Hero */}
        <section className="group relative isolate overflow-hidden rounded-[2rem] border border-white/80 bg-white/85 shadow-[0_35px_110px_-48px_rgba(99,102,241,.35)] ring-1 ring-stone-200/50 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-700">
          <div className="absolute inset-0 overflow-hidden rounded-[2rem]">
            <div className="animate-pulse-slow absolute -left-16 -top-20 size-72 rounded-full bg-gradient-to-br from-cyan-300/35 via-blue-300/25 to-transparent blur-3xl" />
            <div className="animate-pulse-slow absolute -right-12 -top-16 size-80 rounded-full bg-gradient-to-br from-violet-300/35 via-fuchsia-300/25 to-transparent blur-3xl" style={{ animationDelay: "1.5s" }} />
            <div className="animate-pulse-slow absolute -bottom-32 left-[30%] size-72 rounded-full bg-gradient-to-t from-rose-300/25 via-pink-200/15 to-transparent blur-3xl" style={{ animationDelay: "3s" }} />
            <div className="animate-pulse-slow absolute right-[18%] top-0 size-32 rounded-full bg-gradient-to-bl from-amber-300/35 via-orange-200/20 to-transparent blur-2xl" style={{ animationDelay: "2.5s" }} />
          </div>
          <div className="relative grid gap-8 p-7 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-end lg:p-12">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.2em] text-primary backdrop-blur-xl">
                <span className="flex size-1.5 rounded-full bg-primary animate-pulse" />{" "}
                Command Center
              </div>
              <h1 className="bg-gradient-to-br from-stone-950 via-stone-800 to-stone-600 bg-clip-text text-5xl font-black tracking-[-.04em] leading-[.96] text-transparent sm:text-6xl lg:text-7xl">
                619 FITNESS STUDIO
              </h1>
              <p className="mt-4 max-w-xl text-sm font-medium leading-relaxed text-stone-500">
                Your business pulse, decisions queue, and growth engine — all in one place.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:flex-col lg:gap-4">
              <Link
                href="/owner-os"
                className="group/btn inline-flex min-h-[3.25rem] items-center justify-center gap-2.5 rounded-2xl border border-stone-200/80 bg-white/90 px-6 text-sm font-extrabold text-stone-800 shadow-xl shadow-stone-900/5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:text-primary hover:shadow-2xl hover:shadow-primary/10"
              >
                <BarChart3 className="size-4 text-primary" />
                Insights
                <ChevronRight className="size-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
              </Link>
              <Link
                href="/ai"
                className="group/ai relative inline-flex min-h-[3.25rem] items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-violet-500 to-fuchsia-500 px-7 text-sm font-extrabold text-white shadow-2xl shadow-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-3xl hover:shadow-fuchsia-30"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover/ai:translate-x-full" />
                <Sparkles className="relative size-4" />
                <span className="relative">Ask MyGymAgent</span>
                <ArrowRight className="relative size-4 transition-transform duration-300 group-hover/ai:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>

        {/* Today at a glance */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: "200ms" }}>
          <SectionHeader eyebrow="Business pulse" title="Today at a glance" />
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              icon={CalendarCheck}
              label="Today's check-ins"
              value={briefing.isLoading ? "—" : (data?.today.checkIns ?? 0)}
              hint="Real-time attendance"
              tone="cyan"
            />
            <Metric
              icon={Wallet}
              label="Net revenue"
              value={briefing.isLoading ? "—" : money(revenue?.netRevenue, currency)}
              hint="Current period"
              tone="emerald"
            />
            <Metric
              icon={Users}
              label="Members at risk"
              value={briefing.isLoading ? "—" : (data?.atRiskMembers.count ?? 0)}
              hint="14+ days inactive"
              tone="amber"
            />
            <Metric
              icon={Sparkles}
              label="Pending AI actions"
              value={briefing.isLoading ? "—" : (data?.pendingAiActions ?? 0)}
              hint="Needs approval"
              tone="violet"
            />
          </div>
        </section>

        {/* Decision queue + Sales health */}
        <section
          className="grid gap-6 xl:grid-cols-[1.35fr_.9fr] animate-in fade-in slide-in-from-bottom-4 duration-700"
          style={{ animationDelay: "300ms" }}
        >
          <Card className="group overflow-hidden border-white/80 bg-white/88 shadow-[0_24px_70px_-45px_rgba(28,25,23,.4)] backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-50/50 via-orange-50/30 to-amber-50/20 opacity-60" />
            <div className="absolute -right-8 -top-8 size-32 rounded-full bg-gradient-to-br from-rose-300/20 to-orange-300/15 blur-2xl transition-transform duration-700 group-hover:scale-110" />
            <CardHeader className="relative border-b border-stone-100/80 bg-gradient-to-r from-white via-rose-50/50 to-amber-50/50 px-6 py-5">
              <CardTitle className="flex items-center gap-3 text-xl font-bold text-stone-950">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 to-orange-500 text-white shadow-lg shadow-rose-500/20">
                  <Zap className="size-5" />
                </span>
                Decision queue
              </CardTitle>
              <p className="mt-1.5 text-xs text-stone-500">
                The highest-value things that deserve attention right now.
              </p>
            </CardHeader>
            <CardContent className="relative p-4">
              {briefing.isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-[76px] animate-pulse rounded-2xl bg-gradient-to-r from-stone-100 to-stone-50"
                    />
                  ))}
                </div>
              ) : priorities.length ? (
                <div className="space-y-3">
                  {priorities.map((item) => {
                    if (!item) return null;
                    return (
                      <PriorityLink
                        key={item.title}
                        href={item.href}
                        cls={item.cls}
                        iconBg={item.iconBg}
                        icon={item.icon as typeof AlertTriangle}
                        title={item.title}
                        detail={item.detail}
                        action={item.action}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-200/80 bg-gradient-to-br from-emerald-50/60 to-teal-50/40 p-10 text-center">
                  <span className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-xl shadow-emerald-500/25">
                    <CheckCircle2 className="size-7" />
                  </span>
                  <p className="mt-4 text-sm font-bold text-emerald-700">All caught up!</p>
                  <p className="mt-1 text-xs text-emerald-500">
                    No priority items need attention right now.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="group overflow-hidden border-0 bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4c1d95] text-white shadow-2xl shadow-indigo-500/30 animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -right-8 -top-8 size-36 rounded-full bg-gradient-to-br from-violet-400/30 to-fuchsia-400/20 blur-2xl" />
              <div className="absolute -bottom-6 left-4 size-28 rounded-full bg-gradient-to-tr from-indigo-400/25 to-blue-400/15 blur-2xl" />
            </div>
            <CardHeader className="relative border-b border-white/10 px-6 py-5">
              <CardTitle className="flex items-center gap-3 text-xl font-bold">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-xl shadow-lg">
                  <TrendingUp className="size-5" />
                </span>
                Sales health
              </CardTitle>
              <p className="mt-1.5 text-xs text-white/60">
                Pipeline momentum and follow-up discipline.
              </p>
            </CardHeader>
            <CardContent className="relative space-y-4 p-6">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Total leads", data?.salesFunnel.totalLeads ?? "—"],
                  ["Won leads", data?.salesFunnel.wonLeads ?? "—"],
                  [
                    "Conversion",
                    data ? `${data.salesFunnel.conversionRatePct}%` : "—",
                  ],
                  [
                    "Follow-ups",
                    data
                      ? `${data.salesFunnel.followUps.completionRatePct}%`
                      : "—",
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label as string}
                    className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4 backdrop-blur-xl"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                      {label}
                    </p>
                    <p className="mt-2 text-2xl font-black tabular-nums text-white">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
              <Link
                href="/crm"
                className="group/btn relative inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-white to-slate-100 px-5 py-4 text-sm font-bold text-indigo-800 shadow-xl shadow-white/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-white/30"
              >
                <TrendingUp className="size-4" />
                Open Sales OS
                <ArrowRight className="size-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
              </Link>
            </CardContent>
          </Card>
        </section>

        {/* Money movement */}
        <section
          className="animate-in fade-in slide-in-from-bottom-4 duration-700"
          style={{ animationDelay: "500ms" }}
        >
          <SectionHeader
            eyebrow="Financial intelligence"
            title="Money movement"
            action="Open billing"
            href="/billing"
          />
          <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
            <Card className="overflow-hidden border-white/80 bg-white/88 shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-left-4 duration-700">
              <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-5 shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10">
                  <div className="absolute -right-3 -top-3 size-16 rounded-full bg-gradient-to-br from-emerald-200/40 to-teal-200/30 blur-xl transition-transform duration-700 group-hover:scale-125" />
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                    Net revenue
                  </p>
                  <p className="mt-2 text-2xl font-black text-stone-950">
                    {money(revenue?.netRevenue, currency)}
                  </p>
                  <p className="mt-1.5 text-xs text-stone-500">
                    {revenue?.paymentCount ?? 0} payments
                  </p>
                </div>
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50 p-5 shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10">
                  <div className="absolute -right-3 -top-3 size-16 rounded-full bg-gradient-to-br from-indigo-200/40 to-violet-200/30 blur-xl transition-transform duration-700 group-hover:scale-125" />
                  <p className="text-[10px] font-black uppercase tracking-wider text-indigo-700">
                    Membership revenue
                  </p>
                  <p className="mt-2 text-2xl font-black text-stone-950">
                    {money(revenue?.membershipRevenue, currency)}
                  </p>
                  <p className="mt-1.5 text-xs text-stone-500">Recurring core</p>
                </div>
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-5 shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10">
                  <div className="absolute -right-3 -top-3 size-16 rounded-full bg-gradient-to-br from-amber-200/40 to-orange-200/30 blur-xl transition-transform duration-700 group-hover:scale-125" />
                  <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">
                    Outstanding
                  </p>
                  <p className="mt-2 text-2xl font-black text-stone-950">
                    {money(outstanding?.outstandingBalance, currency)}
                  </p>
                  <p className="mt-1.5 text-xs text-stone-500">
                    {outstanding?.membershipsWithBalance ?? 0} memberships with
                    balance
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-white/80 bg-gradient-to-br from-white via-rose-50/60 to-white shadow-xl backdrop-blur-xl">
              <div className="absolute -right-6 -top-6 size-28 rounded-full bg-gradient-to-br from-rose-200/30 to-pink-200/20 blur-2xl transition-transform duration-700 group-hover:scale-110" />
              <CardContent className="relative flex h-full items-center gap-4 p-6">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 text-white shadow-xl shadow-rose-500/25">
                  <CreditCard className="size-6" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-stone-900">
                    Keep collections moving
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-stone-500">
                    Review outstanding memberships and keep cash flow healthy.
                  </p>
                </div>
                <Link
                  href="/billing"
                  className="group/btn flex size-10 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white/80 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-200 hover:bg-rose-50 hover:shadow-md"
                >
                  <ArrowRight className="size-4 text-stone-500 transition-transform duration-300 group-hover/btn:translate-x-0.5" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* At-risk, Low stock, Trainer */}
        <section
          className="grid gap-5 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-700"
          style={{ animationDelay: "600ms" }}
        >
          <Card className="group overflow-hidden border-white/80 bg-white/88 shadow-xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-50/60 via-orange-50/40 to-amber-50/20 opacity-60" />
            <div className="absolute -right-4 -top-4 size-24 rounded-full bg-gradient-to-br from-rose-200/25 to-orange-200/20 blur-2xl transition-transform duration-700 group-hover:scale-110" />
            <CardHeader className="relative px-6 pb-2 pt-5">
              <CardTitle className="flex items-center gap-3 text-lg font-bold text-stone-950">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 to-orange-500 text-white shadow-lg shadow-rose-500/20">
                  <Users className="size-5" />
                </span>
                At-risk members
              </CardTitle>
              <p className="mt-1 text-xs text-stone-500">Retention watchlist</p>
            </CardHeader>
            <CardContent className="relative px-6 pb-6">
              {data?.atRiskMembers.top.length
                ? data.atRiskMembers.top.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between gap-3 border-b border-stone-100/80 py-3 last:border-0"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-orange-100 text-xs font-bold text-rose-700 shadow-sm">
                          {member.firstName.charAt(0)}
                          {member.lastName.charAt(0)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-stone-900">
                            {member.firstName} {member.lastName}
                          </p>
                          <p className="text-xs text-stone-500">
                            {member.neverCheckedIn
                              ? "Never checked in"
                              : `${member.daysSinceLastVisit} days since visit`}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-gradient-to-r from-rose-100 to-orange-100 px-2.5 py-1 text-[10px] font-bold uppercase text-rose-600 shadow-sm">
                        Risk
                      </span>
                    </div>
                  ))
                : <EmptyState text="No at-risk members returned." />}
              <Link
                href="/members"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white/90 py-2.5 text-xs font-bold text-stone-700 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-200 hover:text-rose-600 hover:shadow-md"
              >
                View all members <ArrowRight className="size-3.5" />
              </Link>
            </CardContent>
          </Card>

          <Card className="group overflow-hidden border-white/80 bg-white/88 shadow-xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50/60 via-orange-50/40 to-yellow-50/20 opacity-60" />
            <div className="absolute -right-4 -top-4 size-24 rounded-full bg-gradient-to-br from-amber-200/25 to-orange-200/20 blur-2xl transition-transform duration-700 group-hover:scale-110" />
            <CardHeader className="relative px-6 pb-2 pt-5">
              <CardTitle className="flex items-center gap-3 text-lg font-bold text-stone-950">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/20">
                  <Package className="size-5" />
                </span>
                Low stock
              </CardTitle>
              <p className="mt-1 text-xs text-stone-500">Inventory watchlist</p>
            </CardHeader>
            <CardContent className="relative px-6 pb-6">
              {data?.lowStock.top.length
                ? data.lowStock.top.map((product) => (
                    <div
                      key={product.productId}
                      className="flex items-center justify-between gap-3 border-b border-stone-100/80 py-3 last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-stone-900">
                          {product.name}
                        </p>
                        <p className="text-xs text-stone-500">
                          {product.sku} · reorder at {product.reorderLevel}
                        </p>
                      </div>
                      <span className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1.5 text-sm font-bold tabular-nums text-amber-700 shadow-sm">
                        {product.quantityOnHand}
                      </span>
                    </div>
                  ))
                : <EmptyState text="Inventory levels look healthy." />}
              <Link
                href="/inventory"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white/90 py-2.5 text-xs font-bold text-stone-700 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-200 hover:text-amber-600 hover:shadow-md"
              >
                Open inventory <ArrowRight className="size-3.5" />
              </Link>
            </CardContent>
          </Card>

          <Card className="group overflow-hidden border-white/80 bg-white/88 shadow-xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/60 via-violet-50/40 to-purple-50/20 opacity-60" />
            <div className="absolute -right-4 -top-4 size-24 rounded-full bg-gradient-to-br from-indigo-200/25 to-violet-200/20 blur-2xl transition-transform duration-700 group-hover:scale-110" />
            <CardHeader className="relative px-6 pb-2 pt-5">
              <CardTitle className="flex items-center gap-3 text-lg font-bold text-stone-950">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-500 text-white shadow-lg shadow-indigo-500/20">
                  <Dumbbell className="size-5" />
                </span>
                Trainer workload
              </CardTitle>
              <p className="mt-1 text-xs text-stone-500">
                People + programming activity
              </p>
            </CardHeader>
            <CardContent className="relative px-6 pb-6">
              {data?.trainerWorkload.top.length
                ? data.trainerWorkload.top.map((trainer) => (
                    <div
                      key={trainer.userId}
                      className="border-b border-stone-100/80 py-3 last:border-0"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-stone-900">
                            {trainer.firstName} {trainer.lastName}
                          </p>
                          <p className="text-xs text-stone-500">
                            {trainer.assignedMemberCount} assigned members
                          </p>
                        </div>
                        <span className="rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 px-2.5 py-1 text-xs font-bold text-indigo-700 shadow-sm">
                          {trainer.workoutPlansAssignedLast30Days +
                            trainer.dietPlansAssignedLast30Days}{" "}
                          plans
                        </span>
                      </div>
                    </div>
                  ))
                : <EmptyState text="No trainer workload data returned." />}
              <Link
                href="/staff"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white/90 py-2.5 text-xs font-bold text-stone-700 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-600 hover:shadow-md"
              >
                Open staff <ArrowRight className="size-3.5" />
              </Link>
            </CardContent>
          </Card>
        </section>

        {/* Command shortcuts */}
        <section
          className="animate-in fade-in slide-in-from-bottom-4 duration-700"
          style={{ animationDelay: "700ms" }}
        >
          <SectionHeader eyebrow="Command shortcuts" title="Move faster" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {hasPermission("attendance.read") && (
              <ShortcutLink
                href="/attendance"
                bgFrom="from-white"
                bgTo="via-cyan-50/80 to-cyan-100/40"
                border="border-cyan-200/60"
                iconBg="bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg shadow-cyan-500/20"
                icon={CalendarCheck}
                label="Attendance"
                sublabel="Check-in operations"
              />
            )}
            {hasPermission("members.read") && (
              <ShortcutLink
                href="/members"
                bgFrom="from-white"
                bgTo="via-violet-50/80 to-fuchsia-100/40"
                border="border-violet-200/60"
                iconBg="bg-gradient-to-br from-violet-400 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20"
                icon={Users}
                label="Members"
                sublabel="Member 360"
              />
            )}
            {hasPermission("payments.read") && (
              <ShortcutLink
                href="/billing"
                bgFrom="from-white"
                bgTo="via-emerald-50/80 to-teal-100/40"
                border="border-emerald-200/60"
                iconBg="bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/20"
                icon={Wallet}
                label="Billing"
                sublabel="Collections & payments"
              />
            )}
            {hasPermission("workouts.edit") && (
              <ShortcutLink
                href="/workouts"
                bgFrom="from-white"
                bgTo="via-rose-50/80 to-orange-100/40"
                border="border-rose-200/60"
                iconBg="bg-gradient-to-br from-rose-400 to-orange-500 text-white shadow-lg shadow-rose-500/20"
                icon={Dumbbell}
                label="Workout OS"
                sublabel="Programs & sessions"
              />
            )}
          </div>
        </section>

        {/* OS shortcuts */}
        <section
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
          style={{ animationDelay: "800ms" }}
        >
          <OSLink
            href="/owner-os"
            bgFrom="from-indigo-50"
            bgTo="via-violet-50/80 to-fuchsia-50/60"
            border="border-indigo-200/60"
            iconBg="bg-gradient-to-br from-indigo-400 to-violet-500 text-white shadow-xl shadow-indigo-500/25"
            icon={BarChart3}
            label="Owner Insights"
            sublabel="Deeper business intelligence"
            cta="Open dashboard"
          />
          <OSLink
            href="/crm"
            bgFrom="from-blue-50"
            bgTo="via-cyan-50/80 to-teal-50/60"
            border="border-blue-200/60"
            iconBg="bg-gradient-to-br from-blue-400 to-cyan-500 text-white shadow-xl shadow-blue-500/25"
            icon={TrendingUp}
            label="Sales OS"
            sublabel="Lead and follow-up engine"
            cta="Open CRM"
          />
          <OSLink
            href="/inventory"
            bgFrom="from-amber-50"
            bgTo="via-orange-50/80 to-yellow-50/60"
            border="border-amber-200/60"
            iconBg="bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xl shadow-amber-500/25"
            icon={Package}
            label="Inventory OS"
            sublabel="Stock and reorder control"
            cta="Open inventory"
          />
          <OSLink
            href="/ai"
            bgFrom="from-fuchsia-50"
            bgTo="via-violet-50/80 to-purple-50/60"
            border="border-fuchsia-200/60"
            iconBg="bg-gradient-to-br from-fuchsia-400 to-violet-500 text-white shadow-xl shadow-fuchsia-500/25"
            icon={Sparkles}
            label="MyGymAgent AI"
            sublabel="Ask, analyze, decide"
            cta="Start chatting"
          />
        </section>
      </div>
    </div>
  );
}

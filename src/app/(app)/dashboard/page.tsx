"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Dumbbell,
  Megaphone,
  Package,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  Zap,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";
import { useDailyBriefing } from "@/lib/hooks/use-daily-briefing";
import { useMemberStatusBreakdown, useRevenueTrend } from "@/lib/hooks/use-analytics";
import { useOrganization } from "@/lib/hooks/use-organization";
import { SceneBackground } from "@/components/three/scene-bg";
import { PageHero } from "@/components/shared/page-hero";
import { MetricCard3D } from "@/components/three/metric-card-3d";
import { Chart3D } from "@/components/three/chart-3d";
import { DataOrb } from "@/components/three/data-orb";
import { ActivityTimeline3D } from "@/components/three/activity-timeline-3d";

const QUICK_ACTIONS = [
  ["Add a member", "Register a new client", "/members/new", UserPlus, "members.create"],
  ["Record a payment", "Log cash, card, or UPI", "/billing", Wallet, "payments.create"],
  ["Check in a member", "Record attendance", "/attendance", CalendarCheck, "attendance.create"],
  ["Build a workout", "Create or assign a plan", "/workouts", Dumbbell, "workouts.create"],
  ["Add a lead", "Track a new prospect", "/crm", Megaphone, "leads.manage"],
] as const;

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#818cf8",
  INACTIVE: "#f59e0b",
  FROZEN: "#06b6d4",
  EXPIRED: "#f43f5e",
};

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const QUICK_TILES = [
  "from-cyan-500 to-blue-600 shadow-cyan-500/25",
  "from-emerald-500 to-teal-600 shadow-emerald-500/25",
  "from-violet-600 to-fuchsia-600 shadow-violet-500/25",
  "from-rose-500 to-orange-500 shadow-rose-500/25",
  "from-amber-500 to-orange-600 shadow-amber-500/25",
];

export default function DashboardPage() {
  const { hasPermission } = useAuth();
  const briefing = useDailyBriefing();
  const data = briefing.data;
  const organization = useOrganization();
  const revenueTrend = useRevenueTrend(6);
  const statusBreakdown = useMemberStatusBreakdown();

  const gymName = organization.data?.name?.toUpperCase() ?? "MY GYM";

  const currency = data?.revenue.revenue[0]?.currency ?? "INR";
  const revenue =
    data?.revenue.revenue.find((r) => r.currency === currency)?.netRevenue ?? "0.00";

  const visibleActions = QUICK_ACTIONS.filter(
    ([, , , , permission]) => hasPermission(permission as string),
  );

  const priorities = data
    ? [
        data.atRiskMembers.count > 0 && {
          icon: AlertTriangle,
          tone: "danger",
          title: `${data.atRiskMembers.count} members need attention`,
          detail: "Review inactive members before they churn.",
          href: "/members",
          action: "Review members",
        },
        data.salesFunnel.followUps.total > 0 && {
          icon: Megaphone,
          tone: "warning",
          title: `${data.salesFunnel.followUps.total} follow-ups are due`,
          detail: `${data.salesFunnel.followUps.completionRatePct}% completed so far.`,
          href: "/crm",
          action: "Open Sales OS",
        },
        data.lowStock.count > 0 && {
          icon: Package,
          tone: "warning",
          title: `${data.lowStock.count} products are low on stock`,
          detail: "Check reorder levels and stockout risk.",
          href: "/inventory",
          action: "Review inventory",
        },
        data.pendingAiActions > 0 && {
          icon: Sparkles,
          tone: "ai",
          title: `${data.pendingAiActions} AI actions await approval`,
          detail: "Review proposed actions before execution.",
          href: "/ai-actions",
          action: "Review AI actions",
        },
      ].filter(Boolean)
    : [];

  const weeklyData = useMemo(() => {
    const months = revenueTrend.data ?? [];
    if (months.length === 0) return [];
    const firstCurrency = months[0]?.revenue[0]?.currency;
    return months.map((m) => {
      const [year, month] = m.month.split("-").map(Number);
      const label = month >= 1 && month <= 12 ? MONTH_LABELS[month - 1] : m.month;
      const row = m.revenue.find((r) => r.currency === firstCurrency);
      void year;
      return { day: label, value: Math.max(0, Math.round(Number(row?.netRevenue ?? 0))) };
    });
  }, [revenueTrend.data]);

  const membershipData = useMemo(() => {
    const rows = statusBreakdown.data ?? [];
    return rows.map((row, index) => ({
      label: row.status,
      value: row.count,
      color: STATUS_COLORS[row.status] ?? ["#818cf8", "#06b6d4", "#10b981", "#f59e0b"][index % 4],
    }));
  }, [statusBreakdown.data]);

  const activityTimeline = useMemo(() => {
    if (!data) return [];
    return [
      { label: "Check-ins", time: "Today", color: "#06b6d4", value: Math.min(1, data.today.checkIns / 50) },
      { label: "Revenue", time: "This month", color: "#10b981", value: Math.min(1, Number(data.revenue.revenue[0]?.netRevenue || 0) / 10000) },
      { label: "Conversions", time: "This month", color: "#818cf8", value: Math.min(1, data.salesFunnel.wonLeads / 20) },
      { label: "Follow-ups", time: "Tracked", color: "#f43f5e", value: Math.min(1, data.salesFunnel.followUps.total / 10) },
    ];
  }, [data]);

  return (
    <div className="relative -mx-2 min-h-full overflow-hidden pb-12 sm:-mx-3 lg:-mx-5">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_5%_2%,rgba(6,182,212,.13),transparent_19%),radial-gradient(circle_at_96%_4%,rgba(99,102,241,.15),transparent_22%),radial-gradient(circle_at_70%_38%,rgba(217,70,239,.10),transparent_25%),radial-gradient(circle_at_12%_72%,rgba(16,185,129,.08),transparent_24%)]"
        aria-hidden="true"
      />
      <SceneBackground />
      <div className="mx-auto flex max-w-[1680px] flex-col gap-8 px-2 sm:px-4 lg:px-6">
        {/* Compact midnight hero */}
        <PageHero
          id="dashboard-title"
          variant="dark"
          accent="violet"
          icon={Sparkles}
          title={gymName}
          actions={
            <>
              <Link
                href="/ai"
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-indigo-950 shadow-[0_16px_40px_-16px_rgba(255,255,255,.5)] transition duration-300 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <Sparkles className="size-4" aria-hidden="true" />
                Ask MyGymAgent
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/command-center"
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-bold text-white backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <Zap className="size-4" aria-hidden="true" />
                Command Center
              </Link>
            </>
          }
        />

        <section aria-label="Today at a glance" className="rounded-[20px] border border-white/90 bg-white/85 p-4 shadow-[0_16px_45px_-30px_rgba(79,70,229,.4)] backdrop-blur-xl sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[.16em] text-stone-500">
              <Activity className="size-4 text-cyan-600" aria-hidden="true" />
              Today at a glance
            </p>
            <Link
              href="/intelligence"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold text-violet-700 transition hover:bg-violet-500/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
            >
              Intelligence
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50/80 px-4 py-3 ring-1 ring-stone-200/60">
              <span className="text-xs font-bold text-stone-600">Net revenue</span>
              <span className="font-mono text-base font-black tabular-nums text-stone-950">
                {briefing.isLoading ? "—" : `${currency} ${revenue}`}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50/80 px-4 py-3 ring-1 ring-stone-200/60">
              <span className="text-xs font-bold text-stone-600">Members at risk</span>
              <span className="font-mono text-base font-black tabular-nums text-stone-950">
                {briefing.isLoading ? "—" : (data?.atRiskMembers.count ?? 0)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50/80 px-4 py-3 ring-1 ring-stone-200/60">
              <span className="text-xs font-bold text-stone-600">AI awaiting approval</span>
              <span className="font-mono text-base font-black tabular-nums text-stone-950">
                {briefing.isLoading ? "—" : (data?.pendingAiActions ?? 0)}
              </span>
            </div>
          </div>
        </section>

        <section aria-labelledby="dash-pulse" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 id="dash-pulse" className="font-serif text-2xl font-semibold tracking-tight text-stone-950">
                Business pulse
              </h2>
            </div>
            <Link
              href="/intelligence"
              className="hidden min-h-11 items-center gap-1 text-xs font-extrabold text-violet-700 hover:text-violet-900 sm:inline-flex"
            >
              View insights <ChevronRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard3D icon={CalendarCheck} label="Today's check-ins" value={data?.today.checkIns} loading={briefing.isLoading} accent="cyan" trend="neutral" delay={0} />
            <MetricCard3D icon={Wallet} label="Net revenue" value={data ? `${currency} ${revenue}` : undefined} loading={briefing.isLoading} accent="green" trend="neutral" delay={100} />
            <MetricCard3D icon={Users} label="Members at risk" value={data?.atRiskMembers.count} loading={briefing.isLoading} accent="amber" trend="neutral" delay={200} />
            <MetricCard3D icon={Sparkles} label="AI actions" value={data?.pendingAiActions} loading={briefing.isLoading} accent="violet" trend="neutral" delay={300} />
          </div>
        </section>

        <section aria-label="Revenue and membership visuals" className="grid gap-5 xl:grid-cols-[1fr_1fr]">
          <Card className="overflow-hidden border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl">
            <CardHeader className="border-b border-stone-100/80 bg-gradient-to-r from-cyan-50/90 via-white to-blue-50/60 pb-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-[15px] bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25">
                    <Activity className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <CardTitle className="font-serif text-xl tracking-tight text-stone-950">Revenue trend</CardTitle>
                  </div>
                </div>
                <Link href="/billing" className="inline-flex min-h-11 items-center rounded-xl px-3 py-2 text-xs font-extrabold text-cyan-700 transition hover:bg-cyan-500/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600">Details</Link>
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-4">
              <div className="h-64">
                {revenueTrend.isLoading ? (
                  <div className="flex h-full items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" aria-hidden="true" /></div>
                ) : weeklyData.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed border-stone-200 bg-stone-50/60 p-6 text-center"><p className="text-sm font-bold text-stone-900">No revenue yet</p></div>
                ) : (
                  <Suspense fallback={<div className="flex h-full items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" aria-hidden="true" /></div>}>
                    <Chart3D data={weeklyData} />
                  </Suspense>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl">
            <CardHeader className="border-b border-stone-100/80 bg-gradient-to-r from-violet-50/90 via-white to-fuchsia-50/60 pb-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-[15px] bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25">
                    <Zap className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <CardTitle className="font-serif text-xl tracking-tight text-stone-950">Member status</CardTitle>
                  </div>
                </div>
                <Link href="/members" className="inline-flex min-h-11 items-center rounded-xl px-3 py-2 text-xs font-extrabold text-violet-700 transition hover:bg-violet-500/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">Members</Link>
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-4">
              <div className="h-64">
                {statusBreakdown.isLoading ? (
                  <div className="flex h-full items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" aria-hidden="true" /></div>
                ) : membershipData.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed border-stone-200 bg-stone-50/60 p-6 text-center"><p className="text-sm font-bold text-stone-900">No members yet</p></div>
                ) : (
                  <Suspense fallback={<div className="flex h-full items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" aria-hidden="true" /></div>}>
                    <DataOrb data={membershipData} />
                  </Suspense>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {membershipData.map((item) => (
                  <span key={item.label} className="inline-flex items-center gap-1.5 rounded-full bg-stone-100/80 px-2.5 py-1 text-xs font-bold text-stone-700 ring-1 ring-stone-200/60">
                    <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} aria-hidden="true" />
                    {item.label} ({item.value})
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section aria-label="Activity and priorities" className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
          <Card className="overflow-hidden border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl">
            <CardHeader className="border-b border-stone-100/80 bg-gradient-to-r from-white via-cyan-50/50 to-violet-50/50 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-[15px] bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25">
                  <Activity className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <CardTitle className="font-serif text-xl tracking-tight text-stone-950">Today&apos;s activity flow</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-4">
              <div className="h-48">
                {briefing.isLoading ? (
                  <div className="flex h-full items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" aria-hidden="true" /></div>
                ) : activityTimeline.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed border-stone-200 bg-stone-50/60 p-6 text-center"><p className="text-sm font-bold text-stone-900">No activity yet</p></div>
                ) : (
                  <Suspense fallback={<div className="flex h-full items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" aria-hidden="true" /></div>}>
                    <ActivityTimeline3D activities={activityTimeline} />
                  </Suspense>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl">
            <CardHeader className="border-b border-stone-100/80 bg-gradient-to-r from-amber-50/90 via-white to-orange-50/60 pb-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-[15px] bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25">
                    <AlertTriangle className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <CardTitle className="font-serif text-xl tracking-tight text-stone-950">Today&apos;s priorities</CardTitle>
                  </div>
                </div>
                <Link href="/owner-os" className="inline-flex min-h-11 items-center rounded-xl px-3 py-2 text-xs font-extrabold text-amber-700 transition hover:bg-amber-500/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600">Owner OS</Link>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              {briefing.isLoading ? (
                <div className="space-y-2" aria-label="Loading priorities">{[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-[20px] bg-gradient-to-r from-stone-100 to-stone-50" />)}</div>
              ) : priorities.length ? (
                <div className="flex flex-col gap-1">
                  {priorities.map((item) => {
                    if (!item) return null;
                    const Icon = item.icon;
                    const tone = item.tone === "danger" ? "from-rose-500 to-orange-500 shadow-rose-500/25" : item.tone === "ai" ? "from-violet-600 to-fuchsia-600 shadow-violet-500/25" : "from-amber-500 to-orange-600 shadow-amber-500/25";
                    return (
                      <Link key={item.title} href={item.href} className="group flex items-center gap-3 rounded-[20px] border border-transparent px-3 py-3 transition hover:-translate-y-px hover:border-violet-200 hover:bg-violet-50/60 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">
                        <span className={`flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br text-white shadow-md ${tone}`}><Icon className="size-5" aria-hidden="true" /></span>
                        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-extrabold text-stone-900">{item.title}</span><span className="mt-0.5 block truncate text-xs font-medium text-stone-600">{item.detail}</span></span>
                        <span className="hidden items-center gap-1 text-xs font-extrabold text-violet-700 sm:flex">{item.action}<ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 rounded-[22px] border border-dashed border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 px-5 py-10 text-center"><span className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25"><CheckCircle2 className="size-6" aria-hidden="true" /></span><p className="text-sm font-extrabold text-stone-900">You&apos;re all caught up</p></div>
              )}
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="dash-ai" className="relative overflow-hidden rounded-[20px] bg-[linear-gradient(145deg,#172554,#3730a3_45%,#a21caf)] p-4 text-white shadow-[0_28px_75px_-38px_rgba(79,70,229,.78)] sm:p-5">
          <div className="pointer-events-none absolute -right-12 -top-16 size-56 rounded-full bg-fuchsia-400/25 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 size-56 rounded-full bg-cyan-400/20 blur-3xl" aria-hidden="true" />
          <div className="relative flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-[15px] bg-white/15 ring-1 ring-white/20 backdrop-blur">
              <Sparkles className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="dash-ai" className="font-serif text-xl font-semibold tracking-tight">AI briefing</h2>
            </div>
          </div>
          <div className="relative mt-4 grid grid-cols-2 gap-3">
            <MiniInsight icon={TrendingUp} label="Conversion" value={data ? `${data.salesFunnel.conversionRatePct}%` : "—"} />
            <MiniInsight icon={Clock3} label="Follow-ups" value={data?.salesFunnel.followUps.total ?? 0} />
          </div>
          <Link href="/ai" className="relative mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-indigo-950 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Open AI <ArrowRight className="size-4" aria-hidden="true" /></Link>
        </section>

        <section aria-labelledby="dash-quick">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-[15px] bg-gradient-to-br from-cyan-500 via-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25">
              <Zap className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="dash-quick" className="font-serif text-2xl font-semibold tracking-tight text-stone-950">Quick actions</h2>
            </div>
          </div>
          {visibleActions.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visibleActions.map(([title, , href, Icon], i) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex min-h-11 items-center gap-3 rounded-[22px] border border-white/90 bg-white/85 p-4 shadow-[0_16px_45px_-30px_rgba(79,70,229,.4)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_-30px_rgba(79,70,229,.5)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
                >
                  <span className={`flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${QUICK_TILES[i % QUICK_TILES.length]}`}><Icon className="size-5" aria-hidden="true" /></span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-extrabold tracking-tight text-stone-950">{title}</span></span>
                  <ArrowRight className="size-4 shrink-0 text-stone-400 transition group-hover:translate-x-1 group-hover:text-violet-700" aria-hidden="true" />
                </Link>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

function MiniInsight({ icon: Icon, label, value }: { icon: typeof TrendingUp; label: string; value: string | number }) {
  return (
    <div className="rounded-[20px] border border-white/15 bg-white/10 p-4 backdrop-blur">
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.14em] text-white/60"><Icon className="size-3.5" aria-hidden="true" />{label}</div>
      <p className="mt-1 font-mono text-2xl font-black tabular-nums">{value}</p>
    </div>
  );
}

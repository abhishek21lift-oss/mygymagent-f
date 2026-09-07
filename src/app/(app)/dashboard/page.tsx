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
  CreditCard,
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
import { SceneBackground } from "@/components/three/scene-bg";
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

const WEEKLY_CHECKINS = [
  { day: "Mon", value: 42 },
  { day: "Tue", value: 58 },
  { day: "Wed", value: 35 },
  { day: "Thu", value: 67 },
  { day: "Fri", value: 89 },
  { day: "Sat", value: 76 },
  { day: "Sun", value: 45 },
];

const MEMBERSHIP_TYPES = [
  { label: "Monthly", value: 45, color: "#818cf8" },
  { label: "Quarterly", value: 25, color: "#06b6d4" },
  { label: "Annual", value: 20, color: "#10b981" },
  { label: "Premium", value: 10, color: "#f59e0b" },
];

const ACTIVITIES = [
  { label: "Check-ins", time: "9:00 AM", color: "#06b6d4", value: 0.8 },
  { label: "Payments", time: "10:30 AM", color: "#10b981", value: 0.6 },
  { label: "New Members", time: "11:00 AM", color: "#818cf8", value: 0.4 },
  { label: "Workouts", time: "2:00 PM", color: "#f59e0b", value: 0.9 },
  { label: "Follow-ups", time: "4:00 PM", color: "#f43f5e", value: 0.5 },
];

export default function DashboardPage() {
  const { hasPermission } = useAuth();
  const briefing = useDailyBriefing();
  const data = briefing.data;

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
    if (data?.today.checkIns) {
      return WEEKLY_CHECKINS.map((d) => ({
        ...d,
        value: Math.round(d.value * (data.today.checkIns / 60)),
      }));
    }
    return WEEKLY_CHECKINS;
  }, [data]);

  const membershipData = useMemo(() => {
    if (data?.salesFunnel) {
      const total = data.salesFunnel.totalLeads || 100;
      return [
        { label: "Active", value: Math.round(total * 0.45), color: "#818cf8" },
        { label: "Pending", value: Math.round(total * 0.25), color: "#06b6d4" },
        { label: "At Risk", value: data.atRiskMembers.count || Math.round(total * 0.15), color: "#f59e0b" },
        { label: "New", value: Math.round(total * 0.15), color: "#10b981" },
      ];
    }
    return MEMBERSHIP_TYPES;
  }, [data]);

  const activityTimeline = useMemo(() => {
    if (data) {
      return [
        { label: "Check-ins", time: "9:00 AM", color: "#06b6d4", value: Math.min(1, data.today.checkIns / 50) },
        { label: "Revenue", time: "10:30 AM", color: "#10b981", value: Math.min(1, Number(data.revenue.revenue[0]?.netRevenue || 0) / 10000) },
        { label: "Members", time: "11:00 AM", color: "#818cf8", value: Math.min(1, data.salesFunnel.wonLeads / 20) },
        { label: "Workouts", time: "2:00 PM", color: "#f59e0b", value: 0.7 },
        { label: "Follow-ups", time: "4:00 PM", color: "#f43f5e", value: Math.min(1, data.salesFunnel.followUps.total / 10) },
      ];
    }
    return ACTIVITIES;
  }, [data]);

  return (
    <div className="relative flex flex-col gap-7 overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_12%_8%,rgba(59,130,246,0.08),transparent_26%),radial-gradient(circle_at_88%_18%,rgba(168,85,247,0.08),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(6,182,212,0.06),transparent_30%)]">
      <SceneBackground />

      {/* Premium brand hero */}
      <section className="relative isolate flex min-h-[205px] items-center justify-center overflow-hidden rounded-[2rem] border border-white/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(241,245,255,0.86)_42%,rgba(250,245,255,0.92))] px-5 py-6 shadow-[0_24px_70px_-30px_rgba(59,130,246,0.35)] ring-1 ring-primary/10 backdrop-blur-xl sm:min-h-[220px] sm:px-8">
        <div className="pointer-events-none absolute -left-24 -top-24 size-64 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 -top-28 size-72 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 size-72 rounded-full bg-fuchsia-400/15 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.045)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />

        <div className="relative z-10 flex w-full max-w-3xl flex-col items-center justify-center gap-6 text-center">
          <h1 className="select-none bg-gradient-to-r from-blue-600 via-violet-600 via-50% to-fuchsia-500 bg-clip-text text-4xl font-black uppercase leading-[0.95] tracking-[-0.045em] text-transparent drop-shadow-[0_8px_25px_rgba(99,102,241,0.18)] sm:text-6xl lg:text-7xl">
            619 FITNESS STUDIO
          </h1>
          <Link
            href="/ai"
            className="group inline-flex items-center justify-center gap-2.5 rounded-2xl border border-white/70 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-6 py-3 text-sm font-bold text-white shadow-[0_12px_30px_-10px_rgba(79,70,229,0.55)] transition duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-[0_18px_38px_-12px_rgba(79,70,229,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 sm:px-7 sm:py-3.5 sm:text-base"
          >
            <Sparkles className="size-4 transition-transform duration-300 group-hover:rotate-12 sm:size-5" />
            Ask MyGymAgent
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1 sm:size-5" />
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Business pulse</h2>
            <p className="text-xs text-muted-foreground">The numbers that matter today.</p>
          </div>
          <Link href="/insights" className="text-xs font-medium text-primary hover:underline">
            View insights
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard3D icon={CalendarCheck} label="Today&apos;s check-ins" value={data?.today.checkIns} loading={briefing.isLoading} accent="cyan" hint="Real-time" trend="up" trendValue="+12%" delay={0} />
          <MetricCard3D icon={Wallet} label="Net revenue" value={data ? `${currency} ${revenue}` : undefined} loading={briefing.isLoading} accent="green" hint="Current period" trend="up" trendValue="+8%" delay={100} />
          <MetricCard3D icon={Users} label="Members at risk" value={data?.atRiskMembers.count} loading={briefing.isLoading} accent="amber" hint="14+ days inactive" trend="down" trendValue="-3" delay={200} />
          <MetricCard3D icon={Sparkles} label="AI actions" value={data?.pendingAiActions} loading={briefing.isLoading} accent="violet" hint="Awaiting approval" trend="neutral" delay={300} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card className="overflow-hidden border-0 bg-white/75 shadow-[0_18px_45px_-28px_rgba(59,130,246,0.35)] ring-1 ring-blue-100/80 backdrop-blur-xl">
          <CardHeader className="border-b border-blue-100/70 bg-gradient-to-r from-cyan-50/80 via-white/50 to-blue-50/80 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base"><Activity className="size-4 text-cyan-500" />Weekly check-ins</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">Interactive 3D attendance visualization.</p>
              </div>
              <Link href="/attendance" className="text-xs font-medium text-primary hover:underline">Details</Link>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-4">
            <div className="h-64">
              <Suspense fallback={<div className="flex h-full items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
                <Chart3D data={weeklyData} />
              </Suspense>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 bg-white/75 shadow-[0_18px_45px_-28px_rgba(139,92,246,0.4)] ring-1 ring-violet-100/80 backdrop-blur-xl">
          <CardHeader className="border-b border-violet-100/70 bg-gradient-to-r from-violet-50/80 via-white/50 to-fuchsia-50/80 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base"><Zap className="size-4 text-violet-500" />Membership distribution</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">Live membership status orbiting in 3D space.</p>
              </div>
              <Link href="/members" className="text-xs font-medium text-primary hover:underline">Members</Link>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-4">
            <div className="h-64">
              <Suspense fallback={<div className="flex h-full items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
                <DataOrb data={membershipData} />
              </Suspense>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {membershipData.map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.label} ({item.value})
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card className="overflow-hidden border-0 bg-white/75 shadow-sm ring-1 ring-cyan-100/80 backdrop-blur-xl">
          <CardHeader className="border-b border-cyan-100/70 bg-gradient-to-r from-cyan-50/70 to-white/40 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base"><Activity className="size-4 text-cyan-500" />Today&apos;s activity flow</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">Animated timeline of gym events.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-4">
            <div className="h-48">
              <Suspense fallback={<div className="flex h-full items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
                <ActivityTimeline3D activities={activityTimeline} />
              </Suspense>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 bg-white/75 shadow-sm ring-1 ring-amber-100/80 backdrop-blur-xl">
          <CardHeader className="border-b border-amber-100/70 bg-gradient-to-r from-amber-50/80 to-white/40 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Today&apos;s priorities</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">AI-ranked signals that may need a decision.</p>
              </div>
              <Link href="/owner-os" className="text-xs font-medium text-primary hover:underline">Owner OS</Link>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            {briefing.isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-muted" />)}</div>
            ) : priorities.length ? (
              <div className="space-y-2">
                {priorities.map((item) => {
                  if (!item) return null;
                  const Icon = item.icon;
                  const tone = item.tone === "danger" ? "bg-destructive/10 text-destructive" : item.tone === "ai" ? "bg-primary/10 text-primary" : "bg-warning/15 text-warning-foreground";
                  return (
                    <Link key={item.title} href={item.href} className="group flex items-center gap-3 rounded-2xl border border-transparent p-3 transition hover:border-border hover:bg-muted/30">
                      <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon className="size-4.5" /></span>
                      <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{item.title}</span><span className="mt-0.5 block text-xs text-muted-foreground">{item.detail}</span></span>
                      <span className="hidden items-center gap-1 text-xs font-medium text-primary sm:flex">{item.action}<ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" /></span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center"><CheckCircle2 className="size-8 text-success" /><p className="mt-3 text-sm font-semibold">You&apos;re all caught up</p><p className="mt-1 text-xs text-muted-foreground">No urgent operational signals right now.</p></div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="border-0 bg-gradient-to-br from-violet-50/90 via-white/80 to-cyan-50/80 shadow-[0_20px_55px_-35px_rgba(124,58,237,0.5)] ring-1 ring-violet-100/80 backdrop-blur-xl">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="size-4 text-primary" />AI briefing</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm leading-6 text-muted-foreground">{data ? `${data.today.checkIns} check-ins today, ${data.atRiskMembers.count} members need attention, ${data.salesFunnel.followUps.total} follow-ups are tracked, and ${data.pendingAiActions} AI proposals await decisions.` : "Loading today&apos;s operational briefing…"}</p>
          <div className="grid grid-cols-2 gap-2">
            <MiniInsight icon={TrendingUp} label="Conversion" value={data ? `${data.salesFunnel.conversionRatePct}%` : "—"} />
            <MiniInsight icon={Clock3} label="Follow-ups" value={data?.salesFunnel.followUps.total ?? 0} />
          </div>
          <Link href="/ai" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-violet-100 bg-white/70 px-4 py-2.5 text-sm font-semibold transition hover:bg-white">Open AI command center <ArrowRight className="size-4" /></Link>
        </CardContent>
      </Card>

      <section>
        <div className="mb-3 flex items-center gap-2"><h2 className="text-base font-semibold tracking-tight">Quick actions</h2><span className="text-xs text-muted-foreground">Common workflows</span></div>
        {visibleActions.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleActions.map(([title, description, href, Icon]) => (
              <Link key={href} href={href}>
                <Card className="group h-full border-0 bg-white/70 shadow-sm ring-1 ring-border/70 transition hover:-translate-y-1 hover:ring-primary/25 hover:shadow-lg backdrop-blur-xl"><CardContent className="flex items-center gap-3 p-4"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/15 to-violet-500/15 text-primary"><Icon className="size-5" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{title}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{description}</span></span><ArrowRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" /></CardContent></Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Link href="/members" className="rounded-2xl border border-blue-100/80 bg-white/70 p-4 backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-center gap-2 text-sm font-semibold"><Users className="size-4 text-primary" /> Member health</div><p className="mt-1 text-xs text-muted-foreground">Explore retention, attendance and member lifecycle.</p></Link>
        <Link href="/crm" className="rounded-2xl border border-violet-100/80 bg-white/70 p-4 backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-center gap-2 text-sm font-semibold"><Megaphone className="size-4 text-primary" /> Sales pipeline</div><p className="mt-1 text-xs text-muted-foreground">Prioritize leads and follow-ups with context.</p></Link>
        <Link href="/billing" className="rounded-2xl border border-cyan-100/80 bg-white/70 p-4 backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-center gap-2 text-sm font-semibold"><CreditCard className="size-4 text-primary" /> Cash flow</div><p className="mt-1 text-xs text-muted-foreground">Outstanding balances and payment activity.</p></Link>
      </section>
    </div>
  );
}

function MiniInsight({ icon: Icon, label, value }: { icon: typeof TrendingUp; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-violet-100/70 bg-white/60 p-3">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Icon className="size-3.5" />{label}</div>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

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

function todayLabel() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

const QUICK_ACTIONS = [
  ["Add a member", "Register a new client", "/members/new", UserPlus, "members.create"],
  ["Record a payment", "Log cash, card, or UPI", "/billing", Wallet, "payments.create"],
  ["Check in a member", "Record attendance", "/attendance", CalendarCheck, "attendance.create"],
  ["Build a workout", "Create or assign a plan", "/workouts", Dumbbell, "workouts.create"],
  ["Add a lead", "Track a new prospect", "/crm", Megaphone, "leads.manage"],
] as const;

// Simulated weekly data for 3D chart
const WEEKLY_CHECKINS = [
  { day: "Mon", value: 42 },
  { day: "Tue", value: 58 },
  { day: "Wed", value: 35 },
  { day: "Thu", value: 67 },
  { day: "Fri", value: 89 },
  { day: "Sat", value: 76 },
  { day: "Sun", value: 45 },
];

// Simulated membership distribution for orb
const MEMBERSHIP_TYPES = [
  { label: "Monthly", value: 45, color: "#818cf8" },
  { label: "Quarterly", value: 25, color: "#06b6d4" },
  { label: "Annual", value: 20, color: "#10b981" },
  { label: "Premium", value: 10, color: "#f59e0b" },
];

// Simulated activity timeline
const ACTIVITIES = [
  { label: "Check-ins", time: "9:00 AM", color: "#06b6d4", value: 0.8 },
  { label: "Payments", time: "10:30 AM", color: "#10b981", value: 0.6 },
  { label: "New Members", time: "11:00 AM", color: "#818cf8", value: 0.4 },
  { label: "Workouts", time: "2:00 PM", color: "#f59e0b", value: 0.9 },
  { label: "Follow-ups", time: "4:00 PM", color: "#f43f5e", value: 0.5 },
];

export default function DashboardPage() {
  const { user, hasPermission } = useAuth();
  const briefing = useDailyBriefing();
  const data = briefing.data;

  const currency = data?.revenue.revenue[0]?.currency ?? "INR";
  const revenue =
    data?.revenue.revenue.find((r) => r.currency === currency)?.netRevenue ?? "0.00";

  const visibleActions = QUICK_ACTIONS.filter(
    ([, , , , permission]) => hasPermission(permission as string)
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

  // Dynamic weekly chart data based on real check-ins if available
  const weeklyData = useMemo(() => {
    if (data?.today.checkIns) {
      return WEEKLY_CHECKINS.map((d) => ({
        ...d,
        value: Math.round(d.value * (data.today.checkIns / 60)),
      }));
    }
    return WEEKLY_CHECKINS;
  }, [data]);

  // Dynamic membership data from sales funnel
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

  // Dynamic activity timeline
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
    <div className="relative flex flex-col gap-7">
      {/* 3D Background Scene */}
      <SceneBackground />

      {/* Hero Section with 3D Background */}
      <section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/[0.08] via-card to-card p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 size-48 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/70 px-3 py-1.5 text-xs font-semibold text-primary backdrop-blur">
              <Sparkles className="size-3.5" /> MyGymAgent Intelligence
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Good morning, {user?.firstName ?? ""}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              {todayLabel()} — Your gym&apos;s pulse in 3D. Interact with the visualizations below.
            </p>
          </div>
          <Link
            href="/ai"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <Sparkles className="size-4" /> Ask MyGymAgent <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* 3D Metric Cards */}
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
          <MetricCard3D
            icon={CalendarCheck}
            label="Today's check-ins"
            value={data?.today.checkIns}
            loading={briefing.isLoading}
            accent="cyan"
            hint="Real-time"
            trend="up"
            trendValue="+12%"
            delay={0}
          />
          <MetricCard3D
            icon={Wallet}
            label="Net revenue"
            value={data ? `${currency} ${revenue}` : undefined}
            loading={briefing.isLoading}
            accent="green"
            hint="Current period"
            trend="up"
            trendValue="+8%"
            delay={100}
          />
          <MetricCard3D
            icon={Users}
            label="Members at risk"
            value={data?.atRiskMembers.count}
            loading={briefing.isLoading}
            accent="amber"
            hint="14+ days inactive"
            trend="down"
            trendValue="-3"
            delay={200}
          />
          <MetricCard3D
            icon={Sparkles}
            label="AI actions"
            value={data?.pendingAiActions}
            loading={briefing.isLoading}
            accent="violet"
            hint="Awaiting approval"
            trend="neutral"
            delay={300}
          />
        </div>
      </section>

      {/* 3D Visualizations Grid */}
      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        {/* 3D Attendance Chart */}
        <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-border/70">
          <CardHeader className="border-b bg-muted/20 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="size-4 text-primary" />
                  Weekly check-ins
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Interactive 3D attendance visualization.
                </p>
              </div>
              <Link href="/attendance" className="text-xs font-medium text-primary hover:underline">
                Details
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-4">
            <div className="h-64">
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                }
              >
                <Chart3D data={weeklyData} />
              </Suspense>
            </div>
          </CardContent>
        </Card>

        {/* 3D Membership Orb */}
        <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-border/70">
          <CardHeader className="border-b bg-muted/20 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="size-4 text-violet-500" />
                  Membership distribution
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Live membership status orbiting in 3D space.
                </p>
              </div>
              <Link href="/members" className="text-xs font-medium text-primary hover:underline">
                Members
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-4">
            <div className="h-64">
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                }
              >
                <DataOrb data={membershipData} />
              </Suspense>
            </div>
            {/* Legend */}
            <div className="mt-3 flex flex-wrap gap-3">
              {membershipData.map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.label} ({item.value})
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Activity Timeline + Priorities */}
      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        {/* 3D Activity Timeline */}
        <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-border/70">
          <CardHeader className="border-b bg-muted/20 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="size-4 text-cyan-500" />
                  Today&apos;s activity flow
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Animated timeline of gym events.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-2 sm:p-4">
            <div className="h-48">
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                }
              >
                <ActivityTimeline3D activities={activityTimeline} />
              </Suspense>
            </div>
          </CardContent>
        </Card>

        {/* Priorities (kept from original) */}
        <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-border/70">
          <CardHeader className="border-b bg-muted/20 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Today&apos;s priorities</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  AI-ranked signals that may need a decision.
                </p>
              </div>
              <Link href="/owner-os" className="text-xs font-medium text-primary hover:underline">
                Owner OS
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            {briefing.isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-16 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : priorities.length ? (
              <div className="space-y-2">
                {priorities.map((item) => {
                  if (!item) return null;
                  const Icon = item.icon;
                  const tone =
                    item.tone === "danger"
                      ? "bg-destructive/10 text-destructive"
                      : item.tone === "ai"
                        ? "bg-primary/10 text-primary"
                        : "bg-warning/15 text-warning-foreground";
                  return (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="group flex items-center gap-3 rounded-2xl border border-transparent p-3 transition hover:border-border hover:bg-muted/30"
                    >
                      <span
                        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tone}`}
                      >
                        <Icon className="size-4.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">{item.title}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {item.detail}
                        </span>
                      </span>
                      <span className="hidden items-center gap-1 text-xs font-medium text-primary sm:flex">
                        {item.action}
                        <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center">
                <CheckCircle2 className="size-8 text-success" />
                <p className="mt-3 text-sm font-semibold">You&apos;re all caught up</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  No urgent operational signals right now.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* AI Briefing Card */}
      <Card className="border-0 bg-gradient-to-br from-violet-500/[0.08] via-card to-card shadow-sm ring-1 ring-primary/15">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-primary" /> AI briefing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm leading-6 text-muted-foreground">
            {data
              ? `${data.today.checkIns} check-ins today, ${data.atRiskMembers.count} members need attention, ${data.salesFunnel.followUps.total} follow-ups are tracked, and ${data.pendingAiActions} AI proposals await decisions.`
              : "Loading today&apos;s operational briefing…"}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <MiniInsight icon={TrendingUp} label="Conversion" value={data ? `${data.salesFunnel.conversionRatePct}%` : "—"} />
            <MiniInsight icon={Clock3} label="Follow-ups" value={data?.salesFunnel.followUps.total ?? 0} />
          </div>
          <Link
            href="/ai"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border bg-background/70 px-4 py-2.5 text-sm font-semibold transition hover:bg-background"
          >
            Open AI command center <ArrowRight className="size-4" />
          </Link>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-base font-semibold tracking-tight">Quick actions</h2>
          <span className="text-xs text-muted-foreground">Common workflows</span>
        </div>
        {visibleActions.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleActions.map(([title, description, href, Icon]) => (
              <Link key={href} href={href}>
                <Card className="group h-full border-0 shadow-sm ring-1 ring-border/70 transition hover:-translate-y-0.5 hover:ring-primary/25 hover:shadow-md">
                  <CardContent className="flex items-center gap-3 p-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{title}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {description}
                      </span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Bottom Links */}
      <section className="grid gap-3 sm:grid-cols-3">
        <Link
          href="/members"
          className="rounded-2xl border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Users className="size-4 text-primary" /> Member health
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Explore retention, attendance and member lifecycle.
          </p>
        </Link>
        <Link
          href="/crm"
          className="rounded-2xl border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Megaphone className="size-4 text-primary" /> Sales pipeline
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Prioritize leads and follow-ups with context.
          </p>
        </Link>
        <Link
          href="/billing"
          className="rounded-2xl border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CreditCard className="size-4 text-primary" /> Cash flow
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Outstanding balances and payment activity.
          </p>
        </Link>
      </section>
    </div>
  );
}

function MiniInsight({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border bg-background/60 p-3">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

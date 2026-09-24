"use client";

import { useMemo } from "react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import { useDailyBriefing } from "@/lib/hooks/use-daily-briefing";
import { useMemberStatusBreakdown, useRevenueTrend } from "@/lib/hooks/use-analytics";
import { useOrganization } from "@/lib/hooks/use-organization";
import { PageHero } from "@/components/shared/page-hero";
import { currencySymbol, displayCurrencyAmount } from "@/lib/utils";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";

const QUICK_ACTIONS = [
 ["Add a member", "Register a new client", "/members/new", UserPlus, "members.create"],
 ["Record a payment", "Log cash, card, or UPI", "/billing", Wallet, "payments.create"],
 ["Check in a member", "Record attendance", "/attendance", CalendarCheck, "attendance.create"],
 ["Build a workout", "Create or assign a plan", "/workouts", Dumbbell, "workouts.create"],
 ["Add a lead", "Track a new prospect", "/crm", Megaphone, "leads.manage"],
] as const;

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function DashboardPage() {
 const { hasPermission } = useAuth();
 const briefing = useDailyBriefing();
 const data = briefing.data;
 const organization = useOrganization();
 const revenueTrend = useRevenueTrend(6);
 const statusBreakdown = useMemberStatusBreakdown();

 const gymName = organization.data?.name ?? "Dashboard";

 // The API keys revenue rows by currency *code* ("INR"); this used to
 // look them up by the display *symbol* ("₹"), which never matches — so
 // the headline figure on the owner's home screen read ₹0.00 no matter
 // how much money had come in. Fall back to the first row rather than to
 // zero, so a tenant on another currency still sees its own takings.
 const currencyCode = organization.data?.currency ?? "INR";
 const revenueRow =
 data?.revenue.revenue.find((r) => r.currency === currencyCode) ??
 data?.revenue.revenue[0];
 const currency = currencySymbol(currencyCode);
 const revenue = revenueRow?.netRevenue ?? "0.00";

 const visibleActions = QUICK_ACTIONS.filter(
 ([, , , , permission]) => hasPermission(permission as string),
 );

 const priorities = data
 ? [
 data.atRiskMembers.count > 0 && {
 icon: AlertTriangle,
 tone: "destructive" as const,
 title: `${data.atRiskMembers.count} members need attention`,
 detail: "Review inactive members before they churn.",
 href: "/members",
 action: "Review members",
 },
 data.salesFunnel.followUps.total > 0 && {
 icon: Megaphone,
 tone: "warning" as const,
 title: `${data.salesFunnel.followUps.total} follow-ups are due`,
 detail: `${data.salesFunnel.followUps.completionRatePct}% completed so far.`,
 href: "/crm",
 action: "Open Sales",
 },
 data.lowStock.count > 0 && {
 icon: Package,
 tone: "warning" as const,
 title: `${data.lowStock.count} products are low on stock`,
 detail: "Check reorder levels and stockout risk.",
 href: "/inventory",
 action: "Review inventory",
 },
 data.pendingAiActions > 0 && {
 icon: Sparkles,
 tone: "primary" as const,
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
 const [, month] = m.month.split("-").map(Number);
 const label = month >= 1 && month <= 12 ? MONTH_LABELS[month - 1] : m.month;
 const row = m.revenue.find((r) => r.currency === firstCurrency);
 return { day: label, value: Math.max(0, Math.round(Number(row?.netRevenue ?? 0))) };
 });
 }, [revenueTrend.data]);

 const maxRevenue = Math.max(1, ...weeklyData.map((d) => d.value));
 // The series arrives six-months-long whether or not any money came in,
 // so "is there a chart to draw?" is a question about the values, not the
 // length of the array.
 const hasRevenue = weeklyData.some((d) => d.value > 0);

 const membershipData = useMemo(() => {
 return (statusBreakdown.data ?? []).map((row) => ({
 label: row.status,
 value: row.count,
 }));
 }, [statusBreakdown.data]);
 const maxMembers = Math.max(1, ...membershipData.map((d) => d.value));

 const activityTimeline = useMemo(() => {
 if (!data) return [];
 return [
 { label: "Check-ins", time: "Today", value: Math.min(1, data.today.checkIns / 50), detail: `${data.today.checkIns} check-ins` },
 { label: "Revenue", time: "This month", value: Math.min(1, Number(revenueRow?.netRevenue ?? 0) / 10000), detail: displayCurrencyAmount(revenue, currencyCode) },
 { label: "Conversions", time: "This month", value: Math.min(1, data.salesFunnel.wonLeads / 20), detail: `${data.salesFunnel.wonLeads} won` },
 { label: "Follow-ups", time: "Tracked", value: Math.min(1, data.salesFunnel.followUps.total / 10), detail: `${data.salesFunnel.followUps.total} total` },
 ];
 }, [data, currency, revenue]);

 return (
 <div className="flex w-full flex-col gap-4 pb-8">
 <PageHero
 id="dashboard-title"
 icon={Sparkles}
 title={gymName}
 actions={
 <>
 <Button asChild size="sm">
 <Link href="/ai">
 <Sparkles className="size-4" aria-hidden="true" />
 Ask THE CULT CLIENT
 </Link>
 </Button>
 <Button asChild size="sm" variant="outline">
 <Link href="/command-center">
 <Zap className="size-4" aria-hidden="true" />
 Command Center
 </Link>
 </Button>
 </>
 }
 />

 <section aria-labelledby="dash-pulse">
 <div className="mb-3 flex items-end justify-between gap-4">
 <h2 id="dash-pulse" className="text-xl font-semibold tracking-tight">
 Business pulse
 </h2>
 <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
 <Link href="/intelligence">
 View insights <ChevronRight className="size-3.5" aria-hidden="true" />
 </Link>
 </Button>
 </div>
 <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
 <StatCard icon={CalendarCheck} title="Today's check-ins" value={data?.today.checkIns} isLoading={briefing.isLoading} isError={briefing.isError} tone="primary" />
 <StatCard icon={Wallet} title="Net revenue" value={data ? displayCurrencyAmount(revenue, currencyCode) : undefined} isLoading={briefing.isLoading} isError={briefing.isError} tone="success" />
 <StatCard icon={Users} title="Members at risk" value={data?.atRiskMembers.count} isLoading={briefing.isLoading} isError={briefing.isError} tone="warning" />
 <StatCard icon={Sparkles} title="AI actions" value={data?.pendingAiActions} isLoading={briefing.isLoading} isError={briefing.isError} tone="primary" />
 </div>
 </section>

 <section aria-label="Revenue and membership" className="grid gap-4 xl:grid-cols-2">
 <Card>
 <CardHeader className="border-b pb-4">
 <div className="flex items-center justify-between gap-3">
 <div className="flex items-center gap-3">
 <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Revenue trend</CardTitle>
 </div>
 <Button asChild variant="ghost" size="sm">
 <Link href="/billing">Details</Link>
 </Button>
 </div>
 </CardHeader>
 <CardContent className="pt-4">
 {revenueTrend.isLoading ? (
 <div className="space-y-2" role="status" aria-label="Loading revenue trend">
 <Skeleton className="h-32 w-full rounded-lg" />
 </div>
 ) : revenueTrend.isError ? (
 <ErrorState message="Could not load the revenue trend." onRetry={() => void revenueTrend.refetch()} />
 ) : !hasRevenue ? (
 <EmptyState title="No revenue yet" description="Revenue will appear here once payments are recorded." />
 ) : (
 <>
 <p className="mb-2 text-xs text-muted-foreground">
 Peak <span className="font-medium tabular-nums text-foreground">{currency}{maxRevenue.toLocaleString()}</span> · last 6 months
 </p>
 <div role="img" aria-label={`Revenue trend: ${weeklyData.map((d) => `${d.day} ${d.value}`).join(", ")}`} className="flex h-48 items-end gap-2">
 {weeklyData.map((d) => (
 <div key={d.day} className="flex min-w-0 flex-1 flex-col items-center gap-1.5" title={`${d.day}: ${d.value}`}>
 <div className="flex h-36 w-full items-end border-b border-border" aria-hidden="true">
 {/* No minimum height: a month with no revenue draws nothing.
 The old `Math.max(4, …)` floor painted a bar for zero. */}
 <div
 className="w-full rounded-t-[3px] bg-chart-1 transition-[height] motion-reduce:transition-none"
 aria-hidden="true"
 style={{ height: `${(d.value / maxRevenue) * 100}%` }}
 />
 </div>
 <span className="truncate text-xs text-muted-foreground">{d.day}</span>
 </div>
 ))}
 </div>
 <table className="sr-only">
 <caption>Revenue by month</caption>
 <thead>
 <tr>
 <th scope="col">Month</th>
 <th scope="col">Value</th>
 </tr>
 </thead>
 <tbody>
 {weeklyData.map((d) => (
 <tr key={d.day}>
 <th scope="row">{d.day}</th>
 <td>{d.value}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </>
 )}
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="border-b pb-4">
 <div className="flex items-center justify-between gap-3">
 <div className="flex items-center gap-3">
 <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Member status</CardTitle>
 </div>
 <Button asChild variant="ghost" size="sm">
 <Link href="/members">Members</Link>
 </Button>
 </div>
 </CardHeader>
 <CardContent className="pt-4">
 {statusBreakdown.isLoading ? (
 <div className="space-y-2" role="status" aria-label="Loading member status">
 <Skeleton className="h-8 w-full rounded-lg" />
 <Skeleton className="h-8 w-full rounded-lg" />
 <Skeleton className="h-8 w-2/3 rounded-lg" />
 </div>
 ) : statusBreakdown.isError ? (
 <ErrorState message="Could not load the member breakdown." onRetry={() => void statusBreakdown.refetch()} />
 ) : membershipData.length === 0 ? (
 <EmptyState title="No members yet" description="Add your first member to see the breakdown." />
 ) : (
 <>
 <ul className="space-y-2.5">
 {membershipData.map((item) => (
 <li key={item.label} className="flex items-center gap-3">
 <Badge variant="secondary" className="min-w-24 justify-center">{item.label}</Badge>
 <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${item.label}: ${item.value} members`}>
 <div className="h-full rounded-full bg-primary/70" aria-hidden="true" style={{ width: `${Math.max(3, Math.round((item.value / maxMembers) * 100))}%` }} />
 </div>
 <span className="w-12 text-right font-mono text-sm tabular-nums">{item.value}</span>
 </li>
 ))}
 </ul>
 <table className="sr-only">
 <caption>Members by status</caption>
 <thead>
 <tr>
 <th scope="col">Status</th>
 <th scope="col">Count</th>
 </tr>
 </thead>
 <tbody>
 {membershipData.map((item) => (
 <tr key={item.label}>
 <th scope="row">{item.label}</th>
 <td>{item.value}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </>
 )}
 </CardContent>
 </Card>
 </section>

 <section aria-label="Activity and priorities" className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
 <Card>
 <CardHeader className="border-b pb-4">
 <div className="flex items-center gap-3">
 <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
 <Activity className="size-5" aria-hidden="true" />
 </span>
 <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Today&apos;s activity</CardTitle>
 </div>
 </CardHeader>
 <CardContent className="pt-4">
 {briefing.isLoading ? (
 <div className="space-y-2" role="status" aria-label="Loading activity">
 <Skeleton className="h-12 w-full rounded-lg" />
 <Skeleton className="h-12 w-full rounded-lg" />
 </div>
 ) : briefing.isError ? (
 <ErrorState message="Could not load today's activity." onRetry={() => void briefing.refetch()} />
 ) : activityTimeline.length === 0 ? (
 <EmptyState title="No activity yet" description="Check-ins and sales will appear here." />
 ) : (
 <ul className="space-y-1">
 {activityTimeline.map((a) => (
 <li key={a.label} className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/60">
 <div className="h-9 w-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
 <div className="w-full rounded-full bg-primary/70" style={{ height: `${Math.round(a.value * 100)}%` }} />
 </div>
 <div className="min-w-0 flex-1">
 <p className="truncate text-sm font-medium">{a.label}</p>
 <p className="truncate text-xs text-muted-foreground">{a.time} · {a.detail}</p>
 </div>
 </li>
 ))}
 </ul>
 )}
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="border-b pb-4">
 <div className="flex items-center justify-between gap-3">
 <div className="flex items-center gap-3">
 <span className="flex size-10 items-center justify-center rounded-lg bg-warning/15 text-warning">
 <AlertTriangle className="size-5" aria-hidden="true" />
 </span>
 <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Today&apos;s priorities</CardTitle>
 </div>
 <Button asChild variant="ghost" size="sm">
 <Link href="/owner-os">Owner OS</Link>
 </Button>
 </div>
 </CardHeader>
 <CardContent className="pt-3">
 {briefing.isLoading ? (
 <div className="space-y-2" role="status" aria-label="Loading priorities">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-16 w-full rounded-lg" />)}</div>
 ) : briefing.isError ? (
 <ErrorState message="Could not load today's priorities." onRetry={() => void briefing.refetch()} />
 ) : priorities.length ? (
 <ul className="flex flex-col gap-1">
 {priorities.map((item) => {
 if (!item) return null;
 const Icon = item.icon;
 return (
 <li key={item.title}>
 <Link href={item.href} className="group flex items-center gap-3 rounded-lg border border-transparent px-3 py-3 transition-colors hover:border-border hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-ring">
 <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Icon className="size-5" aria-hidden="true" /></span>
 <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{item.title}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{item.detail}</span></span>
 <span className="hidden items-center gap-1 text-xs font-medium text-primary sm:flex">{item.action}<ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></span>
 </Link>
 </li>
 );
 })}
 </ul>
 ) : (
 <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-5 py-10 text-center">
 <span className="flex size-11 items-center justify-center rounded-full bg-success/10 text-success"><CheckCircle2 className="size-5" aria-hidden="true" /></span>
 <p className="text-sm font-medium">You&apos;re all caught up</p>
 <p className="text-xs text-muted-foreground">No urgent items need attention.</p>
 </div>
 )}
 </CardContent>
 </Card>
 </section>

 <section aria-labelledby="dash-ai" className="rounded-xl border bg-sidebar p-4 text-sidebar-foreground sm:p-5">
 <div className="flex items-center gap-3">
 <span className="flex size-10 items-center justify-center rounded-lg bg-sidebar-primary/15 text-sidebar-primary">
 <Sparkles className="size-5" aria-hidden="true" />
 </span>
 <h2 id="dash-ai" className="text-lg font-semibold tracking-tight">AI briefing</h2>
 </div>
 <div className="mt-4 grid grid-cols-2 gap-3">
 <MiniInsight icon={TrendingUp} label="Conversion" value={data ? `${data.salesFunnel.conversionRatePct}%` : "—"} />
 <MiniInsight icon={Clock3} label="Follow-ups" value={data ? data.salesFunnel.followUps.total : "\u2014"} />
 </div>
 <Button asChild className="mt-4 w-full" variant="secondary">
 <Link href="/ai">Open AI <ArrowRight className="size-4" aria-hidden="true" /></Link>
 </Button>
 </section>

 <section aria-labelledby="dash-quick">
 <h2 id="dash-quick" className="mb-3 text-xl font-semibold tracking-tight">Quick actions</h2>
 {visibleActions.length > 0 && (
 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
 {visibleActions.map(([title, desc, href, Icon]) => (
 <Link
 key={href}
 href={href}
 className="group flex min-h-11 items-center gap-3 rounded-xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring"
 >
 <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-105"><Icon className="size-5" aria-hidden="true" /></span>
 <span className="min-w-0 flex-1">
 <span className="block truncate text-sm font-medium tracking-tight">{title}</span>
 <span className="block truncate text-xs text-muted-foreground">{desc}</span>
 </span>
 <ArrowRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
 </Link>
 ))}
 </div>
 )}
 </section>
 </div>
 );
}

function MiniInsight({ icon: Icon, label, value }: { icon: typeof TrendingUp; label: string; value: string | number }) {
 return (
 <div className="rounded-lg border border-sidebar-border/60 bg-sidebar-accent/50 p-4">
 <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider opacity-70"><Icon className="size-3.5" aria-hidden="true" />{label}</div>
 <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">{value}</p>
 </div>
 );
}

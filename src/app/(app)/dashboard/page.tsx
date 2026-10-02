"use client";

import * as React from "react";
import Link from "next/link";
import {
 AlertTriangle,
 ArrowRight,
 CalendarCheck,
 CalendarClock,
 CheckCircle2,
 ChevronRight,
 Dumbbell,
 Megaphone,
 Package,
 Sparkles,
 UserCheck,
 UserPlus,
 Wallet,
 type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth/auth-context";
import { useDailyBriefing } from "@/lib/hooks/use-daily-briefing";
import { useMemberStatusBreakdown, useRevenueTrend } from "@/lib/hooks/use-analytics";
import { useBranches } from "@/lib/hooks/use-branches";
import { useOrganization } from "@/lib/hooks/use-organization";
import { PageHero } from "@/components/shared/page-hero";
import { currencySymbol, displayCurrencyAmount } from "@/lib/utils";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { memberStatusLabel } from "@/lib/member-status";
import { revenueChart } from "@/lib/revenue-chart";

const QUICK_ACTIONS = [
 ["Add a member", "Register a new client", "/members/new", UserPlus, "members.create"],
 ["Record a payment", "Log cash, card, or UPI", "/billing", Wallet, "payments.create"],
 ["Check in a member", "Record attendance", "/attendance", CalendarCheck, "attendance.create"],
 ["Build a workout", "Create or assign a plan", "/workouts", Dumbbell, "workouts.create"],
 ["Add a lead", "Track a new prospect", "/crm", Megaphone, "leads.manage"],
] as const;

const ALL_BRANCHES = "all";
const BRANCH_STORAGE_KEY = "mygymagent:dashboard-branch";

function readStoredBranch(): string {
 if (typeof window === "undefined") return ALL_BRANCHES;
 try {
 return window.localStorage.getItem(BRANCH_STORAGE_KEY) || ALL_BRANCHES;
 } catch {
 return ALL_BRANCHES;
 }
}

/**
 * The owner's home: the one place the day's numbers live.
 *
 * It replaces three pages that showed the same figures under different
 * definitions -- this one, the Command Centre (the same four tiles again,
 * reading 0 on an outage and "LIVE" on a minute-old figure) and Owner OS
 * (whose revenue and renewal counts were wrong). What each of those
 * offered that this lacked -- outstanding dues, renewals due this week --
 * is here; their addresses redirect here.
 */
export default function DashboardPage() {
 const { hasPermission, user } = useAuth();
 // Home is every staff member's landing page, but its figures need
 // `reports.view`, which trainers, front desk, sales and inventory staff
 // do not hold. Without it the page is a staff home of the actions this
 // person can take, and asks the API for nothing it would refuse.
 const canViewReports = hasPermission("reports.view");

 // "All branches" or one, remembered on this device. Sent as ?branchId=,
 // which narrows an org-wide owner's figures; a branch-restricted
 // manager's own scope wins on the server whatever is asked for.
 // Read at first render: the (app) layout renders pages only once the
 // session is known on the client, so this never runs while prerendering.
 const [selectedBranch, setSelectedBranch] = React.useState<string>(readStoredBranch);
 const chooseBranch = (value: string) => {
 setSelectedBranch(value);
 try {
 window.localStorage.setItem(BRANCH_STORAGE_KEY, value);
 } catch {
 // Storage blocked: the choice lasts for this visit.
 }
 };
 const branches = useBranches({ pageSize: 100 }, { enabled: canViewReports && hasPermission("branches.read") });
 const branchItems = branches.data?.items ?? [];
 // A stored branch that no longer exists (deleted, or another account on
 // this device) falls back to the whole gym rather than to nothing.
 const branchFilter =
 selectedBranch !== ALL_BRANCHES && (!branches.data || branchItems.some((b) => b.id === selectedBranch))
 ? selectedBranch
 : undefined;

 const briefing = useDailyBriefing({ enabled: canViewReports, branchId: branchFilter });
 const data = briefing.data;
 const organization = useOrganization({ enabled: hasPermission("organizations.read") });
 const revenueTrend = useRevenueTrend(6, branchFilter, { enabled: canViewReports });
 const statusBreakdown = useMemberStatusBreakdown(branchFilter, { enabled: canViewReports });

 // The server answers for the branch it actually used. When that is not
 // the one asked for, this person is restricted to it: say which, and
 // offer no picker that would only pretend to change it.
 const scopedBranchId = data?.branchId && data.branchId !== branchFilter ? data.branchId : null;
 const branchName = (id: string | null | undefined) => branchItems.find((b) => b.id === id)?.name;

 const gymName = organization.data?.name ?? "Dashboard";
 const currencyCode = organization.data?.currency ?? "INR";
 // Rows are keyed by currency code; fall back to the first row so a
 // tenant paid in another currency still sees its own takings.
 const revenueRow =
 data?.revenue.revenue.find((r) => r.currency === currencyCode) ?? data?.revenue.revenue[0];
 const revenue = revenueRow?.netRevenue ?? "0.00";
 // Formatted in the currency the figure is actually in.
 const revenueCurrency = revenueRow?.currency ?? currencyCode;
 const outstandingRow =
 data?.revenue.outstanding.find((r) => r.currency === currencyCode) ?? data?.revenue.outstanding[0];

 const visibleActions = QUICK_ACTIONS.filter(([, , , , permission]) => hasPermission(permission as string));

 // Each priority is shown only to someone who can act on it: an alert
 // that links to a page that will refuse you is noise.
 const memberFollowUps = data?.memberFollowUpsDue
 const priorities: Priority[] = data
 ? ([
 memberFollowUps &&
 memberFollowUps.count > 0 &&
 hasPermission(["members.read", "members.read_assigned"]) && {
 icon: UserCheck,
 title:
 memberFollowUps.renewalRequests > 0
 ? `${memberFollowUps.renewalRequests} member${memberFollowUps.renewalRequests === 1 ? "" : "s"} asked to renew`
 : `${memberFollowUps.count} member follow-up${memberFollowUps.count === 1 ? "" : "s"} due today`,
 detail: [
 memberFollowUps.renewalRequests > 0 && memberFollowUps.count > memberFollowUps.renewalRequests
 ? `${memberFollowUps.count} member follow-ups due in all`
 : null,
 memberFollowUps.overdue > 0 ? `${memberFollowUps.overdue} overdue` : null,
 ]
 .filter(Boolean)
 .join(" · ") || "From the member app and your team — due today.",
 // A row per member: there is no gym-wide list of these yet, and
 // each one is handled on that member's page.
 people: memberFollowUps.top.slice(0, 3).map((f) => ({
 key: f.id,
 href: `/members/${f.memberId}`,
 name: `${f.firstName} ${f.lastName}`,
 what: f.isRenewalRequest ? f.title.replace(/^Renewal requested: /, "Renew onto ") : f.title,
 })),
 more: Math.max(0, memberFollowUps.count - 3),
 },
 (data.expiringSoon?.count ?? 0) > 0 &&
 hasPermission(["memberships.read", "memberships.read_assigned"]) && {
 icon: CalendarClock,
 title: `${data.expiringSoon!.count} membership${data.expiringSoon!.count === 1 ? "" : "s"} end within ${data.expiringSoon!.withinDays} days`,
 detail: "Not renewed yet — a call before the end date keeps them.",
 href: "/memberships",
 action: "Renewals",
 },
 (data.followUpsDue?.count ?? 0) > 0 &&
 hasPermission("leads.read") && {
 icon: Megaphone,
 title: `${data.followUpsDue!.count} lead follow-up${data.followUpsDue!.count === 1 ? "" : "s"} due today`,
 detail:
 data.followUpsDue!.overdue > 0
 ? `${data.followUpsDue!.overdue} overdue — call those first.`
 : "Due by the end of today.",
 href: "/crm",
 action: "Open Sales",
 },
 data.atRiskMembers.count > 0 &&
 hasPermission(["members.read", "members.read_assigned"]) && {
 icon: AlertTriangle,
 title: `${data.atRiskMembers.count} paying member${data.atRiskMembers.count === 1 ? " hasn’t" : "s haven’t"} visited in 14 days`,
 detail: "A personal message now is cheaper than a win-back later.",
 // The list of who, with days since each last came in.
 href: "/intelligence",
 action: "See who",
 },
 data.lowStock.count > 0 &&
 hasPermission("inventory.read") && {
 icon: Package,
 title: `${data.lowStock.count} product${data.lowStock.count === 1 ? " is" : "s are"} at or below reorder level`,
 detail: data.lowStock.top.slice(0, 3).map((p) => p.name).join(", "),
 href: "/inventory",
 action: "Review inventory",
 },
 data.pendingAiActions > 0 &&
 hasPermission("ai.approve") && {
 icon: Sparkles,
 title: `${data.pendingAiActions} AI proposal${data.pendingAiActions === 1 ? "" : "s"} awaiting approval`,
 detail: "Review proposed actions before they run.",
 href: "/ai-actions",
 action: "Review",
 },
 ] as Array<Priority | false | undefined>).filter((item): item is Priority => Boolean(item))
 : [];

 const { weeklyData, chartCurrency } = React.useMemo(
 () => revenueChart(revenueTrend.data ?? [], currencyCode),
 [revenueTrend.data, currencyCode],
 );
 const maxRevenue = Math.max(1, ...weeklyData.map((d) => d.value));
 const hasRevenue = weeklyData.some((d) => d.value > 0);

 const membershipData = React.useMemo(
 () => (statusBreakdown.data ?? []).map((row) => ({ label: memberStatusLabel(row.status), value: row.count })),
 [statusBreakdown.data],
 );
 const maxMembers = Math.max(1, ...membershipData.map((d) => d.value));

 if (!canViewReports) {
 return <StaffHome firstName={user?.firstName} gymName={organization.data?.name} actions={visibleActions} />;
 }

 const today = formatToday(organization.data?.timezone);
 const updatedAt = data ? formatTime(data.generatedAt, organization.data?.timezone) : null;

 return (
 <div className="flex w-full flex-col gap-5 pb-8">
 <PageHero
 id="dashboard-title"
 icon={Sparkles}
 title={gymName}
 actions={
 hasPermission("ai.generate") ? (
 <Button asChild size="sm">
 <Link href="/ai">
 <Sparkles className="size-4" aria-hidden="true" />
 Ask THE CULT CLIENT
 </Link>
 </Button>
 ) : undefined
 }
 />

 {/* Context: which day, which branch, how fresh. Every figure below
 is read against this line. */}
 <div className="-mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
 <span className="font-medium text-foreground">{today}</span>
 <span aria-hidden="true">·</span>
 {scopedBranchId ? (
 <span>{branchName(scopedBranchId) ?? "Your branch"}</span>
 ) : branchItems.length > 1 ? (
 <Select value={branchFilter ?? ALL_BRANCHES} onValueChange={chooseBranch}>
 <SelectTrigger aria-label="Branch" className="h-9 w-auto min-w-40 rounded-xl bg-card">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value={ALL_BRANCHES}>All branches</SelectItem>
 {branchItems.map((b) => (
 <SelectItem key={b.id} value={b.id}>
 {b.name}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 ) : (
 <span>{branchItems[0]?.name ?? "All branches"}</span>
 )}
 {updatedAt && (
 <>
 <span aria-hidden="true">·</span>
 <span>Updated {updatedAt}</span>
 </>
 )}
 </div>

 <section aria-labelledby="dash-pulse">
 <h2 id="dash-pulse" className="sr-only">
 Today and this month
 </h2>
 <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
 <StatCard
 icon={CalendarCheck}
 title="Checked in today"
 value={data?.today.checkIns}
 hint={data?.today.deniedCheckIns ? `${data.today.deniedCheckIns} turned away at the door` : undefined}
 isLoading={briefing.isLoading}
 isError={briefing.isError}
 tone="primary"
 href={hasPermission(["attendance.read", "attendance.read_assigned"]) ? "/attendance" : undefined}
 />
 <StatCard
 icon={Wallet}
 title="Net revenue"
 value={data ? displayCurrencyAmount(revenue, revenueCurrency) : undefined}
 hint="This month, after refunds"
 isLoading={briefing.isLoading}
 isError={briefing.isError}
 tone="success"
 href={hasPermission("payments.read") ? "/billing" : undefined}
 />
 <StatCard
 icon={Wallet}
 title="Outstanding dues"
 value={data ? displayCurrencyAmount(outstandingRow?.outstandingBalance ?? "0.00", outstandingRow?.currency ?? currencyCode) : undefined}
 hint={
 outstandingRow && outstandingRow.membershipsWithBalance > 0
 ? `On ${outstandingRow.membershipsWithBalance} membership${outstandingRow.membershipsWithBalance === 1 ? "" : "s"}`
 : "Nothing owed"
 }
 isLoading={briefing.isLoading}
 isError={briefing.isError}
 tone="warning"
 href={hasPermission("payments.read") ? "/billing" : undefined}
 />
 <StatCard
 icon={AlertTriangle}
 title="Members at risk"
 value={data?.atRiskMembers.count}
 hint="Paying, no visit in 14 days"
 isLoading={briefing.isLoading}
 isError={briefing.isError}
 tone="warning"
 href="/intelligence"
 />
 </div>
 </section>

 <section aria-label="What needs doing, and how revenue is moving" className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
 <Card>
 <CardHeader className="border-b pb-4">
 <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Needs attention</CardTitle>
 </CardHeader>
 <CardContent className="pt-3">
 {briefing.isLoading ? (
 <div className="space-y-2" role="status" aria-label="Loading priorities">
 {[1, 2, 3].map((item) => (
 <Skeleton key={item} className="h-16 w-full rounded-lg" />
 ))}
 </div>
 ) : briefing.isError ? (
 <ErrorState message="Could not load today's priorities." onRetry={() => void briefing.refetch()} />
 ) : priorities.length ? (
 <ul className="flex flex-col gap-1">
 {priorities.map((item) => (
 <li key={item.href ?? item.title}>
 <PriorityRow item={item} />
 </li>
 ))}
 </ul>
 ) : (
 <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-5 py-10 text-center">
 <span className="flex size-11 items-center justify-center rounded-full bg-success/10 text-success">
 <CheckCircle2 className="size-5" aria-hidden="true" />
 </span>
 <p className="text-sm font-medium">You&apos;re all caught up</p>
 <p className="text-xs text-muted-foreground">Nothing needs attention right now.</p>
 </div>
 )}
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="border-b pb-4">
 <div className="flex items-center justify-between gap-3">
 <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Revenue · last 6 months</CardTitle>
 {hasPermission("payments.read") && (
 <Button asChild variant="ghost" size="sm">
 <Link href="/billing">Details</Link>
 </Button>
 )}
 </div>
 </CardHeader>
 <CardContent className="pt-4">
 {revenueTrend.isLoading ? (
 <div role="status" aria-label="Loading revenue trend">
 <Skeleton className="h-40 w-full rounded-lg" />
 </div>
 ) : revenueTrend.isError ? (
 <ErrorState message="Could not load the revenue trend." onRetry={() => void revenueTrend.refetch()} />
 ) : !hasRevenue ? (
 <EmptyState title="No revenue yet" description="Revenue will appear here once payments are recorded." />
 ) : (
 <>
 <p className="mb-2 text-xs text-muted-foreground">
 Peak{" "}
 <span className="font-medium tabular-nums text-foreground">
 {currencySymbol(chartCurrency)}
 {maxRevenue.toLocaleString()}
 </span>{" "}
 · net of refunds
 </p>
 <div
 role="img"
 aria-label={`Revenue trend: ${weeklyData.map((d) => `${d.day} ${d.value}`).join(", ")}`}
 className="flex h-48 items-end gap-2"
 >
 {weeklyData.map((d, i) => (
 <div key={d.day} className="flex min-w-0 flex-1 flex-col items-center gap-1.5" title={`${d.day}: ${d.value}`}>
 <div className="flex h-36 w-full items-end border-b border-border" aria-hidden="true">
 <div
 // The current month in full colour, the past muted.
 className={`w-full rounded-t-[3px] bg-chart-1 transition-[height] motion-reduce:transition-none ${i === weeklyData.length - 1 ? "" : "opacity-55"}`}
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
 </section>

 <Card>
 <CardHeader className="border-b pb-4">
 <div className="flex items-center justify-between gap-3">
 <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Members by membership</CardTitle>
 {hasPermission(["members.read", "members.read_assigned"]) && (
 <Button asChild variant="ghost" size="sm">
 <Link href="/members">Members</Link>
 </Button>
 )}
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
 <ul className="grid gap-2.5 md:grid-cols-2 md:gap-x-8">
 {membershipData.map((item) => (
 <li key={item.label} className="flex items-center gap-3">
 <Badge variant="secondary" className="min-w-28 justify-center">
 {item.label}
 </Badge>
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

 <QuickActions actions={visibleActions} />
 </div>
 );
}

type Priority = {
 icon: LucideIcon;
 title: string;
 detail?: string;
 /** Where to act, for a row about one list. */
 href?: string;
 action?: string;
 /** Or one link per person, for a row about people handled one by one. */
 people?: { key: string; href: string; name: string; what: string }[];
 more?: number;
};

const ROW_ICON = "flex size-10 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-warning";

function PriorityRow({ item }: { item: Priority }) {
 const Icon = item.icon;
 const text = (
 <span className="min-w-0 flex-1">
 <span className="block [overflow-wrap:anywhere] text-sm font-medium">{item.title}</span>
 {item.detail && <span className="mt-0.5 block [overflow-wrap:anywhere] text-xs text-muted-foreground">{item.detail}</span>}
 </span>
 );
 if (item.people) {
 return (
 <div className="flex gap-3 rounded-lg px-3 py-3">
 <span className={ROW_ICON}>
 <Icon className="size-5" aria-hidden="true" />
 </span>
 <div className="min-w-0 flex-1">
 {text}
 <ul className="mt-2 flex flex-col">
 {item.people.map((person) => (
 <li key={person.key}>
 <Link
 href={person.href}
 className="group -mx-2 flex min-h-11 items-center gap-2 rounded-md px-2 text-sm transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-ring"
 >
 <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
 <span className="font-medium">{person.name}</span>
 <span className="text-muted-foreground"> · {person.what}</span>
 </span>
 <ChevronRight className="size-3.5 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
 </Link>
 </li>
 ))}
 </ul>
 {item.more ? <p className="mt-1 text-xs text-muted-foreground">and {item.more} more</p> : null}
 </div>
 </div>
 );
 }
 return (
 <Link
 href={item.href!}
 className="group flex min-h-11 items-center gap-3 rounded-lg border border-transparent px-3 py-3 transition-colors hover:border-border hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-ring"
 >
 <span className={ROW_ICON}>
 <Icon className="size-5" aria-hidden="true" />
 </span>
 {text}
 <span className="hidden items-center gap-1 text-xs font-medium text-primary sm:flex">
 {item.action}
 <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
 </span>
 </Link>
 );
}

function formatToday(timeZone: string | null | undefined) {
 const options: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" };
 try {
 return new Intl.DateTimeFormat(undefined, { ...options, ...(timeZone ? { timeZone } : {}) }).format(new Date());
 } catch {
 return new Intl.DateTimeFormat(undefined, options).format(new Date());
 }
}

function formatTime(iso: string, timeZone: string | null | undefined) {
 const options: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
 try {
 return new Intl.DateTimeFormat(undefined, { ...options, ...(timeZone ? { timeZone } : {}) }).format(new Date(iso));
 } catch {
 return new Intl.DateTimeFormat(undefined, options).format(new Date(iso));
 }
}

function QuickActions({ actions }: { actions: ReadonlyArray<(typeof QUICK_ACTIONS)[number]> }) {
 return (
 <section aria-labelledby="dash-quick">
 <h2 id="dash-quick" className="mb-3 text-xl font-semibold tracking-tight">
 Quick actions
 </h2>
 {actions.length > 0 ? (
 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
 {actions.map(([title, desc, href, Icon]) => (
 <Link
 key={href}
 href={href}
 className="group flex min-h-11 items-center gap-3 rounded-xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring"
 >
 <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
 <Icon className="size-5" aria-hidden="true" />
 </span>
 <span className="min-w-0 flex-1">
 <span className="block [overflow-wrap:anywhere] text-sm font-medium tracking-tight">{title}</span>
 <span className="block [overflow-wrap:anywhere] text-xs text-muted-foreground">{desc}</span>
 </span>
 <ArrowRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
 </Link>
 ))}
 </div>
 ) : (
 <EmptyState
 title="Nothing to do here yet"
 description="Your account doesn’t include any of these actions. Use the menu, or ask the gym owner for access."
 />
 )}
 </section>
 );
}

/**
 * Home for staff without `reports.view`: who they are, and what they can
 * do from here. No figures, so nothing to fail.
 */
function StaffHome({
 firstName,
 gymName,
 actions,
}: {
 firstName?: string;
 gymName?: string;
 actions: ReadonlyArray<(typeof QUICK_ACTIONS)[number]>;
}) {
 return (
 <div className="flex w-full flex-col gap-4 pb-8">
 <PageHero
 id="dashboard-title"
 icon={Sparkles}
 title={gymName ?? (firstName ? `Welcome, ${firstName}` : "Welcome")}
 description="Here’s what you can do from here today."
 />
 <QuickActions actions={actions} />
 </div>
 );
}

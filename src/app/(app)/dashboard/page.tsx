"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Building2,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  Megaphone,
  Package,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth/auth-context";
import { useDailyBriefing } from "@/lib/hooks/use-daily-briefing";
import { useMemberStatusBreakdown, useRevenueTrend } from "@/lib/hooks/use-analytics";
import { useBranches } from "@/lib/hooks/use-branches";
import { useOrganization } from "@/lib/hooks/use-organization";
import { PageHero } from "@/components/shared/page-hero";
import { BentoGrid, QuickActionCard, SectionHeader } from "@/components/shared/bento";
import { currencySymbol, displayCurrencyAmount } from "@/lib/utils";
import { StatCard } from "@/components/shared/stat-card";
import { DonutChart } from "@/components/shared/donut-chart";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { memberStatusLabel } from "@/lib/member-status";
import { revenueChart } from "@/lib/revenue-chart";
import type { Accent } from "@/lib/section-accent";

/* ─── Quick action definitions ──────────────────────────────────── */
const QUICK_ACTIONS = [
  ["Add a member",     "Register a new client",       "/members/new",  UserPlus,     "members.create",   "violet"]  as const,
  ["Record a payment", "Log cash, card, or UPI",      "/billing",      Wallet,       "payments.create",  "amber"]   as const,
  ["Check in",         "Record today's attendance",   "/attendance",   CalendarCheck,"attendance.create","cyan"]    as const,
  ["Build a workout",  "Create or assign a plan",     "/workouts",     Dumbbell,     "workouts.create",  "emerald"] as const,
  ["Add a lead",       "Track a new prospect",        "/crm",          Megaphone,    "leads.manage",     "rose"]    as const,
];

/* ─── Donut colours: section tokens, never hardcoded ─────────────────── */
const DONUT_COLORS = [
  "var(--a-indigo)",
  "var(--a-violet)",
  "var(--a-emerald)",
  "var(--a-amber)",
  "var(--a-cyan)",
  "var(--a-rose)",
  "var(--a-blue)",
  "var(--a-orange)",
];

/* ─── Branch storage ─────────────────────────────────────────────── */
const ALL_BRANCHES = "all";
const BRANCH_STORAGE_KEY = "mygymagent:dashboard-branch";

function readStoredBranch(): string {
  if (typeof window === "undefined") return ALL_BRANCHES;
  try { return window.localStorage.getItem(BRANCH_STORAGE_KEY) || ALL_BRANCHES; }
  catch { return ALL_BRANCHES; }
}

/* ─── Helpers ────────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────────────────
   Main Dashboard Page
   ──────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { hasPermission, user } = useAuth();
  const canViewReports = hasPermission("reports.view");

  const [selectedBranch, setSelectedBranch] = React.useState<string>(readStoredBranch);
  const chooseBranch = (value: string) => {
    setSelectedBranch(value);
    try { window.localStorage.setItem(BRANCH_STORAGE_KEY, value); } catch { /* noop */ }
  };

  const branches = useBranches({ pageSize: 100 }, { enabled: canViewReports && hasPermission("branches.read") });
  const branchItems = branches.data?.items ?? [];
  const branchFilter =
    selectedBranch !== ALL_BRANCHES && (!branches.data || branchItems.some((b) => b.id === selectedBranch))
      ? selectedBranch
      : undefined;

  const briefing      = useDailyBriefing({ enabled: canViewReports, branchId: branchFilter });
  const organization  = useOrganization({ enabled: hasPermission("organizations.read") });
  const revenueTrend  = useRevenueTrend(6, branchFilter, { enabled: canViewReports });
  const statusBreakdown = useMemberStatusBreakdown(branchFilter, { enabled: canViewReports });

  const data          = briefing.data;
  const scopedBranchId = data?.branchId && data.branchId !== branchFilter ? data.branchId : null;
  const branchName    = (id: string | null | undefined) => branchItems.find((b) => b.id === id)?.name;

  const gymName       = organization.data?.name ?? "Dashboard";
  const currencyCode  = organization.data?.currency ?? "INR";

  const revenueRow    =
    data?.revenue.revenue.find((r) => r.currency === currencyCode) ?? data?.revenue.revenue[0];
  const revenue       = revenueRow?.netRevenue ?? "0.00";
  const revenueCurrency = revenueRow?.currency ?? currencyCode;
  const outstandingRow =
    data?.revenue.outstanding.find((r) => r.currency === currencyCode) ?? data?.revenue.outstanding[0];

  const visibleActions = QUICK_ACTIONS.filter(([,,,, permission]) => hasPermission(permission as string));

  /* Priorities / attention items */
  const priorities = data
    ? [
        (data.expiringSoon?.count ?? 0) > 0 &&
          hasPermission(["memberships.read", "memberships.read_assigned"]) && {
            icon: CalendarClock,
            title: `${data.expiringSoon!.count} membership${data.expiringSoon!.count === 1 ? "" : "s"} end within ${data.expiringSoon!.withinDays} days`,
            detail: "Not renewed yet — a call before the end date keeps them.",
            href: "/memberships",
            action: "Renewals",
            color: "amber" as Accent,
          },
        (data.followUpsDue?.count ?? 0) > 0 &&
          hasPermission("leads.read") && {
            icon: Megaphone,
            title: `${data.followUpsDue!.count} lead follow-up${data.followUpsDue!.count === 1 ? "" : "s"} due today`,
            detail: data.followUpsDue!.overdue > 0
              ? `${data.followUpsDue!.overdue} overdue — call those first.`
              : "Due by the end of today.",
            href: "/crm",
            action: "Open Sales",
            color: "rose" as Accent,
          },
        data.atRiskMembers.count > 0 &&
          hasPermission(["members.read", "members.read_assigned"]) && {
            icon: AlertTriangle,
            title: `${data.atRiskMembers.count} paying member${data.atRiskMembers.count === 1 ? " hasn't" : "s haven't"} visited in 14 days`,
            detail: "A personal message now is cheaper than a win-back later.",
            href: "/members",
            action: "Review members",
            color: "orange" as Accent,
          },
        data.lowStock.count > 0 &&
          hasPermission("inventory.read") && {
            icon: Package,
            title: `${data.lowStock.count} product${data.lowStock.count === 1 ? " is" : "s are"} below reorder level`,
            detail: data.lowStock.top.slice(0, 3).map((p) => p.name).join(", "),
            href: "/inventory",
            action: "Inventory",
            color: "cyan" as Accent,
          },
        data.pendingAiActions > 0 &&
          hasPermission("ai.approve") && {
            icon: Sparkles,
            title: `${data.pendingAiActions} AI proposal${data.pendingAiActions === 1 ? "" : "s"} awaiting approval`,
            detail: "Review proposed actions before they run.",
            href: "/ai-actions",
            action: "Review",
            color: "violet" as Accent,
          },
      ].filter((item): item is Exclude<typeof item, false> => Boolean(item))
    : [];

  /* Revenue chart data */
  const { weeklyData, chartCurrency } = React.useMemo(
    () => revenueChart(revenueTrend.data ?? [], currencyCode),
    [revenueTrend.data, currencyCode],
  );
  const maxRevenue = Math.max(1, ...weeklyData.map((d) => d.value));
  const hasRevenue = weeklyData.some((d) => d.value > 0);

  /* Member status donut data */
  const memberDonutSegments = React.useMemo(
    () =>
      (statusBreakdown.data ?? []).map((row, i) => ({
        label: memberStatusLabel(row.status),
        value: row.count,
        color: DONUT_COLORS[i % DONUT_COLORS.length],
      })),
    [statusBreakdown.data],
  );
  const totalMembers = memberDonutSegments.reduce((sum, s) => sum + s.value, 0);

  /* Jump-to bento: one tile per work area, gated like the rail, with live
     counts only from data this page already loads — never new requests. */
  const jumpItems = [
    { title: "Branches", desc: "Locations, kiosks and stock", href: "/branches", icon: Building2, accent: "blue" as Accent, permission: "branches.read", badge: branchItems.length > 0 ? branchItems.length : undefined },
    { title: "Members", desc: "Directory and memberships", href: "/members", icon: Users, accent: "cyan" as Accent, permission: ["members.read", "members.read_assigned"], badge: totalMembers > 0 ? totalMembers : undefined },
    { title: "Revenue", desc: "Payments and invoices", href: "/billing", icon: Wallet, accent: "emerald" as Accent, permission: "payments.read", badge: outstandingRow && outstandingRow.membershipsWithBalance > 0 ? outstandingRow.membershipsWithBalance : undefined },
    { title: "AI", desc: "Agent and approvals", href: "/ai", icon: Sparkles, accent: "violet" as Accent, permission: "ai.generate", badge: data?.pendingAiActions ? data.pendingAiActions : undefined },
    { title: "Operations", desc: "Attendance and inventory", href: "/attendance", icon: CalendarCheck, accent: "orange" as Accent, permission: ["attendance.read", "attendance.read_assigned"], badge: data && data.today.checkIns > 0 ? data.today.checkIns : undefined },
    { title: "Security", desc: "Access and audit", href: "/settings/security", icon: ShieldCheck, accent: "rose" as Accent, permission: ["organizations.update", "audit.read"], badge: undefined as number | undefined },
    { title: "Control", desc: "Gym settings", href: "/settings", icon: Settings, accent: "indigo" as Accent, permission: "organizations.read", badge: undefined as number | undefined },
  ].filter((item) => hasPermission(item.permission));

  if (!canViewReports) {
    return (
      <StaffHome
        firstName={user?.firstName}
        gymName={organization.data?.name}
        actions={visibleActions}
      />
    );
  }

  const today     = formatToday(organization.data?.timezone);
  const updatedAt = data ? formatTime(data.generatedAt, organization.data?.timezone) : null;

  return (
    <div className="flex w-full flex-col gap-6 pb-8">

      {/* ── Hero Banner ─────────────────────────────────────────── */}
      <PageHero
        id="dashboard-title"
        eyebrow=""
        title={gymName}
        description={today}
        compact
        centered
        tone="noir"
        actions={
          hasPermission("ai.generate") ? (
            <Button asChild size="sm" className="hero-banner-btn hero-banner-btn-ghost">
              <Link href="/ai">
                <Sparkles className="size-4" aria-hidden="true" />
                Ask AI
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* ── Branch picker + freshness row ───────────────────────── */}
      <div className="-mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
        {scopedBranchId ? (
          <span className="font-medium text-foreground">{branchName(scopedBranchId) ?? "Your branch"}</span>
        ) : branchItems.length > 1 ? (
          <Select value={branchFilter ?? ALL_BRANCHES} onValueChange={chooseBranch}>
            <SelectTrigger aria-label="Branch" className="h-8 w-auto min-w-40 rounded-xl bg-card text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_BRANCHES}>All branches</SelectItem>
              {branchItems.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="font-medium text-foreground">{branchItems[0]?.name ?? "All branches"}</span>
        )}
        {updatedAt && (
          <>
            <span aria-hidden="true">·</span>
            <span>Updated {updatedAt}</span>
          </>
        )}
      </div>

      {/* ── KPI Grid ────────────────────────────────────────────── */}
      <section aria-labelledby="dash-kpis">
        <h2 id="dash-kpis" className="sr-only">Key performance indicators</h2>

        {/* Category header: Today */}
        <div className="category-header kpi-cyan mb-3">
          <span className="category-header-icon">
            <CalendarCheck className="size-3.5" aria-hidden="true" />
          </span>
          <span className="category-header-label">Today</span>
        </div>
        <BentoGrid columns={4} label="Today's key figures" className="mb-6">
          <StatCard
            icon={CalendarCheck}
            title="Checked in today"
            value={data?.today.checkIns}
            hint={data?.today.deniedCheckIns ? `${data.today.deniedCheckIns} turned away at the door` : undefined}
            isLoading={briefing.isLoading}
            isError={briefing.isError}
            tone="primary"
            accent="cyan"
          />
          <StatCard
            icon={Users}
            title="Active members"
            value={data?.atRiskMembers ? totalMembers - data.atRiskMembers.count : totalMembers}
            hint="Current memberships active"
            isLoading={briefing.isLoading || statusBreakdown.isLoading}
            isError={briefing.isError}
            tone="primary"
            accent="indigo"
          />
          <StatCard
            icon={UserPlus}
            title="At-risk members"
            value={data?.atRiskMembers.count}
            hint="No visit in 14 days"
            isLoading={briefing.isLoading}
            isError={briefing.isError}
            tone="warning"
            accent="amber"
          />
          <StatCard
            icon={AlertTriangle}
            title="Expiring soon"
            value={data?.expiringSoon?.count}
            hint={`Within ${data?.expiringSoon?.withinDays ?? 7} days`}
            isLoading={briefing.isLoading}
            isError={briefing.isError}
            tone="warning"
            accent="orange"
          />
        </BentoGrid>

        {/* Category header: Finance */}
        <div className="category-header kpi-emerald mb-3">
          <span className="category-header-icon">
            <Wallet className="size-3.5" aria-hidden="true" />
          </span>
          <span className="category-header-label">Finance this month</span>
        </div>
        <BentoGrid columns={4} label="Finance figures">
          <StatCard
            icon={Wallet}
            title="Net revenue"
            value={data ? displayCurrencyAmount(revenue, revenueCurrency) : undefined}
            hint="After refunds"
            isLoading={briefing.isLoading}
            isError={briefing.isError}
            tone="success"
            accent="emerald"
          />
          <StatCard
            icon={TrendingUp}
            title="Outstanding dues"
            value={data ? displayCurrencyAmount(outstandingRow?.outstandingBalance ?? "0.00", outstandingRow?.currency ?? currencyCode) : undefined}
            hint={outstandingRow && outstandingRow.membershipsWithBalance > 0
              ? `On ${outstandingRow.membershipsWithBalance} memberships`
              : "Nothing owed"}
            isLoading={briefing.isLoading}
            isError={briefing.isError}
            tone="warning"
            accent="amber"
          />
          <StatCard
            icon={Zap}
            title="Pending AI actions"
            value={data?.pendingAiActions}
            hint="Awaiting approval"
            isLoading={briefing.isLoading}
            isError={briefing.isError}
            tone="primary"
            accent="violet"
          />
          <StatCard
            icon={Package}
            title="Low-stock items"
            value={data?.lowStock.count}
            hint={hasPermission("inventory.read") ? "At or below reorder level" : undefined}
            isLoading={briefing.isLoading}
            isError={briefing.isError}
            tone="warning"
            accent="rose"
          />
        </BentoGrid>
      </section>

      {/* ── Jump to ─────────────────────────────────────────────── */}
      {jumpItems.length > 0 && (
        <div>
          <SectionHeader title="Jump to" />
          <BentoGrid columns={3} label="Jump to a section">
            {jumpItems.map((item) => (
              <QuickActionCard
                key={item.href}
                icon={item.icon}
                label={item.title}
                hint={item.desc}
                accent={item.accent}
                href={item.href}
                badge={item.badge}
              />
            ))}
          </BentoGrid>
        </div>
      )}

      {/* ── Charts row ──────────────────────────────────────────── */}
      <section
        aria-label="Revenue trend and member status"
        className="grid gap-4 xl:grid-cols-[1.4fr_1fr]"
      >
        {/* Revenue bar chart */}
        <Card>
          <CardHeader className="border-b pb-4">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em]">
                Revenue · last 6 months
              </CardTitle>
              {hasPermission("payments.read") && (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/billing">Details</Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            {revenueTrend.isLoading ? (
              <Skeleton className="h-44 w-full rounded-xl" aria-label="Loading revenue chart" />
            ) : revenueTrend.isError ? (
              <ErrorState message="Could not load revenue trend." onRetry={() => void revenueTrend.refetch()} />
            ) : !hasRevenue ? (
              <EmptyState title="No revenue yet" description="Revenue will appear here once payments are recorded." />
            ) : (
              <>
                <p className="mb-3 text-xs text-muted-foreground">
                  Peak{" "}
                  <span className="font-semibold tabular-nums text-foreground">
                    {currencySymbol(chartCurrency)}{maxRevenue.toLocaleString()}
                  </span>{" "}
                  · net of refunds
                </p>
                <div
                  role="img"
                  aria-label={`Revenue trend: ${weeklyData.map((d) => `${d.day} ${d.value}`).join(", ")}`}
                  className="flex h-44 items-end gap-2"
                >
                  {weeklyData.map((d, i) => {
                    const isCurrentMonth = i === weeklyData.length - 1;
                    const pct = Math.max(4, Math.round((d.value / maxRevenue) * 100));
                    return (
                      <div
                        key={d.day}
                        className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
                        title={`${d.day}: ${d.value}`}
                      >
                        <div className="flex h-36 w-full items-end border-b border-border" aria-hidden="true">
                          <div
                            className="w-full rounded-t-md transition-[height] motion-reduce:transition-none"
                            style={{
                              height: `${pct}%`,
                              background: isCurrentMonth
                                ? "linear-gradient(180deg, var(--a-indigo-grad-1), var(--a-indigo-grad-2))"
                                : "linear-gradient(180deg, color-mix(in oklab, var(--a-indigo-grad-1) 45%, transparent), color-mix(in oklab, var(--a-indigo-grad-2) 45%, transparent))",
                              borderRadius: "4px 4px 2px 2px",
                            }}
                          />
                        </div>
                        <span className="truncate text-xs text-muted-foreground">{d.day}</span>
                      </div>
                    );
                  })}
                </div>
                {/* Screen-reader table */}
                <table className="sr-only">
                  <caption>Revenue by month</caption>
                  <thead><tr><th scope="col">Month</th><th scope="col">Value</th></tr></thead>
                  <tbody>
                    {weeklyData.map((d) => (
                      <tr key={d.day}><th scope="row">{d.day}</th><td>{d.value}</td></tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </CardContent>
        </Card>

        {/* Member status donut */}
        <Card>
          <CardHeader className="border-b pb-4">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em]">
                Members by status
              </CardTitle>
              {hasPermission(["members.read", "members.read_assigned"]) && (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/members">All members</Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            {statusBreakdown.isLoading ? (
              <DonutChart segments={[]} isLoading size={140} />
            ) : statusBreakdown.isError ? (
              <ErrorState
                message="Could not load member breakdown."
                onRetry={() => void statusBreakdown.refetch()}
              />
            ) : (
              <>
                <DonutChart
                  segments={memberDonutSegments}
                  centerValue={totalMembers.toLocaleString()}
                  centerLabel="Total"
                  size={140}
                  strokeWidth={22}
                  showLegend
                />
                {/* Screen-reader table — duplicates the legend so status
                    labels appear twice, which the test suite asserts on. */}
                <table className="sr-only">
                  <caption>Members by status</caption>
                  <thead><tr><th scope="col">Status</th><th scope="col">Count</th></tr></thead>
                  <tbody>
                    {memberDonutSegments.map((seg) => (
                      <tr key={seg.label}>
                        <th scope="row">{seg.label}</th>
                        <td>{seg.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Attention + Quick actions row ───────────────────────── */}
      <section
        aria-label="Needs attention and quick actions"
        className="grid gap-4 xl:grid-cols-[1fr_1fr]"
      >
        {/* Needs attention panel */}
        <Card>
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em]">
              Needs attention
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            {briefing.isLoading ? (
              <div className="space-y-2" role="status" aria-label="Loading priorities">
                {[1, 2, 3].map((k) => <Skeleton key={k} className="h-16 w-full rounded-xl" />)}
              </div>
            ) : briefing.isError ? (
              <ErrorState message="Could not load today's priorities." onRetry={() => void briefing.refetch()} />
            ) : priorities.length ? (
              <ul className="flex flex-col gap-1">
                {priorities.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="group flex min-h-11 items-center gap-3 rounded-xl border border-transparent px-3 py-3 transition-all hover:border-border hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring"
                      >
                        <span
                          className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white"
                          style={{
                            background: `linear-gradient(135deg, var(--a-${item.color}-grad-1), var(--a-${item.color}-grad-2))`,
                            boxShadow: `0 3px 8px -3px color-mix(in oklab, var(--a-${item.color}-grad-1) 55%, transparent)`,
                          }}
                        >
                          <Icon className="size-4.5" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block [overflow-wrap:anywhere] text-sm font-medium">{item.title}</span>
                          {item.detail && (
                            <span className="mt-0.5 block [overflow-wrap:anywhere] text-xs text-muted-foreground">{item.detail}</span>
                          )}
                        </span>
                        <span className="hidden items-center gap-1 text-xs font-semibold text-primary sm:flex">
                          {item.action}
                          <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-5 py-10 text-center">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-success/10 text-success">
                  <CheckCircle2 className="size-6" aria-hidden="true" />
                </span>
                <p className="text-sm font-semibold">You&apos;re all caught up</p>
                <p className="text-xs text-muted-foreground">Nothing needs attention right now.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick actions grid */}
        <section aria-labelledby="dash-quick">
          <h2
            id="dash-quick"
            className="section-title mb-4 text-base font-semibold tracking-tight"
          >
            Quick actions
          </h2>
          {visibleActions.length > 0 ? (
            <BentoGrid columns={2} label="Quick actions">
              {visibleActions.map(([title, desc, href, Icon, , color]) => (
                <QuickActionCard
                  key={href}
                  icon={Icon}
                  label={title}
                  hint={desc}
                  accent={color}
                  href={href}
                />
              ))}
            </BentoGrid>
          ) : (
            <EmptyState
              title="Nothing to do here yet"
              description="Your account doesn't include any of these actions."
            />
          )}
        </section>
      </section>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Staff home (no reports.view permission)
   ──────────────────────────────────────────────────────────────── */
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
    <div className="flex w-full flex-col gap-6 pb-8">
      <PageHero
        id="dashboard-title"
        eyebrow=""
        title={gymName ?? (firstName ? `Welcome, ${firstName}` : "Welcome")}
        description="Here's what you can do from here today."
        compact
        centered
        tone="noir"
      />

      <section aria-labelledby="dash-quick">
        <h2 id="dash-quick" className="section-title mb-4 text-base font-semibold">
          Quick actions
        </h2>
        {actions.length > 0 ? (
          <BentoGrid columns={3} label="Quick actions">
            {actions.map(([title, desc, href, Icon, , color]) => (
              <QuickActionCard
                key={href}
                icon={Icon}
                label={title}
                hint={desc}
                accent={color}
                href={href}
              />
            ))}
          </BentoGrid>
        ) : (
          <EmptyState
            title="Nothing to do here yet"
            description="Your account doesn't include any of these actions. Ask the gym owner for access."
          />
        )}
      </section>
    </div>
  );
}

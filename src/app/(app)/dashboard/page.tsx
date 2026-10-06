"use client";

import * as React from "react";
import Link from "next/link";
import {
  Building2,
  CalendarCheck,
  CalendarDays,
  Dumbbell,
  HandCoins,
  Megaphone,
  RefreshCw,
  Scale,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth/auth-context";
import { useDailyBriefing } from "@/lib/hooks/use-daily-briefing";
import { useMemberStatusBreakdown, useRevenueSummary, useRevenueTrend } from "@/lib/hooks/use-analytics";
import { useGymHealth } from "@/lib/hooks/use-gym-health";
import { useLeads } from "@/lib/hooks/use-leads";
import { useMembers } from "@/lib/hooks/use-members";
import { useMemberships } from "@/lib/hooks/use-memberships";
import { useTodayWorkoutSessions } from "@/lib/hooks/use-workout-sessions";
import { useBranches } from "@/lib/hooks/use-branches";
import { useOrganization } from "@/lib/hooks/use-organization";
import { PageHero } from "@/components/shared/page-hero";
import { BentoGrid, QuickActionCard, SectionHeader } from "@/components/shared/bento";
import { GymHealthHero, GymHealthPanels, GymHealthRevenueRisk } from "./gym-health";
import { PriorityActions } from "./priority-actions";
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
/* ─── Finance period ─────────────────────────────────────────────── */
type FinancePreset = "today" | "7d" | "15d" | "30d" | "90d" | "custom";
const FINANCE_PRESETS: ReadonlyArray<{ value: Exclude<FinancePreset, "custom">; label: string; days: number }> = [
  { value: "today", label: "Today", days: 1 },
  { value: "7d", label: "7D", days: 7 },
  { value: "15d", label: "15D", days: 15 },
  { value: "30d", label: "30D", days: 30 },
  { value: "90d", label: "90D", days: 90 },
];

/** YYYY-MM-DD in the gym's timezone — what the revenue endpoint bounds by day. */
function isoDay(date: Date, timeZone: string | null | undefined) {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timeZone ?? undefined,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  }
}

function shortDay(iso: string, timeZone: string | null | undefined) {
  const [y, m, d] = iso.split("-").map(Number);
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: timeZone ?? undefined,
      month: "short",
      day: "numeric",
    }).format(new Date(y, (m ?? 1) - 1, d ?? 1));
  } catch {
    return iso;
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


  const canReadOrg    = hasPermission("organizations.read");
  const organization  = useOrganization({ enabled: canReadOrg });
  /* Date windows are computed in the gym's timezone. Firing the queries
     before it loads would request (and flash) a wrong-timezone day, then
     refire — so date-driven queries wait for it. Without the permission
     the org never loads and local time is the only option. */
  const tzReady = !canReadOrg || organization.isFetched;
  const revenueTrend  = useRevenueTrend(6, branchFilter, { enabled: canViewReports });
  const gymHealth     = useGymHealth(
    { ...(branchFilter ? { branchId: branchFilter } : {}) },
    { enabled: canViewReports && tzReady },
  );
  const statusBreakdown = useMemberStatusBreakdown(branchFilter, { enabled: canViewReports });

  const data          = briefing.data;
  const scopedBranchId = data?.branchId && data.branchId !== branchFilter ? data.branchId : null;

  const gymName       = organization.data?.name ?? "Dashboard";
  const currencyCode  = organization.data?.currency ?? "INR";

  /* Finance period: presets or a custom range; always drives the summary below. */
  const [financePreset, setFinancePreset] = React.useState<FinancePreset>("30d");
  const [customRange, setCustomRange] = React.useState<{ from: string; to: string } | null>(null);
  const [customOpen, setCustomOpen] = React.useState(false);
  const [draftFrom, setDraftFrom] = React.useState("");
  const [draftTo, setDraftTo] = React.useState("");
  const timezone = organization.data?.timezone;
  const financeRange = React.useMemo(() => {
    if (financePreset === "custom" && customRange) return customRange;
    const days = FINANCE_PRESETS.find((preset) => preset.value === financePreset)?.days ?? 30;
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - (days - 1));
    return { from: isoDay(from, timezone), to: isoDay(to, timezone) };
  }, [financePreset, customRange, timezone]);
  const financeSummary = useRevenueSummary(
    { from: financeRange.from, to: financeRange.to, ...(branchFilter ? { branchId: branchFilter } : {}) },
    { enabled: canViewReports && tzReady },
  );
  const summaryRow =
    financeSummary.data?.revenue.find((r) => r.currency === currencyCode) ?? financeSummary.data?.revenue[0];

  /* Today section: six KPIs, each from its authoritative source. New members
     use the members joined-filter; renewals are today's memberships linked
     to a previous row; leads and PT sessions come from their own endpoints.
     Every query is permission-gated so nobody asks the API for what it
     would refuse. */
  const canReadMembers = hasPermission(["members.read", "members.read_assigned"]);
  const canReadMemberships = hasPermission(["memberships.read", "memberships.read_assigned"]);
  const canReadLeads = hasPermission("leads.read");
  const canReadWorkouts = hasPermission(["workouts.read", "workouts.read_assigned"]);
  const todayStr = React.useMemo(() => isoDay(new Date(), timezone), [timezone]);
  // members joinedTo is lte-start-of-day server-side, so tomorrow bounds today.
  const tomorrowStr = React.useMemo(
    () => isoDay(new Date(new Date().setDate(new Date().getDate() + 1)), timezone),
    [timezone],
  );
  const todayCollection = useRevenueSummary(
    { from: todayStr, to: todayStr, ...(branchFilter ? { branchId: branchFilter } : {}) },
    { enabled: canViewReports && tzReady },
  );
  const todayCollectionRow =
    todayCollection.data?.revenue.find((r) => r.currency === currencyCode) ?? todayCollection.data?.revenue[0];
  const newMembers = useMembers(
    { joinedFrom: todayStr, joinedTo: tomorrowStr, pageSize: 1, ...(branchFilter ? { branchId: [branchFilter] } : {}) },
    { enabled: canViewReports && canReadMembers && tzReady },
  );
  const todayMemberships = useMemberships(
    { createdFrom: todayStr, createdTo: todayStr, pageSize: 100 },
    { enabled: canViewReports && canReadMemberships && tzReady },
  );
  const renewalsToday = (todayMemberships.data?.items ?? []).filter((m) => m.previousMembershipId).length;
  const todayLeads = useLeads(
    { createdFrom: todayStr, createdTo: todayStr, pageSize: 1 },
    { enabled: canViewReports && canReadLeads && tzReady },
  );
  const todaySessions = useTodayWorkoutSessions({ enabled: canViewReports && canReadWorkouts && tzReady });
  const summaryOutstanding =
    financeSummary.data?.outstanding.find((r) => r.currency === currencyCode) ?? financeSummary.data?.outstanding[0];
  const rangeLabel =
    financePreset === "custom" && customRange
      ? `Custom · ${shortDay(customRange.from, timezone)} – ${shortDay(customRange.to, timezone)}`
      : financePreset === "today"
        ? `Today · ${shortDay(financeRange.to, timezone)}`
        : `Last ${FINANCE_PRESETS.find((preset) => preset.value === financePreset)?.days ?? 30} days · ${shortDay(financeRange.from, timezone)} – ${shortDay(financeRange.to, timezone)}`;

  const outstandingRow =
    data?.revenue.outstanding.find((r) => r.currency === currencyCode) ?? data?.revenue.outstanding[0];

  const visibleActions = QUICK_ACTIONS.filter(([,,,, permission]) => hasPermission(permission as string));

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

  return (
    <div className="flex w-full flex-col gap-6 pb-8">

      {/* ── Gym Health hero ───────────────────────────────────────── */}
      <GymHealthHero
        gymName={gymName}
        health={gymHealth.data}
        isLoading={gymHealth.isLoading}
        isError={gymHealth.isError}
        onRetry={() => void gymHealth.refetch()}
      />

      {/* ── Branch picker (drives every figure below) ─────────────── */}
      {branchItems.length > 1 && !scopedBranchId && (
        <div className="-mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
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
        </div>
      )}

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
        <BentoGrid columns={6} label="Today's key figures" className="mb-6">
          <StatCard
            icon={CalendarCheck}
            title="Check In"
            value={data?.today.checkIns}
            hint={data?.today.deniedCheckIns ? `${data.today.deniedCheckIns} turned away at the door` : "Visits today"}
            isLoading={briefing.isLoading}
            isError={briefing.isError}
            tone="primary"
            accent="cyan"
          />
          <StatCard
            icon={HandCoins}
            title="Collection"
            value={todayCollection.data ? displayCurrencyAmount(todayCollectionRow?.grossRevenue ?? "0.00", todayCollectionRow?.currency ?? currencyCode) : undefined}
            hint={todayCollectionRow && todayCollectionRow.paymentCount > 0
              ? `Today · across ${todayCollectionRow.paymentCount} payments`
              : "No collections yet"}
            isLoading={todayCollection.isLoading}
            isError={todayCollection.isError}
            tone="success"
            accent="emerald"
          />
          {canReadMembers && (
            <StatCard
              icon={UserPlus}
              title="New Members"
              value={newMembers.data?.total}
              hint="Joined today"
              isLoading={newMembers.isLoading}
              isError={newMembers.isError}
              tone="primary"
              accent="violet"
            />
          )}
          {canReadMemberships && (
            <StatCard
              icon={RefreshCw}
              title="Renewals"
              value={todayMemberships.data ? renewalsToday : undefined}
              hint={todayMemberships.data && todayMemberships.data.total > 0
                ? `Of ${todayMemberships.data.total} started today`
                : "None renewed today"}
              isLoading={todayMemberships.isLoading}
              isError={todayMemberships.isError}
              tone="primary"
              accent="amber"
            />
          )}
          {canReadLeads && (
            <StatCard
              icon={Megaphone}
              title="Leads"
              value={todayLeads.data?.total}
              hint="New enquiries today"
              isLoading={todayLeads.isLoading}
              isError={todayLeads.isError}
              tone="primary"
              accent="rose"
            />
          )}
          {canReadWorkouts && (
            <StatCard
              icon={Dumbbell}
              title="PT Sessions"
              value={todaySessions.data?.length}
              hint="On today's floor"
              isLoading={todaySessions.isLoading}
              isError={todaySessions.isError}
              tone="primary"
              accent="blue"
            />
          )}
        </BentoGrid>

        <SectionHeader
          title="Finance"
          action={
            <span className="kpi-trend kpi-trend-neutral" role="status">
              {financeSummary.isLoading ? "Loading…" : rangeLabel}
            </span>
          }
        />
        {/* Period selector: presets plus a custom range. Every choice
            re-queries the revenue summary, so the four KPIs below always
            reflect the selected period — except Outstanding, which is a
            live balance by definition (see its hint). */}
        <div className="mb-3 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* Segmented presets: plain buttons with pressed state, so the
                control works identically with mouse, touch, keyboard and
                assistive tech — no menu library needed for five options. */}
            <div
              role="group"
              aria-label="Finance period"
              className="inline-flex max-w-full flex-wrap items-center gap-1 rounded-xl border border-border bg-surface-sunken p-1"
            >
              {FINANCE_PRESETS.map((preset) => {
                const active = financePreset === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setFinancePreset(preset.value)}
                    className={active
                      ? "inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-card px-3.5 text-sm font-semibold text-foreground shadow-[var(--shadow-card)] transition-all duration-200 touch-manipulation"
                      : "inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3.5 text-sm font-semibold text-muted-foreground transition-all duration-200 hover:text-foreground touch-manipulation"}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
            <Button
              variant={financePreset === "custom" ? "default" : "outline"}
              size="sm"
              className="min-h-11 rounded-xl"
              aria-expanded={customOpen}
              onClick={() => setCustomOpen((open) => !open)}
            >
              <CalendarDays className="size-4" aria-hidden="true" />
              {financePreset === "custom" && customRange
                ? `${shortDay(customRange.from, timezone)} – ${shortDay(customRange.to, timezone)}`
                : "Custom"}
            </Button>
          </div>
          {customOpen && (
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
              <p className="mb-3 text-sm font-semibold tracking-tight">Custom range</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="finance-from" className="mb-1 block text-xs font-semibold text-muted-foreground">
                    Start date
                  </label>
                  <Input
                    id="finance-from"
                    type="date"
                    value={draftFrom}
                    max={draftTo || undefined}
                    onChange={(e) => setDraftFrom(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="finance-to" className="mb-1 block text-xs font-semibold text-muted-foreground">
                    End date
                  </label>
                  <Input
                    id="finance-to"
                    type="date"
                    value={draftTo}
                    min={draftFrom || undefined}
                    onChange={(e) => setDraftTo(e.target.value)}
                  />
                </div>
              </div>
              {!draftFrom || !draftTo ? (
                <p className="mt-2 text-xs text-muted-foreground">Pick a start and an end date.</p>
              ) : draftFrom > draftTo ? (
                <p className="mt-2 text-xs font-semibold text-destructive" role="alert">
                  Start date must be on or before the end date.
                </p>
              ) : null}
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  className="min-h-11 flex-1"
                  disabled={!draftFrom || !draftTo || draftFrom > draftTo}
                  onClick={() => {
                    setCustomRange({ from: draftFrom, to: draftTo });
                    setFinancePreset("custom");
                    setCustomOpen(false);
                  }}
                >
                  Apply
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="min-h-11"
                  onClick={() => {
                    setDraftFrom("");
                    setDraftTo("");
                    setCustomRange(null);
                    setFinancePreset("30d");
                    setCustomOpen(false);
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
          )}
        </div>
        <BentoGrid columns={4} label="Finance figures">
          <StatCard
            icon={Wallet}
            title="Net revenue"
            value={financeSummary.data ? displayCurrencyAmount(summaryRow?.netRevenue ?? "0.00", summaryRow?.currency ?? currencyCode) : undefined}
            hint="After refunds"
            isLoading={financeSummary.isLoading}
            isError={financeSummary.isError}
            tone="success"
            accent="emerald"
          />
          <StatCard
            icon={HandCoins}
            title="Collected amount"
            value={financeSummary.data ? displayCurrencyAmount(summaryRow?.grossRevenue ?? "0.00", summaryRow?.currency ?? currencyCode) : undefined}
            hint={summaryRow && summaryRow.paymentCount > 0
              ? `Across ${summaryRow.paymentCount} payments`
              : "No collections yet"}
            isLoading={financeSummary.isLoading}
            isError={financeSummary.isError}
            tone="primary"
            accent="cyan"
          />
          <StatCard
            icon={Scale}
            title="Outstanding amount"
            value={financeSummary.data ? displayCurrencyAmount(summaryOutstanding?.outstandingBalance ?? "0.00", summaryOutstanding?.currency ?? currencyCode) : undefined}
            hint={summaryOutstanding && summaryOutstanding.membershipsWithBalance > 0
              ? `On ${summaryOutstanding.membershipsWithBalance} memberships · live balance`
              : "Nothing owed"}
            isLoading={financeSummary.isLoading}
            isError={financeSummary.isError}
            tone="warning"
            accent="amber"
          />
          <StatCard
            icon={ShoppingBag}
            title="Inventory sale"
            value={financeSummary.data ? displayCurrencyAmount(summaryRow?.productRevenue ?? "0.00", summaryRow?.currency ?? currencyCode) : undefined}
            hint="Product sales in period"
            isLoading={financeSummary.isLoading}
            isError={financeSummary.isError}
            tone="primary"
            accent="violet"
          />
        </BentoGrid>
      </section>

      {/* ── Revenue at risk (same gym-health request as the hero) ─── */}
      <GymHealthRevenueRisk
        health={gymHealth.data}
        isLoading={gymHealth.isLoading}
      />

      <GymHealthPanels
        health={gymHealth.data}
        isLoading={gymHealth.isLoading}
        isError={gymHealth.isError}
        onRetry={() => void gymHealth.refetch()}
      />

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
        <PriorityActions
          branchFilter={branchFilter}
          outstandingBalance={summaryOutstanding?.outstandingBalance}
          outstandingCount={summaryOutstanding?.membershipsWithBalance ?? 0}
          currencyCode={summaryOutstanding?.currency ?? currencyCode}
          atRiskCount={data?.atRiskMembers.count ?? 0}
          pendingAiActions={data?.pendingAiActions ?? 0}
        />

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

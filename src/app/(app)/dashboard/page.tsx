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
import { GymHealthHero, GymHealthPanels, GymHealthRevenueRisk } from "./gym-health";
import { PriorityActions } from "./priority-actions";
import { AppIconLink, DashSection, Segmented, Tile } from "./dashboard-ui";
import styles from "./dashboard.module.css";
import { addDays, shortDay, useGymToday } from "./gym-day";
import { todayMetricHref } from "./today/[metric]/metrics";
import { cn, currencySymbol, displayCurrencyAmount } from "@/lib/utils";
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

/** Per user, so a shared device never hands one account another's
 * branch (or another gym's). The bare key is only a fallback for a
 * session with no user id. */
function branchStorageKey(userId: string | undefined): string {
  return userId ? `${BRANCH_STORAGE_KEY}:${userId}` : BRANCH_STORAGE_KEY;
}

function readStoredBranch(key: string): string {
  if (typeof window === "undefined") return ALL_BRANCHES;
  try { return window.localStorage.getItem(key) || ALL_BRANCHES; }
  catch { return ALL_BRANCHES; }
}

/* ─── Calendar helpers (gym timezone) ───────────────────────────── */
type FinancePreset = "today" | "7d" | "15d" | "30d" | "90d" | "custom";
const FINANCE_PRESETS: ReadonlyArray<{ value: Exclude<FinancePreset, "custom">; label: string; days: number }> = [
  { value: "today", label: "Today", days: 1 },
  { value: "7d", label: "7D", days: 7 },
  { value: "15d", label: "15D", days: 15 },
  { value: "30d", label: "30D", days: 30 },
  { value: "90d", label: "90D", days: 90 },
];

/* ─────────────────────────────────────────────────────────────────
   Main Dashboard Page
   ──────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { hasPermission, user } = useAuth();
  const canViewReports = hasPermission("reports.view");
  const canReadBranches = hasPermission("branches.read");

  const storageKey = branchStorageKey(user?.id);
  const [selectedBranch, setSelectedBranch] = React.useState<string>(() => readStoredBranch(storageKey));
  const chooseBranch = (value: string) => {
    setSelectedBranch(value);
    try { window.localStorage.setItem(storageKey, value); } catch { /* noop */ }
  };

  const branches = useBranches({ pageSize: 100 }, { enabled: canViewReports && canReadBranches });
  const branchItems = branches.data?.items ?? [];
  /* A remembered branch counts only for someone who can see the picker,
     and only once it is confirmed to still exist. Firing first and
     checking later asked for a stale (or another gym's) branch, which
     the API answers with zeros — silently, for anyone without the
     picker to reset it. The default "all" never waits. */
  const branchReady = selectedBranch === ALL_BRANCHES || !canReadBranches || branches.isFetched;
  const branchFilter =
    canReadBranches && selectedBranch !== ALL_BRANCHES && branchItems.some((b) => b.id === selectedBranch)
      ? selectedBranch
      : undefined;
  const branchQuery = branchFilter ? { branchId: branchFilter } : {};
  const reportsReady = canViewReports && branchReady;

  const briefing = useDailyBriefing({ enabled: reportsReady, branchId: branchFilter });

  const canReadOrg = hasPermission("organizations.read");
  const organization = useOrganization({ enabled: canReadOrg });
  /* Date windows are computed in the gym's timezone. Firing the queries
     before it loads would request (and flash) a wrong-timezone day, then
     refire — so date-driven queries wait for it. Without the permission
     the org never loads and local time is the only option. */
  const tzReady = !canReadOrg || organization.isFetched;
  const datedReady = reportsReady && tzReady;
  const revenueTrend = useRevenueTrend(6, branchFilter, { enabled: reportsReady });
  const gymHealth = useGymHealth(branchQuery, { enabled: datedReady });
  const statusBreakdown = useMemberStatusBreakdown(branchFilter, { enabled: reportsReady });

  const data = briefing.data;
  const scopedBranchId = data?.branchId && data.branchId !== branchFilter ? data.branchId : null;

  const gymName = organization.data?.name ?? "Dashboard";
  const currencyCode = organization.data?.currency ?? "INR";
  const timezone = organization.data?.timezone;
  const todayStr = useGymToday(timezone);

  /* Finance period: presets or a custom range; always drives the summary below. */
  const [financePreset, setFinancePreset] = React.useState<FinancePreset>("30d");
  const [customRange, setCustomRange] = React.useState<{ from: string; to: string } | null>(null);
  const [customOpen, setCustomOpen] = React.useState(false);
  const [draftFrom, setDraftFrom] = React.useState("");
  const [draftTo, setDraftTo] = React.useState("");
  const financeRange = React.useMemo(() => {
    if (financePreset === "custom" && customRange) return customRange;
    const days = FINANCE_PRESETS.find((preset) => preset.value === financePreset)?.days ?? 30;
    return { from: addDays(todayStr, -(days - 1)), to: todayStr };
  }, [financePreset, customRange, todayStr]);
  const financeSummary = useRevenueSummary(
    { from: financeRange.from, to: financeRange.to, ...branchQuery },
    { enabled: datedReady },
  );
  const summaryRow =
    financeSummary.data?.revenue.find((r) => r.currency === currencyCode) ?? financeSummary.data?.revenue[0];

  /* Today section: six KPIs, each from its authoritative source, each
     narrowed to the picked branch, each permission-gated so nobody asks
     the API for what it would refuse. */
  const canReadMembers = hasPermission(["members.read", "members.read_assigned"]);
  const canReadMemberships = hasPermission(["memberships.read", "memberships.read_assigned"]);
  const canReadLeads = hasPermission("leads.read");
  const canReadWorkouts = hasPermission(["workouts.read", "workouts.read_assigned"]);
  // members joinedTo is lte-start-of-day server-side, so tomorrow bounds today.
  const tomorrowStr = addDays(todayStr, 1);
  const todayCollection = useRevenueSummary(
    { from: todayStr, to: todayStr, ...branchQuery },
    { enabled: datedReady },
  );
  const todayCollectionRow =
    todayCollection.data?.revenue.find((r) => r.currency === currencyCode) ?? todayCollection.data?.revenue[0];
  const newMembers = useMembers(
    { joinedFrom: todayStr, joinedTo: tomorrowStr, pageSize: 1, ...(branchFilter ? { branchId: [branchFilter] } : {}) },
    { enabled: datedReady && canReadMembers },
  );
  const todayMemberships = useMemberships(
    { createdFrom: todayStr, createdTo: todayStr, pageSize: 100, ...branchQuery },
    { enabled: datedReady && canReadMemberships },
  );
  const todayMembershipItems = todayMemberships.data?.items ?? [];
  const renewalsToday = todayMembershipItems.filter((m) => m.previousMembershipId).length;
  // One page of 100 is plenty for a day; if a gym ever exceeds it, say
  // "at least" rather than under-report.
  const renewalsTruncated = (todayMemberships.data?.total ?? 0) > todayMembershipItems.length;
  const todayLeads = useLeads(
    { createdFrom: todayStr, createdTo: todayStr, pageSize: 1, ...branchQuery },
    { enabled: datedReady && canReadLeads },
  );
  const todaySessions = useTodayWorkoutSessions({
    enabled: datedReady && canReadWorkouts,
    branchId: branchFilter,
  });
  /* Each Today figure opens the records behind it, for the same day and
     branch -- when this person may read that list. */
  const canReadAttendance = hasPermission(["attendance.read", "attendance.read_assigned"]);
  const canReadPayments = hasPermission("payments.read");
  const todayHref = (metric: Parameters<typeof todayMetricHref>[0]) => todayMetricHref(metric, todayStr, branchFilter);
  const summaryOutstanding =
    financeSummary.data?.outstanding.find((r) => r.currency === currencyCode) ?? financeSummary.data?.outstanding[0];
  const rangeLabel =
    financePreset === "custom" && customRange
      ? `Custom · ${shortDay(customRange.from)} – ${shortDay(customRange.to)}`
      : financePreset === "today"
        ? `Today · ${shortDay(financeRange.to)}`
        : `Last ${FINANCE_PRESETS.find((preset) => preset.value === financePreset)?.days ?? 30} days · ${shortDay(financeRange.from)} – ${shortDay(financeRange.to)}`;

  const outstandingRow =
    data?.revenue.outstanding.find((r) => r.currency === currencyCode) ?? data?.revenue.outstanding[0];

  const visibleActions = QUICK_ACTIONS.filter(([,,,, permission]) => hasPermission(permission as string));

  /* Revenue chart data */
  const { weeklyData: monthlyData, chartCurrency } = React.useMemo(
    () => revenueChart(revenueTrend.data ?? [], currencyCode),
    [revenueTrend.data, currencyCode],
  );
  const maxRevenue = Math.max(1, ...monthlyData.map((d) => d.value));
  const hasRevenue = monthlyData.some((d) => d.value > 0);

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

  /* Jump-to launcher: one icon per work area, gated like the rail, with
     live counts only from data this page already loads — never new requests. */
  const jumpItems = [
    { title: "Branches", desc: "Locations, kiosks and stock", href: "/branches", icon: Building2, accent: "blue" as Accent, permission: "branches.read", badge: branchItems.length, alert: false },
    { title: "Members", desc: "Directory and memberships", href: "/members", icon: Users, accent: "cyan" as Accent, permission: ["members.read", "members.read_assigned"], badge: totalMembers, alert: false },
    { title: "Revenue", desc: "Payments and invoices", href: "/billing", icon: Wallet, accent: "emerald" as Accent, permission: "payments.read", badge: outstandingRow?.membershipsWithBalance, alert: true },
    { title: "AI", desc: "Agent and approvals", href: "/ai", icon: Sparkles, accent: "violet" as Accent, permission: "ai.generate", badge: data?.pendingAiActions, alert: true },
    { title: "Operations", desc: "Attendance and inventory", href: "/attendance", icon: CalendarCheck, accent: "orange" as Accent, permission: ["attendance.read", "attendance.read_assigned"], badge: data?.today.checkIns, alert: false },
    { title: "Security", desc: "Access and audit", href: "/settings/security", icon: ShieldCheck, accent: "rose" as Accent, permission: ["organizations.update", "audit.read"], badge: undefined as number | undefined, alert: false },
    { title: "Control", desc: "Gym settings", href: "/settings", icon: Settings, accent: "indigo" as Accent, permission: "organizations.read", badge: undefined as number | undefined, alert: false },
  ].filter((item) => hasPermission(item.permission));

  if (!canViewReports) {
    return (
      <StaffHome
        firstName={user?.firstName}
        gymName={organization.data?.name}
        timeZone={timezone}
        actions={visibleActions}
      />
    );
  }

  const branchPicker =
    branchItems.length > 1 && !scopedBranchId ? (
      <Select value={branchFilter ?? ALL_BRANCHES} onValueChange={chooseBranch}>
        <SelectTrigger
          aria-label="Branch"
          className={cn(styles.glassPill, "h-8 w-auto min-w-36 gap-2 !rounded-full !border-border/70 !bg-card/70 text-xs font-semibold")}
        >
          <Building2 className="size-3.5 text-muted-foreground" aria-hidden="true" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_BRANCHES}>All branches</SelectItem>
          {branchItems.map((b) => (
            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    ) : null;

  return (
    <div className="flex w-full flex-col gap-8 pb-10">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <GymHealthHero
        gymName={gymName}
        timeZone={timezone}
        health={gymHealth.data}
        isLoading={gymHealth.isLoading || !datedReady}
        isError={gymHealth.isError}
        onRetry={() => void gymHealth.refetch()}
      >
        {branchPicker}
      </GymHealthHero>

      {/* ── Today ────────────────────────────────────────────────── */}
      <DashSection id="dash-today" title="Today" subtitle={`On the floor · ${shortDay(todayStr)}`}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          <Tile
            icon={CalendarCheck}
            title="Check In"
            accent="cyan"
            feature
            href={canReadAttendance ? todayHref("check-ins") : undefined}
            value={data?.today.checkIns}
            hint={data?.today.deniedCheckIns ? `${data.today.deniedCheckIns} turned away at the door` : "Visits today"}
            isLoading={briefing.isLoading || !reportsReady}
            isError={briefing.isError}
          />
          <Tile
            icon={HandCoins}
            title="Collection"
            accent="emerald"
            href={canReadPayments ? todayHref("collection") : undefined}
            value={todayCollection.data ? displayCurrencyAmount(todayCollectionRow?.grossRevenue ?? "0.00", todayCollectionRow?.currency ?? currencyCode, 0) : undefined}
            hint={todayCollectionRow && todayCollectionRow.paymentCount > 0
              ? `${todayCollectionRow.paymentCount} payment${todayCollectionRow.paymentCount === 1 ? "" : "s"} today`
              : "No collections yet"}
            isLoading={todayCollection.isLoading || !datedReady}
            isError={todayCollection.isError}
          />
          {canReadMembers && (
            <Tile
              icon={UserPlus}
              title="New Members"
              accent="violet"
              href={todayHref("new-members")}
              value={newMembers.data?.total}
              hint="Joined today"
              isLoading={newMembers.isLoading || !datedReady}
              isError={newMembers.isError}
            />
          )}
          {canReadMemberships && (
            <Tile
              icon={RefreshCw}
              title="Renewals"
              accent="amber"
              href={todayHref("renewals")}
              value={todayMemberships.data ? `${renewalsToday}${renewalsTruncated ? "+" : ""}` : undefined}
              hint={todayMemberships.data && todayMemberships.data.total > 0
                ? `Of ${todayMemberships.data.total} started today`
                : "None renewed today"}
              isLoading={todayMemberships.isLoading || !datedReady}
              isError={todayMemberships.isError}
            />
          )}
          {canReadLeads && (
            <Tile
              icon={Megaphone}
              title="Leads"
              accent="rose"
              href={todayHref("leads")}
              value={todayLeads.data?.total}
              hint="New enquiries today"
              isLoading={todayLeads.isLoading || !datedReady}
              isError={todayLeads.isError}
            />
          )}
          {canReadWorkouts && (
            <Tile
              icon={Dumbbell}
              title="Workouts"
              accent="blue"
              href="/workout-sessions"
              value={todaySessions.data?.length}
              hint="Training sessions today"
              isLoading={todaySessions.isLoading || !datedReady}
              isError={todaySessions.isError}
            />
          )}
        </div>
      </DashSection>

      {/* ── Finance ─────────────────────────────────────────────── */}
      <DashSection
        id="dash-finance"
        title="Finance"
        subtitle={financeSummary.isLoading ? "Loading…" : rangeLabel}
        subtitleLive
        action={
          <div className="flex flex-wrap items-center gap-2">
            {/* Plain buttons with pressed state: works identically with
                mouse, touch, keyboard and assistive tech. */}
            <Segmented
              label="Finance period"
              options={FINANCE_PRESETS}
              value={financePreset === "custom" ? null : financePreset}
              onChange={setFinancePreset}
            />
            <Button
              variant={financePreset === "custom" ? "default" : "outline"}
              size="sm"
              className="min-h-11 rounded-full px-4"
              aria-expanded={customOpen}
              onClick={() => setCustomOpen((open) => !open)}
            >
              <CalendarDays className="size-4" aria-hidden="true" />
              {financePreset === "custom" && customRange
                ? `${shortDay(customRange.from)} – ${shortDay(customRange.to)}`
                : "Custom"}
            </Button>
          </div>
        }
      >
        {customOpen && (
          <div className={cn(styles.panel, "w-full max-w-md self-end")}>
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
                  max={draftTo || todayStr}
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
                  max={todayStr}
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
                className="min-h-11 flex-1 rounded-full"
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
                className="min-h-11 rounded-full"
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
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Tile
            icon={Wallet}
            title="Net revenue"
            accent="emerald"
            feature
            value={financeSummary.data ? displayCurrencyAmount(summaryRow?.netRevenue ?? "0.00", summaryRow?.currency ?? currencyCode) : undefined}
            hint="After refunds"
            isLoading={financeSummary.isLoading || !datedReady}
            isError={financeSummary.isError}
          />
          <Tile
            icon={HandCoins}
            title="Collected amount"
            accent="cyan"
            value={financeSummary.data ? displayCurrencyAmount(summaryRow?.grossRevenue ?? "0.00", summaryRow?.currency ?? currencyCode) : undefined}
            hint={summaryRow && summaryRow.paymentCount > 0
              ? `Across ${summaryRow.paymentCount} payments${Number(summaryRow.productRevenue ?? 0) > 0 ? " + product sales" : ""}`
              : Number(summaryRow?.productRevenue ?? 0) > 0 ? "Product sales only" : "No collections yet"}
            isLoading={financeSummary.isLoading || !datedReady}
            isError={financeSummary.isError}
          />
          <Tile
            icon={Scale}
            title="Outstanding amount"
            accent="amber"
            value={financeSummary.data ? displayCurrencyAmount(summaryOutstanding?.outstandingBalance ?? "0.00", summaryOutstanding?.currency ?? currencyCode) : undefined}
            hint={summaryOutstanding && summaryOutstanding.membershipsWithBalance > 0
              ? `On ${summaryOutstanding.membershipsWithBalance} memberships · live balance`
              : "Nothing owed"}
            isLoading={financeSummary.isLoading || !datedReady}
            isError={financeSummary.isError}
          />
          <Tile
            icon={ShoppingBag}
            title="Inventory sale"
            accent="violet"
            value={financeSummary.data ? displayCurrencyAmount(summaryRow?.productRevenue ?? "0.00", summaryRow?.currency ?? currencyCode) : undefined}
            hint="Product sales in period"
            isLoading={financeSummary.isLoading || !datedReady}
            isError={financeSummary.isError}
          />
        </div>
      </DashSection>

      {/* ── Revenue at risk (same gym-health request as the hero) ─── */}
      <GymHealthRevenueRisk
        health={gymHealth.data}
        isLoading={gymHealth.isLoading || !datedReady}
        isError={gymHealth.isError}
      />

      {/* ── Charts ──────────────────────────────────────────────── */}
      <section aria-label="Revenue trend and member status" className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className={cn(styles.panel, "min-w-0")}>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className={styles.sectionTitle}>Revenue</h2>
              <p className={styles.sectionSub}>Last 6 months · net of refunds</p>
            </div>
            {hasPermission("payments.read") && (
              <Button asChild variant="ghost" size="sm" className="min-h-11 rounded-full">
                <Link href="/billing">Details</Link>
              </Button>
            )}
          </div>
          {revenueTrend.isLoading || !reportsReady ? (
            <Skeleton className="h-44 w-full rounded-2xl" aria-label="Loading revenue chart" />
          ) : revenueTrend.isError ? (
            <ErrorState message="Could not load revenue trend." onRetry={() => void revenueTrend.refetch()} />
          ) : !hasRevenue ? (
            <EmptyState title="No revenue yet" description="Revenue will appear here once payments are recorded." />
          ) : (
            <>
              <p className="mb-3 text-xs text-muted-foreground">
                Peak{" "}
                <span className="text-base font-bold tabular-nums tracking-tight text-foreground">
                  {currencySymbol(chartCurrency)}{maxRevenue.toLocaleString("en-IN")}
                </span>
              </p>
              <div
                role="img"
                aria-label={`Revenue trend: ${monthlyData.map((d) => `${d.day} ${d.value}`).join(", ")}`}
                className={styles.bars}
              >
                {monthlyData.map((d, i) => {
                  const isCurrentMonth = i === monthlyData.length - 1;
                  const pct = d.value > 0 ? Math.max(6, Math.round((d.value / maxRevenue) * 100)) : 0;
                  return (
                    <div key={`${d.day}-${i}`} className={styles.barCol} title={`${d.day}: ${currencySymbol(chartCurrency)}${d.value.toLocaleString("en-IN")}`}>
                      <div className={styles.barTrack} aria-hidden="true">
                        <div
                          className={cn(styles.bar, isCurrentMonth && styles.barCurrent)}
                          style={{ height: `${pct}%` }}
                        />
                      </div>
                      <span
                        className={cn(
                          "truncate text-xs",
                          isCurrentMonth ? "font-semibold text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {d.day}
                      </span>
                    </div>
                  );
                })}
              </div>
              <table className="sr-only">
                <caption>Revenue by month</caption>
                <thead><tr><th scope="col">Month</th><th scope="col">Value</th></tr></thead>
                <tbody>
                  {monthlyData.map((d, i) => (
                    <tr key={`${d.day}-${i}`}><th scope="row">{d.day}</th><td>{d.value}</td></tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        <div className={cn(styles.panel, "min-w-0 overflow-hidden")}>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className={styles.sectionTitle}>Members</h2>
              <p className={styles.sectionSub}>By status</p>
            </div>
            {hasPermission(["members.read", "members.read_assigned"]) && (
              <Button asChild variant="ghost" size="sm" className="min-h-11 rounded-full">
                <Link href="/members">All members</Link>
              </Button>
            )}
          </div>
          {statusBreakdown.isLoading || !reportsReady ? (
            <DonutChart segments={[]} isLoading size={140} />
          ) : statusBreakdown.isError ? (
            <ErrorState message="Could not load member breakdown." onRetry={() => void statusBreakdown.refetch()} />
          ) : (
            <>
              <DonutChart
                segments={memberDonutSegments}
                centerValue={totalMembers.toLocaleString("en-IN")}
                centerLabel="Total"
                size={148}
                strokeWidth={20}
                showLegend
              />
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
        </div>
      </section>

      {/* ── Priorities + launcher ──────────────────────────────── */}
      <section aria-label="Needs attention and shortcuts" className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        {reportsReady ? (
          <PriorityActions
            branchFilter={branchFilter}
            outstandingBalance={summaryOutstanding?.outstandingBalance}
            outstandingCount={summaryOutstanding?.membershipsWithBalance ?? 0}
            currencyCode={summaryOutstanding?.currency ?? currencyCode}
            atRiskCount={data?.atRiskMembers.count ?? 0}
            pendingAiActions={data?.pendingAiActions ?? 0}
          />
        ) : (
          <Skeleton className="h-64 w-full rounded-3xl" aria-label="Loading priorities" />
        )}

        <div className="flex flex-col gap-6">
          <Launcher id="dash-quick" title="Quick actions" emptyHint="Your account doesn't include any of these actions.">
            {visibleActions.map(([title, desc, href, Icon, , color]) => (
              <AppIconLink key={href} href={href} icon={Icon} label={title} hint={desc} accent={color} />
            ))}
          </Launcher>
          {jumpItems.length > 0 && (
            <Launcher id="dash-jump" title="Jump to">
              {jumpItems.map((item) => (
                <AppIconLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.title}
                  hint={item.desc}
                  accent={item.accent}
                  badge={item.badge}
                  badgeTone={item.alert ? "alert" : "neutral"}
                />
              ))}
            </Launcher>
          )}
        </div>
      </section>

      {/* ── Why this score ──────────────────────────────────────── */}
      <GymHealthPanels
        health={gymHealth.data}
        isLoading={gymHealth.isLoading || !datedReady}
        isError={gymHealth.isError}
        onRetry={() => void gymHealth.refetch()}
      />
    </div>
  );
}

/* ─── Launcher: an app-icon grid in a panel ─────────────────────── */
function Launcher({
  id,
  title,
  emptyHint,
  children,
}: {
  id: string;
  title: string;
  emptyHint?: string;
  children: React.ReactNode;
}) {
  const hasItems = React.Children.count(children) > 0;
  return (
    <DashSection id={id} title={title}>
      <div className={cn(styles.panel, "p-3 sm:p-3")}>
        {hasItems ? (
          <div className="grid grid-cols-3 gap-1 sm:grid-cols-4 xl:grid-cols-4">{children}</div>
        ) : (
          <EmptyState title="Nothing to do here yet" description={emptyHint} />
        )}
      </div>
    </DashSection>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Staff home (no reports.view permission)
   ──────────────────────────────────────────────────────────────── */
function StaffHome({
  firstName,
  gymName,
  timeZone,
  actions,
}: {
  firstName?: string;
  gymName?: string;
  timeZone?: string | null;
  actions: ReadonlyArray<(typeof QUICK_ACTIONS)[number]>;
}) {
  const today = useGymToday(timeZone);
  return (
    <div className="flex w-full flex-col gap-8 pb-10">
      <section aria-labelledby="dashboard-title" className={styles.hero}>
        <div className={styles.aurora} aria-hidden="true" />
        <p className={styles.eyebrow}>{shortDay(today)}</p>
        <h1 id="dashboard-title" className={styles.gymName}>
          {gymName ?? (firstName ? `Welcome, ${firstName}` : "Welcome")}
        </h1>
        <p className={styles.greeting}>Here&apos;s what you can do from here today.</p>
      </section>

      <Launcher
        id="dash-quick"
        title="Quick actions"
        emptyHint="Your account doesn't include any of these actions. Ask the gym owner for access."
      >
        {actions.map(([title, desc, href, Icon, , color]) => (
          <AppIconLink key={href} href={href} icon={Icon} label={title} hint={desc} accent={color} />
        ))}
      </Launcher>
    </div>
  );
}

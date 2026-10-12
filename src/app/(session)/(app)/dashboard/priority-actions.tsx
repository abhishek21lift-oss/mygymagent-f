"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  HeartHandshake,
  Megaphone,
  RefreshCw,
  Sparkles,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import { useAiEffectiveness } from "@/lib/hooks/use-gym-health";
import {
  usePtOpportunities,
  useRenewalPipeline,
  useSalesPriority,
  useWinBack,
} from "@/lib/hooks/use-analytics";
import type { Accent } from "@/lib/section-accent";
import { cn, displayCurrencyAmount } from "@/lib/utils";
import { DashSection, accentStyle } from "./dashboard-ui";
import styles from "./dashboard.module.css";
import { outstandingHref } from "./outstanding/outstanding-list";

interface ActionRow {
  key: string;
  icon: LucideIcon;
  /** Action-oriented title: what needs attention + who is affected. */
  title: string;
  /** Plain-language why it matters + the evidence (amount/count). */
  detail?: string;
  href: string;
  action: string;
  color: Accent;
  severity: "Critical" | "High" | "Medium" | "Low";
}

const SEVERITY_BADGE: Record<ActionRow["severity"], "destructive" | "warning" | "secondary" | "success"> = {
  Critical: "destructive",
  High: "warning",
  Medium: "secondary",
  Low: "success",
};

function endsIn(days: number): string {
  if (days <= 0) return "ends today";
  if (days === 1) return "ends tomorrow";
  return `ends in ${days}d`;
}

/**
 * Today's Priority Actions: one operating list for revenue + retention.
 * Every row is a deterministic signal with evidence and a destination —
 * renewals due, hot leads, PT packages, unpaid money, at-risk members,
 * pending AI approvals — plus the outcome counts that close the loop.
 *
 * Each signal is fetched only for someone who could act on it, and a
 * signal that failed to load is said out loud: "all caught up" is only
 * ever shown when every source answered.
 */
export function PriorityActions({
  branchFilter,
  outstandingBalance,
  outstandingCount,
  currencyCode,
  atRiskCount,
  pendingAiActions,
}: {
  branchFilter?: string;
  outstandingBalance: string | undefined;
  outstandingCount: number;
  currencyCode: string;
  atRiskCount: number;
  pendingAiActions: number;
}) {
  const { hasPermission } = useAuth();
  const canReadMemberships = hasPermission(["memberships.read", "memberships.read_assigned"]);
  const canReadLeads = hasPermission("leads.read");
  const canReadWorkouts = hasPermission(["workouts.read", "workouts.read_assigned"]);
  const canReadMembers = hasPermission(["members.read", "members.read_assigned"]);
  const canReadPayments = hasPermission("payments.read");
  const canApproveAi = hasPermission("ai.approve");

  const renewals = useRenewalPipeline(branchFilter, { enabled: canReadMemberships });
  const sales = useSalesPriority(branchFilter, { enabled: canReadLeads });
  const pt = usePtOpportunities(branchFilter, { enabled: canReadWorkouts });
  const winback = useWinBack(branchFilter, { enabled: canReadMembers });
  // One counts request (shared with /coo's cache) instead of two list pages.
  const outcomes = useAiEffectiveness({ enabled: canApproveAi });

  const sources = [renewals, sales, pt, winback];
  const enabledCount = [canReadMemberships, canReadLeads, canReadWorkouts, canReadMembers].filter(Boolean).length;
  const loading = sources.some((query) => query.isLoading);
  const failed = sources.filter((query) => query.isError);

  const rows: ActionRow[] = [];
  const overdue = renewals.data?.overdue ?? [];
  if (overdue.length > 0) {
    rows.push({
      key: "renewals-overdue",
      icon: AlertTriangle,
      title: `Renew ${overdue.length} overdue membership${overdue.length === 1 ? "" : "s"}`,
      detail: "Expired with no active term since. Every lapsed day risks churn.",
      href: "/memberships",
      action: "Review renewals",
      color: "rose",
      severity: "Critical",
    });
  }
  for (const item of (renewals.data?.upcoming ?? []).slice(0, 3)) {
    rows.push({
      key: `renewal-${item.membershipId}`,
      icon: RefreshCw,
      title: `Remind ${item.firstName} ${item.lastName} — ${item.planName} ${endsIn(item.daysUntilExpiry)}`,
      detail: `${displayCurrencyAmount(item.price, item.currency)} at stake if they lapse.`,
      href: `/members/${item.memberId}`,
      action: "Open member",
      color: "amber",
      severity: "High",
    });
  }
  for (const lead of (sales.data?.items ?? []).filter((item) => item.severity === "hot").slice(0, 3)) {
    rows.push({
      key: `lead-${lead.leadId}`,
      icon: Megaphone,
      title: `Follow up with ${lead.firstName} ${lead.lastName} — ${lead.reasons[0] ?? "hot prospect"}`,
      detail: lead.source ? `Came in via ${lead.source}. Hot leads cool fast.` : "Hot lead — follow up before they cool off.",
      href: `/crm/leads/${lead.leadId}`,
      action: "Follow up",
      color: "rose",
      severity: "High",
    });
  }
  for (const o of (pt.data?.expiring ?? []).slice(0, 2)) {
    rows.push({
      key: `pt-${o.packageId}`,
      icon: Dumbbell,
      title: `Review ${o.firstName} ${o.lastName}'s PT package — ${o.sessionsRemaining} sessions left, ${o.daysLeft}d to go`,
      detail: `${o.packageName}. Unused sessions rarely renew.`,
      href: `/members/${o.memberId}`,
      action: "PT review",
      color: "violet",
      severity: "Medium",
    });
  }
  for (const o of (pt.data?.neverStarted ?? []).slice(0, 1)) {
    rows.push({
      key: `pt-${o.packageId}`,
      icon: Dumbbell,
      title: `Start ${o.firstName} ${o.lastName} on their untouched PT package`,
      detail: `${o.packageName}. A package that never starts never renews.`,
      href: `/members/${o.memberId}`,
      action: "PT review",
      color: "violet",
      severity: "Medium",
    });
  }
  if (outstandingCount > 0 && canReadPayments) {
    rows.push({
      key: "outstanding",
      icon: Wallet,
      title: `Collect ${displayCurrencyAmount(outstandingBalance ?? "0.00", currencyCode)} outstanding`,
      detail: `Owed across ${outstandingCount} membership${outstandingCount === 1 ? "" : "s"}.`,
      // Who owes, not the billing screen: that lists invoices, not these.
      href: outstandingHref(branchFilter),
      action: "Collect",
      color: "amber",
      severity: "High",
    });
  }
  const winbackHigh = winback.data?.items.filter((i) => i.tier === "HIGH") ?? [];
  if (winbackHigh.length > 0) {
    const top = winbackHigh[0];
    rows.push({
      key: "winback",
      icon: HeartHandshake,
      title: `Win back ${winbackHigh.length} high-value former member${winbackHigh.length === 1 ? "" : "s"}`,
      detail: `${top.firstName} ${top.lastName} leads — ${top.reasons[0] ?? "proven past value"}.`,
      href: "/intelligence",
      action: "Win back",
      color: "emerald",
      severity: "Medium",
    });
  }
  if (atRiskCount > 0 && canReadMembers) {
    rows.push({
      key: "at-risk",
      icon: AlertTriangle,
      title: `Check on ${atRiskCount} paying member${atRiskCount === 1 ? "" : "s"} not seen in 14 days`,
      detail: "A personal message now is cheaper than a win-back later.",
      href: "/intelligence",
      action: "Review risk",
      color: "orange",
      severity: "High",
    });
  }
  if (pendingAiActions > 0 && canApproveAi) {
    rows.push({
      key: "ai-pending",
      icon: Sparkles,
      title: `Approve ${pendingAiActions} pending AI proposal${pendingAiActions === 1 ? "" : "s"}`,
      detail: "Review proposed actions before they run.",
      href: "/ai-actions",
      action: "Review",
      color: "violet",
      severity: "Medium",
    });
  }

  const executed = outcomes.data?.executed ?? 0;
  const rejected = outcomes.data?.rejected ?? 0;
  const showOutcomes = canApproveAi && (executed > 0 || rejected > 0);

  return (
    <DashSection
      id="dash-priorities"
      title="Today's priority actions"
      subtitle="Revenue and retention, in the order they matter."
      action={
        rows.length > 0 && !loading ? (
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold tabular-nums text-muted-foreground">
            {rows.length}
          </span>
        ) : undefined
      }
    >
      <div className={cn(styles.panel, "p-2 sm:p-2")}>
        {failed.length > 0 && !loading && (
          <div
            role="alert"
            className="m-1 mb-2 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-warning/10 px-4 py-3 text-sm"
          >
            <span className="font-medium text-foreground">
              {failed.length === enabledCount
                ? "Could not load today's priorities."
                : "Some priorities could not be loaded — this list may be incomplete."}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11 rounded-full"
              onClick={() => failed.forEach((query) => void query.refetch())}
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              Retry
            </Button>
          </div>
        )}

        {loading ? (
          <div className="space-y-2 p-2" role="status" aria-label="Loading priorities">
            {[1, 2, 3].map((k) => (
              <Skeleton key={k} className="h-14 w-full rounded-2xl" />
            ))}
          </div>
        ) : rows.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {rows.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.key} className={accentStyle(item.color)}>
                  <div className={cn(styles.row, "flex-wrap gap-x-3 gap-y-2 sm:flex-nowrap")}>
                    <span className={styles.iconDisc} aria-hidden="true">
                      <Icon className="size-[1.1rem]" strokeWidth={2.2} />
                    </span>
                    <span className="min-w-0 flex-1 basis-48">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <Link
                          href={item.href}
                          className="text-sm font-semibold tracking-tight text-foreground [overflow-wrap:anywhere] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                          {item.title}
                        </Link>
                      </span>
                      {item.detail && (
                        <span className="mt-0.5 block [overflow-wrap:anywhere] text-xs text-muted-foreground">
                          {item.detail}
                        </span>
                      )}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <Badge variant={SEVERITY_BADGE[item.severity]} className="rounded-full">
                        {item.severity}
                      </Badge>
                      <Button asChild size="sm" variant="outline" className="min-h-11 rounded-full">
                        <Link href={item.href}>
                          {item.action}
                          <ChevronRight className="size-4" aria-hidden="true" />
                        </Link>
                      </Button>
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : failed.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-5 py-10 text-center">
            <span className={cn(styles.iconDisc, styles.emerald, "size-12 rounded-2xl")} aria-hidden="true">
              <CheckCircle2 className="size-6" />
            </span>
            <p className="mt-1 text-sm font-semibold">You&apos;re all caught up</p>
            <p className="text-xs text-muted-foreground">Nothing needs attention right now.</p>
          </div>
        ) : null}

        {showOutcomes && !loading && (
          <p className="mx-3 mb-2 mt-1 border-t border-border/60 pt-3 text-xs text-muted-foreground">
            Outcomes so far: {executed} AI action{executed === 1 ? "" : "s"} executed
            {rejected > 0 && ` · ${rejected} rejected`}.{" "}
            <Link href="/ai-actions" className="font-semibold text-[var(--a-violet-ink)] underline-offset-2 hover:underline">
              Action history
            </Link>
          </p>
        )}
      </div>
    </DashSection>
  );
}

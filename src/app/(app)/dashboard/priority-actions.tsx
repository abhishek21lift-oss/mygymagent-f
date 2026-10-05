"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  HeartHandshake,
  Megaphone,
  Sparkles,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import { useAiActions } from "@/lib/hooks/use-ai-actions";
import {
  usePtOpportunities,
  useRenewalPipeline,
  useSalesPriority,
  useWinBack,
} from "@/lib/hooks/use-analytics";
import type { Accent } from "@/lib/section-accent";
import { displayCurrencyAmount } from "@/lib/utils";

interface ActionRow {
  key: string;
  icon: LucideIcon;
  title: string;
  detail?: string;
  href: string;
  action: string;
  color: Accent;
}

/**
 * Today's Priority Actions: one operating list for revenue + retention.
 * Every row is a deterministic signal with evidence and a destination —
 * renewals due, hot leads, PT packages, unpaid money, at-risk members,
 * pending AI approvals — plus the outcome counts that close the loop.
 * Replaces the older needs-attention card with the same links and gates.
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
  const enabled = true;
  const renewals = useRenewalPipeline(branchFilter, { enabled });
  const sales = useSalesPriority(branchFilter, { enabled });
  const pt = usePtOpportunities(branchFilter, { enabled });
  const winback = useWinBack(branchFilter, { enabled });
  const canApproveAi = hasPermission("ai.approve");
  const executed = useAiActions("EXECUTED", { enabled: canApproveAi });
  const rejected = useAiActions("REJECTED", { enabled: canApproveAi });

  const canReadMemberships = hasPermission([
    "memberships.read",
    "memberships.read_assigned",
  ]);
  const canReadLeads = hasPermission("leads.read");
  const canReadWorkouts = hasPermission([
    "workouts.read",
    "workouts.read_assigned",
  ]);
  const canReadMembers = hasPermission([
    "members.read",
    "members.read_assigned",
  ]);
  const canReadPayments = hasPermission("payments.read");

  const rows: ActionRow[] = [];
  const overdue = renewals.data?.overdue ?? [];
  if (overdue.length > 0 && canReadMemberships) {
    rows.push({
      key: "renewals-overdue",
      icon: AlertTriangle,
      title: `${overdue.length} renewal${overdue.length === 1 ? "" : "s"} overdue`,
      detail: "Expired with no active term since.",
      href: "/memberships",
      action: "Renewals",
      color: "rose",
    });
  }
  if (canReadMemberships) {
    for (const item of (renewals.data?.upcoming ?? []).slice(0, 3)) {
      rows.push({
        key: `renewal-${item.membershipId}`,
        icon: AlertTriangle,
        title: `${item.firstName} ${item.lastName} — ${item.planName} ends in ${item.daysUntilExpiry}d`,
        detail: `${displayCurrencyAmount(item.price, item.currency)} at stake.`,
        href: `/members/${item.memberId}`,
        action: "Renew",
        color: "amber",
      });
    }
  }
  if (canReadLeads) {
    for (const lead of (sales.data?.items ?? [])
      .filter((item) => item.severity === "hot")
      .slice(0, 3)) {
      rows.push({
        key: `lead-${lead.leadId}`,
        icon: Megaphone,
        title: `${lead.firstName} ${lead.lastName} — ${lead.reasons[0] ?? "needs a follow-up"}`,
        detail: lead.source ? `via ${lead.source}` : undefined,
        href: `/crm/leads/${lead.leadId}`,
        action: "Follow up",
        color: "rose",
      });
    }
  }
  if (canReadWorkouts) {
    const opportunities = [
      ...(pt.data?.expiring ?? []).slice(0, 2).map((o) => ({
        key: `pt-${o.packageId}`,
        icon: Dumbbell,
        title: `${o.firstName} ${o.lastName} — ${o.sessionsRemaining} sessions, ${o.daysLeft}d left`,
        detail: o.packageName,
        href: `/members/${o.memberId}`,
        action: "PT review",
        color: "violet" as Accent,
      })),
      ...(pt.data?.neverStarted ?? []).slice(0, 1).map((o) => ({
        key: `pt-${o.packageId}`,
        icon: Dumbbell,
        title: `${o.firstName} ${o.lastName} — package untouched`,
        detail: o.packageName,
        href: `/members/${o.memberId}`,
        action: "PT review",
        color: "violet" as Accent,
      })),
    ];
    rows.push(...opportunities);
  }
  if (outstandingCount > 0 && canReadPayments) {
    rows.push({
      key: "outstanding",
      icon: Wallet,
      title: `${displayCurrencyAmount(outstandingBalance ?? "0.00", currencyCode)} outstanding`,
      detail: `On ${outstandingCount} membership${outstandingCount === 1 ? "" : "s"}.`,
      href: "/billing",
      action: "Collect",
      color: "amber",
    });
  }
  const winbackHigh = winback.data?.items.filter((i) => i.tier === "HIGH") ?? [];
  if (winbackHigh.length > 0 && canReadMembers) {
    const top = winbackHigh[0];
    rows.push({
      key: "winback",
      icon: HeartHandshake,
      title: `${winbackHigh.length} high-value win-back${winbackHigh.length === 1 ? "" : "s"}`,
      detail: `${top.firstName} ${top.lastName} leads — ${top.reasons[0] ?? "proven past value"}.`,
      href: "/intelligence",
      action: "Win back",
      color: "emerald",
    });
  }
  if (atRiskCount > 0 && canReadMembers) {
    rows.push({
      key: "at-risk",
      icon: AlertTriangle,
      title: `${atRiskCount} paying member${atRiskCount === 1 ? " hasn't" : "s haven't"} visited in 14 days`,
      detail: "A personal message now is cheaper than a win-back later.",
      href: "/intelligence",
      action: "Review risk",
      color: "orange",
    });
  }
  if (pendingAiActions > 0 && canApproveAi) {
    rows.push({
      key: "ai-pending",
      icon: Sparkles,
      title: `${pendingAiActions} AI proposal${pendingAiActions === 1 ? "" : "s"} awaiting approval`,
      detail: "Review proposed actions before they run.",
      href: "/ai-actions",
      action: "Review",
      color: "violet",
    });
  }

  const loading =
    renewals.isLoading || sales.isLoading || pt.isLoading;
  const failed =
    !loading &&
    renewals.isError &&
    sales.isError &&
    pt.isError;

  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em]">
          Today&apos;s priority actions
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-3">
        {loading ? (
          <div className="space-y-2" role="status" aria-label="Loading priorities">
            {[1, 2, 3].map((k) => (
              <Skeleton key={k} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : failed ? (
          <p className="rounded-2xl border border-dashed px-5 py-10 text-center text-sm text-muted-foreground">
            Could not load today&apos;s priorities.
          </p>
        ) : rows.length ? (
          <>
            <ul className="flex flex-col gap-1">
              {rows.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.key}>
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
                        <span className="block [overflow-wrap:anywhere] text-sm font-medium">
                          {item.title}
                        </span>
                        {item.detail && (
                          <span className="mt-0.5 block [overflow-wrap:anywhere] text-xs text-muted-foreground">
                            {item.detail}
                          </span>
                        )}
                      </span>
                      <span className="hidden items-center gap-1 text-xs font-semibold text-primary sm:flex">
                        {item.action}
                        <ChevronRight
                          className="size-3.5 transition-transform group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            {canApproveAi &&
              (executed.data || rejected.data) &&
              (executed.data!.total > 0 || rejected.data!.total > 0) && (
                <p className="mt-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                  Outcomes so far: {executed.data?.total ?? 0} AI action
                  {(executed.data?.total ?? 0) === 1 ? "" : "s"} executed
                  {(rejected.data?.total ?? 0) > 0 &&
                    ` · ${rejected.data?.total} rejected`}
                  .{" "}
                  <Link
                    href="/ai-actions"
                    className="font-semibold text-primary hover:underline"
                  >
                    Action history
                  </Link>
                </p>
              )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-5 py-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-success/10 text-success">
              <CheckCircle2 className="size-6" aria-hidden="true" />
            </span>
            <p className="text-sm font-semibold">You&apos;re all caught up</p>
            <p className="text-xs text-muted-foreground">
              Nothing needs attention right now.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

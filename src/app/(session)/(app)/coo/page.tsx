"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import { BentoGrid, SectionHeader } from "@/components/shared/bento";
import { StatCard } from "@/components/shared/stat-card";
import { ProgressRing } from "@/components/shared/progress-ring";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { useAuth } from "@/lib/auth/auth-context";
import { useBranches } from "@/lib/hooks/use-branches";
import { useDailyBriefing } from "@/lib/hooks/use-daily-briefing";
import { useAiActions, type AiAction } from "@/lib/hooks/use-ai-actions";
import { useAiEffectiveness, useCooForecast, useCooTrends, useCooBriefing } from "@/lib/hooks/use-gym-health";
import { useRenewalPipeline } from "@/lib/hooks/use-analytics";
import { displayCurrencyAmount } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AiActionReviewDialog } from "../ai-actions/review-dialog";
import { EffectivenessStrip, ForecastScenario, TrendsStrip } from "./coo-insights";
import { PriorityActions } from "../dashboard/priority-actions";
import { cn } from "@/lib/utils";

const ALL_BRANCHES = "all";

const STATUS_META: Record<string, { label: string; fill: string }> = {
  healthy: { label: "Healthy", fill: "var(--success)" },
  stable: { label: "Stable", fill: "var(--info)" },
  "needs-attention": { label: "Needs attention", fill: "var(--warning)" },
  critical: { label: "Critical", fill: "var(--destructive)" },
  unknown: { label: "Unknown", fill: "var(--muted-foreground)" },
};

function Delta({ value, invert }: { value: number | null; invert?: boolean }) {
  if (value === null) {
    return <span className="text-xs font-semibold text-muted-foreground">— vs yesterday</span>;
  }
  const good = invert ? value < 0 : value > 0;
  const arrow = value > 0 ? "↑" : value < 0 ? "↓" : "→";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1",
        good
          ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300"
          : "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300",
      )}
    >
      <span>{arrow} {Math.abs(value)}%</span>
      <span className="font-medium text-muted-foreground">
        vs yesterday · {good ? "on track" : "needs look"}
      </span>
    </span>
  );
}

function ApprovalsQueue() {
  const { hasPermission } = useAuth();
  const canApprove = hasPermission("ai.approve");
  const pending = useAiActions("PENDING_APPROVAL", { enabled: canApprove });
  if (!canApprove) return null;
  const items = (pending.data?.items ?? []).slice(0, 5);
  return (
    <section aria-label="Pending approvals">
      <SectionHeader
        title="Pending approvals"
        action={
          <Button asChild variant="outline" size="sm" className="min-h-10 rounded-xl text-xs font-semibold">
            <Link href="/ai-actions">Action Center</Link>
          </Button>
        }
      />
      {pending.isLoading ? (
        <Skeleton className="h-24 w-full rounded-2xl" aria-label="Loading approvals" />
      ) : pending.isError ? (
        <p className="rounded-2xl border border-dashed px-5 py-8 text-center text-sm text-muted-foreground">
          Could not load approvals.
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-dashed px-5 py-8 text-center text-sm text-muted-foreground">
          Nothing awaiting approval.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((action: AiAction) => (
            <li
              key={action.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-xs"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold tracking-tight text-foreground">
                  {action.type.replaceAll("_", " ").toLowerCase()}
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {action.reasoning}
                </p>
              </div>
              <AiActionReviewDialog action={action} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function CooPage() {
  const { hasPermission } = useAuth();
  const canGenerate = hasPermission("ai.generate");
  const canViewReports = hasPermission("reports.view");
  const allowed = canGenerate && canViewReports;

  const [selectedBranch, setSelectedBranch] = React.useState<string>(ALL_BRANCHES);
  const branches = useBranches({ pageSize: 100 }, { enabled: allowed });
  const branchItems = branches.data?.items ?? [];
  const branchFilter = selectedBranch !== ALL_BRANCHES ? selectedBranch : undefined;

  const briefing = useCooBriefing({ branchId: branchFilter }, { enabled: allowed });
  const daily = useDailyBriefing({ enabled: allowed, branchId: branchFilter });
  const trends = useCooTrends({ branchId: branchFilter }, { enabled: allowed });
  const forecast = useCooForecast({ branchId: branchFilter }, { enabled: allowed });
  const renewals = useRenewalPipeline(branchFilter, { enabled: allowed });
  const effectiveness = useAiEffectiveness({
    enabled: hasPermission("ai.approve"),
  });
  const health = briefing.data?.health;
  const meta = STATUS_META[health?.status ?? "unknown"];

  if (!allowed) {
    return (
      <div className="flex w-full flex-col gap-6 pb-8">
        <EmptyState
          icon={Sparkles}
          title="AI COO needs access"
          description="Ask the gym owner for AI and reporting access to see the morning briefing."
        />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6 pb-8">
      {/* Light Apple-Aurora Glass Hero */}
      <section
        aria-labelledby="coo-title"
        className="hero-banner mb-4"
      >

        <div className="relative flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <div className="min-w-0 flex-1 [--foreground:#fff] [--muted-foreground:rgb(255_255_255/0.82)]">

            <h1
              id="coo-title"
              className="mt-2 text-xl font-black tracking-tight text-foreground sm:text-2xl"
            >
              Morning briefing
            </h1>

            {briefing.data && (
              <div className="mt-2 space-y-2">
                <p className="text-sm font-medium leading-relaxed text-muted-foreground">
                  <span className="font-bold text-foreground">
                    {displayCurrencyAmount(briefing.data.today.collected, briefing.data.today.currency)}
                  </span>{" "}
                  collected today ·{" "}
                  <span className="font-bold text-foreground">
                    {briefing.data.today.checkIns}
                  </span>{" "}
                  check-ins ·{" "}
                  {briefing.data.today.mixed ? "mixed currencies · " : ""}
                  <span className="font-bold text-foreground">
                    {briefing.data.outcomes.pending}
                  </span>{" "}
                  approvals awaiting signature
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1 sm:justify-start">
                  <Delta value={briefing.data.deltas.collectedPct} />
                  <Delta value={briefing.data.deltas.checkinsPct} />
                </div>
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              <Button asChild size="sm" className="rounded-xl shadow-xs">
                <Link href="/ai">
                  <Sparkles className="mr-1.5 size-4" aria-hidden="true" />
                  Ask AI Co-pilot
                </Link>
              </Button>
            </div>
          </div>

          {/* Health Score Progress Ring */}
          <div className="flex shrink-0 flex-col items-center gap-2">
            {briefing.isLoading ? (
              <div
                className="size-20 animate-pulse rounded-full bg-muted/60"
                aria-label="Loading briefing"
              />
            ) : briefing.isError || !briefing.data ? (
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  Could not load health score
                </p>
                <Button size="sm" variant="outline" onClick={() => void briefing.refetch()}>
                  Retry
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-3xl border border-white/60 bg-white/90 p-3 shadow-2xs dark:border-white/10 dark:bg-card/80">
                <ProgressRing
                  value={health?.score ?? 0}
                  size={72}
                  strokeWidth={10}
                  tone="auto"
                  label={
                    health?.score === null || health?.score === undefined
                      ? "Gym health unavailable"
                      : `Gym health ${health.score} out of 100, ${meta.label}`
                  }
                />
                <span
                  className="rounded-full px-3 py-1 font-mono text-xs font-bold text-white shadow-2xs"
                  style={{ background: meta.fill }}
                >
                  {health?.score ?? "—"} · {meta.label}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {branchItems.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <Select value={branchFilter ?? ALL_BRANCHES} onValueChange={setSelectedBranch}>
            <SelectTrigger aria-label="Branch" className="h-9 w-auto min-w-44 rounded-xl bg-card text-xs font-semibold shadow-2xs">
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
        </div>
      )}

      <TrendsStrip
        trends={trends.data?.trends}
        isLoading={trends.isLoading}
        isError={trends.isError}
        onRetry={() => void trends.refetch()}
      />

      <PriorityActions
        branchFilter={branchFilter}
        outstandingBalance={daily.data?.revenue.outstanding[0]?.outstandingBalance}
        outstandingCount={daily.data?.revenue.outstanding[0]?.membershipsWithBalance ?? 0}
        currencyCode={daily.data?.revenue.outstanding[0]?.currency ?? "INR"}
        atRiskCount={daily.data?.atRiskMembers.count ?? 0}
        pendingAiActions={briefing.data?.outcomes.pending ?? daily.data?.pendingAiActions ?? 0}
      />

      <ApprovalsQueue />

      <ForecastScenario
        forecast={forecast.data}
        isLoading={forecast.isLoading}
        isError={forecast.isError}
        onRetry={() => void forecast.refetch()}
        renewals={renewals.data}
        renewalsLoading={renewals.isLoading}
      />

      <EffectivenessStrip
        effectiveness={effectiveness.data}
        isLoading={effectiveness.isLoading}
        isError={effectiveness.isError}
      />

      <section aria-label="Outcomes and AI spend">
        <SectionHeader title="Outcomes · AI spend" />
        <BentoGrid columns={4} label="Outcomes and spend">
          <StatCard
            title="Executed"
            value={briefing.data?.outcomes.executed}
            hint="AI actions completed"
            isLoading={briefing.isLoading}
            isError={briefing.isError}
            tone="primary"
            accent="emerald"
          />
          <StatCard
            title="Rejected"
            value={briefing.data?.outcomes.rejected}
            hint="Stopped by reviewers"
            isLoading={briefing.isLoading}
            isError={briefing.isError}
            tone="primary"
            accent="amber"
          />
          <StatCard
            title="AI requests 24h"
            value={briefing.data?.usage.requests24h}
            hint={`${briefing.data?.usage.errors24h ?? 0} errors`}
            isLoading={briefing.isLoading}
            isError={briefing.isError}
            tone="primary"
            accent="violet"
          />
          <StatCard
            title="AI spend 24h"
            value={briefing.data ? `$${briefing.data.usage.costUsd24h}` : undefined}
            hint={`${(briefing.data?.usage.tokens24h ?? 0).toLocaleString()} tokens`}
            isLoading={briefing.isLoading}
            isError={briefing.isError}
            tone="primary"
            accent="cyan"
          />
        </BentoGrid>
      </section>
    </div>
  );
}

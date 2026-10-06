"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import { BentoGrid, SectionHeader } from "@/components/shared/bento";
import { StatCard } from "@/components/shared/stat-card";
import { ProgressRing } from "@/components/shared/progress-ring";
import { NOIR_BANNER_STYLE } from "@/components/shared/page-hero";
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
    return <span className="text-xs font-semibold text-white/60">— vs yesterday</span>;
  }
  const good = invert ? value < 0 : value > 0;
  const arrow = value > 0 ? "↑" : value < 0 ? "↓" : "→";
  return (
    <span className="text-xs font-bold text-white">
      {arrow} {Math.abs(value)}%
      <span className="ml-1 font-medium text-white/70">
        vs yesterday · {good ? "on track" : "needs a look"}
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
          <Button asChild variant="outline" size="sm" className="min-h-11 rounded-xl">
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
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="min-w-0">
                <p className="text-sm font-extrabold tracking-tight">
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
      <section
        aria-labelledby="coo-title"
        style={NOIR_BANNER_STYLE}
        className="hero-banner hero-centered -mx-4 mb-5 sm:-mx-5 lg:-mx-8"
      >
        <div className="hero-banner-body">
          <p className="hero-banner-eyebrow">MyGymAgent · AI COO</p>
          <div className="flex flex-col items-center gap-2">
            {briefing.isLoading ? (
              <div
                className="rounded-full bg-white/20 animate-pulse"
                style={{ width: 112, height: 112 }}
                aria-label="Loading briefing"
              />
            ) : briefing.isError || !briefing.data ? (
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm font-semibold text-white">
                  Could not load the briefing.
                </p>
                <button
                  type="button"
                  onClick={() => void briefing.refetch()}
                  className="hero-banner-btn hero-banner-btn-ghost"
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                <ProgressRing
                  value={health?.score ?? 0}
                  size={112}
                  strokeWidth={12}
                  tone="light"
                  label={
                    health?.score === null || health?.score === undefined
                      ? "Gym health unavailable"
                      : `Gym health ${health.score} out of 100, ${meta.label}`
                  }
                />
                <span
                  className="rounded-full px-3 py-1 text-xs font-bold text-white"
                  style={{ background: meta.fill }}
                >
                  {health?.score ?? "—"} · {meta.label}
                </span>
              </>
            )}
          </div>
          <h1 id="coo-title" className="hero-banner-title">
            Morning briefing
          </h1>
          {briefing.data && (
            <div className="flex flex-col items-center gap-1">
              <p className="hero-banner-subtitle">
                {displayCurrencyAmount(briefing.data.today.collected, briefing.data.today.currency)} collected
                today · {briefing.data.today.checkIns} check-ins ·{" "}
                {briefing.data.today.mixed ? "mixed currencies · " : ""}
                {briefing.data.outcomes.pending} approvals waiting
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
                <Delta value={briefing.data.deltas.collectedPct} />
                <Delta value={briefing.data.deltas.checkinsPct} />
              </div>
            </div>
          )}
          <div className="hero-banner-actions">
            <Button asChild size="sm" className="hero-banner-btn hero-banner-btn-ghost">
              <Link href="/ai">
                <Sparkles className="size-4" aria-hidden="true" />
                Ask AI
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {branchItems.length > 1 && (
        <div className="-mt-4 flex flex-wrap items-center gap-2">
          <Select value={branchFilter ?? ALL_BRANCHES} onValueChange={setSelectedBranch}>
            <SelectTrigger aria-label="Branch" className="h-8 w-auto min-w-40 rounded-xl bg-card text-sm">
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

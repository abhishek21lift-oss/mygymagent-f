"use client";

import { AlertTriangle } from "lucide-react";

import { BentoCard, BentoGrid, SectionHeader } from "@/components/shared/bento";
import { StatCard } from "@/components/shared/stat-card";
import { ProgressRing } from "@/components/shared/progress-ring";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { displayCurrencyAmount } from "@/lib/utils";
import type {
  GymHealth,
  HealthComponent,
  HealthStatus,
} from "@/lib/hooks/use-gym-health";

const STATUS_META: Record<
  HealthStatus,
  { label: string; fill: string; line: string }
> = {
  healthy: {
    label: "Healthy",
    fill: "var(--success)",
    line: "Your gym is performing well.",
  },
  stable: {
    label: "Stable",
    fill: "var(--info)",
    line: "Your gym is steady with room to grow.",
  },
  "needs-attention": {
    label: "Needs attention",
    fill: "var(--warning)",
    line: "A few areas need attention.",
  },
  critical: {
    label: "Critical",
    fill: "var(--destructive)",
    line: "Your gym needs urgent attention.",
  },
  unknown: {
    label: "Unknown",
    fill: "var(--muted-foreground)",
    line: "Not enough data yet to score your gym.",
  },
};

/** Vibrant Apple-style gradient per band for pills and bars. */
function bandGradient(score: number): string {
  if (score >= 80) return "linear-gradient(135deg,#10b981,#0d9488)";
  if (score >= 60) return "linear-gradient(135deg,#3b82f6,#8b5cf6)";
  if (score >= 40) return "linear-gradient(135deg,#f59e0b,#f97316)";
  return "linear-gradient(135deg,#f43f5e,#ef4444)";
}

/**
 * Gym Health hero: the gym's name in big type, centered, with the
 * health ring beneath it. Compact and centered by construction —
 * the same noir banner language as PageHero, composed for a metric
 * instead of a title.
 */
export function GymHealthHero({
  gymName,
  health,
  isLoading,
  isError,
  onRetry,
}: {
  gymName: string;
  health: GymHealth | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const meta = STATUS_META[health?.status ?? "unknown"];

  return (
    <section
      aria-labelledby="dashboard-title"
      className="relative -mx-4 mb-5 overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-br from-white/90 via-white/80 to-indigo-50/40 p-6 shadow-raised backdrop-blur-2xl transition-all dark:border-white/10 dark:from-card/90 dark:via-card/80 dark:to-indigo-950/20 sm:-mx-5 sm:p-8 lg:-mx-8"
      style={{
        boxShadow:
          "inset 0 1px 0 rgb(255 255 255 / 0.9), 0 12px 32px -8px rgb(15 23 42 / 0.08)",
      }}
    >
      {/* Decorative ambient aurora glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-16 size-72 rounded-full bg-gradient-to-br from-violet-500/15 via-indigo-500/15 to-transparent blur-3xl dark:from-violet-500/25"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-16 size-72 rounded-full bg-gradient-to-tl from-cyan-500/15 via-emerald-500/15 to-transparent blur-3xl dark:from-cyan-500/25"
      />

      <div className="relative flex flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200/60 bg-violet-50/80 px-3 py-1 text-xs font-bold text-violet-800 shadow-sm dark:border-violet-800/40 dark:bg-violet-950/40 dark:text-violet-200">
              <span className="size-2 rounded-full bg-violet-600 animate-pulse" />
              Live Health & Telemetry
            </span>
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold text-white shadow-sm"
              style={{ backgroundImage: bandGradient(health?.score ?? 0) }}
            >
              {meta.label}
            </span>
          </div>

          <h1
            id="dashboard-title"
            className="mt-3 text-2xl font-black tracking-tight text-foreground sm:text-3xl lg:text-4xl"
          >
            {gymName}
          </h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">
            {meta.line}
          </p>
        </div>

        {isError && !isLoading ? (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm font-semibold text-destructive">
              Could not load gym health.
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex min-h-11 items-center rounded-xl border border-border bg-card px-4 py-2 text-sm font-bold text-foreground shadow-sm hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-white/70 bg-white/70 p-3 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-card/70">
            {isLoading ? (
              <div
                className="size-20 rounded-full bg-muted/60 animate-pulse"
                aria-label="Loading gym health"
              />
            ) : (
              <ProgressRing
                value={health?.score ?? 0}
                size={80}
                strokeWidth={9}
                tone="auto"
                centerLabel={meta.label}
                label={
                  health?.score === null || health?.score === undefined
                    ? "Gym health unavailable"
                    : `Gym health ${health.score} out of 100, ${meta.label}`
                }
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function ComponentRow({ component }: { component: HealthComponent }) {
  return (
    <li className="flex flex-col gap-1 py-2 first:pt-0 last:pb-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold tracking-tight text-foreground">
          {component.label}
          <span className="ml-2 font-normal text-muted-foreground">
            · {component.value}
          </span>
        </span>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums shadow-sm",
            component.score === null
              ? "bg-muted text-muted-foreground"
              : "text-white",
          )}
          style={
            component.score === null
              ? undefined
              : { backgroundImage: bandGradient(component.score) }
          }
        >
          {component.score ?? "—"}
        </span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-muted"
        role="presentation"
      >
        {component.score !== null && (
          <div
            className="h-full rounded-full"
            style={{
              width: `${component.score}%`,
              backgroundImage: bandGradient(component.score),
            }}
          />
        )}
      </div>
      <p className="line-clamp-2 text-xs text-muted-foreground">
        {component.explanation}{" "}
        <span className="font-mono">[{component.source}]</span>
      </p>
    </li>
  );
}

/**
 * "Why is my score X?" breakdown, from the same gym-health request.
 * Nothing here is computed in the browser beyond formatting — the
 * backend owns every number.
 */
export function GymHealthPanels({
  health,
  isLoading,
  isError,
  onRetry,
}: {
  health: GymHealth | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  if (isLoading) {
    return (
      <section aria-label="Gym health breakdown">
        <SectionHeader title="Why this score" />
        <BentoCard>
          <Skeleton className="h-5 w-2/3 rounded-lg" aria-label="Loading breakdown" />
          <div className="mt-3 space-y-3" aria-hidden="true">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </BentoCard>
      </section>
    );
  }
  if (isError || !health) {
    return (
      <section aria-label="Gym health breakdown">
        <SectionHeader title="Why this score" />
        <BentoCard>
          <p className="text-sm font-semibold">Could not load the breakdown.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 min-h-11"
            onClick={onRetry}
          >
            Retry
          </Button>
        </BentoCard>
      </section>
    );
  }

  return (
    <section aria-label="Why this score">
        <SectionHeader
          title="Why this score"
          action={
            health.opportunity ? (
              <span className="kpi-trend kpi-trend-neutral">
                Biggest opportunity:{" "}
                {health.components.find((c) => c.key === health.opportunity)?.label}
              </span>
            ) : undefined
          }
        />
        <BentoCard>
          {health.score === null ? (
            <p className="text-sm text-muted-foreground">
              Not enough data yet — sell a membership, record a payment or
              add a lead and the score will appear.
            </p>
          ) : (
            <>
              {health.mixedCurrencies && (
                <p className="mb-2 rounded-xl bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
                  Multiple currencies in play — ratios blend denominations,
                  treat the score as approximate.
                </p>
              )}
            <ul className="divide-y divide-border">
              {health.components.map((component) => (
                <ComponentRow key={component.key} component={component} />
              ))}
            </ul>
            </>
          )}
        </BentoCard>
      </section>
  );
}

/**
 * Revenue at risk strip — extracted from GymHealthPanels so the
 * dashboard can slot it directly under Finance while the score
 * breakdown stays lower on the page.
 */
export function GymHealthRevenueRisk({
  health,
  isLoading,
}: {
  health: GymHealth | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <section aria-label="Revenue at risk">
        <SectionHeader title="Revenue at risk" />
        <BentoGrid columns={2} label="Revenue at risk">
          <Skeleton className="h-24 w-full rounded-xl" aria-label="Loading revenue at risk" />
          <Skeleton className="h-24 w-full rounded-xl" aria-hidden="true" />
        </BentoGrid>
      </section>
    );
  }
  if (!health) return null;

  const segments = (health.revenueAtRisk.bySegment ?? []).filter(
    (segment) => segment.mrr > 0,
  );
  return (
    <section aria-label="Revenue at risk">
      <SectionHeader title="Revenue at risk" />
      <BentoGrid columns={2} label="Revenue at risk">
        <StatCard
          icon={AlertTriangle}
          title="At-risk MRR"
          value={displayCurrencyAmount(health.revenueAtRisk.atRiskMRR)}
          hint={
            health.revenueAtRisk.mixed
              ? "Mixed currencies — total indicative"
              : `${Math.round(health.revenueAtRisk.atRiskPercentage)}% of ${displayCurrencyAmount(health.revenueAtRisk.totalMRR)} MRR`
          }
          isLoading={false}
          tone="primary"
          accent="rose"
        />
        <BentoCard>
          {segments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No membership value sits on at-risk accounts right now.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {segments.map((segment) => (
                <li
                  key={segment.riskLevel}
                  className="flex items-baseline justify-between gap-2 text-sm"
                >
                  <span className="font-semibold capitalize">
                    {segment.riskLevel.toLowerCase()}
                    <span className="ml-1.5 font-normal tabular-nums text-muted-foreground">
                      {segment.memberCount} member
                      {segment.memberCount === 1 ? "" : "s"}
                    </span>
                  </span>
                  <span className="shrink-0 font-bold tabular-nums">
                    {displayCurrencyAmount(segment.mrr)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </BentoCard>
      </BentoGrid>
    </section>
  );
}

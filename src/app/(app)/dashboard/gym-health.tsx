"use client";

import Link from "next/link";
import { AlertTriangle, Sparkles } from "lucide-react";

import { BentoCard, BentoGrid, SectionHeader } from "@/components/shared/bento";
import { StatCard } from "@/components/shared/stat-card";
import { ProgressRing } from "@/components/shared/progress-ring";
import { NOIR_BANNER_STYLE } from "@/components/shared/page-hero";
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

function bandFill(score: number): string {
  if (score >= 80) return "var(--success)";
  if (score >= 60) return "var(--info)";
  if (score >= 40) return "var(--warning)";
  return "var(--destructive)";
}

/**
 * Gym Health hero: brand, score ring, status, one-line read-out and the
 * two CTAs. Compact and centered by construction — the same noir banner
 * language as PageHero, composed for a metric instead of a title.
 */
export function GymHealthHero({
  gymName,
  health,
  isLoading,
  isError,
  onRetry,
  canAskAi,
  canReviewActions,
  pendingActions,
}: {
  gymName: string;
  health: GymHealth | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  canAskAi: boolean;
  canReviewActions: boolean;
  pendingActions: number;
}) {
  const meta = STATUS_META[health?.status ?? "unknown"];
  const opportunity = health?.components.find(
    (c) => c.key === health.opportunity,
  );
  const summary =
    health?.status === "unknown" || !opportunity
      ? meta.line
      : `${meta.line} ${opportunity.label} is the biggest opportunity today.`;

  return (
    <section
      aria-labelledby="dashboard-title"
      style={NOIR_BANNER_STYLE}
      className="hero-banner hero-centered -mx-4 mb-5 sm:-mx-5 lg:-mx-8"
    >
      <div className="hero-banner-body">
        <p className="hero-banner-eyebrow">MyGymAgent{gymName ? ` · ${gymName}` : ""}</p>
        <div className="flex flex-col items-center gap-2">
          {isLoading ? (
            <div
              className="rounded-full bg-white/20 animate-pulse"
              style={{ width: 112, height: 112 }}
              aria-label="Loading gym health"
            />
          ) : isError ? (
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm font-semibold text-white">
                Could not load gym health.
              </p>
              <button
                type="button"
                onClick={onRetry}
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
        <h1 id="dashboard-title" className="hero-banner-title">
          Gym Health
        </h1>
        {!isLoading && !isError && (
          <p className="hero-banner-subtitle">{summary}</p>
        )}
        <div className="hero-banner-actions">
          {canAskAi && (
            <Button
              asChild
              size="sm"
              className="hero-banner-btn hero-banner-btn-ghost"
            >
              <Link href="/ai">
                <Sparkles className="size-4" aria-hidden="true" />
                Ask AI
              </Link>
            </Button>
          )}
          {canReviewActions && (
            <Button
              asChild
              size="sm"
              className="hero-banner-btn hero-banner-btn-ghost"
            >
              <Link href="/ai-actions">
                View Actions
                {pendingActions > 0 && (
                  <span
                    aria-label={`${pendingActions} pending`}
                    className="rounded-full bg-white px-2 py-0.5 text-[11px] font-extrabold tabular-nums"
                    style={{ color: "#0b0b0d" }}
                  >
                    {pendingActions}
                  </span>
                )}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

function ComponentRow({ component }: { component: HealthComponent }) {
  return (
    <li className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold tracking-tight text-foreground">
          {component.label}
          <span className="ml-2 font-normal text-muted-foreground">
            · {component.value}
          </span>
        </span>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums",
            component.score === null
              ? "bg-muted text-muted-foreground"
              : "text-white",
          )}
          style={
            component.score === null
              ? undefined
              : { background: bandFill(component.score) }
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
              background: bandFill(component.score),
            }}
          />
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {component.explanation}{" "}
        <span className="font-mono">[{component.source}]</span>
      </p>
    </li>
  );
}

/**
 * "Why is my score X?" breakdown plus the revenue-at-risk strip, both from
 * the same gym-health request. Nothing here is computed in the browser
 * beyond formatting — the backend owns every number.
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

  const segments = (health.revenueAtRisk.bySegment ?? []).filter(
    (segment) => segment.mrr > 0,
  );
  return (
    <>
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
    </>
  );
}

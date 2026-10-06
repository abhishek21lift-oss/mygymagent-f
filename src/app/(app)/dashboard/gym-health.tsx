"use client";

import * as React from "react";
import {
  AlertTriangle,
  Boxes,
  HandCoins,
  HeartPulse,
  Megaphone,
  RefreshCw,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { Accent } from "@/lib/section-accent";
import { cn, displayCurrencyAmount } from "@/lib/utils";
import type {
  GymHealth,
  HealthComponent,
  HealthStatus,
} from "@/lib/hooks/use-gym-health";
import { DashSection, HealthRing, Tile, accentStyle } from "./dashboard-ui";
import styles from "./dashboard.module.css";

const STATUS_META: Record<HealthStatus, { label: string; dot: string; line: string }> = {
  healthy: { label: "Healthy", dot: "var(--success)", line: "Your gym is performing well." },
  stable: { label: "Stable", dot: "var(--info)", line: "Your gym is steady with room to grow." },
  "needs-attention": { label: "Needs attention", dot: "var(--warning)", line: "A few areas need attention." },
  critical: { label: "Critical", dot: "var(--destructive)", line: "Your gym needs urgent attention." },
  unknown: { label: "Not scored yet", dot: "var(--muted-foreground)", line: "Not enough data yet to score your gym." },
};

/** Each health component keeps its own hue across the breakdown. */
const COMPONENT_STYLE: Record<HealthComponent["key"], { icon: LucideIcon; accent: Accent }> = {
  revenue: { icon: TrendingUp, accent: "emerald" },
  collections: { icon: HandCoins, accent: "amber" },
  retention: { icon: HeartPulse, accent: "rose" },
  sales: { icon: Megaphone, accent: "violet" },
  inventory: { icon: Boxes, accent: "cyan" },
};

function partOfDay(timeZone: string | null | undefined): string {
  let hour = new Date().getHours();
  try {
    hour = Number(
      new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: timeZone ?? undefined }).format(new Date()),
    );
  } catch {
    /* fall back to local time */
  }
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function longToday(timeZone: string | null | undefined): string {
  const options: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" };
  try {
    return new Intl.DateTimeFormat(undefined, { ...options, timeZone: timeZone ?? undefined }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat(undefined, options).format(new Date());
  }
}

function clockTime(iso: string | undefined, timeZone: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const options: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
  try {
    return new Intl.DateTimeFormat(undefined, { ...options, timeZone: timeZone ?? undefined }).format(date);
  } catch {
    return new Intl.DateTimeFormat(undefined, options).format(date);
  }
}

/**
 * The page's masthead: date, greeting, the gym's name and its health
 * ring on an aurora ground. `children` is the branch picker slot.
 */
export function GymHealthHero({
  gymName,
  firstName,
  timeZone,
  health,
  isLoading,
  isError,
  onRetry,
  children,
}: {
  gymName: string;
  firstName?: string;
  timeZone?: string | null;
  health: GymHealth | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  children?: React.ReactNode;
}) {
  const status: HealthStatus = health?.score === null || !health ? "unknown" : health.status;
  const meta = STATUS_META[status];
  const updated = clockTime(health?.computedAt, timeZone);
  const score = health?.score ?? null;

  return (
    <section aria-labelledby="dashboard-title" className={styles.hero}>
      <div className={styles.aurora} aria-hidden="true" />
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className={styles.eyebrow}>{longToday(timeZone)}</p>
          <h1 id="dashboard-title" className={styles.gymName}>
            {gymName}
          </h1>
          <p className={styles.greeting}>
            {partOfDay(timeZone)}
            {firstName ? `, ${firstName}` : ""}. {isLoading || isError ? "" : meta.line}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className={styles.glassPill} style={{ "--dot": meta.dot } as React.CSSProperties}>
              <span className={styles.statusDot} aria-hidden="true" />
              {isLoading ? "Scoring…" : isError ? "Score unavailable" : meta.label}
            </span>
            {updated && !isLoading && !isError && (
              <span className={styles.glassPill}>Updated {updated}</span>
            )}
            {children}
          </div>
        </div>

        <div className={styles.ringPanel}>
          {isLoading ? (
            <Skeleton className="size-[88px] rounded-full" aria-label="Loading gym health" />
          ) : isError ? (
            <div className="flex flex-col items-start gap-2 py-1 pr-1">
              <p className="text-sm font-semibold text-destructive">Could not load gym health.</p>
              <Button type="button" variant="outline" size="sm" className="min-h-11 rounded-full" onClick={onRetry}>
                <RefreshCw className="size-4" aria-hidden="true" />
                Retry
              </Button>
            </div>
          ) : (
            <>
              <HealthRing
                score={score}
                status={status}
                label={score === null ? "Gym health unavailable" : `Gym health ${score} out of 100, ${meta.label}`}
              />
              <div className="pr-1">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Gym health</p>
                <p className="text-base font-bold tracking-tight text-foreground">{meta.label}</p>
                <p className="text-xs text-muted-foreground">{score === null ? "Needs more data" : "out of 100"}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function ComponentRow({ component }: { component: HealthComponent }) {
  const { icon: Icon, accent } = COMPONENT_STYLE[component.key] ?? COMPONENT_STYLE.revenue;
  return (
    <li className={cn("flex items-start gap-3 py-3 first:pt-0 last:pb-0", accentStyle(accent))}>
      <span className={styles.iconDisc} aria-hidden="true">
        <Icon className="size-[1.1rem]" strokeWidth={2.2} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="min-w-0 text-sm font-semibold tracking-tight text-foreground">
            {component.label}
            <span className="ml-2 font-normal text-muted-foreground">{component.value}</span>
          </p>
          <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">
            {component.score ?? "—"}
          </span>
        </div>
        <div className={cn(styles.meter, "mt-2")} aria-hidden="true">
          {component.score !== null && (
            <div className={styles.meterFill} style={{ width: `${component.score}%` }} />
          )}
        </div>
        <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{component.explanation}</p>
      </div>
    </li>
  );
}

/**
 * "Why is my score X?" breakdown, from the same gym-health request.
 * Nothing here is computed in the browser beyond formatting.
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
  const opportunity = health?.opportunity
    ? health.components.find((c) => c.key === health.opportunity)?.label
    : undefined;

  return (
    <DashSection
      id="dash-health-why"
      title="Why this score"
      subtitle={opportunity ? `Biggest opportunity: ${opportunity}` : "Five signals, weighted into one number."}
    >
      <div className={styles.panel}>
        {isLoading ? (
          <div className="space-y-4" aria-label="Loading breakdown" role="status">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : isError || !health ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm font-semibold">Could not load the breakdown.</p>
            <Button type="button" variant="outline" size="sm" className="min-h-11" onClick={onRetry}>
              Retry
            </Button>
          </div>
        ) : health.score === null ? (
          <p className="text-sm text-muted-foreground">
            Not enough data yet — sell a membership, record a payment or add a lead and the score will appear.
          </p>
        ) : (
          <>
            {health.mixedCurrencies && (
              <p className="mb-3 rounded-xl bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
                Multiple currencies in play — ratios blend denominations, treat the score as approximate.
              </p>
            )}
            <ul className="divide-y divide-border">
              {health.components.map((component) => (
                <ComponentRow key={component.key} component={component} />
              ))}
            </ul>
          </>
        )}
      </div>
    </DashSection>
  );
}

const RISK_ACCENT: Record<string, Accent> = {
  CRITICAL: "rose",
  HIGH: "orange",
  MEDIUM: "amber",
  LOW: "cyan",
};

/**
 * Membership value sitting on members the churn-risk model has flagged.
 * Not the same list as "no visit in 14 days" on the priority card, so
 * the subtitle names the source.
 */
export function GymHealthRevenueRisk({
  health,
  isLoading,
  isError,
}: {
  health: GymHealth | undefined;
  isLoading: boolean;
  isError?: boolean;
}) {
  if (!isLoading && (isError || !health)) return null;

  const risk = health?.revenueAtRisk;
  const segments = (risk?.bySegment ?? []).filter((segment) => segment.mrr > 0);
  const maxSegment = Math.max(1, ...segments.map((s) => s.mrr));

  return (
    <DashSection id="dash-risk" title="Revenue at risk" subtitle="Monthly value on members flagged by churn-risk scoring.">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <Tile
          icon={AlertTriangle}
          title="At-risk MRR"
          accent="rose"
          feature
          isLoading={isLoading}
          value={risk ? displayCurrencyAmount(risk.atRiskMRR) : undefined}
          hint={
            risk
              ? risk.mixed
                ? "Mixed currencies — total indicative"
                : `${Math.round(risk.atRiskPercentage)}% of ${displayCurrencyAmount(risk.totalMRR)} MRR`
              : undefined
          }
        />
        <div className={styles.panel}>
          {isLoading ? (
            <div className="space-y-3" aria-hidden="true">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-8 w-full rounded-xl" />
              ))}
            </div>
          ) : segments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No membership value sits on at-risk accounts right now.</p>
          ) : (
            <ul className="flex flex-col gap-3.5">
              {segments.map((segment) => (
                <li key={segment.riskLevel} className={accentStyle(RISK_ACCENT[segment.riskLevel] ?? "violet")}>
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="font-semibold capitalize text-foreground">
                      {segment.riskLevel.toLowerCase()}
                      <span className="ml-1.5 font-normal tabular-nums text-muted-foreground">
                        {segment.memberCount} member{segment.memberCount === 1 ? "" : "s"}
                      </span>
                    </span>
                    <span className="shrink-0 font-bold tabular-nums">{displayCurrencyAmount(segment.mrr)}</span>
                  </div>
                  <div className={cn(styles.meter, "mt-1.5")} aria-hidden="true">
                    <div
                      className={styles.meterFill}
                      style={{ width: `${Math.max(4, Math.round((segment.mrr / maxSegment) * 100))}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashSection>
  );
}

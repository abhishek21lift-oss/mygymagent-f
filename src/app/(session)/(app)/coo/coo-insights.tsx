"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, FlaskConical, TrendingDown, TrendingUp } from "lucide-react";

import { BentoCard, BentoGrid, SectionHeader } from "@/components/shared/bento";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { displayCurrencyAmount } from "@/lib/utils";
import type { CooForecast, CooTrend } from "@/lib/hooks/use-gym-health";
import type { AiEffectiveness } from "@/lib/hooks/use-gym-health";
import type { RenewalPipeline } from "@/lib/hooks/use-analytics";

function TrendArrow({ direction }: { direction: "up" | "down" | "flat" }) {
  const Icon = direction === "up" ? TrendingUp : direction === "down" ? TrendingDown : TrendingUp;
  return <Icon className="size-4" aria-hidden="true" />;
}

/**
 * What changed: deterministic trend cards with basis, direction and an
 * Ask-AI deep link carrying the question as context (prefilled, never
 * auto-sent).
 */
export function TrendsStrip({
  trends,
  isLoading,
  isError,
  onRetry,
}: {
  trends: CooTrend[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const questions: Record<string, string> = {
    revenue: "Why did revenue change recently? Use the revenue trend and breakdown.",
    risk: "Why is member risk changing? Use the risk trend and at-risk members.",
  };
  if (isLoading) {
    return (
      <section aria-label="What changed">
        <SectionHeader title="What changed" />
        <Skeleton className="h-24 w-full rounded-2xl" aria-label="Loading trends" />
      </section>
    );
  }
  if (isError || !trends) {
    return (
      <section aria-label="What changed">
        <SectionHeader title="What changed" />
        <BentoCard>
          <p className="text-sm font-semibold">Could not load trends.</p>
          <Button type="button" variant="outline" size="sm" className="mt-3 min-h-11" onClick={onRetry}>
            Retry
          </Button>
        </BentoCard>
      </section>
    );
  }
  if (trends.length === 0) {
    return (
      <section aria-label="What changed">
        <SectionHeader title="What changed" />
        <BentoCard>
          <p className="text-sm text-muted-foreground">
            Not enough history yet to compare periods — check back after a few months of data.
          </p>
        </BentoCard>
      </section>
    );
  }
  return (
    <section aria-label="What changed">
      <SectionHeader title="What changed" />
      <BentoGrid columns={2} label="Trend cards">
        {trends.map((trend) => (
          <BentoCard key={trend.metric} accent={trend.direction === "up" ? "emerald" : trend.direction === "down" ? "rose" : "cyan"}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-extrabold tracking-tight">{trend.label}</p>
                <p className="mt-1 text-2xl font-black tabular-nums tracking-tight">
                  {trend.currency ? displayCurrencyAmount(trend.current, trend.currency) : trend.current}
                  {trend.deltaPct !== null && (
                    <span className="ml-2 align-middle text-sm font-bold text-muted-foreground">
                      {trend.deltaPct > 0 ? "+" : ""}{trend.deltaPct}%
                    </span>
                  )}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  vs previous period
                  {trend.deltaPct === null && " · change not computable"}
                </p>
              </div>
              <TrendArrow direction={trend.direction} />
            </div>
            <div className="mt-3">
              <Button asChild variant="ghost" size="sm" className="min-h-11 rounded-xl px-2">
                <Link href={`/ai?q=${encodeURIComponent(questions[trend.metric] ?? "Explain this trend.")}`}>
                  Ask about this <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </BentoCard>
        ))}
      </BentoGrid>
    </section>
  );
}

/**
 * Forecast + scenario: moving-average band with confidence and basis,
 * plus a what-if calculator over the live renewal pipeline. Observed,
 * calculated, assumed and hypothetical values are labeled as such.
 */
export function ForecastScenario({
  forecast,
  isLoading,
  isError,
  onRetry,
  renewals,
  renewalsLoading,
}: {
  forecast: CooForecast | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  renewals: RenewalPipeline | undefined;
  renewalsLoading: boolean;
}) {
  const [upliftPct, setUpliftPct] = React.useState(10);
  const upcoming = renewals?.upcoming ?? [];
  const byCurrency = new Map<string, { count: number; total: number }>();
  for (const item of upcoming) {
    const entry = byCurrency.get(item.currency) ?? { count: 0, total: 0 };
    entry.count += 1;
    entry.total += Number(item.price);
    byCurrency.set(item.currency, entry);
  }
  const scenario = [...byCurrency.entries()].map(([currency, entry]) => {
    const extra = (entry.count * upliftPct) / 100;
    const avg = entry.count > 0 ? entry.total / entry.count : 0;
    return { currency, extra, revenue: extra * avg };
  });

  return (
    <section aria-label="Forecast and scenarios">
      <SectionHeader title="Forecast · What-if" />
      <BentoGrid columns={2} label="Forecast and scenario">
        <BentoCard accent="violet">
          <p className="text-sm font-extrabold tracking-tight">Next month revenue</p>
          {isLoading ? (
            <Skeleton className="mt-2 h-10 w-2/3 rounded-xl" aria-label="Loading forecast" />
          ) : isError || !forecast ? (
            <>
              <p className="mt-2 text-sm text-muted-foreground">Could not load the forecast.</p>
              <Button type="button" variant="outline" size="sm" className="mt-2 min-h-11" onClick={onRetry}>
                Retry
              </Button>
            </>
          ) : forecast.insufficientData || !forecast.revenueNextMonth ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Insufficient data — needs 3 complete months of revenue history.
            </p>
          ) : (
            <>
              <p className="mt-2 text-2xl font-black tabular-nums tracking-tight">
                {displayCurrencyAmount(forecast.revenueNextMonth.point, forecast.revenueNextMonth.currency)}{" "}
                <span className="text-sm font-bold text-muted-foreground">
                  ({displayCurrencyAmount(forecast.revenueNextMonth.low, forecast.revenueNextMonth.currency)}–
                  {displayCurrencyAmount(forecast.revenueNextMonth.high, forecast.revenueNextMonth.currency)})
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Estimate · {forecast.revenueNextMonth.confidence} confidence · based on{" "}
                {forecast.revenueNextMonth.basedOnMonths} months · {forecast.revenueNextMonth.method}
              </p>
              <div className="mt-3">
                <Button asChild variant="ghost" size="sm" className="min-h-11 rounded-xl px-2">
                  <Link
                    href={`/ai?q=${encodeURIComponent("Is next month's revenue forecast reliable? Explain the basis and confidence.")}`}
                  >
                    Ask about this <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </>
          )}
        </BentoCard>

        <BentoCard accent="amber">
          <p className="flex items-center gap-2 text-sm font-extrabold tracking-tight">
            <FlaskConical className="size-4" aria-hidden="true" />
            Renewal uplift scenario
          </p>
          <div className="mt-2 flex items-center gap-2">
            <label htmlFor="uplift-pct" className="text-xs font-semibold text-muted-foreground">
              Improve renewals by
            </label>
            <Input
              id="uplift-pct"
              type="number"
              min={1}
              max={100}
              value={upliftPct}
              onChange={(e) => setUpliftPct(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
              className="h-11 w-20 rounded-xl"
            />
            <span className="text-xs font-semibold">%</span>
          </div>
          {renewalsLoading ? (
            <Skeleton className="mt-2 h-8 w-full rounded-xl" aria-label="Loading renewals" />
          ) : upcoming.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">No upcoming renewals to model.</p>
          ) : (
            <>
              <ul className="mt-2 flex flex-col gap-1">
                {scenario.map((row) => (
                  <li key={row.currency} className="text-sm tabular-nums">
                    <span className="font-extrabold">
                      +{row.extra.toFixed(1)} renewals · {displayCurrencyAmount(row.revenue.toFixed(2), row.currency)}
                    </span>{" "}
                    <span className="text-muted-foreground">({row.currency})</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">
                Hypothetical — assumes the uplift applies evenly across {upcoming.length} upcoming renewals.
                Not a forecast, not actual revenue.
              </p>
            </>
          )}
        </BentoCard>
      </BentoGrid>
    </section>
  );
}

/**
 * AI effectiveness: acceptance and execution rates with null-safe
 * denominators, kept visibly separate from business KPIs.
 */
export function EffectivenessStrip({
  effectiveness,
  isLoading,
  isError,
}: {
  effectiveness: AiEffectiveness | undefined;
  isLoading: boolean;
  isError: boolean;
}) {
  const row = (label: string, value: string | undefined) => (
    <div className="flex items-baseline justify-between gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold tabular-nums">{value ?? "—"}</span>
    </div>
  );
  return (
    <section aria-label="AI effectiveness">
      <SectionHeader title="AI effectiveness" />
      <BentoCard accent="violet">
        {isLoading ? (
          <Skeleton className="h-20 w-full rounded-xl" aria-label="Loading effectiveness" />
        ) : isError || !effectiveness ? (
          <p className="text-sm text-muted-foreground">Could not load effectiveness.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {row("Recommendations", String(effectiveness.total))}
            {row(
              "Acceptance rate",
              effectiveness.acceptanceRate === null ? "insufficient data" : `${effectiveness.acceptanceRate}%`,
            )}
            {row(
              "Execution rate",
              effectiveness.executionRate === null ? "insufficient data" : `${effectiveness.executionRate}%`,
            )}
            {row("Failed", String(effectiveness.failed))}
            <p className="mt-1 text-xs text-muted-foreground">
              Acceptance = executed ÷ decided. Execution = executed ÷ approved + executed.
              Associated outcomes only — never claimed as AI-caused.
            </p>
          </div>
        )}
      </BentoCard>
    </section>
  );
}

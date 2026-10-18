"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { cn } from "@/lib/utils";

export interface BarDatum {
  label: string;
  value: number;
}

export interface GradientBarChartProps {
  data: ReadonlyArray<BarDatum>;
  ariaLabel: string;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Optional node rendered above the bars, e.g. a peak figure. */
  peakLabel?: React.ReactNode;
  /** Index of the bar to highlight as "current". Defaults to the last. */
  highlightIndex?: number;
  className?: string;
  /** Formats the hover tooltip value, e.g. money. Defaults to the raw number. */
  formatValue?: (value: number) => string;
}

/**
 * Premium gradient bar chart.
 *
 * Pure SVG/CSS free implementation (no charting dependency). Renders
 * responsive vertical bars with a gradient fill, hover tooltips via the
 * native `title` attribute, an accessible `role="img"` summary, and a
 * screen-reader table. Handles loading, error and empty states.
 */
export function GradientBarChart({
  data,
  ariaLabel,
  isLoading = false,
  isError = false,
  onRetry,
  emptyTitle = "No data yet",
  emptyDescription,
  peakLabel,
  highlightIndex,
  className,
  formatValue = (v) => v.toLocaleString(),
}: GradientBarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const hasData = data.some((d) => d.value > 0);
  const hi = highlightIndex ?? data.length - 1;

  if (isLoading) {
    return (
      <div className={cn("w-full", className)}>
        <Skeleton className="h-44 w-full rounded-2xl" aria-label="Loading chart" />
      </div>
    );
  }
  if (isError) {
    return (
      <div className={cn("w-full", className)}>
        <ErrorState message="Could not load chart." onRetry={onRetry} />
      </div>
    );
  }
  if (!hasData) {
    return (
      <div className={cn("w-full", className)}>
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {peakLabel ? <div className="mb-3">{peakLabel}</div> : null}
      <div
        role="img"
        aria-label={ariaLabel}
        className="flex items-end gap-1.5 sm:gap-2.5"
        style={{ height: 176 }}
      >
        {data.map((d, i) => {
          const isCurrent = i === hi;
          const pct = d.value > 0 ? Math.max(6, Math.round((d.value / max) * 100)) : 0;
          return (
            <div
              key={`${d.label}-${i}`}
              className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
              title={`${d.label}: ${formatValue(d.value)}`}
            >
              <div
                className="relative flex w-full items-end justify-center"
                style={{ height: 144 }}
                aria-hidden="true"
              >
                <div
                  className="w-full rounded-t-lg transition-all duration-500 ease-out group-hover:opacity-90"
                  style={{
                    height: `${pct}%`,
                    background: isCurrent
                      ? "linear-gradient(180deg, var(--a-emerald-grad-1, #34d399), var(--a-emerald-grad-2, #059669))"
                      : "linear-gradient(180deg, color-mix(in srgb, var(--a-emerald-grad-1, #34d399) 60%, transparent), color-mix(in srgb, var(--a-emerald-grad-2, #059669) 60%, transparent))",
                    boxShadow: isCurrent ? "0 8px 16px -6px color-mix(in srgb, var(--a-emerald-grad-2, #059669) 45%, transparent)" : "none",
                  }}
                />
              </div>
              <span
                className={
                  isCurrent
                    ? "truncate text-xs font-semibold text-foreground"
                    : "truncate text-xs text-muted-foreground"
                }
              >
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
      <table className="sr-only">
        <caption>Bar chart</caption>
        <thead>
          <tr>
            <th scope="col">Label</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={`${d.label}-${i}`}>
              <th scope="row">{d.label}</th>
              <td>{d.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

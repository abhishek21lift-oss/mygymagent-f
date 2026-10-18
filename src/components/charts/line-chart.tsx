"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { cn } from "@/lib/utils";

export interface LineDatum {
  label: string;
  value: number;
}

export interface LineChartProps {
  data: ReadonlyArray<LineDatum>;
  ariaLabel: string;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
  /** Height in px. Default 180. */
  height?: number;
}

/**
 * Premium line/area chart (pure SVG, no charting dependency).
 * Handles loading, error and empty states; accessible via role="img".
 */
export function LineChart({
  data,
  ariaLabel,
  isLoading = false,
  isError = false,
  onRetry,
  emptyTitle = "No data yet",
  emptyDescription,
  className,
  height = 180,
}: LineChartProps) {
  // useId: two charts on one page must not share gradient defs.
  const gradId = React.useId();
  const strokeId = `${gradId}-stroke`;
  const width = 400;
  const padX = 16;
  const padY = 16;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  if (isLoading) {
    return (
      <div className={cn("w-full", className)}>
        <Skeleton className="w-full rounded-2xl" style={{ height }} aria-label="Loading chart" />
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
  const hasData = data.some((d) => d.value > 0);
  if (data.length === 0 || !hasData) {
    return (
      <div className={cn("w-full", className)}>
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  const max = Math.max(1, ...data.map((d) => d.value));
  const min = Math.min(0, ...data.map((d) => d.value));
  const range = max - min || 1;
  const step = data.length > 1 ? innerW / (data.length - 1) : 0;

  const points = data.map((d, i) => {
    const x = padX + (data.length > 1 ? i * step : innerW / 2);
    const y = padY + innerH - ((d.value - min) / range) * innerH;
    return { x, y, d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${height - padY} L ${points[0].x.toFixed(1)} ${height - padY} Z`;

  return (
    <div className={cn("w-full", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height: "auto" }}
        role="img"
        aria-label={ariaLabel}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--a-blue-grad-1, #60a5fa)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--a-blue-grad-1, #60a5fa)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={strokeId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--a-violet-grad-1, #a78bfa)" />
            <stop offset="100%" stopColor="var(--a-blue-grad-1, #60a5fa)" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path d={linePath} fill="none" stroke={`url(#${strokeId})`} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="var(--a-blue-grad-1, #60a5fa)" stroke="var(--card)" strokeWidth={2}>
            <title>{`${p.d.label}: ${p.d.value.toLocaleString()}`}</title>
          </circle>
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        {data.map((d, i) => (
          <span key={i} className="truncate">{d.label}</span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Line chart</caption>
        <thead>
          <tr>
            <th scope="col">Label</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={i}>
              <th scope="row">{d.label}</th>
              <td>{d.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface DonutSegment {
  label: string;
  value: number;
  /** Hex or CSS colour for this segment */
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  /** Value shown in the center. Defaults to total. */
  centerValue?: string | number;
  /** Label shown below the center value */
  centerLabel?: string;
  /** Diameter in px. Default 140 */
  size?: number;
  /** Stroke width (ring thickness) in px. Default 22 */
  strokeWidth?: number;
  className?: string;
  /** Whether to show the legend beside the donut */
  showLegend?: boolean;
  isLoading?: boolean;
}

/**
 * Pure SVG donut chart.
 *
 * Renders a segmented ring using SVG stroke-dasharray/dashoffset,
 * a center label, and an accessible legend. No external charting
 * library — zero dependency, fully responsive, theme-aware colours.
 *
 * Accessibility:
 * - The SVG carries role="img" and an aria-label summarising all segments.
 * - Each segment gets a <title> inside its <circle> element.
 * - The legend duplicates the data in readable text for screen readers.
 *
 * Design:
 * - A 2px gap between segments gives the impression of individual arcs.
 * - The ring rotates -90° so the first segment starts at 12 o'clock.
 * - Colors come from the caller — the dashboard passes the section
 *   accent steps for cohesion with the rest of the page.
 */
export function DonutChart({
  segments,
  centerValue,
  centerLabel,
  size = 140,
  strokeWidth = 22,
  className,
  showLegend = true,
  isLoading = false,
}: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  // Gap between segments in SVG units (2px visual gap)
  const gap = total > 0 ? (2 / circumference) * circumference : 0;

  const resolvedCenter = centerValue ?? (total > 0 ? total.toLocaleString() : "—");

  // Build per-segment arc data.
  // Uses reduce (not map + let mutation) to accumulate the running
  // fraction without reassigning a variable during render — the
  // react-compiler eslint rule disallows that pattern.
  const arcs = segments.reduce<
    Array<DonutSegment & { dashLength: number; offset: number; fraction: number }>
  >((acc, seg) => {
    const fraction = total > 0 ? seg.value / total : 0;
    const dashLength = Math.max(0, fraction * circumference - gap);
    const cumulative = acc.reduce((sum, a) => sum + a.fraction, 0);
    const offset = -cumulative * circumference;
    return [...acc, { ...seg, dashLength, offset, fraction }];
  }, []);

  // Accessible summary for the SVG
  const ariaLabel = [
    centerLabel ?? "Donut chart",
    ...segments.map(
      (s) =>
        `${s.label}: ${s.value}${total > 0 ? ` (${Math.round((s.value / total) * 100)}%)` : ""}`,
    ),
  ].join(". ");

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-6", className)}>
        <div
          className="shrink-0 rounded-full animate-pulse bg-muted"
          style={{ width: size, height: size }}
          aria-label="Loading chart"
        />
        {showLegend && (
          <div className="flex flex-col gap-2.5 min-w-0 flex-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-muted animate-pulse" />
                <div className="h-3 rounded-md bg-muted animate-pulse flex-1" />
                <div className="h-3 w-8 rounded-md bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className={cn("flex items-center gap-6", className)}>
        <div
          className="shrink-0 rounded-full border-4 border-border flex items-center justify-center"
          style={{ width: size, height: size }}
          aria-label="No data"
        >
          <span className="text-xs text-muted-foreground font-medium">None</span>
        </div>
        {showLegend && segments.length > 0 && (
          <div className="donut-legend min-w-0 flex-1">
            {segments.map((seg) => (
              <div key={seg.label} className="donut-legend-row">
                <span className="donut-legend-dot" style={{ background: seg.color }} />
                <span className="donut-legend-name">{seg.label}</span>
                <span className="donut-legend-val">0</span>
                <span className="donut-legend-pct">0%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-5 sm:gap-6", className)}>
      {/* SVG ring */}
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label={ariaLabel}
          style={{ transform: "rotate(-90deg)" }}
          overflow="visible"
        >
          {/* Background ring (track) */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth={strokeWidth * 0.4}
            opacity={0.6}
          />

          {arcs.map((arc) => (
            <React.Fragment key={arc.label}>
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={arc.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${arc.dashLength} ${circumference}`}
                strokeDashoffset={arc.offset}
                strokeLinecap="round"
                aria-label={`${arc.label}: ${arc.value}`}
              >
                <title>{`${arc.label}: ${arc.value} (${Math.round(arc.fraction * 100)}%)`}</title>
              </circle>
            </React.Fragment>
          ))}
        </svg>

        {/* Center label — outside the SVG transform, so it stays upright */}
        <div className="donut-center">
          <span className="donut-center-value">{resolvedCenter}</span>
          {centerLabel && (
            <span className="donut-center-label">{centerLabel}</span>
          )}
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="donut-legend min-w-0 flex-1" aria-hidden="true">
          {arcs.map((arc) => (
            <div key={arc.label} className="donut-legend-row">
              <span
                className="donut-legend-dot"
                style={{ background: arc.color }}
              />
              <span className="donut-legend-name">{arc.label}</span>
              <span className="donut-legend-val">
                {arc.value.toLocaleString()}
              </span>
              <span className="donut-legend-pct">
                {Math.round(arc.fraction * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

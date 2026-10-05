"use client";

import { cn } from "@/lib/utils";

/**
 * Single-value radial progress ring (pure SVG, no chart dependency).
 *
 * Sibling of `DonutChart` (multi-segment) for KPI/target visuals:
 * monthly-target %, session-capacity %, profile-completeness %.
 * Token-colored, `role="img"` labelled, no animation (reduced-motion safe).
 */
export function ProgressRing({
  value,
  max = 100,
  size = 96,
  strokeWidth = 10,
  label,
  centerLabel,
  className,
}: {
  /** Current value (clamped to [0, max]). */
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  /** Accessible name, e.g. "Monthly target: 72%". */
  label: string;
  /** Small caption under the % — defaults to the % itself. */
  centerLabel?: string;
  className?: string;
}) {
  const safeMax = Math.max(1, max);
  const fraction = Math.min(1, Math.max(0, value / safeMax));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  return (
    <div className={cn("relative inline-flex shrink-0 items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={label}
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth * 0.45}
          opacity={0.7}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="url(#progress-ring-grad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${fraction * circumference} ${circumference}`}
        >
          <title>{label}</title>
        </circle>
        <defs>
          <linearGradient id="progress-ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--section-grad-1)" />
            <stop offset="100%" stopColor="var(--section-grad-2)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-extrabold tabular-nums tracking-tight text-foreground">
          {Math.round(fraction * 100)}%
        </span>
        {centerLabel && (
          <span className="max-w-[5rem] truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {centerLabel}
          </span>
        )}
      </div>
    </div>
  );
}

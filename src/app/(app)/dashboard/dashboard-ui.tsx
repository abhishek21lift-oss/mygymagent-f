"use client";

import * as React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import type { Accent } from "@/lib/section-accent";
import { cn } from "@/lib/utils";
import styles from "./dashboard.module.css";

/** Accent → the module class that sets its two gradient stops. */
export function accentStyle(accent: Accent): string {
  return styles[accent] ?? styles.indigo;
}

/* --- Section ------------------------------------------------------ */
export function DashSection({
  id,
  title,
  subtitle,
  subtitleLive = false,
  action,
  children,
  className,
}: {
  id: string;
  title: string;
  subtitle?: React.ReactNode;
  /** Announce subtitle changes (e.g. a period label) to screen readers. */
  subtitleLive?: boolean;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section aria-labelledby={id} className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <h2 id={id} className={styles.sectionTitle}>
            {title}
          </h2>
          {subtitle && (
            <p className={styles.sectionSub} role={subtitleLive ? "status" : undefined}>
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** "₹ 2,64,200.00" must never wrap between the symbol and the figure. */
function nonBreakingCurrency(value: React.ReactNode): React.ReactNode {
  return typeof value === "string" ? value.replace(/^(\D{1,3}) (?=\d)/, "$1\u00a0") : value;
}

/* --- Metric tile -------------------------------------------------- */
/**
 * One figure on a tinted ground. Same states as the shared StatCard —
 * skeleton while loading, an em dash (named for screen readers) on
 * error — so a failed request never reads as a real zero.
 */
export function Tile({
  icon: Icon,
  title,
  value,
  hint,
  accent,
  feature = false,
  isLoading,
  isError,
}: {
  icon: LucideIcon;
  title: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  accent: Accent;
  /** The one vivid tile in a row. */
  feature?: boolean;
  isLoading: boolean;
  isError?: boolean;
}) {
  return (
    <div className={cn(styles.tile, feature && styles.tileFeature, accentStyle(accent))}>
      <div className="flex items-center gap-2.5">
        <span className={styles.iconDisc} aria-hidden="true">
          <Icon className="size-[1.15rem]" strokeWidth={2.2} />
        </span>
        <p className={styles.tileLabel}>{title}</p>
      </div>
      {isLoading ? (
        <Skeleton className="mt-auto h-8 w-24 rounded-xl" aria-label={`Loading ${title}`} />
      ) : isError ? (
        <p className={styles.tileValue} title={`${title} could not be loaded`}>
          <span aria-hidden="true">&mdash;</span>
          <span className="sr-only">Could not be loaded</span>
        </p>
      ) : (
        <p className={styles.tileValue}>{nonBreakingCurrency(value) ?? "—"}</p>
      )}
      {hint && !isLoading && <p className={styles.tileHint}>{hint}</p>}
    </div>
  );
}

/* --- Segmented control ------------------------------------------- */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className={styles.segmented}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={styles.segment}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/* --- App-icon launcher -------------------------------------------- */
export function AppIconLink({
  href,
  icon: Icon,
  label,
  hint,
  accent,
  badge,
  badgeTone = "alert",
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  hint?: string;
  accent: Accent;
  badge?: number;
  /** Red only for something waiting on the user; totals stay neutral. */
  badgeTone?: "alert" | "neutral";
}) {
  const count = badge && badge > 0 ? (badge > 99 ? "99+" : String(badge)) : null;
  return (
    <Link
      href={href}
      aria-label={count ? `${label}, ${count}` : label}
      title={hint}
      className={cn(styles.appIcon, accentStyle(accent))}
    >
      <span className={styles.appGlyph} aria-hidden="true">
        <Icon className="size-6" strokeWidth={2} />
      </span>
      {count && (
        <span className={cn(styles.appBadge, badgeTone === "neutral" && styles.appBadgeNeutral)} aria-hidden="true">
          {count}
        </span>
      )}
      <span className="line-clamp-2 w-full text-xs font-semibold leading-tight tracking-tight text-foreground [overflow-wrap:anywhere]">
        {label}
      </span>
    </Link>
  );
}

/* --- Health ring --------------------------------------------------- */
const RING_STOPS: Record<string, [string, string]> = {
  healthy: ["var(--a-emerald-grad-1)", "var(--a-cyan-grad-1)"],
  stable: ["var(--a-blue-grad-1)", "var(--a-violet-grad-1)"],
  "needs-attention": ["var(--a-amber-grad-1)", "var(--a-orange-grad-1)"],
  critical: ["var(--a-rose-grad-1)", "var(--a-orange-grad-1)"],
  unknown: ["var(--muted-foreground)", "var(--muted-foreground)"],
};

/**
 * Activity-ring style score. A null score is drawn as an empty track
 * with an em dash — never as 0, which would read as "critical".
 */
export function HealthRing({
  score,
  status,
  label,
  size = 88,
  stroke = 10,
}: {
  score: number | null;
  status: string;
  label: string;
  size?: number;
  stroke?: number;
}) {
  const gradientId = React.useId();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = score === null ? 0 : Math.min(1, Math.max(0, score / 100));
  const [from, to] = RING_STOPS[status] ?? RING_STOPS.unknown;
  return (
    <div className="relative inline-flex shrink-0 items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--surface-sunken)"
            strokeWidth={stroke}
          />
          {fraction > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${fraction * circumference} ${circumference}`}
            />
          )}
        </g>
      </svg>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center text-xl font-extrabold tabular-nums tracking-tight text-foreground"
      >
        {score ?? "—"}
      </span>
    </div>
  );
}

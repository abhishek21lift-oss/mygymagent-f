import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Accent } from "@/lib/section-accent";

/**
 * Maps colour names from callsites onto the accent system.
 * Fourteen pages each used their own palette vocabulary —
 * this converges them without touching any call site.
 */
export function toStatTone(
  tone: string | undefined,
): "primary" | "success" | "warning" | "destructive" {
  const t = (tone ?? "").toLowerCase();
  if (/(rose|red|danger|destruct|critical|overdue)/.test(t)) return "destructive";
  if (/(amber|orange|yellow|warn|risk|attention)/.test(t)) return "warning";
  if (/(emerald|green|teal|success|paid|good)/.test(t)) return "success";
  return "primary";
}

/** Accent → CSS gradient variable names */
const ACCENT_CLASSES: Record<string, string> = {
  indigo:  "kpi-indigo",
  violet:  "kpi-violet",
  emerald: "kpi-emerald",
  amber:   "kpi-amber",
  cyan:    "kpi-cyan",
  rose:    "kpi-rose",
  blue:    "kpi-blue",
  orange:  "kpi-orange",
};

/** Tone → accent mapping for the icon tile */
const TONE_ACCENT: Record<string, Accent> = {
  primary:     "indigo",
  success:     "emerald",
  warning:     "amber",
  destructive: "rose",
};

/**
 * Premium KPI Card.
 *
 * Visual anatomy:
 * - 3px gradient top-cap in the section or overridden colour
 * - Gradient icon tile (top-left) carrying a white glyph
 * - Large tabular metric number that shrinks to fit its container
 * - Optional trend chip (TrendingUp / TrendingDown / neutral dash)
 * - Optional hint line below the number
 * - Subtle ambient glow in the background of the card
 *
 * States:
 * - isLoading: skeleton placeholder at the number position
 * - isError: em-dash with a screen-reader explanation
 * - warning / destructive: state rule down the leading edge
 *   (only when the number is non-zero)
 *
 * `accent` overrides the gradient colour for the icon tile and cap,
 * independently of the page's section colour. This lets the dashboard
 * give each KPI its own hue even when they all live on the same route.
 */
export function StatCard({
  title,
  icon: Icon,
  value,
  isLoading,
  isError,
  hint,
  tone = "primary",
  accent,
  trendValue,
  trendLabel,
}: {
  title: string;
  icon?: LucideIcon;
  value: number | string | undefined;
  isLoading: boolean;
  isError?: boolean;
  hint?: string;
  tone?: "primary" | "success" | "warning" | "destructive";
  /** Override the gradient colour for the icon tile independently of
   *  the page section. */
  accent?: Accent;
  /** Numeric change for the trend chip, e.g. 12 means +12% */
  trendValue?: number;
  /** Label beside the trend arrow, e.g. "vs last month" */
  trendLabel?: string;
}) {
  // A zero is not a problem — don't paint a warning/destructive state
  // over "Expired: 0" or "Low stock: 0".
  const isZero = value === undefined || value === null || !/[1-9]/.test(String(value));
  const effectiveTone =
    isZero && (tone === "warning" || tone === "destructive") ? "primary" : tone;
  const flagged = effectiveTone === "warning" || effectiveTone === "destructive";

  // Resolve which accent colour drives the icon tile / top-cap.
  const resolvedAccent = accent ?? TONE_ACCENT[effectiveTone] ?? "indigo";
  const accentClass = ACCENT_CLASSES[resolvedAccent] ?? "kpi-indigo";

  // Trend chip
  let TrendIcon = Minus;
  let trendClass = "kpi-trend-neutral";
  if (trendValue !== undefined) {
    if (trendValue > 0) { TrendIcon = TrendingUp; trendClass = "kpi-trend-up"; }
    else if (trendValue < 0) { TrendIcon = TrendingDown; trendClass = "kpi-trend-down"; }
  }

  // Format the displayed value, keeping currency symbols non-breaking.
  const displayValue =
    typeof value === "string"
      ? value.replace(/^(\D{1,3}) (?=\d)/, "$1\u00a0")
      : (value ?? 0);

  return (
    <div
      className={cn(
        "kpi-card @container",
        accentClass,
        // State rule on the leading edge for flagged tiles
        flagged &&
          "before:!bg-transparent after:!bg-transparent relative " +
          "pl-[calc(1.25rem+3px)]",
      )}
    >
      {/* Leading-edge state rule (warning / destructive only) */}
      {flagged && (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-y-3 left-0 w-[3px] rounded-full",
            effectiveTone === "destructive" ? "bg-destructive" : "bg-warning",
          )}
        />
      )}

      {/* Icon tile + label row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        {Icon ? (
          <span className="kpi-icon-tile" aria-hidden="true">
            <Icon className="size-5" strokeWidth={2} />
          </span>
        ) : (
          <span className="kpi-icon-tile" aria-hidden="true" />
        )}

        {/* Trend chip (shown if trendValue is provided) */}
        {trendValue !== undefined && (
          <span className={cn("kpi-trend", trendClass)}>
            <TrendIcon className="size-3" strokeWidth={2.5} aria-hidden="true" />
            {Math.abs(trendValue)}%
          </span>
        )}
      </div>

      {/* Metric */}
      {isLoading ? (
        <Skeleton
          className="h-8 w-20 rounded-xl mt-1"
          aria-label={`Loading ${title}`}
        />
      ) : isError ? (
        <p
          className="kpi-value text-muted-foreground mt-1"
          title={`${title} could not be loaded`}
        >
          <span aria-hidden="true">&mdash;</span>
          <span className="sr-only">Could not be loaded</span>
        </p>
      ) : (
        <p
          className={cn(
            "kpi-value mt-1",
            effectiveTone === "destructive" && "text-destructive",
            effectiveTone === "warning" && "text-warning",
          )}
        >
          {displayValue}
        </p>
      )}

      {/* Title */}
      <p className="kpi-label mt-2">{title}</p>

      {/* Hint / sub-label row */}
      {(hint || trendLabel) && (
        <p className="kpi-hint">
          {hint}
          {hint && trendLabel ? " · " : ""}
          {trendLabel}
        </p>
      )}
    </div>
  );
}

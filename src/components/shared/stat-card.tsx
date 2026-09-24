import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Only `attention` and `critical` paint anything. A tile whose number is
 * simply a number gets no colour — if every tile is tinted, none of them
 * reads as needing attention, which is the only thing colour is for here. */
const TONE_RULE = {
 primary: "",
 success: "",
 warning: "before:bg-warning",
 destructive: "before:bg-destructive",
} as const;

/**
 * One figure, read at a glance.
 *
 * The previous version was a 12px-padded card carrying a 48px tinted icon
 * tile beside the number — the icon repeated what the label already said,
 * and the chrome meant four tiles filled a third of the viewport on an
 * operations screen. This is the figure, its label, and a state rule down
 * the leading edge when (and only when) the figure needs acting on.
 */
export function StatCard({
 title,
 value,
 isLoading,
 isError,
 hint,
 tone = "primary",
}: {
 title: string;
 /** Kept for the existing call sites; no longer rendered. The label is
 * the identifier, and a glyph repeating it is decoration. */
 icon?: LucideIcon;
 value: number | string | undefined;
 isLoading: boolean;
 /** The figure could not be fetched. Renders an em dash instead of the
  * `value ?? 0` below, because a tile that cannot reach the server was
  * otherwise indistinguishable from one reporting a true zero -- on the
  * dashboard that turned an outage into "0 check-ins, 0 revenue, 0
  * members at risk", which reads as a quiet day rather than a fault. */
 isError?: boolean;
 hint?: string;
 tone?: "primary" | "success" | "warning" | "destructive";
}) {
 // A zero is not a problem, whatever tone the page asked for.
 // "Expired: 0", "Low stock: 0" and "Refunded: \u20b9 0.00" were each
 // painting a state rule and coloured digits over the good news -- and
 // once several tiles on a screen are tinted, none of them reads as
 // needing attention, which is the only thing colour is for here.
 // Tested on the rendered value, not a number, because pages pass these
 // pre-formatted ("\u20b9 0.00", "0 due").
 const isZero = value === undefined || value === null || !/[1-9]/.test(String(value));
 const effectiveTone =
 isZero && (tone === "warning" || tone === "destructive") ? "primary" : tone;
 const flagged = effectiveTone === "warning" || effectiveTone === "destructive";

 return (
 <div
 className={cn( "relative min-w-0 rounded-lg border border-border bg-card px-4 py-3",
 flagged && "before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:content-['']",
 TONE_RULE[effectiveTone],
 )}
 >
 <p className="truncate text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
 {title}
 </p>
 {isLoading ? (
 <Skeleton
 className="mt-1.5 h-7 w-20 rounded"
 aria-label={`Loading ${title}`}
 />
 ) : isError ? (
 <p
 className="mt-0.5 truncate text-[1.625rem] font-semibold leading-tight tracking-tight text-muted-foreground"
 title={`${title} could not be loaded`}
 >
 <span aria-hidden="true">&mdash;</span>
 <span className="sr-only">Could not be loaded</span>
 </p>
 ) : (
 <p
 className={cn( "mt-0.5 truncate text-[1.625rem] font-semibold leading-tight tracking-tight tabular-nums",
 effectiveTone === "destructive" && "text-destructive",
 effectiveTone === "warning" && "text-warning",
 )}
 >
 {value ?? 0}
 </p>
 )}
 {hint ? (
 <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>
 ) : null}
 </div>
 );
}

/**
 * Maps the ad-hoc tone vocabularies the pages grew — "green", "amber",
 * "violet", "cyan", "rose" and friends — onto the four states a tile can
 * actually be in. Fourteen pages each defined their own `Metric` with its
 * own palette; this lets them all delegate here without touching a single
 * call site.
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

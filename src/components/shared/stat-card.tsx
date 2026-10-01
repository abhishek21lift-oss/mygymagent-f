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
 *
 * `stat-tile` adds the finish: a diagonal wash off the section hue, 2px
 * of that hue across the top, real elevation and a 1px lift on hover.
 * All of it is background and shadow, so the tile is the same height it
 * was. The leading edge stays bare because the state rule lives there —
 * a tile that is merely a number must not be wearing anything a tile
 * that needs acting on wears.
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
 className={cn( "stat-tile @container min-w-0 overflow-hidden rounded-2xl border border-border px-5 py-4",
 flagged && "before:absolute before:inset-y-3 before:left-0 before:w-1 before:rounded-full before:content-['']",
 TONE_RULE[effectiveTone],
 )}
 >
 <p
 className="text-[11px] font-bold uppercase leading-snug tracking-[0.1em] [overflow-wrap:anywhere]"
 style={{ color: "var(--section-ink)" }}
 >
 {title}
 </p>
 {isLoading ? (
 <Skeleton
 className="mt-2 h-8 w-20 rounded-lg"
 aria-label={`Loading ${title}`}
 />
 ) : isError ? (
 <p
 className="mt-1 text-[1.75rem] font-bold leading-tight tracking-[-0.03em] text-muted-foreground"
 title={`${title} could not be loaded`}
 >
 <span aria-hidden="true">&mdash;</span>
 <span className="sr-only">Could not be loaded</span>
 </p>
 ) : (
 <p
 // Sized to the tile, never cut: a two-column phone grid gave
 // "₹ 1,55,073.99" about 130px, and `truncate` showed "₹ 1,55,0…".
 // The figure shrinks with the tile's own width (container query
 // units) and, as a last resort, wraps rather than hides.
 className={cn( "mt-1 font-bold leading-tight tracking-[-0.03em] tabular-nums [overflow-wrap:anywhere]",
 // A long figure starts smaller so it stays on one line.
 String(value ?? 0).length > 9
 ? "text-[clamp(1rem,9cqi,1.75rem)]"
 : "text-[clamp(1.125rem,11cqi,1.75rem)]",
 effectiveTone === "destructive" && "text-destructive",
 effectiveTone === "warning" && "text-warning",
 )}
 >
 {/* Keep a currency sign with its amount if it ever wraps. */}
 {typeof value === "string" ? value.replace(/^(\D{1,3}) (?=\d)/, "$1\u00a0") : (value ?? 0)}
 </p>
 )}
 {hint ? (
 <p className="mt-0.5 text-xs text-muted-foreground [overflow-wrap:anywhere]">{hint}</p>
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

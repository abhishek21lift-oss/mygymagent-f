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
  hint,
  tone = "primary",
}: {
  title: string;
  /** Kept for the existing call sites; no longer rendered. The label is
   * the identifier, and a glyph repeating it is decoration. */
  icon?: LucideIcon;
  value: number | string | undefined;
  isLoading: boolean;
  hint?: string;
  tone?: "primary" | "success" | "warning" | "destructive";
}) {
  const flagged = tone === "warning" || tone === "destructive";

  return (
    <div
      className={cn(
        "relative min-w-0 rounded-lg border border-border bg-card px-4 py-3",
        flagged &&
          "before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:content-['']",
        TONE_RULE[tone],
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
      ) : (
        <p
          className={cn(
            "mt-0.5 truncate text-[1.625rem] font-semibold leading-tight tracking-tight tabular-nums",
            tone === "destructive" && "text-destructive",
            tone === "warning" && "text-warning",
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

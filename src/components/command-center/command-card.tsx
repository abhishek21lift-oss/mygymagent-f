import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { CardResult, CardStatus } from "@/lib/hooks/use-command-center";

/**
 * One telemetry card, with its verdict stated before its numbers.
 *
 * ── The rule this exists to enforce ─────────────────────────────────────────
 *
 * A card must never let "unavailable" read as "fine". Three states, three
 * visibly different things:
 *
 *  - `ok`         — the number, in ink.
 *  - `degraded`   — the number, plus a warning edge and the reason.
 *  - `unavailable` — NO number at all. An em dash, the reason, and no
 *    figure behind it, because `value` is null and rendering `?? 0` here
 *    would invent a measurement nobody took.
 *
 * That last one is why this is a component rather than a `<StatCard>` with a
 * `tone` prop: StatCard's zero-suppression logic is about "a zero is not a
 * problem", which is the opposite concern from "there is no zero".
 */

const STATUS_STYLE: Record<CardStatus, { edge: string; chip: string; label: string }> = {
  ok: {
    edge: "before:bg-emerald-500",
    chip: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    label: "Healthy",
  },
  degraded: {
    edge: "before:bg-amber-500",
    chip: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
    label: "Degraded",
  },
  unavailable: {
    // Deliberately not red. Unavailable means "we could not measure this",
    // which is not the same as "this is broken" — and painting it red would
    // train an operator to ignore the one card that genuinely is red.
    edge: "before:bg-slate-400",
    chip: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
    label: "Unavailable",
  },
}

export function StatusChip({ status }: { status: CardStatus }) {
  const style = STATUS_STYLE[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        style.chip,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full",
          status === "ok" && "bg-emerald-500",
          status === "degraded" && "bg-amber-500",
          status === "unavailable" && "bg-slate-400",
        )}
      />
      {style.label}
    </span>
  )
}

export function CommandCard({
  title,
  description,
  card,
  isStale,
  children,
}: {
  title: string
  description?: string
  card: CardResult<unknown> | undefined
  /** The reading is older than it should be; say so rather than trust it. */
  isStale?: boolean
  children: ReactNode
}) {
  const status: CardStatus = card?.status ?? "unavailable"
  const unavailable = status === "unavailable"

  return (
    <section
      aria-label={title}
      className={cn(
        "glass-card relative overflow-hidden rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm backdrop-blur-xl",
        "before:absolute before:inset-y-4 before:left-0 before:w-1 before:rounded-full before:content-['']",
        STATUS_STYLE[status].edge,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            {title}
          </h3>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {isStale && !unavailable ? (
            <span className="rounded-full bg-amber-500/12 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
              Stale
            </span>
          ) : null}
          <StatusChip status={status} />
        </div>
      </header>

      {unavailable ? (
        <div className="mt-4" data-testid="card-unavailable">
          <p
            className="text-[1.75rem] font-bold leading-tight tracking-[-0.03em] text-muted-foreground"
            title={`${title} could not be measured`}
          >
            <span aria-hidden="true">&mdash;</span>
            <span className="sr-only">Unavailable</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground [overflow-wrap:anywhere]">
            {card?.unavailableReason ?? "No reading was returned."}
          </p>
        </div>
      ) : (
        <div className="mt-4">{children}</div>
      )}
    </section>
  )
}

/**
 * A figure inside a card. Returns an em dash for null so a caller cannot
 * accidentally render `value ?? 0` — that single `??` is the whole failure
 * mode this file is guarding against.
 */
export function Metric({
  label,
  value,
  unit,
  tone,
}: {
  label: string
  value: number | string | null
  unit?: string
  tone?: "default" | "warning" | "destructive"
}) {
  const unknown = value === null || value === undefined
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>
      {unknown ? (
        <p className="mt-0.5 text-lg font-bold text-muted-foreground">
          <span aria-hidden="true">&mdash;</span>
          <span className="sr-only">Not measured</span>
        </p>
      ) : (
        <p
          className={cn(
            "mt-0.5 text-lg font-bold tabular-nums leading-tight [overflow-wrap:anywhere]",
            tone === "destructive" && "text-destructive",
            tone === "warning" && "text-warning",
          )}
        >
          {value}
          {unit ? (
            <span className="ml-0.5 text-xs font-medium text-muted-foreground">
              {unit}
            </span>
          ) : null}
        </p>
      )}
    </div>
  )
}

/**
 * A horizontal depth bar per queue.
 *
 * Hand-rolled rather than a charting library: the repo has no chart
 * dependency today (revenue charts are plain SVG in `lib/revenue-chart.ts`),
 * and this is four rectangles. Adding recharts for it would be the only
 * reason the bundle grows.
 */
export function QueueBars({
  rows,
}: {
  rows: { name: string; waiting: number; failed: number; unavailable?: boolean }[]
}) {
  const peak = Math.max(1, ...rows.map((r) => r.waiting + r.failed))
  return (
    <ul className="space-y-2.5">
      {rows.map((row) => (
        <li key={row.name} className="min-w-0">
          <div className="flex items-baseline justify-between gap-2 text-xs">
            <span className="truncate font-medium text-foreground">{row.name}</span>
            {row.unavailable ? (
              <span className="shrink-0 text-muted-foreground">unavailable</span>
            ) : (
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {row.waiting} waiting
                {row.failed > 0 ? ` · ${row.failed} failed` : ""}
              </span>
            )}
          </div>
          <div
            className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"
            role="presentation"
          >
            {row.unavailable ? null : (
              <div className="flex h-full">
                <div
                  className="h-full bg-sky-500"
                  style={{ width: `${(row.waiting / peak) * 100}%` }}
                />
                <div
                  className="h-full bg-rose-500"
                  style={{ width: `${(row.failed / peak) * 100}%` }}
                />
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

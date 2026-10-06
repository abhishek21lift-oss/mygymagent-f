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
 */

const STATUS_ACCENT: Record<CardStatus, { glow: string; border: string; chip: string; label: string }> = {
  ok: {
    glow: "from-emerald-500/10 via-teal-500/5 to-transparent",
    border: "border-border/80 hover:border-emerald-500/40",
    chip: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/20",
    label: "Healthy",
  },
  degraded: {
    glow: "from-amber-500/10 via-orange-500/5 to-transparent",
    border: "border-amber-500/30 hover:border-amber-500/50",
    chip: "bg-amber-500/12 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/20",
    label: "Degraded",
  },
  unavailable: {
    glow: "from-slate-500/5 via-zinc-500/5 to-transparent",
    border: "border-border/80 hover:border-border",
    chip: "bg-slate-500/10 text-slate-600 dark:text-slate-300 ring-1 ring-slate-500/20",
    label: "Unavailable",
  },
};

export function StatusChip({ status }: { status: CardStatus }) {
  const style = STATUS_ACCENT[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold shadow-2xs",
        style.chip,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full",
          status === "ok" && "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]",
          status === "degraded" && "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]",
          status === "unavailable" && "bg-slate-400",
        )}
      />
      {style.label}
    </span>
  );
}

export function CommandCard({
  title,
  description,
  card,
  isStale,
  children,
}: {
  title: string;
  description?: string;
  card: CardResult<unknown> | undefined;
  /** The reading is older than it should be; say so rather than trust it. */
  isStale?: boolean;
  children: ReactNode;
}) {
  const status: CardStatus = card?.status ?? "unavailable";
  const unavailable = status === "unavailable";
  const meta = STATUS_ACCENT[status];

  return (
    <section
      aria-label={title}
      className={cn(
        "group relative overflow-hidden rounded-3xl border bg-card/90 p-5 shadow-sm backdrop-blur-xl transition-all duration-300 hover:shadow-md",
        meta.border,
      )}
    >
      {/* Ambient status light aura */}
      <div
        className={cn(
          "pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-br opacity-40 transition-opacity duration-300 group-hover:opacity-100",
          meta.glow,
        )}
      />

      <div className="relative z-1">
        <header className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-bold tracking-tight text-foreground">
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
              <span className="rounded-full bg-amber-500/12 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-300">
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
      </div>
    </section>
  );
}

/**
 * A figure inside a card. Returns an em dash for null so a caller cannot
 * accidentally render `value ?? 0`.
 */
export function Metric({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: number | string | null;
  unit?: string;
  tone?: "default" | "warning" | "destructive";
}) {
  const unknown = value === null || value === undefined;
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>
      {unknown ? (
        <p className="mt-0.5 text-xl font-bold text-muted-foreground">
          <span aria-hidden="true">&mdash;</span>
          <span className="sr-only">Not measured</span>
        </p>
      ) : (
        <p
          className={cn(
            "mt-0.5 text-xl font-black tabular-nums leading-tight tracking-tight [overflow-wrap:anywhere]",
            tone === "destructive" && "text-destructive",
            tone === "warning" && "text-warning",
            !tone || tone === "default" ? "text-foreground" : null,
          )}
        >
          {value}
          {unit ? (
            <span className="ml-1 text-xs font-semibold text-muted-foreground">
              {unit}
            </span>
          ) : null}
        </p>
      )}
    </div>
  );
}

/**
 * A horizontal depth bar per queue.
 */
export function QueueBars({
  rows,
}: {
  rows: { name: string; waiting: number; failed: number; unavailable?: boolean }[];
}) {
  const peak = Math.max(1, ...rows.map((r) => r.waiting + r.failed));
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.name} className="min-w-0">
          <div className="flex items-baseline justify-between gap-2 text-xs">
            <span className="truncate font-semibold text-foreground">{row.name}</span>
            {row.unavailable ? (
              <span className="shrink-0 text-muted-foreground">unavailable</span>
            ) : (
              <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                {row.waiting} waiting{row.failed > 0 ? ` · ${row.failed} failed` : ""}
              </span>
            )}
          </div>
          <div
            className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted/80 shadow-2xs"
            role="presentation"
          >
            {row.unavailable ? null : (
              <div className="flex h-full">
                <div
                  className="h-full rounded-l-full bg-gradient-to-r from-sky-400 to-indigo-500 transition-all duration-500"
                  style={{ width: `${(row.waiting / peak) * 100}%` }}
                />
                <div
                  className="h-full rounded-r-full bg-gradient-to-r from-rose-500 to-red-600 transition-all duration-500"
                  style={{ width: `${(row.failed / peak) * 100}%` }}
                />
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CardResult, CardStatus } from "@/lib/hooks/use-command-center";
import type { Accent } from "@/lib/section-accent";

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
 * Visually it is an Aurora tile: a ground tinted with the card's own hue,
 * an app-icon glyph, and a status pill. Unavailable is grey, never red: a
 * blind spot is not a fault.
 */

const STATUS_META: Record<CardStatus, { label: string; dot: string; chip: string }> = {
  ok: {
    label: "Healthy",
    dot: "var(--success)",
    chip: "bg-success/12 text-success ring-1 ring-success/25",
  },
  degraded: {
    label: "Degraded",
    dot: "var(--warning)",
    chip: "bg-warning/14 text-warning ring-1 ring-warning/30",
  },
  unavailable: {
    label: "Unavailable",
    dot: "var(--muted-foreground)",
    chip: "bg-muted text-muted-foreground ring-1 ring-border",
  },
};

/** The two gradient stops for an accent, as CSS variables. */
export function accentVars(accent: Accent): CSSProperties {
  return {
    "--kpi-grad-1": `var(--a-${accent}-grad-1)`,
    "--kpi-grad-2": `var(--a-${accent}-grad-2)`,
    "--kpi-ink": `var(--a-${accent}-ink)`,
  } as CSSProperties;
}

export function StatusChip({ status }: { status: CardStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold",
        meta.chip,
      )}
    >
      <span
        aria-hidden="true"
        className="size-1.5 rounded-full"
        style={{ background: meta.dot, boxShadow: `0 0 0 3px color-mix(in oklab, ${meta.dot} 22%, transparent)` }}
      />
      {meta.label}
    </span>
  );
}

/** An app-icon squircle in the card's hue. */
export function GlyphTile({ icon: Icon, size = "md" }: { icon: LucideIcon; size?: "md" | "lg" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center text-white",
        size === "lg" ? "size-12 rounded-[1rem]" : "size-10 rounded-[0.85rem]",
      )}
      style={{
        background:
          "radial-gradient(80% 70% at 30% 15%, rgb(255 255 255 / 0.3), transparent 60%), linear-gradient(150deg, var(--kpi-grad-1), var(--kpi-grad-2))",
        boxShadow:
          "inset 0 1px 0 rgb(255 255 255 / 0.32), 0 10px 20px -10px color-mix(in oklab, var(--kpi-grad-1) 80%, transparent)",
      }}
    >
      <Icon className={size === "lg" ? "size-6" : "size-5"} strokeWidth={2} />
    </span>
  );
}

export function CommandCard({
  title,
  description,
  card,
  isStale,
  icon,
  accent = "indigo",
  className,
  children,
}: {
  title: string;
  description?: string;
  card: CardResult<unknown> | undefined;
  /** The reading is older than it should be; say so rather than trust it. */
  isStale?: boolean;
  icon?: LucideIcon;
  accent?: Accent;
  className?: string;
  children: ReactNode;
}) {
  const status: CardStatus = card?.status ?? "unavailable";
  const unavailable = status === "unavailable";

  return (
    <section
      aria-label={title}
      style={accentVars(accent)}
      className={cn(
        "relative min-w-0 overflow-hidden rounded-[1.75rem] border p-5 shadow-[var(--shadow-card)] transition-shadow duration-300 hover:shadow-[var(--shadow-raised)] sm:p-6",
        status === "degraded"
          ? "border-warning/40"
          : "border-[color-mix(in_oklab,var(--kpi-grad-1)_16%,var(--border))]",
        className,
      )}
    >
      {/* Tinted ground: the card's own hue, falling away from the corner. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: unavailable
            ? "var(--card)"
            : "radial-gradient(110% 80% at 100% 0%, color-mix(in oklab, var(--kpi-grad-2) 14%, transparent), transparent 60%), linear-gradient(165deg, color-mix(in oklab, var(--kpi-grad-1) 8%, var(--card)) 0%, var(--card) 70%)",
        }}
      />
      {status === "degraded" ? (
        <span aria-hidden="true" className="absolute inset-y-5 left-0 w-[3px] rounded-full bg-warning" />
      ) : null}

      <div className="relative">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {icon ? <GlyphTile icon={icon} /> : null}
            <div className="min-w-0">
              <h3 className="text-base font-bold tracking-tight text-foreground">{title}</h3>
              {description ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {isStale && !unavailable ? (
              <span className="rounded-full bg-warning/14 px-2.5 py-1 text-[11px] font-semibold text-warning ring-1 ring-warning/30">
                Stale
              </span>
            ) : null}
            <StatusChip status={status} />
          </div>
        </header>

        {unavailable ? (
          <div className="mt-5" data-testid="card-unavailable">
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
          <div className="mt-5">{children}</div>
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
  size = "md",
}: {
  label: string;
  value: number | string | null;
  unit?: string;
  tone?: "default" | "warning" | "destructive" | "success";
  size?: "md" | "lg";
}) {
  const unknown = value === null || value === undefined;
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      {unknown ? (
        <p className={cn("mt-1 font-bold text-muted-foreground", size === "lg" ? "text-3xl" : "text-xl")}>
          <span aria-hidden="true">&mdash;</span>
          <span className="sr-only">Not measured</span>
        </p>
      ) : (
        <p
          className={cn(
            "mt-1 font-extrabold tabular-nums leading-none tracking-[-0.04em] break-words",
            size === "lg" ? "text-3xl sm:text-4xl" : "text-lg sm:text-2xl",
            tone === "destructive" && "text-destructive",
            tone === "warning" && "text-warning",
            tone === "success" && "text-success",
            !tone || tone === "default" ? "text-foreground" : null,
          )}
        >
          {value}
          {unit ? <span className="ml-1 inline-block whitespace-nowrap text-xs font-semibold tracking-normal text-muted-foreground">{unit}</span> : null}
        </p>
      )}
    </div>
  );
}

/** A soft well that groups one figure inside a card. */
export function MetricWell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-2xl border border-border/60 bg-[color-mix(in_oklab,var(--card)_70%,transparent)] p-3.5 backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * One bar split into coloured segments, with a legend that carries the
 * numbers in text (so the colours are never the only channel).
 */
export function StackedBar({
  label,
  segments,
}: {
  label: string;
  segments: { label: string; value: number; color: string }[];
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  return (
    <div className="min-w-0">
      <div
        role="img"
        aria-label={`${label}: ${segments.map((s) => `${s.label} ${s.value}`).join(", ")}`}
        className="flex h-2.5 overflow-hidden rounded-full bg-[var(--surface-sunken)]"
      >
        {total > 0
          ? segments
              .filter((s) => s.value > 0)
              .map((s) => (
                <span
                  key={s.label}
                  className="h-full first:rounded-l-full last:rounded-r-full"
                  style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
                />
              ))
          : null}
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
        {segments.map((s) => (
          <li key={s.label} className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span aria-hidden="true" className="size-2 rounded-full" style={{ background: s.color }} />
            {s.label}
            <span className="font-semibold tabular-nums text-foreground">{s.value.toLocaleString("en-IN")}</span>
          </li>
        ))}
      </ul>
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
    <ul className="space-y-3.5">
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
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--surface-sunken)]" role="presentation">
            {row.unavailable ? null : (
              <div className="flex h-full">
                <div
                  className="h-full rounded-l-full transition-all duration-500 motion-reduce:transition-none"
                  style={{
                    width: `${(row.waiting / peak) * 100}%`,
                    background: "linear-gradient(90deg, var(--a-cyan-grad-1), var(--a-blue-grad-1))",
                  }}
                />
                <div
                  className="h-full rounded-r-full transition-all duration-500 motion-reduce:transition-none"
                  style={{
                    width: `${(row.failed / peak) * 100}%`,
                    background: "linear-gradient(90deg, var(--a-rose-grad-1), var(--a-orange-grad-1))",
                  }}
                />
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

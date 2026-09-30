"use client";

import * as React from "react";
import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import type { Accent } from "@/lib/section-accent";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * The member profile's building blocks.
 *
 * Every colour here comes from the app's accent tokens (`--a-<hue>-*` in
 * globals.css), which are defined once per theme and measured for contrast
 * there -- so a tile is as legible in dark mode as in light, and nothing in
 * this file branches on the theme. A component takes a hue name and
 * re-points the local `--t-*` variables at it.
 */
export function accentVars(accent: Accent): CSSProperties {
  return {
    "--t": `var(--a-${accent})`,
    "--t-ink": `var(--a-${accent}-ink)`,
    "--t-tint": `var(--a-${accent}-tint)`,
    "--t-fill": `var(--a-${accent}-fill)`,
    "--t-g1": `var(--a-${accent}-grad-1)`,
    "--t-g2": `var(--a-${accent}-grad-2)`,
  } as CSSProperties;
}

const GRADIENT: CSSProperties = { backgroundImage: "linear-gradient(135deg, var(--t-g1), var(--t-g2))" };

/** The raised surface every block on the profile sits on -- the same
 * radius, border and elevation as the shared `Panel`. */
export const surfaceClass = "rounded-3xl border border-border/60 bg-card shadow-[var(--shadow-card)]";

/** A glyph on a small gradient squircle -- the app-icon look, in the tile's hue. */
export function GlyphBadge({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <span
      aria-hidden="true"
      style={GRADIENT}
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-[10px] text-white shadow-sm shadow-black/10",
        className,
      )}
    >
      <Icon className="size-4" strokeWidth={2.25} />
    </span>
  );
}

/** One figure, widget-style: a glyph and label, the figure large, one line of context. */
export function GlanceTile({
  accent,
  icon,
  label,
  value,
  caption,
  isLoading,
}: {
  accent: Accent;
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  caption?: ReactNode;
  isLoading?: boolean;
}) {
  return (
    <div style={accentVars(accent)} className={cn(surfaceClass, "relative isolate overflow-hidden p-4 sm:p-5")}>
      {/* A soft pool of the hue in the corner: colour as light, not as a fill
          behind the figure, which has to stay high-contrast. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-10 -z-10 size-28 rounded-full opacity-25 blur-2xl dark:opacity-30"
        style={{ background: "var(--t)" }}
      />
      <div className="flex items-center gap-2">
        <GlyphBadge icon={icon} />
        <span className="truncate text-[13px] font-medium text-muted-foreground">{label}</span>
      </div>
      {isLoading ? (
        <>
          <Skeleton className="mt-3 h-7 w-20 rounded-lg" />
          <Skeleton className="mt-2 h-3 w-24 rounded" />
        </>
      ) : (
        <>
          <p className="mt-3 truncate text-[26px] font-semibold leading-none tracking-tight tabular-nums text-foreground sm:text-[28px]">
            {value}
          </p>
          {caption ? <p className="mt-2 truncate text-xs text-muted-foreground">{caption}</p> : null}
        </>
      )}
    </div>
  );
}

/** A titled block of the profile. */
export function ProfileSection({
  id,
  title,
  icon,
  accent,
  action,
  children,
  className,
}: {
  id: string;
  title: string;
  icon: LucideIcon;
  accent: Accent;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section aria-labelledby={id} style={accentVars(accent)} className={cn(surfaceClass, "p-4 sm:p-6", className)}>
      <div className="mb-4 flex items-center gap-2.5">
        <GlyphBadge icon={icon} />
        <h2 id={id} className="flex-1 text-[17px] font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/**
 * A round action with its label underneath, as on an iPhone contact card.
 * An `href` makes it a link (tel:, sms:, mailto:); without one it is a
 * button. `disabled` keeps it in the row, so the row doesn't reflow between
 * members, but greyed and unfocusable.
 */
export const QuickAction = React.forwardRef<
  HTMLElement,
  {
    accent: Accent;
    icon: LucideIcon;
    label: string;
    href?: string;
    disabled?: boolean;
    disabledReason?: string;
  } & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "disabled">
>(function QuickAction({ accent, icon: Icon, label, href, disabled, disabledReason, className, ...rest }, ref) {
  const inner = (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "flex size-12 items-center justify-center rounded-full transition duration-200",
          disabled
            ? "bg-muted text-muted-foreground/60"
            : "bg-[var(--t-tint)] text-[var(--t-ink)] group-hover:bg-[var(--t-fill)] group-hover:text-white group-active:scale-95",
        )}
      >
        <Icon className="size-5" strokeWidth={2.1} />
      </span>
      <span className={cn("text-[11px] font-medium", disabled ? "text-muted-foreground/60" : "text-muted-foreground")}>
        {label}
      </span>
    </>
  );
  const base = cn(
    "group flex w-16 flex-col items-center gap-1.5 rounded-2xl py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring",
    disabled && "cursor-not-allowed",
    className,
  );

  if (disabled) {
    return (
      <span
        ref={ref as React.Ref<HTMLSpanElement>}
        role="link"
        aria-disabled="true"
        aria-label={disabledReason ? `${label} (${disabledReason})` : label}
        title={disabledReason}
        style={accentVars(accent)}
        className={base}
      >
        {inner}
      </span>
    );
  }
  if (href) {
    return (
      <a ref={ref as React.Ref<HTMLAnchorElement>} href={href} style={accentVars(accent)} className={base}>
        {inner}
      </a>
    );
  }
  return (
    <button ref={ref as React.Ref<HTMLButtonElement>} type="button" style={accentVars(accent)} className={base} {...rest}>
      {inner}
    </button>
  );
});

/**
 * Days left on the membership as an activity ring: the arc is the share of
 * the term still to run, so it empties as the end date approaches.
 */
export function TermRing({
  remaining,
  daysLeft,
  accent,
}: {
  /** 0-1, share of the term still to run. */
  remaining: number;
  daysLeft: number;
  accent: Accent;
}) {
  const size = 104;
  const stroke = 11;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const gradientId = React.useId();
  return (
    <div style={accentVars(accent)} className="relative size-[104px] shrink-0">
      <svg viewBox={`0 0 ${size} ${size}`} className="size-full -rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--t-g2)" />
            <stop offset="100%" stopColor="var(--t)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--t-tint)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - Math.min(1, Math.max(0, remaining)))}
          className="transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[26px] font-semibold leading-none tracking-tight tabular-nums text-foreground">{daysLeft}</span>
        <span className="mt-1 text-[11px] font-medium text-muted-foreground">{daysLeft === 1 ? "day left" : "days left"}</span>
      </div>
    </div>
  );
}

/** Status as a small pill in its own hue. */
export function StatusPill({ accent, children }: { accent: Accent; children: ReactNode }) {
  return (
    <span
      style={accentVars(accent)}
      className="inline-flex items-center gap-1.5 rounded-full bg-[var(--t-tint)] px-2.5 py-1 text-xs font-semibold text-[var(--t-ink)]"
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-[var(--t)]" />
      {children}
    </span>
  );
}

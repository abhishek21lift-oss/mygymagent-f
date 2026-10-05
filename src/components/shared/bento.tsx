"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { accentClass } from "@/lib/design-tokens";
import type { Accent } from "@/lib/section-accent";

/**
 * Named bento + glass primitives for the Soft-Glass Bento language.
 *
 * Thin wrappers over the existing token layer in `globals.css`
 * (`.glass`, `.kpi-card`, `.quick-action-tile`, `.section-title` and the
 * `[data-slot=card]` treatment) — no new visual islands, so dark mode,
 * section hues and reduced-motion keep working unchanged.
 */

/* --- BentoGrid: responsive bento layout. 2-col on phones by design. --- */
const bentoGridVariants = cva("grid gap-3", {
  variants: {
    columns: {
      2: "grid-cols-2",
      3: "grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-2 xl:grid-cols-4",
      6: "grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
    },
  },
  defaultVariants: { columns: 4 },
});

export function BentoGrid({
  columns,
  label = "Content grid",
  className,
  children,
}: {
  columns?: 2 | 3 | 4 | 6;
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={label} className={cn(bentoGridVariants({ columns }), className)}>
      {children}
    </section>
  );
}

/* --- BentoCard: opaque card with gradient top-cap (== .kpi-card). --- */
export function BentoCard({
  accent,
  className,
  style,
  children,
  ...rest
}: {
  accent?: Accent;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="card"
      className={cn("kpi-card", accent && accentClass[accent], className)}
      style={style}
      {...rest}
    >
      {children}
    </div>
  );
}

/* --- GlassCard: frosted translucent surface for chrome/overlays. --- */
export function GlassCard({
  strong,
  className,
  children,
  ...rest
}: {
  strong?: boolean;
  className?: string;
  children: ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(strong ? "glass-strong" : "glass", "rounded-3xl", className)} {...rest}>
      {children}
    </div>
  );
}

/* --- GradientIcon: colorful rounded-square tile carrying a glyph. --- */
export function GradientIcon({
  icon: Icon,
  accent,
  size = "md",
  className,
}: {
  icon: LucideIcon;
  accent?: Accent;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      data-accent={accent}
      style={
        accent
          ? ({
              "--kpi-grad-1": `var(--a-${accent}-grad-1)`,
              "--kpi-grad-2": `var(--a-${accent}-grad-2)`,
            } as CSSProperties)
          : undefined
      }
      className={cn(
        "kpi-icon-tile",
        size === "sm" && "quick-action-icon",
        size === "lg" && "hero-banner-icon-tile",
        className,
      )}
    >
      <Icon className={size === "lg" ? "size-8" : size === "sm" ? "size-4" : "size-5"} strokeWidth={2} />
    </span>
  );
}

/* --- QuickActionCard: tappable tile (link or button). --- */
export function QuickActionCard({
  icon: Icon,
  label,
  hint,
  accent,
  href,
  onClick,
  badge,
  className,
}: {
  icon: LucideIcon;
  label: string;
  hint?: string;
  accent?: Accent;
  href?: string;
  onClick?: () => void;
  /** Optional count/status pill in the top-right corner. */
  badge?: ReactNode;
  className?: string;
}) {
  const inner = (
    <>
      <span
        aria-hidden="true"
        style={
          accent
            ? ({
                "--kpi-grad-1": `var(--a-${accent}-grad-1)`,
                "--kpi-grad-2": `var(--a-${accent}-grad-2)`,
              } as CSSProperties)
            : undefined
        }
        className={cn("quick-action-icon", accent && accentClass[accent])}
      >
        <Icon className="size-5" strokeWidth={2} />
      </span>
      {/* Right padding reserves room for the absolute badge so a long
          label never slides underneath the count on narrow tiles. */}
      <span className={cn("min-w-0", badge && "pr-10")}>
        <span className="block truncate text-sm font-semibold tracking-tight text-foreground">
          {label}
        </span>
        {hint && <span className="block truncate text-xs text-muted-foreground">{hint}</span>}
      </span>
    </>
  );
  const cls = cn("quick-action-tile", accent && accentClass[accent], "min-h-11", className);
  const badgeNode = badge ? (
    <span className="absolute right-3 top-3 rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold tabular-nums text-muted-foreground">
      {badge}
    </span>
  ) : null;
  if (href) {
    return (
      <Link href={href} className={cls} aria-label={label}>
        {badgeNode}
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cn(cls, "touch-manipulation")} aria-label={label}>
      {badgeNode}
      {inner}
    </button>
  );
}

/* --- SectionHeader: iOS-style dot-led heading (== .section-title). --- */
export function SectionHeader({
  title,
  action,
  className,
}: {
  title: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-2", className)}>
      <h2 className="section-title min-w-0 flex-1 [overflow-wrap:anywhere]">{title}</h2>
      {action}
    </div>
  );
}

export type { VariantProps };

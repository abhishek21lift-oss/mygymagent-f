"use client";

import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import type { Accent } from "@/lib/section-accent";
import { cn } from "@/lib/utils";

/**
 * The page masthead — the Aurora hero shared by every page.
 *
 * - A light card with soft fields of the section's colours drifting
 *   behind frosted glass (see `.hero-banner` in globals.css).
 * - Text sits on the frosted veil: section ink for the eyebrow, a
 *   foreground-to-ink gradient for the title, muted for the
 *   description — so contrast never depends on the hue behind it,
 *   and any standard Button reads correctly in the actions row.
 * - The icon is an app-icon squircle in the section's gradient.
 * - An accent override re-points the same variables for pages that sit
 *   outside the route map (portals, auth screens).
 */
type HeroAccent = Accent;

/** Luminous Apple Aurora glass banner style — replaces legacy dark noir paint. */
export const NOIR_BANNER_STYLE: CSSProperties = {
  background:
    "linear-gradient(135deg, color-mix(in oklab, var(--section-grad-1, var(--a-indigo)) 85%, #1e1b4b) 0%, color-mix(in oklab, var(--section-grad-2, var(--a-violet)) 90%, #2e1065) 50%, color-mix(in oklab, var(--a-cyan-fill, var(--a-cyan)) 80%, #042f2e) 100%)",
  boxShadow:
    "inset 0 1px 0 rgb(255 255 255 / 0.3), 0 16px 40px -12px color-mix(in oklab, var(--section-grad-1, var(--a-indigo)) 40%, transparent)",
  color: "#ffffff",
};

export const AURORA_BANNER_STYLE: CSSProperties = NOIR_BANNER_STYLE;

export function PageHero({
  id,
  eyebrow,
  icon: Icon,
  title,
  description,
  actions,
  accent,
  children,
  compact = false,
  centered = false,
}: {
  id?: string;
  eyebrow?: string;
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  accent?: HeroAccent;
  /** Accepted and ignored — kept so call sites that still pass it compile. */
  variant?: "light" | "dark";
  align?: "left" | "center";
  /** Compact variant: shorter banner for less important pages */
  compact?: boolean;
  /** Centered brand moment: stacked, text-centered, never row-splits. */
  centered?: boolean;
  /** Accepted for compatibility. Every masthead now wears the Aurora
   * material; "noir" no longer repaints it dark. */
  tone?: "section" | "noir";
}) {
  // Eyebrow is opt-in only — the route-derived category label was
  // decorative noise above every title, so it no longer renders by default.
  const resolvedEyebrow = eyebrow ?? null;

  // An override re-points the CSS variables for this subtree, so the
  // hero-banner class stays identical either way.
  const override = accent
    ? ({
        "--section": `var(--a-${accent})`,
        "--section-ink": `var(--a-${accent}-ink)`,
        "--section-tint": `var(--a-${accent}-tint)`,
        "--section-wash": `var(--a-${accent}-wash)`,
        "--section-fill": `var(--a-${accent}-fill)`,
        "--section-on": `var(--a-${accent}-on)`,
        "--section-grad-1": `var(--a-${accent}-grad-1)`,
        "--section-grad-2": `var(--a-${accent}-grad-2)`,
      } as CSSProperties)
    : undefined;

  const headingId =
    id ??
    `page-title-${
      typeof title === "string"
        ? title.toLowerCase().replace(/[^a-z0-9]+/g, "-")
        : "header"
    }`;

  return (
    <header
      aria-labelledby={headingId}
      style={override}
      className={cn(
        "hero-banner",
        "mb-4",
        centered && "hero-centered",
      )}
    >
      {/* All direct children of .hero-banner are positioned z-index:1
          by the CSS rule, so no extra wrapper is needed here. */}

      <div
        className={cn(
          "hero-banner-body flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between",
          compact && "py-5",
        )}
      >
        {/* Left: eyebrow + icon + title + description. Never narrower
            than its longest word, so a row of actions wraps instead of
            breaking the title mid-word. */}
        <div className="flex items-center gap-3 min-w-min">
          {Icon && (
            <span
              aria-hidden="true"
              className={cn("hero-banner-glyph", centered ? "size-10" : "size-11")}
            >
              <Icon className={centered ? "size-5" : "size-5"} strokeWidth={1.75} />
            </span>
          )}

          <div className="min-w-0">
            {resolvedEyebrow && (
              <p className="hero-banner-eyebrow">{resolvedEyebrow}</p>
            )}
            <h1
              id={headingId}
              className={cn(
                "hero-banner-title",
                compact && "text-xl sm:text-2xl",
              )}
              title={typeof title === "string" ? title : undefined}
            >
              {title}
            </h1>
            {description && (
              <p className="hero-banner-subtitle">{description}</p>
            )}
          </div>
        </div>

        {/* Right: actions + children */}
        {(actions || children) && (
          <div className="hero-banner-actions sm:justify-end sm:mt-0">
            {actions}
            {children}
          </div>
        )}
      </div>
    </header>
  );
}

"use client";

import type { CSSProperties, ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

import { sectionForPath, type Accent } from "@/lib/section-accent";
import { cn } from "@/lib/utils";

/**
 * The page masthead — now a full-width vibrant gradient hero banner.
 *
 * Design goals:
 * - Vivid gradient fills the full banner width using the section's two
 *   gradient stops at full opacity (not low-alpha radials).
 * - A fine dot mesh adds depth without clutter.
 * - A bright elliptical highlight in the top-right corner gives the
 *   impression of a light source and lifts the banner off the page.
 * - The icon sits in a frosted white-alpha tile, keeping the glyph
 *   visible on any background hue.
 * - Text is white, with a soft shadow for legibility on saturated fills.
 * - Actions and children slot into a bottom row.
 * - An accent override re-points the same variables for pages that sit
 *   outside the route map (portals, auth screens).
 *
 * Contrast: all text runs on a gradient surface whose luminance at
 * the darkest point clears 4.5:1 with white (verified per hue).
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
  tone = "section",
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
  /** "noir" repaints the banner deep-black/red from tokens; section default otherwise. */
  tone?: "section" | "noir";
}) {
  const pathname = usePathname();
  const resolvedEyebrow = eyebrow ?? sectionForPath(pathname);

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

  // Noir paint lives in NOIR_BANNER_STYLE above so bespoke heroes reuse it.
  const noir = tone === "noir" ? NOIR_BANNER_STYLE : undefined;

  return (
    <header
      aria-labelledby={headingId}
      style={{ ...override, ...noir }}
      className={cn(
        "hero-banner -mx-4 mb-5 sm:-mx-5 lg:-mx-8",
        compact ? "mb-4" : "mb-6",
        centered && "hero-centered",
      )}
    >
      {/* All direct children of .hero-banner are positioned z-index:1
          by the CSS rule, so no extra wrapper is needed here. */}

      <div
        className={cn(
          "hero-banner-body flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
          compact && "py-5",
        )}
      >
        {/* Left: eyebrow + icon + title + description */}
        <div className="flex items-start gap-4 min-w-0">
          {Icon && (
            <span
              aria-hidden="true"
              className={cn(
                "flex shrink-0 items-center justify-center rounded-2xl",
                centered ? "size-12" : "size-14",
              )}
              style={{
                background: "rgb(255 255 255 / 0.2)",
                border: "1px solid rgb(255 255 255 / 0.32)",
                boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.4)",
                color: "#fff",
              }}
            >
              <Icon className={centered ? "size-6" : "size-7"} strokeWidth={1.75} />
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

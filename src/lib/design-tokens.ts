/**
 * Design-token map for the Premium Apple Soft-Glass Bento system.
 *
 * Zero-runtime: every value is a `var(--…)` reference to the tokens
 * already defined in `src/app/globals.css` ("THE CULT CLIENT — Aurora").
 * Import names from here instead of hardcoding hex/oklch/radius/shadow
 * values inside components.
 */
import type { Accent } from "@/lib/section-accent";

export const ACCENTS: readonly Accent[] = [
  "indigo",
  "violet",
  "rose",
  "emerald",
  "amber",
  "cyan",
  "blue",
  "orange",
];

/** Per-card accent class consumed by `.kpi-card` / `.quick-action-tile`. */
export const accentClass: Record<Accent, string> = {
  indigo: "kpi-indigo",
  violet: "kpi-violet",
  rose: "kpi-rose",
  emerald: "kpi-emerald",
  amber: "kpi-amber",
  cyan: "kpi-cyan",
  blue: "kpi-blue",
  orange: "kpi-orange",
};

export const tokens = {
  surface: {
    page: "var(--background)",
    card: "var(--card)",
    raised: "var(--surface-raised)",
    sunken: "var(--surface-sunken)",
    hover: "var(--surface-hover)",
    popover: "var(--popover)",
  },
  glass: {
    bg: "var(--glass-bg)",
    bgStrong: "var(--glass-bg-strong)",
    bgThin: "var(--glass-bg-thin)",
    border: "var(--glass-border)",
    blur: "var(--glass-blur)",
    saturate: "var(--glass-saturate)",
  },
  radius: {
    sm: "var(--radius-sm)",
    md: "var(--radius-md)",
    lg: "var(--radius-lg)",
    xl: "var(--radius-xl)",
    "2xl": "var(--radius-2xl)",
    "3xl": "var(--radius-3xl)",
    pill: "9999px",
  },
  shadow: {
    card: "var(--shadow-card)",
    raised: "var(--shadow-raised)",
    float: "var(--shadow-float)",
    popover: "var(--shadow-popover)",
  },
  section: {
    solid: "var(--section)",
    ink: "var(--section-ink)",
    tint: "var(--section-tint)",
    wash: "var(--section-wash)",
    fill: "var(--section-fill)",
    on: "var(--section-on)",
    grad1: "var(--section-grad-1)",
    grad2: "var(--section-grad-2)",
  },
  motion: {
    fast: "var(--duration-fast)",
    base: "var(--duration-base)",
    slow: "var(--duration-slow)",
    easeOut: "var(--ease-out)",
    easeSpring: "var(--ease-spring)",
  },
} as const;

"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

import { accentForPath, sectionForPath, type Accent } from "@/lib/section-accent";
import { cn } from "@/lib/utils";

/**
 * The page masthead.
 *
 * Two requirements that pull against each other, and the shape below is
 * what satisfies both: it should look premium and carry colour, and it
 * should not eat the screen. The version before this one resolved that
 * tension by deleting the colour -- it had been a bordered card with a
 * 56px tinted icon tile costing ~90px on every route, and the fix was to
 * strip it back to a hairline rule. That bought density and lost every
 * bit of identity a page had.
 *
 * This keeps the density. The whole band is ~76px: a 36px glyph tile, a
 * title, one line of context, and the actions on the same row. What it
 * adds is a wash that bleeds from the accent and fades out before the
 * midpoint, a matching glyph tile, and a 2px accent rule under it in
 * place of the flat hairline. Colour arrives through a gradient that
 * touches nothing else, so no card is introduced and no row is pushed
 * down.
 *
 * The accent is derived from the route, not decided here, so every page
 * in a section shares a hue and the six sections are told apart at a
 * glance. `accent` still overrides it -- and now actually does
 * something. It had been accepted and ignored for 32 call sites, which
 * is how a prop becomes a lie.
 */
type HeroAccent = Accent;

const ACCENT_STYLES: Record<Accent, { wash: string; tint: string; solid: string }> = {
  indigo: { wash: "var(--a-indigo-wash)", tint: "var(--a-indigo-tint)", solid: "var(--a-indigo)" },
  violet: { wash: "var(--a-violet-wash)", tint: "var(--a-violet-tint)", solid: "var(--a-violet)" },
  rose: { wash: "var(--a-rose-wash)", tint: "var(--a-rose-tint)", solid: "var(--a-rose)" },
  emerald: { wash: "var(--a-emerald-wash)", tint: "var(--a-emerald-tint)", solid: "var(--a-emerald)" },
  amber: { wash: "var(--a-amber-wash)", tint: "var(--a-amber-tint)", solid: "var(--a-amber)" },
  cyan: { wash: "var(--a-cyan-wash)", tint: "var(--a-cyan-tint)", solid: "var(--a-cyan)" },
  blue: { wash: "var(--a-blue-wash)", tint: "var(--a-blue-tint)", solid: "var(--a-blue)" },
  orange: { wash: "var(--a-orange-wash)", tint: "var(--a-orange-tint)", solid: "var(--a-orange)" },
};

export function PageHero({
  id,
  eyebrow,
  icon: Icon,
  title,
  description,
  actions,
  accent,
  children,
}: {
  id?: string;
  eyebrow?: string;
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  /** Retained: some pages predate the route map and a few sit outside
   * it. Unset, the route decides. */
  accent?: HeroAccent;
  /** Accepted and ignored. Kept only so the call sites that still pass
   * it type-check; the masthead has one treatment now. */
  variant?: "light" | "dark";
  align?: "left" | "center";
}) {
  const pathname = usePathname();
  const resolved = accent ?? accentForPath(pathname);
  // Unset, the eyebrow says which section you are in. It is the line
  // that makes the hue mean something rather than just be present --
  // "MEMBERS" in violet above "Members" reads as one place, where the
  // colour alone reads as styling.
  const resolvedEyebrow = eyebrow ?? sectionForPath(pathname);
  const a = ACCENT_STYLES[resolved] ?? ACCENT_STYLES.indigo;

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
      className="relative isolate -mx-4 mb-1 overflow-hidden px-4 pb-3 pt-3 sm:-mx-5 sm:px-5 lg:-mx-6 lg:px-6"
    >
      {/* The wash. Absolutely positioned and behind everything, so it
          adds colour without adding height. It stops at 62% because a
          gradient that reaches the right edge reads as a filled banner,
          which is the bulky thing this replaced. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `linear-gradient(100deg, ${a.wash} 0%, ${a.wash} 18%, transparent 72%),
             radial-gradient(28rem 12rem at 0% 0%, ${a.tint} 0%, transparent 70%)`,
        }}
      />
      {/* 2px of accent instead of the flat hairline: the page's own
          colour, doing the job a border was already doing. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 -z-10"
        style={{
          background: `linear-gradient(90deg, ${a.solid} 0%, transparent 70%)`,
        }}
      />

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="flex min-w-0 items-center gap-3">
          {Icon ? (
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-lg"
              style={{ background: a.tint, color: a.solid }}
            >
              <Icon className="size-[1.125rem]" aria-hidden="true" />
            </span>
          ) : null}
          <div className="min-w-0">
            {resolvedEyebrow ? (
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: a.solid }}
              >
                {resolvedEyebrow}
              </p>
            ) : null}
            <h1
              id={headingId}
              className={cn(
                "truncate text-xl font-semibold tracking-tight text-foreground sm:text-[1.375rem]",
                resolvedEyebrow && "leading-tight",
              )}
              title={typeof title === "string" ? title : undefined}
            >
              {title}
            </h1>
            {description ? (
              <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        {/* Actions and children share one group on the right. Kept
            apart they became three columns under `justify-between`,
            which left a page's primary button stranded mid-row with a
            gap either side -- /crm had "Ask AI" floating in the middle
            of its own masthead. */}
        {actions || children ? (
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {actions}
            {children}
          </div>
        ) : null}
      </div>
    </header>
  );
}

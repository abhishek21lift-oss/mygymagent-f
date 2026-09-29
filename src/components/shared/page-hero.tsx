"use client";

import type { CSSProperties, ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

import { sectionForPath, type Accent } from "@/lib/section-accent";
import { cn } from "@/lib/utils";

/**
 * The page masthead.
 *
 * Two requirements pull against each other here, and the shape below is
 * what satisfies both: it should look premium and carry colour, and it
 * should not eat the screen. A previous version resolved that by
 * deleting the colour — a bordered card with a 56px tinted icon tile
 * costing ~90px on every route. The version before that deleted the
 * border and kept the tile. Neither is what this is.
 *
 * This keeps the density and spends the hue as LIGHT rather than as a
 * tile: a wide, low-alpha field of the section's own gradient bleeds
 * from the top-left and fades out before the right edge, the glyph sits
 * on a soft tinted disc, and a 3px gradient rule closes the band. The
 * colour arrives through a gradient that touches nothing else, so no
 * card is introduced and no row is pushed down.
 *
 * The hue itself is not resolved here. `AppLayout` publishes it on the
 * shell as `--section*`, and this reads the inherited variables like
 * every other surface does — which is what lets a server-rendered
 * table on the same page wear the same colour without becoming a
 * client component. `accent` overrides it by setting those variables
 * locally, for the handful of screens that sit outside the route map.
 */
type HeroAccent = Accent;

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
   * it. Unset, the shell decides. */
  accent?: HeroAccent;
  /** Accepted and ignored. Kept only so the call sites that still pass
   * it type-check; the masthead has one treatment now. */
  variant?: "light" | "dark";
  align?: "left" | "center";
}) {
  const pathname = usePathname();
  // Unset, the eyebrow says which section you are in. It is the line
  // that makes the hue mean something rather than just be present —
  // "MEMBERS" in violet above "Members" reads as one place, where the
  // colour alone reads as styling.
  const resolvedEyebrow = eyebrow ?? sectionForPath(pathname);

  // An override re-points the same variables for this subtree, so the
  // rules below stay identical either way.
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
      className="relative isolate -mx-4 mb-2 overflow-hidden px-4 pb-5 pt-4 sm:-mx-5 sm:px-5 lg:-mx-8 lg:px-8"
    >
      {/* The field. Absolutely positioned and behind everything, so it
          adds colour without adding height. It stops before the right
          edge because a gradient that reaches it reads as a filled
          banner, which is the bulky thing this replaced. Two radials in
          the section's own gradient steps, held at low alpha: this is
          light in the room, not a fill behind the title. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: [
            `radial-gradient(34rem 14rem at 0% 0%, color-mix(in oklab, var(--section-grad-1) 14%, transparent) 0%, transparent 72%)`,
            `radial-gradient(26rem 12rem at 24% 0%, color-mix(in oklab, var(--section-grad-2) 10%, transparent) 0%, transparent 70%)`,
            `linear-gradient(100deg, var(--section-wash) 0%, var(--section-wash) 30%, transparent 78%)`,
          ].join(","),
        }}
      />
      {/* 3px of the section's own gradient instead of a flat hairline:
          the page's colour doing the job a border was already doing. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] -z-10 rounded-full"
        style={{
          backgroundImage: `linear-gradient(90deg, var(--section-grad-1) 0%, var(--section-grad-2) 38%, transparent 85%)`,
        }}
      />

      {/* `flex-wrap`, so the action group drops to its own line instead of
          squeezing the title. With `justify-between` and no wrap, a page
          carrying several actions (the member masthead has seven) left the
          h1 whatever was left over: measured at 1512px it got 147px for a
          name needing 191px, and `truncate` rendered it as "Ananya S…". A
          title is the one thing on a screen that must not be the part that
          gets cut, and at 1920px there was room for both — so the squeeze
          only appeared at the widths people actually demo on. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-6 sm:gap-y-3">
        <div className="flex min-w-0 items-center gap-3.5">
          {Icon ? (
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-2xl"
              style={{
                background: `color-mix(in oklab, var(--section) 14%, var(--card))`,
                color: "var(--section-ink)",
                boxShadow: `inset 0 0 0 1px color-mix(in oklab, var(--section) 18%, transparent)`,
              }}
            >
              <Icon className="size-5" aria-hidden="true" />
            </span>
          ) : null}
          <div className="min-w-0">
            {resolvedEyebrow ? (
              // `--section-ink`, not `--section`. The solid step is a
              // paint for gradients and glyphs; measured as type on its
              // own wash it scores 2.2:1 for amber, and this line is
              // 10px. The ink step is 6.1:1 or better on every hue, in
              // both themes.
              <p
                className="text-[10px] font-bold uppercase tracking-[0.14em]"
                style={{ color: "var(--section-ink)" }}
              >
                {resolvedEyebrow}
              </p>
            ) : null}
            <h1
              id={headingId}
              className={cn(
                "truncate text-2xl font-bold tracking-[-0.03em] text-foreground sm:text-[1.75rem]",
                resolvedEyebrow && "leading-tight",
              )}
              title={typeof title === "string" ? title : undefined}
            >
              {title}
            </h1>
            {description ? (
              <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>

        {/* Actions and children share one group on the right. Kept
            apart they became three columns under `justify-between`,
            which left a page's primary button stranded mid-row with a
            gap either side — /crm had "Ask AI" floating in the middle
            of its own masthead. */}
        {actions || children ? (
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}{children}</div>
        ) : null}
      </div>
    </header>
  );
}

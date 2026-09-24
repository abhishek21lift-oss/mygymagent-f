"use client";

import type { CSSProperties, ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

import { sectionForPath, type Accent } from "@/lib/section-accent";
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
 * The hue itself is no longer resolved here. `AppLayout` publishes it on
 * the shell as `--section*`, and this reads the inherited variables like
 * every other surface does -- which is what lets a server-rendered table
 * on the same page wear the same colour without becoming a client
 * component. `accent` overrides it by setting those variables locally,
 * for the handful of screens that sit outside the route map.
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
  // that makes the hue mean something rather than just be present --
  // "MEMBERS" in violet above "Members" reads as one place, where the
  // colour alone reads as styling.
  const resolvedEyebrow = eyebrow ?? sectionForPath(pathname);

  // An override re-points the same four variables for this subtree, so
  // the rules below stay identical either way.
  const override = accent
    ? ({
        "--section": `var(--a-${accent})`,
        "--section-ink": `var(--a-${accent}-ink)`,
        "--section-tint": `var(--a-${accent}-tint)`,
        "--section-wash": `var(--a-${accent}-wash)`,
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
      className="relative isolate -mx-4 mb-1 overflow-hidden px-4 pb-3 pt-3 sm:-mx-5 sm:px-5 lg:-mx-6 lg:px-6"
    >
      {/* The wash. Absolutely positioned and behind everything, so it
          adds colour without adding height. It stops before the right
          edge because a gradient that reaches it reads as a filled
          banner, which is the bulky thing this replaced. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `linear-gradient(100deg, var(--section-wash) 0%, var(--section-wash) 18%, transparent 72%),
             radial-gradient(28rem 12rem at 0% 0%, var(--section-tint) 0%, transparent 70%)`,
        }}
      />
      {/* 2px of accent instead of the flat hairline: the page's own
          colour, doing the job a border was already doing. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 -z-10"
        style={{
          background:
            "linear-gradient(90deg, var(--section) 0%, transparent 70%)",
        }}
      />

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="flex min-w-0 items-center gap-3">
          {Icon ? (
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-lg shadow-[0_1px_2px_rgb(15_23_42_/_0.08)]"
              style={{
                background: "var(--section-tint)",
                color: "var(--section)",
              }}
            >
              <Icon className="size-[1.125rem]" aria-hidden="true" />
            </span>
          ) : null}
          <div className="min-w-0">
            {resolvedEyebrow ? (
              // `--section-ink`, not `--section`. The solid step is a
              // paint, and measured as type on its own wash it scores
              // 3.21:1 for amber and 3.49:1 for orange against a 4.5:1
              // requirement -- this line is 10px, so it was failing AA
              // on half the app. The ink step is 6.5:1 or better on
              // every hue.
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: "var(--section-ink)" }}
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

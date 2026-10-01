import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The one container a page section sits in.
 *
 * The redesign gave the app one metric component and one masthead but no
 * container, so all twenty-odd routes kept hand-rolling their own: a
 * rounded-xl shell with a hardcoded white border and a violet-tinted
 * shadow, both fighting the token layer that makes dark mode work. That
 * one string appeared 91 times across 34 files. This is what replaces
 * it.
 *
 * The header is a sentence-case title led by a dot of the section's hue,
 * as a grouped section is headed on iOS. It is 15px against the page
 * title's 28-30px, so it still does not compete with the masthead.
 * `title` renders a real `h2` so the document outline is intact, and
 * `titleId` wires `aria-labelledby` for callers that were already doing
 * it.
 *
 * `flush` is for sections whose body is a table or a list that should
 * meet the border — padding around a table just pushes it away from the
 * frame that defines it.
 *
 * The header wears the section wash and the label the section ink. Six
 * of these stacked down a page were six identical grey strips, and the
 * eye had nothing to catch on; given the page's own hue they read as
 * divisions of one thing. The label is still 11px uppercase, still not
 * competing with the masthead — it just stopped being invisible.
 */
export function Panel({
  title,
  titleId,
  description,
  actions,
  footer,
  flush,
  className,
  bodyClassName,
  children,
}: {
  /** Omit to render a frame with no header — a body that speaks for itself. */
  title?: ReactNode;
  titleId?: string;
  description?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  flush?: boolean;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={title && titleId ? titleId : undefined}
      className={cn(
        "panel-premium overflow-hidden rounded-3xl border border-border/60 bg-card",
        className,
      )}
    >
      {title ? (
        <div
          data-slot="panel-header"
          className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-5 py-3.5 sm:px-6"
        >
          <div className="min-w-0">
            <h2
              id={titleId}
              data-slot="panel-title"
              className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-foreground"
            >
              {/* The section's hue as a dot, rather than as the text colour:
                  a sentence-case title in ink-on-card reads as a heading,
                  the way a grouped list's header does on iOS. */}
              <span
                aria-hidden="true"
                data-slot="panel-dot"
                className="size-2 shrink-0 rounded-full"
              />
              <span className="min-w-0 [overflow-wrap:anywhere]">{title}</span>
            </h2>
            {description ? (
              <p className="mt-0.5 text-xs text-muted-foreground [overflow-wrap:anywhere]">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            // max-w-full: actions wider than a phone (two date pickers and
            // a button) wrap inside the header instead of running off it.
            <div className="flex max-w-full shrink-0 flex-wrap items-center gap-2">
              {actions}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={cn(!flush && "p-5 sm:p-6", bodyClassName)}>{children}</div>

      {footer ? (
        <div className="border-t border-border/60 px-5 py-3 sm:px-6">
          {footer}
        </div>
      ) : null}
    </section>
  );
}

/**
 * A metric strip. Four numbers do not need a section heading telling you
 * they are numbers — the old "Stock pulse" / "Collections snapshot" /
 * "Lifecycle pulse" headings each cost a line and said nothing, so this
 * takes none.
 *
 * `columns` is the count at the widest breakpoint; everything steps down
 * to two on a phone, because a single column of tiles is a list, and a
 * list of numbers is worse at comparison than a row of them.
 */
export function MetricStrip({
  columns = 4,
  label = "Key figures",
  className,
  children,
}: {
  columns?: 2 | 3 | 4 | 5;
  /** Screen-reader only: the strip has no visible heading by design. */
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  // `grid-cols-2` is the base, not `sm:grid-cols-2`. Every entry here
  // used to start at the `sm` breakpoint, so below 640px the grid fell
  // back to its one-column default -- the exact single column of tiles
  // the comment above says this avoids. On a 390px screen that turned a
  // five-tile strip into five full-width cards, four of them reading 0,
  // and pushed the table they belong to most of a screen further down.
  const cols = {
    2: "grid-cols-2",
    3: "grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 xl:grid-cols-4",
    5: "grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
  }[columns];

  return <section aria-label={label} className={cn("grid gap-3", cols, className)}>{children}</section>;
}

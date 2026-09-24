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
 * The header is a label, not a headline: a section inside a page is not
 * competing with the page's own title, so it wears the same small
 * uppercase treatment as a metric tile's label. `title` still renders a
 * real `h2` so the document outline is intact, and `titleId` wires
 * `aria-labelledby` for callers that were already doing it.
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
        "panel-premium overflow-hidden rounded-lg border border-border bg-card",
        className,
      )}
    >
      {title ? (
        <div
          data-slot="panel-header"
          className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5 sm:px-5"
        >
          <div className="min-w-0">
            <h2
              id={titleId}
              data-slot="panel-title"
              className="truncate text-[11px] font-semibold uppercase tracking-[0.1em]"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {actions}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={cn(!flush && "p-4 sm:p-5", bodyClassName)}>{children}</div>

      {footer ? (
        <div className="border-t border-border px-4 py-2.5 sm:px-5">
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

  return (
    <section aria-label={label} className={cn("grid gap-2.5", cols, className)}>
      {children}
    </section>
  );
}

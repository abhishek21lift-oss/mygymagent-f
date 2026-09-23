import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/** Retained only so the 37 existing call sites keep type-checking; the
 * tinted chip these used to drive is gone. Colour now means state, not
 * decoration, so a page's own title has no business carrying an accent. */
type HeroAccent =
 | "violet" | "emerald" | "cyan" | "amber"
 | "rose" | "indigo" | "orange" | "blue";

/**
 * The page masthead.
 *
 * Deliberately not a card. A card says "separate object", and the page's
 * own title is not an object sitting on the page — it *is* the page. The
 * previous version was a bordered, shadowed card carrying a tinted icon
 * tile, which cost ~90px of vertical space on every one of 37 routes and
 * put a decorative chip at the top of each. On a 1512x950 screen that was
 * the difference between seeing three member rows and seeing ten.
 *
 * What remains: the title, an optional line of context, and the actions —
 * on one row, over a hairline rule.
 */
export function PageHero({
 id,
 eyebrow,
 icon: Icon,
 title,
 description,
 actions,
 children,
}: {
 id?: string;
 eyebrow?: string;
 icon?: LucideIcon;
 title: ReactNode;
 description?: ReactNode;
 actions?: ReactNode;
 children?: ReactNode;
 variant?: "light" | "dark";
 accent?: HeroAccent;
 align?: "left" | "center";
}) {
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
 className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6"
 >
 <div className="flex min-w-0 items-center gap-2.5">
 {/* The sidebar already says where you are; on phone width it is
 hidden, so a small plain glyph still earns its place. */}
 {Icon ? (
 <Icon
 className="size-5 shrink-0 text-muted-foreground sm:hidden"
 aria-hidden="true"
 />
 ) : null}
 <div className="min-w-0">
 {eyebrow ? (
 <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
 {eyebrow}
 </p>
 ) : null}
 <h1
 id={headingId}
 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-[1.375rem]"
 title={typeof title === "string" ? title : undefined}
 >
 {title}
 </h1>
 {description ? (
 <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
 {description}
 </p>
 ) : null}
 </div>
 </div>

 {actions ? (
 <div className="flex flex-wrap items-center gap-2">{actions}</div>
 ) : null}

 {children ? <div className="w-full sm:w-auto">{children}</div> : null}
 </header>
 );
}

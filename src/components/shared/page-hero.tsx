import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type HeroAccent = "violet" | "emerald" | "cyan" | "amber" | "rose" | "indigo" | "orange" | "blue";

/**
 * Premium page header — clean card + tinted icon tile.
 * `accent` is retained for API compatibility and maps to subtle tints.
 */
const ACCENTS: Record<HeroAccent, string> = {
  violet: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  emerald: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  cyan: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  amber: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  rose: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  indigo: "bg-primary/10 text-primary",
  orange: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
  blue: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
};

export function PageHero({
  id,
  icon: Icon,
  title,
  actions,
  children,
  accent = "indigo",
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
  const headingId = id ?? `page-title-${typeof title === "string" ? title.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "header"}`;
  return (
    <section
      aria-labelledby={headingId}
      className="relative rounded-xl border bg-card px-4 py-4 shadow-sm sm:px-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {Icon && (
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-lg",
                ACCENTS[accent],
              )}
            >
              <Icon className="size-5" aria-hidden="true" strokeWidth={2.25} />
            </span>
          )}
          <h1
            id={headingId}
            className="min-w-0 flex-1 truncate text-lg font-semibold tracking-tight sm:text-xl"
            title={typeof title === "string" ? title : undefined}
          >
            {title}
          </h1>
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 [&>*]:min-h-10">
            {actions}
          </div>
        )}
      </div>
      {children && <div className="mt-3 rounded-lg border bg-muted/50 p-3">{children}</div>}
    </section>
  );
}

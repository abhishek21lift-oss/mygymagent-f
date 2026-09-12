import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type HeroAccent = "violet" | "emerald" | "cyan" | "amber" | "rose" | "indigo" | "orange" | "blue";

const ACCENTS: Record<HeroAccent, string> = {
  violet: "from-violet-600 to-fuchsia-600",
  emerald: "from-emerald-500 to-teal-600",
  cyan: "from-cyan-500 to-blue-600",
  amber: "from-amber-500 to-orange-600",
  rose: "from-rose-500 to-orange-500",
  indigo: "from-indigo-600 to-violet-600",
  orange: "from-orange-500 to-amber-500",
  blue: "from-blue-600 to-cyan-500",
};

/**
 * Clean page header — title + actions only.
 * `eyebrow`, `description` and `children` are kept in props for
 * backward compatibility but are intentionally not rendered,
 * except functional `children` (filters) which render compactly.
 */
export function PageHero({
  id,
  icon: Icon,
  title,
  actions,
  children,
  variant = "light",
  accent = "violet",
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
  const dark = variant === "dark";

  return (
    <section
      aria-labelledby={id}
      className={cn(
        "rounded-2xl border px-4 py-3.5 sm:px-5",
        dark
          ? "border-white/10 bg-stone-950 text-white"
          : "border-stone-200/70 bg-white text-stone-950 shadow-sm dark:border-white/10 dark:bg-stone-950 dark:text-white",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {Icon && (
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white",
                ACCENTS[accent],
              )}
            >
              <Icon className="size-4.5" aria-hidden="true" />
            </span>
          )}
          <h1
            id={id}
            className="truncate text-lg font-semibold tracking-tight sm:text-xl"
          >
            {title}
          </h1>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {children && <div className="mt-3 border-t border-stone-200/60 pt-3 dark:border-white/10">{children}</div>}
    </section>
  );
}

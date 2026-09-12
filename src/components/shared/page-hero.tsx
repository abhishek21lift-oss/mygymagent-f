import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type HeroAccent = "violet" | "emerald" | "cyan" | "amber" | "rose" | "indigo" | "orange" | "blue";

const ACCENTS: Record<HeroAccent, { tile: string; eyebrow: string; blob: string; bar: string }> = {
  violet: {
    tile: "from-violet-600 to-fuchsia-600 shadow-violet-500/25",
    eyebrow: "border-violet-200/70 bg-violet-50/80 text-violet-700 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200",
    blob: "bg-violet-300/25 dark:bg-violet-500/10",
    bar: "from-violet-600 via-fuchsia-500 to-cyan-400",
  },
  emerald: {
    tile: "from-emerald-500 to-teal-600 shadow-emerald-500/25",
    eyebrow: "border-emerald-200/70 bg-emerald-50/80 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200",
    blob: "bg-emerald-300/25 dark:bg-emerald-500/10",
    bar: "from-emerald-500 via-teal-500 to-cyan-500",
  },
  cyan: {
    tile: "from-cyan-500 to-blue-600 shadow-cyan-500/25",
    eyebrow: "border-cyan-200/70 bg-cyan-50/80 text-cyan-800 dark:border-cyan-400/20 dark:bg-cyan-500/10 dark:text-cyan-200",
    blob: "bg-cyan-300/25 dark:bg-cyan-500/10",
    bar: "from-cyan-500 via-sky-500 to-blue-600",
  },
  amber: {
    tile: "from-amber-500 to-orange-600 shadow-amber-500/25",
    eyebrow: "border-amber-200/70 bg-amber-50/80 text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200",
    blob: "bg-amber-300/25 dark:bg-amber-500/10",
    bar: "from-amber-400 via-orange-500 to-rose-500",
  },
  rose: {
    tile: "from-rose-500 to-orange-500 shadow-rose-500/25",
    eyebrow: "border-rose-200/70 bg-rose-50/80 text-rose-800 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200",
    blob: "bg-rose-300/25 dark:bg-rose-500/10",
    bar: "from-rose-500 via-orange-500 to-amber-500",
  },
  indigo: {
    tile: "from-indigo-600 to-violet-600 shadow-indigo-500/25",
    eyebrow: "border-indigo-200/70 bg-indigo-50/80 text-indigo-800 dark:border-indigo-400/20 dark:bg-indigo-500/10 dark:text-indigo-200",
    blob: "bg-indigo-300/25 dark:bg-indigo-500/10",
    bar: "from-indigo-600 via-violet-600 to-fuchsia-500",
  },
  orange: {
    tile: "from-orange-500 to-amber-500 shadow-orange-500/25",
    eyebrow: "border-orange-200/70 bg-orange-50/80 text-orange-800 dark:border-orange-400/20 dark:bg-orange-500/10 dark:text-orange-200",
    blob: "bg-orange-300/25 dark:bg-orange-500/10",
    bar: "from-orange-500 via-amber-500 to-yellow-400",
  },
  blue: {
    tile: "from-blue-600 to-cyan-500 shadow-blue-500/25",
    eyebrow: "border-blue-200/70 bg-blue-50/80 text-blue-800 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-200",
    blob: "bg-blue-300/25 dark:bg-blue-500/10",
    bar: "from-blue-600 via-cyan-500 to-teal-500",
  },
};

export function PageHero({
  id,
  eyebrow,
  icon: Icon,
  title,
  description,
  actions,
  children,
  variant = "light",
  accent = "violet",
  align = "left",
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
  const a = ACCENTS[accent];

  if (variant === "dark") {
    return (
      <section
        aria-labelledby={id}
        className="relative overflow-hidden rounded-[20px] bg-[linear-gradient(135deg,#0f0c29_0%,#302b63_45%,#6d28d9_78%,#a21caf_100%)] p-4 text-white shadow-[0_20px_60px_-30px_rgba(79,70,229,.55)] sm:p-5"
      >
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 size-52 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -left-12 -bottom-20 size-48 rounded-full bg-cyan-400/15 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <div className={cn("relative flex flex-col gap-4", align === "center" ? "items-center text-center" : "lg:flex-row lg:items-center lg:justify-between")}>
          <div className={cn("min-w-0 flex-1", align === "center" && "flex flex-col items-center")}>
            {eyebrow && (
              <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[.16em] text-white/90 backdrop-blur">
                {Icon && <Icon className="size-3" aria-hidden="true" />}
                {eyebrow}
              </p>
            )}
            <h1 id={id} className="font-serif text-[22px] font-semibold leading-tight tracking-tight text-balance sm:text-[26px]">
              {title}
            </h1>
            {description && (
              <p className="mt-1.5 max-w-2xl text-[13px] font-medium leading-5 text-white/70">{description}</p>
            )}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
        {children && <div className="relative mt-4">{children}</div>}
      </section>
    );
  }

  return (
    <section
      aria-labelledby={id}
      className="relative overflow-hidden rounded-[20px] border border-white/90 bg-white/85 py-4 pl-4 pr-4 shadow-[0_16px_45px_-30px_rgba(79,70,229,.35)] backdrop-blur-xl sm:py-5 sm:pl-5 sm:pr-5 dark:border-white/10 dark:bg-stone-950/80"
    >
      <span aria-hidden="true" className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", a.bar)} />
      <div aria-hidden="true" className={cn("pointer-events-none absolute -right-14 -top-16 size-44 rounded-full blur-3xl", a.blob)} />
      <div className={cn("relative flex flex-col gap-3", align === "center" ? "items-center text-center" : "sm:flex-row sm:items-center sm:justify-between")}>
        <div className={cn("flex min-w-0 flex-1 items-start gap-3", align === "center" && "flex-col items-center")}>
          {Icon && (
            <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md", a.tile)}>
              <Icon className="size-5" aria-hidden="true" />
            </span>
          )}
          <div className={cn("min-w-0 flex-1", align === "center" && "flex flex-col items-center")}>
            {eyebrow && (
              <p className={cn("mb-1.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[.16em]", a.eyebrow)}>
                {eyebrow}
              </p>
            )}
            <h1 id={id} className="font-serif text-[22px] font-semibold leading-tight tracking-tight text-stone-950 text-balance sm:text-[26px] dark:text-white">
              {title}
            </h1>
            {description && (
              <p className="mt-1 max-w-2xl text-[13px] font-medium leading-5 text-stone-600 dark:text-stone-400">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children && <div className="relative mt-4">{children}</div>}
    </section>
  );
}

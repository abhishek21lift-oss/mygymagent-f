import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type HeroAccent = "violet" | "emerald" | "cyan" | "amber" | "rose" | "indigo" | "orange" | "blue";

const ACCENTS: Record<HeroAccent, string> = {
  violet: "from-[#ffedb0] via-[#c99b3f] to-[#7a5a1e] border-[#4a360f] text-[#241a08]",
  emerald: "from-[#d8f0dc] via-[#6aa876] to-[#2a5a35] border-[#1d3a24] text-[#0f2413]",
  cyan: "from-[#d5eef5] via-[#5aa8c0] to-[#2a5a6b] border-[#1d3a44] text-[#0f2229]",
  amber: "from-[#ffe9a8] via-[#d9a53a] to-[#7a5a1e] border-[#4a360f] text-[#241a08]",
  rose: "from-[#ffc4b8] via-[#b03528] to-[#5a130c] border-[#4a0f0a] text-[#fff3e8]",
  indigo: "from-[#e2ddf5] via-[#7a6fc0] to-[#3a346b] border-[#26224a] text-[#14122b]",
  orange: "from-[#ffdfb8] via-[#c07a2a] to-[#5a3410] border-[#4a2a0c] text-[#241505]",
  blue: "from-[#d5e4f5] via-[#5a8ac0] to-[#2a4a6b] border-[#1d3244] text-[#0f1e2b]",
};

/**
 * Skeuo control panel header — riveted steel plate + enamel icon medallion.
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
        "skeuo-plate skeuo-screws relative rounded-[14px] border px-4 py-3.5 sm:px-5",
        dark && "dark",
      )}
    >
      <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {Icon && (
            <span
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-full border-[3px] bg-gradient-to-b shadow-[inset_0_2px_0_rgba(255,255,255,0.6),0_3px_0_#241a08,0_6px_12px_rgba(0,0,0,0.4)]",
                ACCENTS[accent],
              )}
            >
              <Icon className="size-5" aria-hidden="true" strokeWidth={2.5} />
            </span>
          )}
          <h1
            id={id}
            className="min-w-0 flex-1 truncate text-lg font-black tracking-tight text-[#2e2313] sm:text-xl dark:text-[#f3e7c6]"
            style={{ textShadow: "0 1px 0 rgba(255,250,235,0.9)" }}
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
      {children && <div className="skeuo-inset relative z-10 mt-3 rounded-[10px] border p-3">{children}</div>}
    </section>
  );
}

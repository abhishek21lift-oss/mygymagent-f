import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const TONE_STYLES = {
  primary: {
    bar: "from-violet-600 via-purple-600 to-fuchsia-600",
    tile: "from-violet-600 to-fuchsia-600 shadow-violet-500/30",
    orb: "bg-fuchsia-400/20",
    ring: "hover:border-violet-200 hover:shadow-violet-500/10",
  },
  success: {
    bar: "from-emerald-400 via-teal-500 to-green-600",
    tile: "from-emerald-500 to-teal-600 shadow-emerald-500/30",
    orb: "bg-emerald-400/20",
    ring: "hover:border-emerald-200 hover:shadow-emerald-500/10",
  },
  warning: {
    bar: "from-amber-400 to-orange-500",
    tile: "from-amber-500 to-orange-600 shadow-amber-500/30",
    orb: "bg-amber-400/20",
    ring: "hover:border-amber-200 hover:shadow-amber-500/10",
  },
  destructive: {
    bar: "from-rose-500 via-red-500 to-orange-500",
    tile: "from-rose-500 to-orange-500 shadow-rose-500/30",
    orb: "bg-rose-400/20",
    ring: "hover:border-rose-200 hover:shadow-rose-500/10",
  },
} as const;

export function StatCard({
  title,
  icon: Icon,
  value,
  isLoading,
  hint,
  tone = "primary",
}: {
  title: string;
  icon: LucideIcon;
  value: number | string | undefined;
  isLoading: boolean;
  hint?: string;
  tone?: "primary" | "success" | "warning" | "destructive";
}) {
  const t = TONE_STYLES[tone];
  return (
    <Card
      className={cn(
        "group relative gap-0 overflow-hidden border-white/90 bg-white/85 py-0 shadow-[0_20px_60px_-38px_rgba(79,70,229,.35)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_-38px_rgba(79,70,229,.42)] dark:bg-white/5",
        t.ring,
      )}
    >
      <span aria-hidden="true" className={cn("absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r", t.bar)} />
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -right-10 -top-10 size-32 rounded-full blur-2xl transition duration-300 group-hover:scale-125",
          t.orb,
        )}
      />
      <CardContent className="relative flex items-center gap-4 p-5 lg:p-6">
        <span
          className={cn(
            "flex size-14 shrink-0 items-center justify-center rounded-[19px] bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3",
            t.tile,
          )}
        >
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[.18em] text-stone-500 dark:text-stone-300">
            {title}
          </p>
          {isLoading ? (
            <Skeleton className="mt-2 h-8 w-16 rounded-xl" />
          ) : (
            <p className="mt-1 truncate text-3xl font-black tracking-tight text-stone-950 tabular-nums dark:text-white">
              {value ?? 0}
            </p>
          )}
          {hint && <p className="mt-1 text-[11px] font-medium text-stone-600 dark:text-stone-300">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

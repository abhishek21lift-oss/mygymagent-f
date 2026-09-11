import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[22px] border border-dashed border-stone-200 bg-white/70 px-6 py-12 text-center shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5",
        className,
      )}
    >
      {Icon && (
        <span className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      )}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-extrabold tracking-tight text-stone-950 dark:text-white">{title}</p>
        {description && <p className="mx-auto max-w-sm text-sm font-medium text-stone-600 dark:text-stone-300">{description}</p>}
      </div>
      {action}
    </div>
  );
}

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
        "skeuo-inset flex flex-col items-center justify-center gap-3 rounded-[14px] border border-dashed border-[#6b5d42] px-6 py-12 text-center",
        className,
      )}
    >
      {Icon && (
        <span className="flex size-14 items-center justify-center rounded-full border-[3px] border-[#4a360f] bg-gradient-to-b from-[#ffedb0] via-[#c99b3f] to-[#7a5a1e] text-[#241a08] shadow-[inset_0_2px_0_rgba(255,250,220,0.9),0_3px_0_#241a08,0_8px_16px_rgba(0,0,0,0.4)]">
          <Icon className="size-5" aria-hidden="true" strokeWidth={2.5} />
        </span>
      )}
      <div className="flex flex-col gap-1">
        <p className="skeuo-engraved text-sm font-black tracking-tight">{title}</p>
        {description && <p className="mx-auto max-w-sm text-sm font-medium text-[#5c4f38]">{description}</p>}
      </div>
      {action}
    </div>
  );
}

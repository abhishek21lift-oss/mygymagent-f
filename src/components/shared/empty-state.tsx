import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
 icon: Icon = Inbox,
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
 role="status"
 className={cn( "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-card px-6 py-12 text-center",
 className,
 )}
 >
 <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
 <Icon className="size-5" aria-hidden="true" strokeWidth={2} />
 </span>
 <div className="flex flex-col gap-1">
 <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
 {description && <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>}
 </div>
 {action}
 </div>
 );
}

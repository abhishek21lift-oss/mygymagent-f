import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Nothing here yet.
 *
 * Which is not the same as something went wrong, and a dashed grey box
 * with a grey glyph in a grey circle said the second. The frame keeps
 * the dashed border — that is what distinguishes a slot waiting to be
 * filled from a card that is full — but the ground takes a soft wash of
 * the page's hue and the glyph takes the hue itself, so an empty table
 * reads as part of the screen rather than as a failure on it.
 */
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
 className={cn( "empty-premium flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-12 text-center",
 className,
 )}
 >
 <span
 data-slot="empty-glyph"
 className="flex size-12 items-center justify-center rounded-full"
 >
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

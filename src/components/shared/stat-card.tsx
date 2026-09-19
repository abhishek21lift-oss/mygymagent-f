import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const TONE_STYLES = {
 primary: "bg-primary/10 text-primary",
 success: "bg-success/10 text-success",
 warning: "bg-warning/10 text-warning",
 destructive: "bg-destructive/10 text-destructive",
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
 return (
  <Card className="gap-0 overflow-hidden py-0">
   <CardContent className="flex items-center gap-4 p-5">
    <span
     className={cn(
      "flex size-12 shrink-0 items-center justify-center rounded-lg",
      TONE_STYLES[tone],
     )}
    >
     <Icon className="size-5" aria-hidden="true" strokeWidth={2.25} />
    </span>
    <div className="min-w-0 flex-1">
     <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {title}
     </p>
     {isLoading ? (
      <Skeleton className="mt-1.5 h-8 w-24 rounded-md" aria-label={`Loading ${title}`} />
     ) : (
      <p className="mt-0.5 truncate text-2xl font-semibold tabular-nums tracking-tight">
       {value ?? 0}
      </p>
     )}
     {hint && <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>}
    </div>
   </CardContent>
  </Card>
 );
}

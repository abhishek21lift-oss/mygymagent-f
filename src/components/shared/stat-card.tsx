import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
    <Card className="gap-0 py-5 transition-shadow hover:shadow-md">
      <CardContent className="flex items-start justify-between gap-3 px-5">
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <p className="text-3xl font-semibold tracking-tight tabular-nums">{value ?? 0}</p>
          )}
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            tone === "primary" && "bg-primary/10 text-primary",
            tone === "success" && "bg-success/15 text-success",
            tone === "warning" && "bg-warning/20 text-warning-foreground",
            tone === "destructive" && "bg-destructive/10 text-destructive",
          )}
        >
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}

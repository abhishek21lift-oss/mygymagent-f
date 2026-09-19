import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton({ rows = 6, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="flex flex-col gap-2" role="status" aria-label="Loading table">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          aria-hidden="true"
          className="flex items-center gap-4 rounded-lg border bg-card p-4"
        >
          {Array.from({ length: columns }).map((__, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1 rounded-md" />
          ))}
        </div>
      ))}
    </div>
  );
}

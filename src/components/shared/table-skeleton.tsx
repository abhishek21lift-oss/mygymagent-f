import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton({ rows = 6, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="flex flex-col gap-2" role="status" aria-label="Loading table">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="skeleton-shimmer flex items-center gap-4 rounded-[19px] border border-white/80 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-white/5"
        >
          {Array.from({ length: columns }).map((__, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1 rounded-full bg-gradient-to-r from-stone-200/80 to-stone-100" />
          ))}
        </div>
      ))}
    </div>
  );
}

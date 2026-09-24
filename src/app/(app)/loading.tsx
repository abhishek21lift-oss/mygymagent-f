import { Skeleton } from "@/components/ui/skeleton";

/**
 * The instant fallback for a staff route change. It renders inside the
 * shell, so the sidebar and topbar stay put and only the content area
 * swaps — which is also roughly the shape most of these pages settle
 * into (a title, a row of stat cards, then a table), so the swap reads
 * as the page arriving rather than as the layout jumping.
 */
export default function AppLoading() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className="flex flex-col gap-6 py-4"
    >
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-48 rounded-lg" />
        <Skeleton className="h-4 w-64 rounded-md" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      <Skeleton className="h-11 w-full rounded-xl" />

      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>

      <span className="sr-only">Loading page</span>
    </div>
  );
}

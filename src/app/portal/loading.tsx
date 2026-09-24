import { Skeleton } from "@/components/ui/skeleton";

/**
 * The instant fallback for a portal tab change. Narrower and shorter
 * than the staff one: a member's screens are a heading and a short
 * stack of cards, not a stat row over a table.
 */
export default function PortalLoading() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex flex-col gap-5 py-4"
    >
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-40 rounded-lg" />
        <Skeleton className="h-4 w-56 rounded-md" />
      </div>

      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-xl" />
      ))}

      <span className="sr-only">Loading</span>
    </div>
  );
}

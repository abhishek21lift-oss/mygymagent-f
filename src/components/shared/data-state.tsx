import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * The three states a fetch can be in, made impossible to skip.
 *
 * `EmptyState`, `ErrorState` and the skeletons existed already, and the
 * screens that most needed them used none: `business-os`, `classes`,
 * `payroll` and the inventory sub-pages each rendered
 * `{(query.data ?? []).map(...)}`, which collapses *loading*, *failed*
 * and *genuinely empty* into one blank table. A person who had just lost
 * their connection saw the same screen as a person with no suppliers —
 * and the toast that fired had long since gone.
 *
 * Wrapping the three in one component means a call site has to say what
 * empty looks like, and cannot forget the other two. `onRetry` is
 * required alongside `isError` for the same reason: an error the reader
 * cannot act on is only slightly better than a blank page.
 */
export function DataState({
  isLoading,
  isError,
  onRetry,
  isEmpty,
  errorMessage,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyAction,
  skeletonRows = 3,
  children,
}: {
  isLoading?: boolean;
  isError?: boolean;
  /** Required whenever `isError` can be true — see the class comment. */
  onRetry?: () => void;
  isEmpty?: boolean;
  errorMessage?: string;
  emptyIcon?: LucideIcon;
  emptyTitle: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  skeletonRows?: number;
  children: ReactNode;
}) {
  if (isLoading) {
    return (
      <div
        className="flex flex-col gap-2"
        role="status"
        aria-label={`Loading ${emptyTitle.toLowerCase()}`}
      >
        {Array.from({ length: skeletonRows }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorState message={errorMessage} onRetry={onRetry} />;
  }

  if (isEmpty) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return <>{children}</>;
}

"use client"; // Error boundaries must be Client Components.

import * as React from "react";

import { ErrorState } from "@/components/shared/error-state";

/**
 * Catches a failure in any staff page without taking the shell with it.
 *
 * An `error` file wraps its segment's pages but not the `layout` beside
 * it, so the sidebar, topbar and mobile nav stay mounted and usable --
 * the user can navigate away from a broken screen instead of being left
 * on a blank document, which is what the single root-level boundary in
 * `layout.tsx` used to leave them with.
 */
export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="py-10">
      <ErrorState
        message={
          error.digest
            ? `This page failed to load. Reference: ${error.digest}`
            : "This page failed to load."
        }
        onRetry={() => retry()}
      />
    </div>
  );
}

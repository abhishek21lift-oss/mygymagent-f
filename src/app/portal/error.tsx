"use client"; // Error boundaries must be Client Components.

import * as React from "react";

import { ErrorState } from "@/components/shared/error-state";

/**
 * The member portal's own boundary, so a failure in one tab keeps the
 * portal's tab bar mounted and the member can move to another.
 *
 * The wording is deliberately plainer than the staff equivalent: a
 * member is not an operator of this system and has nothing to do with a
 * digest, so the reference is kept for support to ask for rather than
 * being presented as something to act on.
 */
export default function PortalError({
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
        message="We could not load this just now. Please try again."
        onRetry={() => retry()}
      />
      {error.digest && (
        <p className="pt-3 text-center font-mono text-xs text-muted-foreground">
          Reference: {error.digest}
        </p>
      )}
    </div>
  );
}

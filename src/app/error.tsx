"use client"; // Error boundaries must be Client Components.

import * as React from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * The error boundary for everything under the root layout that does not
 * have a closer one of its own — the sign-in screen and the marketing
 * root among them.
 *
 * `retry` (not `reset`) is the prop to use: it re-fetches and re-renders
 * the boundary's children, where `reset` only clears the error state and
 * re-renders what is already in memory, which for a failed fetch just
 * fails again.
 */
export default function RootError({
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
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-6 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </span>

      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Something went wrong
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          This screen failed to load. Trying again will re-fetch it — that
          clears most of these.
        </p>
        {/* The digest is the only handle on the server-side log for this
            error: in production the message itself is withheld from the
            client so it cannot leak internals. */}
        {error.digest && (
          <p className="pt-1 font-mono text-xs text-muted-foreground">
            Reference: {error.digest}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => retry()} className="min-h-11 px-6">
          Try again
        </Button>
        <Button asChild variant="outline" className="min-h-11 px-6">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </main>
  );
}

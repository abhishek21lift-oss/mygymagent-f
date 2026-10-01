"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth/auth-context";
import { homeRouteFor } from "@/lib/auth/home-route";
import { MfaRequiredGate } from "@/components/security/mfa-required-gate";
import { Skeleton } from "@/components/ui/skeleton";
import { TrainerTopBar } from "@/components/trainer/trainer-top-bar";
import { TrainerBottomNav } from "@/components/trainer/trainer-bottom-nav";
import { PullToRefresh } from "@/components/shared/pull-to-refresh";

/**
 * The phone-shaped shell around the same authenticated session as the
 * staff app.
 *
 * It reuses the staff layout's auth boundary rather than standing up a
 * second one -- same `isAuthenticated` redirect, same member-to-portal
 * bounce, same `MfaRequiredGate` for an ENFORCED policy. A separate shell
 * must not become a way around enrolment enforcement, and duplicating
 * those three checks is exactly how that would have happened.
 *
 * Capped at `max-w-lg` and centred. The reference is a phone app; letting
 * a 32px-radius, 30px-title composition stretch across a 27" display
 * would read as a poster. On a phone the cap never binds, and on a
 * desktop it keeps the proportions honest instead of scaling them.
 *
 * No permission gate here: the staff layout does not gate on permissions
 * either, it relies on the API returning 403 and the nav filtering
 * itself. Inventing a route-level gate would have been a second policy to
 * keep in step with the server's.
 */
export function TrainerShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, mfaEnrolment, user } = useAuth();
  const router = useRouter();
  const isMember = Boolean(user?.memberId);

  React.useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (isMember) router.replace(homeRouteFor(user));
  }, [isLoading, isAuthenticated, isMember, user, router]);

  if (isLoading || !isAuthenticated || isMember) {
    return (
      <div className="trainer-surface grid min-h-svh place-items-center bg-[var(--t-page)] px-4">
        <div role="status" aria-label="Loading" className="flex flex-col gap-3">
          <Skeleton className="h-10 w-40 rounded-xl" />
          <Skeleton className="h-4 w-full rounded-lg" />
          <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--t-ink-muted)] uppercase">
            Loading…
          </p>
        </div>
      </div>
    );
  }

  // The backend has confined this session to enrolment, so every other
  // request would 403. Show the one thing that can be done rather than a
  // shell full of errors -- the same choice the staff layout makes.
  if (mfaEnrolment?.state === "ENFORCED") {
    return (
      <div className="trainer-surface min-h-svh bg-[var(--t-page)]">
        <MfaRequiredGate />
      </div>
    );
  }

  return (
    <div className="trainer-surface flex min-h-svh flex-col bg-[var(--t-page)] text-[var(--t-ink)]">
      <TrainerTopBar />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pt-4 pb-8">
        <PullToRefresh>{children}</PullToRefresh>
      </main>
      <TrainerBottomNav />
    </div>
  );
}

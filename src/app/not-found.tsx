"use client";

import { BrandLogo } from "@/components/shared/brand-logo";
import Link from "next/link";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PRODUCT_NAME } from "@/lib/brand";

/**
 * The whole app's 404: the root `not-found` catches every unmatched URL,
 * not just a `notFound()` thrown inside a segment.
 *
 * Until this file existed, a mistyped or half-deleted URL fell through to
 * the framework's own black-on-white 404, which carries no product, no
 * navigation and no way back — `/crm/leads` reached it just by being the
 * parent of `/crm/leads/[id]`, which does exist.
 *
 * It renders outside the session (that lives in (session)/layout.tsx), so
 * it offers the two ways out that are right for anyone: the home page, and
 * sign-in, which sends someone already signed in straight to their own
 * home -- the dashboard for staff, the portal for a member.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-6 py-16 text-center">
      <div className="relative">
        <span
          aria-hidden="true"
          className="absolute inset-0 -z-10 scale-150 rounded-full bg-violet-500/15 blur-2xl"
        />
        <BrandLogo priority sizes="200px" className="h-20" />
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="font-mono text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {PRODUCT_NAME}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          This page does not exist
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          The link may be out of date, or the address may have a typo in it.
          Nothing has been lost — it is just not here.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild className="min-h-11 px-6">
          <Link href="/login">
            <Compass className="mr-2 size-4" aria-hidden="true" />
            Back to the app
          </Link>
        </Button>
        <Button asChild variant="outline" className="min-h-11 px-6">
          <Link href="/">Home page</Link>
        </Button>
      </div>
    </main>
  );
}

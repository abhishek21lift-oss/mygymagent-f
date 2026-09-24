"use client";

import Image from "next/image";
import Link from "next/link";
import { Compass } from "lucide-react";

import { useAuth } from "@/lib/auth/auth-context";
import { homeRouteFor } from "@/lib/auth/home-route";
import { Button } from "@/components/ui/button";
import { PRODUCT_LOGO_ALT, PRODUCT_LOGO_SRC, PRODUCT_NAME } from "@/lib/brand";

/**
 * The whole app's 404: the root `not-found` catches every unmatched URL,
 * not just a `notFound()` thrown inside a segment.
 *
 * Until this file existed, a mistyped or half-deleted URL fell through to
 * the framework's own black-on-white 404, which carries no product, no
 * navigation and no way back — `/crm/leads` reached it just by being the
 * parent of `/crm/leads/[id]`, which does exist.
 *
 * It is a Client Component so it can offer a way out that is actually
 * correct for whoever is reading it: a member has no staff pages to go
 * back to, and a signed-out visitor has neither.
 */
export default function NotFound() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const home = homeRouteFor(user);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-6 py-16 text-center">
      <div className="relative">
        <span
          aria-hidden="true"
          className="absolute inset-0 -z-10 scale-150 rounded-full bg-violet-500/15 blur-2xl"
        />
        <Image
          src={PRODUCT_LOGO_SRC}
          alt={PRODUCT_LOGO_ALT}
          width={72}
          height={72}
          className="size-18 rounded-full"
          priority
        />
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

      {/* While auth is still resolving we cannot say which home is the
          right one, so offer the one link that is true either way. */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {isLoading ? (
          <Button asChild className="min-h-11 px-6">
            <Link href="/">
              <Compass className="mr-2 size-4" aria-hidden="true" />
              Take me somewhere useful
            </Link>
          </Button>
        ) : isAuthenticated ? (
          <>
            <Button asChild className="min-h-11 px-6">
              <Link href={home}>
                <Compass className="mr-2 size-4" aria-hidden="true" />
                {home === "/portal" ? "Back to my portal" : "Back to dashboard"}
              </Link>
            </Button>
            {/* Search is a staff page; a member would only be bounced
                back out of it, so it is not offered to one. */}
            {home === "/dashboard" && (
              <Button asChild variant="outline" className="min-h-11 px-6">
                <Link href="/search">Search instead</Link>
              </Button>
            )}
          </>
        ) : (
          <Button asChild className="min-h-11 px-6">
            <Link href="/login">Sign in</Link>
          </Button>
        )}
      </div>
    </main>
  );
}

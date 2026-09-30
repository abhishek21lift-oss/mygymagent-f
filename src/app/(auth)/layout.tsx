import * as React from "react";
import Image from "next/image";

import { PRODUCT_LOGO_ALT, PRODUCT_LOGO_SRC } from "@/lib/brand";
import { LegalFooter } from "../(legal)/legal-ui";

/**
 * The sign-in canvas.
 *
 * This is the one screen in the product that is not section-coloured.
 * Inside the app, hue means "which part of the gym you are in"; before
 * you are in, there is no section, so the screen wears the product's own
 * brand gradient — the same one on the mark, the agent and the command
 * bar — at its fullest. It is the first impression and it should feel
 * like a different, better thing than the app you are about to open.
 *
 * The mark leads, on its own, lit: it is the one thing here that says
 * which product you are signing in to. It is round because the artwork
 * is round — the file is cropped to a circle with a transparent
 * surround, so the bloom sits behind it instead of being clipped by a
 * frame drawn around a square.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-canvas relative flex min-h-svh flex-col items-center justify-center overflow-hidden p-6 md:p-10">
      <div className="relative flex w-full max-w-sm flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-4">
          <span className="brand-neon block">
            <Image
              src={PRODUCT_LOGO_SRC}
              alt={PRODUCT_LOGO_ALT}
              width={512}
              height={512}
              className="size-28 rounded-full object-contain sm:size-32"
              priority
            />
          </span>
          <p className="glass rounded-full px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Gym Management OS
          </p>
        </div>

        {/* The card is glass over the brand canvas rather than a bordered
            white box, so the sign-in form looks like a pane floating in
            the same light as the mark above it. */}
        <div className="glass-strong w-full rounded-3xl p-1.5">
          <div className="relative z-10">{children}</div>
        </div>

        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Secure &middot; Role-based access
        </p>
        <LegalFooter className="-mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground" />
      </div>
    </main>
  );
}

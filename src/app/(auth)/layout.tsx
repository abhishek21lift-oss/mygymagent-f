import * as React from "react";
import Image from "next/image";

import { PRODUCT_LOGO_ALT, PRODUCT_LOGO_SRC } from "@/lib/brand";

/**
 * The sign-in canvas.
 *
 * The mark leads, on its own, lit: it is the one thing on this screen
 * that says which product you are signing in to. It is round because
 * the artwork is round -- the file is cropped to a circle with a
 * transparent surround, so the glow sits behind it instead of being
 * clipped by a frame drawn around a square.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
 return (
 <main className="auth-neon-canvas relative flex min-h-svh flex-col items-center justify-center overflow-hidden p-6 md:p-10">
 <div className="relative flex w-full max-w-sm flex-col items-center gap-5">
 <div className="flex flex-col items-center gap-3">
 <span className="brand-neon block">
 <Image
 src={PRODUCT_LOGO_SRC}
 alt={PRODUCT_LOGO_ALT}
 width={512}
 height={512}
 className="size-32 rounded-full object-contain sm:size-36"
 priority
 />
 </span>
 <p className="rounded-full border border-border/60 bg-card/70 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground backdrop-blur">
 Gym Management OS
 </p>
 </div>

 <div className="w-full rounded-lg border border-border/60 bg-card/85 p-1 shadow-sm backdrop-blur">
 <div className="relative z-10">{children}</div>
 </div>

 <p className="text-center font-mono text-xs font-medium uppercase tracking-widest text-muted-foreground">
 Secure &middot; Role-based access
 </p>
 </div>
 </main>
 );
}

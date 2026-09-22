import * as React from "react";
import Image from "next/image";

import { PRODUCT_LOGO_ALT, PRODUCT_LOGO_DATA_URI } from "@/lib/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
 return (
  <main className="page-ambient relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background p-6 md:p-10">
   <div className="relative flex w-full max-w-sm flex-col gap-4">
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-card/80 px-6 py-5 shadow-xl backdrop-blur-xl">
     <Image
      src={PRODUCT_LOGO_DATA_URI}
      alt={PRODUCT_LOGO_ALT}
      width={192}
      height={192}
      unoptimized
      className="h-auto w-40 object-contain"
      priority
     />
     <p className="rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Gym Management OS</p>
    </div>
    <div className="rounded-2xl border border-border/60 bg-card/85 p-1 shadow-2xl backdrop-blur-xl">
     <div className="relative z-10">{children}</div>
    </div>
    <p className="text-center font-mono text-xs font-medium uppercase tracking-widest text-muted-foreground">
     Secure &middot; Role-based access
    </p>
   </div>
  </main>
 );
}

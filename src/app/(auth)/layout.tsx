import * as React from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
 return (
  <main className="relative flex min-h-svh flex-col items-center justify-center bg-background p-6 md:p-10">
   <div className="relative flex w-full max-w-sm flex-col gap-4">
    <div className="flex flex-col items-center gap-2 rounded-xl border bg-card px-6 py-5 shadow-sm">
     <img
      src="/logo-lockup.webp"
      alt="MyGymAgent"
      width={192}
      height={192}
      className="h-auto w-40 object-contain"
     />
     <p className="rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Gym Management OS</p>
    </div>
    <div className="rounded-xl border bg-card p-5 shadow-sm">
     <div className="relative z-10">{children}</div>
    </div>
    <p className="text-center font-mono text-xs font-medium uppercase tracking-widest text-muted-foreground">
     Secure &middot; Role-based access
    </p>
   </div>
  </main>
 );
}

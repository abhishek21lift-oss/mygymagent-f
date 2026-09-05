import * as React from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-muted/40 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <img
          src="/logo-lockup.webp"
          alt="MyGymAgent"
          width={192}
          height={192}
          className="mx-auto h-auto w-48 object-contain"
        />
        {children}
      </div>
    </main>
  );
}

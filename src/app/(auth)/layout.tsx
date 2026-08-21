"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth/auth-context";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/40 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Image
          src="/logo-full.webp"
          alt="MyGymAgent"
          width={900}
          height={722}
          className="h-auto w-48 self-center"
          priority
        />
        {children}
      </div>
    </div>
  );
}

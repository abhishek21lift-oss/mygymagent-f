"use client";

import * as React from "react";

import { QueryProvider } from "@/components/providers/query-provider";
import { AuthProvider } from "@/lib/auth/auth-context";
import { Toaster } from "@/components/ui/sonner";

/**
 * Everything a signed-in screen needs: data fetching, the session and
 * toasts. Mounted by (session)/layout.tsx, not the root layout, so the
 * landing, pricing, features, guides and policies ship none of it and a
 * visitor's first page load makes no session call.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
        {/* Below the notch / status bar when the page draws under it. */}
        <Toaster
          position="top-center"
          richColors
          closeButton
          mobileOffset={{ top: "calc(env(safe-area-inset-top) + 0.75rem)" }}
        />
      </AuthProvider>
    </QueryProvider>
  );
}

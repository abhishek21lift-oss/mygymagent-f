import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthProvider } from "@/lib/auth/auth-context";
import { Toaster } from "@/components/ui/sonner";
import ErrorBoundary from "@/components/ui/error-boundary";

export const metadata: Metadata = {
  title: "MyGymAgent",
  description: "AI-driven gym management and personal training platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <ErrorBoundary fallback={<div className="p-6 text-center">Something went wrong. Please refresh the page.</div>}>
                {children}
              </ErrorBoundary>
              <Toaster position="top-right" richColors />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

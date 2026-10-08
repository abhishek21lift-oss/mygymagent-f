import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthProvider } from "@/lib/auth/auth-context";
import { Toaster } from "@/components/ui/sonner";
import ErrorBoundary from "@/components/ui/error-boundary";
import { PRODUCT_LOGO_ICON_SRC, PRODUCT_NAME } from "@/lib/brand";
import { SITE, siteUrl } from "@/lib/site";

/**
 * No webfont.
 *
 * The previous system loaded Geist from Google on every page. The
 * redesign is an Apple-idiom interface, and the correct face for an
 * Apple-idiom interface is the platform's own: `-apple-system`
 * resolves to SF Pro on a Mac, iPhone or iPad, and to that OS's native
 * UI face everywhere else (Segoe UI Variable on Windows, Roboto on
 * Android). A webfont is a *different* typeface from the one the rest
 * of the operating system is drawing with, which is the specific
 * mismatch that makes an interface feel like a website.
 *
 * The stacks themselves live in `@theme inline` in globals.css, so
 * this file has nothing to configure and nothing to wait for — no
 * font request, no layout shift, and the first paint is already in
 * the right face.
 */
export const metadata: Metadata = {
  // The canonical origin, for every route's social cards (src/lib/site.ts).
  metadataBase: siteUrl(),
  // A page's own `title` becomes "<title> · THE CULT CLIENT"; the landing
  // page sets an absolute one.
  title: { default: PRODUCT_NAME, template: `%s · ${PRODUCT_NAME}` },
  description: SITE.description,
  applicationName: PRODUCT_NAME,
  appleWebApp: { capable: true, title: PRODUCT_NAME, statusBarStyle: "default" },
  icons: {
    icon: PRODUCT_LOGO_ICON_SRC,
    // Opaque: iOS paints a transparent Home Screen icon's corners black.
    apple: "/brand/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8fb" },
    { media: "(prefers-color-scheme: dark)", color: "#14161f" },
  ],
  width: "device-width",
  initialScale: 1,
  // The top bar is a translucent material that the browser is told
  // about, so on iOS the status bar area picks up the same treatment
  // instead of a flat white strip above a glass bar.
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" suppressHydrationWarning className="h-full antialiased">
      <body className="min-h-full">
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <ErrorBoundary
                fallback={
                  <div className="flex min-h-svh flex-col items-center justify-center gap-3 p-6 text-center">
                    <p className="text-lg font-semibold">Something went wrong.</p>
                    <p className="text-sm text-muted-foreground">Please refresh the page.</p>
                  </div>
                }
              >
                {children}
              </ErrorBoundary>
              <Toaster position="top-center" richColors closeButton />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

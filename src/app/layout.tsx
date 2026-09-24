import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthProvider } from "@/lib/auth/auth-context";
import { Toaster } from "@/components/ui/sonner";
import ErrorBoundary from "@/components/ui/error-boundary";
import { PRODUCT_LOGO_ICON_SRC, PRODUCT_NAME } from "@/lib/brand";

const geistSans = Geist({
 variable: "--font-geist-sans",
 subsets: ["latin"],
});

const geistMono = Geist_Mono({
 variable: "--font-geist-mono",
 subsets: ["latin"],
});

export const metadata: Metadata = {
 title: PRODUCT_NAME,
 description: "AI-driven gym management and personal training platform",
 icons: {
 icon: PRODUCT_LOGO_ICON_SRC,
 apple: PRODUCT_LOGO_ICON_SRC,
 },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
 return (
 <html
 lang="en"
 suppressHydrationWarning
 data-scroll-behavior="smooth"
 className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
 >
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

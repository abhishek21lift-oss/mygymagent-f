"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { ThemeProvider as NextThemesProvider } from "next-themes"

/** Routes that are always light, whatever the device or the visitor chose:
 * the self-service kiosk is a shared lobby screen, designed light only. */
const LIGHT_ONLY = ["/kiosk"]

export function ThemeProvider({ children }: { children: React.ReactNode }) {
 const pathname = usePathname()
 const forcedTheme = LIGHT_ONLY.some((route) => pathname === route || pathname?.startsWith(`${route}/`))
 ? "light"
 : undefined
 return (
 <NextThemesProvider
 attribute="class"
 defaultTheme="system"
 enableSystem
 disableTransitionOnChange
 forcedTheme={forcedTheme}
 >
 {children}
 </NextThemesProvider>
 )
}

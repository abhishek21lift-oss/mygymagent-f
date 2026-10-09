import type { Metadata, Viewport } from "next"

import "./kiosk.css"

/**
 * The kiosk is a public screen in a gym lobby: kept out of search, light
 * whatever the device's own theme (ThemeProvider forces it on this
 * route), and fixed at 1x so a stray pinch cannot leave it zoomed in for
 * the next member.
 */
export const metadata: Metadata = {
  title: "Check in",
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: "#f7f7fc",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return children
}

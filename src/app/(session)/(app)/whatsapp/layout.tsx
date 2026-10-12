"use client"

import * as React from "react"

import { WhatsAppNavStrip } from "@/components/app-shell/whatsapp-nav"

/**
 * WhatsApp command-center navigation. The shell renders the dedicated
 * sidebar (desktop/tablet) and the compact strip (phones); this export
 * keeps the documented nav contract — every entry at a real destination —
 * importable where the layout tests assert it.
 */
export function WhatsAppShellNav() {
  return <WhatsAppNavStrip />
}

export default function WhatsAppLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-w-0 flex-1">{children}</div>
}

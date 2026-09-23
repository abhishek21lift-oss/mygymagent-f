"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth/auth-context"

/**
 * The warning half of the second-factor policy: shown while the
 * organization requires MFA for this user's role but the deadline has not
 * passed yet.
 *
 * Deliberately not dismissible. The state it reports is not a notification,
 * it is a countdown to losing access to everything but the setup screen,
 * and a banner the user can dismiss on day one is a warning they will not
 * see again on day thirteen.
 */
export function MfaGraceBanner() {
 const { mfaEnrolment } = useAuth()
 const pathname = usePathname()

 if (mfaEnrolment?.state !== "GRACE") return null
 // No point nagging someone who is already on the page that fixes it.
 if (pathname === "/settings/security") return null

 const deadline = mfaEnrolment.deadline
 ? new Date(mfaEnrolment.deadline).toLocaleDateString(undefined, {
 year: "numeric",
 month: "long",
 day: "numeric",
 })
 : null

 return (
 <div
 role="status"
 className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm text-amber-900"
 >
 <ShieldAlert className="size-5 shrink-0 text-amber-600" aria-hidden="true" />
 <p className="min-w-0 flex-1">
 <strong>Two-step verification is required for your role.</strong>{" "}
 {deadline
 ? `Set it up by ${deadline} to keep full access.`
 : "Set it up to keep full access."}
 </p>
 <Button asChild size="sm" className="min-h-9 shrink-0">
 <Link href="/settings/security">Set it up</Link>
 </Button>
 </div>
 )
}

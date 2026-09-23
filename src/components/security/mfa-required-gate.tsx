"use client"

import * as React from "react"
import { ShieldAlert } from "lucide-react"

import { MfaEnrolment } from "@/components/security/mfa-enrolment"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth/auth-context"

/**
 * Shown instead of the application when the backend has confined this
 * session to enrolment (`mfaEnrolment.state === "ENFORCED"`).
 *
 * It replaces the shell rather than rendering inside it because the shell's
 * own chrome — navigation counts, the notification centre, the branch
 * picker — fetches data this session is not allowed to read. Rendering it
 * would fill the screen with 403s and bury the one action available.
 */
export function MfaRequiredGate() {
  const { user, logout, refetchMe } = useAuth()

  return (
    <div className="flex min-h-svh items-start justify-center bg-background px-4 py-10 sm:items-center">
      <div className="w-full max-w-2xl rounded-2xl border border-border/60 bg-card p-6 shadow-xl sm:p-8">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
            <ShieldAlert className="size-5" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold tracking-tight">
              Set up two-step verification to continue
            </h1>
            <p className="text-sm text-muted-foreground">
              Your organization requires a second factor for your role. You are
              signed in{user?.email ? ` as ${user.email}` : ""}, but the rest of
              the app stays locked until this is set up.
            </p>
          </div>
        </div>

        <div className="mt-6 border-t pt-6">
          {/* Re-reading /auth/me is what lifts the gate: the backend
              recomputes the restriction per request, so the very next call
              after enrolling comes back unrestricted. */}
          <MfaEnrolment onEnrolled={() => void refetchMe()} />
        </div>

        <div className="mt-6 flex justify-end border-t pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => void logout()}
            className="min-h-11"
          >
            Sign out
          </Button>
        </div>
      </div>
    </div>
  )
}

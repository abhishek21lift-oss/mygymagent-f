"use client"

import * as React from "react"
import Link from "next/link"
import {
 ArrowLeft,
 ShieldAlert,
 ShieldCheck,
 ShieldOff,
 TriangleAlert,
} from "lucide-react"
import { toast } from "sonner"

import { MfaEnrolment } from "@/components/security/mfa-enrolment"
import { ErrorState } from "@/components/shared/error-state"
import { PageHero } from "@/components/shared/page-hero"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError } from "@/lib/api/client"
import { useAuth } from "@/lib/auth/auth-context"
import {
 useDisableMfa,
 useMfaPolicy,
 useMfaPolicyReport,
 useMfaStatus,
 useUpdateMfaPolicy,
} from "@/lib/hooks/use-mfa"

function message(error: unknown, fallback: string) {
 return error instanceof ApiError ? error.message : fallback
}

function formatDate(value: string | null) {
 if (!value) return null
 return new Date(value).toLocaleDateString(undefined, {
 year: "numeric",
 month: "long",
 day: "numeric",
 })
}

/** The signed-in user's own second factor. */
function MyTwoStepSection() {
 const status = useMfaStatus()
 const disableMfa = useDisableMfa()

 const [disablePassword, setDisablePassword] = React.useState("")
 const [disableCode, setDisableCode] = React.useState("")
 const [disableError, setDisableError] = React.useState("")
 const [showDisable, setShowDisable] = React.useState(false)

 async function onDisable(event: React.FormEvent<HTMLFormElement>) {
 event.preventDefault()
 setDisableError("")
 if (!disablePassword || disableCode.trim().length < 6) {
 setDisableError("Enter your password and a current code (or a recovery code).")
 return
 }
 try {
 await disableMfa.mutateAsync({ password: disablePassword, code: disableCode.trim() })
 setDisablePassword("")
 setDisableCode("")
 setShowDisable(false)
 toast.success("Two-step verification is off")
 } catch (error) {
 setDisableError(message(error, "Could not turn two-step verification off."))
 }
 }

 if (status.isPending) {
 return (
 <div className="flex flex-col gap-3" role="status" aria-label="Loading security settings">
 <Skeleton className="h-6 w-48" />
 <Skeleton className="h-11 w-40" />
 </div>
 )
 }
 if (status.isError) {
 return (
 <ErrorState
 message={message(status.error, "Could not load your security settings.")}
 onRetry={() => void status.refetch()}
 />
 )
 }

 if (!status.data.enabled) {
 return (
 <div className="flex flex-col gap-4">
 <div className="flex items-center gap-2 text-sm font-medium text-stone-600">
 <ShieldOff className="size-5" aria-hidden="true" />
 Two-step verification is off
 </div>
 <MfaEnrolment onEnrolled={() => void status.refetch()} />
 </div>
 )
 }

 return (
 <div className="flex flex-col gap-4">
 <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
 <ShieldCheck className="size-5" aria-hidden="true" />
 Two-step verification is on
 </div>
 <p className="text-sm text-muted-foreground">
 {status.data.recoveryCodesRemaining} unused recovery{" "}
 {status.data.recoveryCodesRemaining === 1 ? "code" : "codes"} remaining.
 {status.data.recoveryCodesRemaining === 0
 ? " Turn verification off and back on to issue a fresh set."
 : null}
 </p>

 {showDisable ? (
 <form onSubmit={onDisable} className="flex max-w-md flex-col gap-3" noValidate>
 <p className="text-sm text-muted-foreground">
 Turning this off needs your password <em>and</em> a current code, so
 neither a stolen password nor a stolen session is enough on its own.
 </p>
 <div className="flex flex-col gap-1.5">
 <label htmlFor="disable-password" className="text-sm font-medium">
 Password
 </label>
 <Input
 id="disable-password"
 type="password"
 autoComplete="current-password"
 value={disablePassword}
 onChange={(e) => setDisablePassword(e.target.value)}
 className="h-11"
 />
 </div>
 <div className="flex flex-col gap-1.5">
 <label htmlFor="disable-code" className="text-sm font-medium">
 Authenticator or recovery code
 </label>
 <Input
 id="disable-code"
 type="text"
 autoComplete="one-time-code"
 spellCheck={false}
 value={disableCode}
 onChange={(e) => setDisableCode(e.target.value)}
 className="h-11 font-mono tracking-widest"
 />
 </div>
 {disableError ? (
 <Alert variant="destructive">
 <AlertDescription>{disableError}</AlertDescription>
 </Alert>
 ) : null}
 <div className="flex flex-wrap gap-2">
 <Button
 type="submit"
 variant="destructive"
 disabled={disableMfa.isPending}
 aria-busy={disableMfa.isPending}
 className="min-h-11"
 >
 {disableMfa.isPending ? "Turning off..." : "Turn off"}
 </Button>
 <Button
 type="button"
 variant="ghost"
 onClick={() => {
 setShowDisable(false)
 setDisableError("")
 }}
 className="min-h-11"
 >
 Cancel
 </Button>
 </div>
 </form>
 ) : (
 <Button
 type="button"
 variant="outline"
 onClick={() => setShowDisable(true)}
 className="min-h-11 w-fit gap-2"
 >
 <ShieldOff className="size-4" aria-hidden="true" /> Turn off
 </Button>
 )}
 </div>
 )
}

/**
 * Organization-wide policy, for admins who can change it.
 *
 * The report is shown above the switch on purpose: turning enforcement on
 * without first seeing who is unenrolled is how an organization finds out
 * its accountant is on holiday the hard way.
 */
function PolicySection() {
 const policy = useMfaPolicy()
 const report = useMfaPolicyReport()
 const updatePolicy = useUpdateMfaPolicy()
 const [error, setError] = React.useState("")

 async function setPolicy(
 next: "OPTIONAL" | "REQUIRED_FOR_PRIVILEGED",
 graceUntil?: string | null,
 ) {
 setError("")
 try {
 await updatePolicy.mutateAsync(
 graceUntil === undefined ? { policy: next } : { policy: next, graceUntil },
 )
 toast.success(
 next === "OPTIONAL"
 ? "Two-step verification is no longer required"
 : "Two-step verification is now required for privileged roles",
 )
 } catch (err) {
 setError(message(err, "Could not update the policy."))
 }
 }

 if (policy.isPending) {
 return <Skeleton className="h-24 w-full rounded-xl" />
 }
 if (policy.isError) {
 return (
 <ErrorState
 message={message(policy.error, "Could not load the organization policy.")}
 onRetry={() => void policy.refetch()}
 />
 )
 }

 const required = policy.data.policy === "REQUIRED_FOR_PRIVILEGED"
 const deadline = formatDate(policy.data.graceUntil)
 const pending = report.data?.summary.pending ?? 0

 return (
 <div className="flex flex-col gap-5">
 <div>
 <h2 className="text-lg font-semibold tracking-tight">
 Require two-step verification
 </h2>
 <p className="mt-1 text-sm text-muted-foreground">
 Applies to {policy.data.privilegedRoles.join(", ")} — the roles that can
 reach settings, payroll and accounting. Nobody is ever locked out: once
 the deadline passes, an unenrolled user can still sign in, but can only
 reach the setup screen until they finish.
 </p>
 </div>

 {report.isPending ? (
 <Skeleton className="h-28 w-full rounded-xl" />
 ) : report.isError ? (
 <ErrorState
 message={message(report.error, "Could not load the enrolment report.")}
 onRetry={() => void report.refetch()}
 />
 ) : (
 <div className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-stone-50/70 p-4">
 <div className="flex flex-wrap items-center gap-4 text-sm">
 <span className="font-semibold">
 {report.data.summary.enrolled} of {report.data.summary.total} covered
 users protected
 </span>
 {pending > 0 ? (
 <span className="inline-flex items-center gap-1.5 text-amber-700">
 <TriangleAlert className="size-4" aria-hidden="true" />
 {pending} still to enrol
 </span>
 ) : null}
 </div>
 <ul className="flex flex-col gap-1.5">
 {report.data.users.map((user) => (
 <li
 key={user.id}
 className="flex flex-wrap items-center justify-between gap-2 text-sm"
 >
 <span>
 {user.firstName} {user.lastName}{" "}
 <span className="text-muted-foreground">
 ({user.roles.join(", ")})
 </span>
 </span>
 {user.mfaEnabled ? (
 <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
 <ShieldCheck className="size-4" aria-hidden="true" /> Protected
 </span>
 ) : (
 <span className="inline-flex items-center gap-1.5 font-medium text-amber-700">
 <ShieldAlert className="size-4" aria-hidden="true" /> Not enrolled
 </span>
 )}
 </li>
 ))}
 </ul>
 </div>
 )}

 {required ? (
 <Alert>
 <ShieldCheck className="size-4" aria-hidden="true" />
 <AlertDescription>
 {policy.data.enforcementActive ? (
 <>
 <strong>Enforcing now.</strong> Unenrolled{" "}
 {policy.data.privilegedRoles.join(", ")} users can sign in but can
 only reach the two-step setup screen.
 </>
 ) : (
 <>
 <strong>Grace period until {deadline}.</strong> Covered users are
 warned when they sign in. After that date, unenrolled users are
 limited to the setup screen.
 </>
 )}
 </AlertDescription>
 </Alert>
 ) : null}

 {error ? (
 <Alert variant="destructive">
 <AlertDescription>{error}</AlertDescription>
 </Alert>
 ) : null}

 <div className="flex flex-wrap gap-2">
 {required ? (
 <>
 <Button
 type="button"
 variant="outline"
 onClick={() => void setPolicy("OPTIONAL")}
 disabled={updatePolicy.isPending}
 className="min-h-11"
 >
 Stop requiring it
 </Button>
 {!policy.data.enforcementActive ? (
 <Button
 type="button"
 variant="destructive"
 onClick={() => void setPolicy("REQUIRED_FOR_PRIVILEGED", null)}
 disabled={updatePolicy.isPending}
 className="min-h-11"
 >
 Enforce now, skip the grace period
 </Button>
 ) : null}
 </>
 ) : (
 <Button
 type="button"
 onClick={() => void setPolicy("REQUIRED_FOR_PRIVILEGED")}
 disabled={updatePolicy.isPending}
 aria-busy={updatePolicy.isPending}
 className="min-h-11 gap-2"
 >
 <ShieldCheck className="size-4" aria-hidden="true" />
 {updatePolicy.isPending ? "Saving..." : "Require it (14-day grace period)"}
 </Button>
 )}
 </div>
 </div>
 )
}

export default function SecuritySettingsPage() {
 const { hasPermission } = useAuth()
 // The policy endpoints are gated on `organizations.update`; querying them
 // without it would just 403 into an error state the user cannot act on.
 const canSetPolicy = hasPermission("organizations.update")

 return (
 <div className="relative -mx-2 min-h-full overflow-hidden pb-12 sm:-mx-3 lg:-mx-5">
 <div className="mx-auto flex max-w-[1680px] flex-col gap-6 px-2 sm:px-4 lg:px-6">
 <PageHero
 id="security-settings-title"
 icon={ShieldCheck}
 title="Security"
 description="Protect your account with a second factor at sign-in."
 variant="light"
 accent="indigo"
 actions={
 <Button asChild variant="outline" className="min-h-11 rounded-lg bg-card">
 <Link href="/settings">
 <ArrowLeft className="size-4" aria-hidden="true" /> Settings
 </Link>
 </Button>
 }
 />

 <Card className="overflow-hidden border-white/80 bg-card shadow-sm shadow-indigo-900/5 ">
 <CardContent className="flex flex-col gap-5 p-6">
 <div>
 <h2 className="text-lg font-semibold tracking-tight">Two-step verification</h2>
 <p className="mt-1 text-sm text-muted-foreground">
 After your password, sign-in asks for a 6-digit code from an authenticator
 app such as Google Authenticator, 1Password or Authy.
 </p>
 </div>
 <MyTwoStepSection />
 </CardContent>
 </Card>

 {canSetPolicy ? (
 <Card className="overflow-hidden border-white/80 bg-card shadow-sm shadow-indigo-900/5 ">
 <CardContent className="p-6">
 <PolicySection />
 </CardContent>
 </Card>
 ) : null}
 </div>
 </div>
 )
}

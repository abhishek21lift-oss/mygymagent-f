"use client"

import * as React from "react"
import QRCode from "qrcode"
import { Check, Copy, Download, TriangleAlert } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError } from "@/lib/api/client"
import { useEnableMfa, useStartMfaEnrolment } from "@/lib/hooks/use-mfa"
import type { MfaSetupResponse } from "@/lib/types/auth"

function message(error: unknown, fallback: string) {
 return error instanceof ApiError ? error.message : fallback
}

function OtpAuthQr({ uri }: { uri: string }) {
 const [svg, setSvg] = React.useState<string | null>(null)
 const [failed, setFailed] = React.useState(false)

 React.useEffect(() => {
 let cancelled = false
 QRCode.toString(uri, { type: "svg", margin: 1, width: 200 })
 .then((markup) => {
 if (!cancelled) setSvg(markup)
 })
 .catch(() => {
 if (!cancelled) setFailed(true)
 })
 return () => {
 cancelled = true
 }
 }, [uri])

 if (failed) {
 // Not fatal: the secret below is the same credential, typed by hand.
 return (
 <div className="flex size-[200px] items-center justify-center rounded-xl border border-dashed border-stone-300 p-4 text-center text-xs text-muted-foreground">
 Could not draw the QR code. Enter the setup key below manually instead.
 </div>
 )
 }
 if (!svg) return <Skeleton className="size-[200px] rounded-xl" />
 return (
 <div
 className="size-[200px] rounded-xl bg-white p-2 [&>svg]:size-full"
 role="img"
 aria-label="QR code for your authenticator app"
 dangerouslySetInnerHTML={{ __html: svg }}
 />
 )
}

function CopyButton({ value, label }: { value: string; label: string }) {
 const [copied, setCopied] = React.useState(false)

 async function onCopy() {
 try {
 await navigator.clipboard.writeText(value)
 setCopied(true)
 window.setTimeout(() => setCopied(false), 2000)
 } catch {
 toast.error("Could not copy to the clipboard. Select the text and copy it manually.")
 }
 }

 return (
 <Button type="button" variant="outline" onClick={onCopy} className="min-h-11 gap-2">
 {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
 {copied ? "Copied" : label}
 </Button>
 )
}

/** Shown exactly once, immediately after enabling. These codes are stored
 * only as hashes, so this screen is the single opportunity to keep them. */
function RecoveryCodes({ codes, onDone }: { codes: string[]; onDone: () => void }) {
 const [acknowledged, setAcknowledged] = React.useState(false)
 const asText = codes.join("\n")

 function onDownload() {
 const blob = new Blob(
 [`MyGymAgent two-factor recovery codes\nEach code works once.\n\n${asText}\n`],
 { type: "text/plain" },
 )
 const url = URL.createObjectURL(blob)
 const anchor = document.createElement("a")
 anchor.href = url
 anchor.download = "mygymagent-recovery-codes.txt"
 anchor.click()
 URL.revokeObjectURL(url)
 setAcknowledged(true)
 }

 return (
 <div className="flex flex-col gap-4">
 <Alert>
 <TriangleAlert className="size-4" aria-hidden="true" />
 <AlertDescription>
 Save these {codes.length} recovery codes now. Each one signs you in once if you
 lose your authenticator device. <strong>They cannot be shown again</strong> —
 generating new ones means turning two-step verification off and back on.
 </AlertDescription>
 </Alert>
 <ul className="grid grid-cols-1 gap-2 rounded-xl border border-stone-200 bg-stone-50 p-4 font-mono text-sm sm:grid-cols-2">
 {codes.map((code) => (
 <li key={code} className="tracking-widest text-stone-800">
 {code}
 </li>
 ))}
 </ul>
 <div className="flex flex-wrap gap-2">
 <Button type="button" variant="outline" onClick={onDownload} className="min-h-11 gap-2">
 <Download className="size-4" aria-hidden="true" /> Download
 </Button>
 <CopyButton value={asText} label="Copy all" />
 </div>
 <div className="flex items-center gap-2">
 <input
 id="ack-codes"
 type="checkbox"
 checked={acknowledged}
 onChange={(e) => setAcknowledged(e.target.checked)}
 className="size-4 rounded border-stone-300"
 />
 <label htmlFor="ack-codes" className="text-sm">
 I have saved my recovery codes somewhere safe
 </label>
 </div>
 <Button type="button" onClick={onDone} disabled={!acknowledged} className="min-h-11 w-fit">
 Done
 </Button>
 </div>
 )
}

/**
 * The enrol-a-second-factor flow, start to recovery codes.
 *
 * Shared deliberately: the settings screen and the enforcement gate in the
 * app layout must not drift apart, because the gate is the *only* screen a
 * user whose organization requires MFA can reach.
 */
export function MfaEnrolment({
 onEnrolled,
}: {
 /** Called once enrolment is confirmed and the recovery codes have been
 * acknowledged. */
 onEnrolled?: () => void
}) {
 const startEnrolment = useStartMfaEnrolment()
 const enableMfa = useEnableMfa()

 // Held in component state only: the secret is returned once and is never
 // retrievable again, so it must not outlive this screen.
 const [setup, setSetup] = React.useState<MfaSetupResponse | null>(null)
 const [recoveryCodes, setRecoveryCodes] = React.useState<string[] | null>(null)
 const [code, setCode] = React.useState("")
 const [error, setError] = React.useState("")

 async function onStart() {
 setError("")
 try {
 setSetup(await startEnrolment.mutateAsync())
 } catch (err) {
 setError(message(err, "Could not start two-step verification setup."))
 }
 }

 async function onConfirm(event: React.FormEvent<HTMLFormElement>) {
 event.preventDefault()
 setError("")
 const trimmed = code.trim()
 if (trimmed.length !== 6) {
 setError("Enter the 6-digit code shown in your authenticator app.")
 return
 }
 try {
 const result = await enableMfa.mutateAsync(trimmed)
 // Drop the secret the moment it is no longer needed.
 setSetup(null)
 setCode("")
 setRecoveryCodes(result.recoveryCodes)
 toast.success("Two-step verification is on")
 } catch (err) {
 setError(message(err, "That code was not accepted. Try the next one."))
 setCode("")
 }
 }

 if (recoveryCodes) {
 return (
 <RecoveryCodes
 codes={recoveryCodes}
 onDone={() => {
 setRecoveryCodes(null)
 onEnrolled?.()
 }}
 />
 )
 }

 if (!setup) {
 return (
 <div className="flex flex-col gap-4">
 {error ? (
 <Alert variant="destructive">
 <AlertDescription>{error}</AlertDescription>
 </Alert>
 ) : null}
 <Button
 type="button"
 onClick={onStart}
 disabled={startEnrolment.isPending}
 aria-busy={startEnrolment.isPending}
 className="min-h-11 w-fit"
 >
 {startEnrolment.isPending ? "Preparing..." : "Set up two-step verification"}
 </Button>
 </div>
 )
 }

 return (
 <div className="flex flex-col gap-5">
 <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
 <OtpAuthQr uri={setup.otpauthUri} />
 <div className="flex flex-1 flex-col gap-3">
 <p className="text-sm">
 <strong>1.</strong> Scan this code with your authenticator app, or enter
 the setup key below by hand.
 </p>
 <div className="flex flex-col gap-2">
 <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
 Setup key
 </span>
 <code className="break-all rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 font-mono text-sm tracking-wider">
 {setup.secret}
 </code>
 <CopyButton value={setup.secret} label="Copy setup key" />
 </div>
 </div>
 </div>
 <form onSubmit={onConfirm} className="flex max-w-sm flex-col gap-3" noValidate>
 <label htmlFor="enrol-code" className="text-sm">
 <strong>2.</strong> Enter the 6-digit code your app now shows.
 </label>
 <Input
 id="enrol-code"
 type="text"
 inputMode="numeric"
 autoComplete="one-time-code"
 placeholder="123456"
 value={code}
 onChange={(e) => setCode(e.target.value)}
 className="h-11 font-mono tracking-widest"
 />
 {error ? (
 <Alert variant="destructive">
 <AlertDescription>{error}</AlertDescription>
 </Alert>
 ) : null}
 <div className="flex flex-wrap gap-2">
 <Button
 type="submit"
 disabled={enableMfa.isPending}
 aria-busy={enableMfa.isPending}
 className="min-h-11"
 >
 {enableMfa.isPending ? "Verifying..." : "Turn on"}
 </Button>
 <Button
 type="button"
 variant="ghost"
 onClick={() => {
 setSetup(null)
 setCode("")
 setError("")
 }}
 className="min-h-11"
 >
 Cancel
 </Button>
 </div>
 </form>
 </div>
 )
}

"use client"

import * as React from "react"
import Link from "next/link"
import QRCode from "qrcode"
import { ArrowLeft, Check, Copy, Download, ShieldCheck, ShieldOff, TriangleAlert } from "lucide-react"
import { toast } from "sonner"

import { ErrorState } from "@/components/shared/error-state"
import { PageHero } from "@/components/shared/page-hero"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError } from "@/lib/api/client"
import {
  useDisableMfa,
  useEnableMfa,
  useMfaStatus,
  useStartMfaEnrolment,
} from "@/lib/hooks/use-mfa"
import type { MfaSetupResponse } from "@/lib/types/auth"

function message(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback
}

/**
 * Renders an `otpauth://` URI as a scannable QR. The backend deliberately
 * returns the URI rather than an image, so the secret is never rendered
 * server-side into something cacheable -- the code is drawn here, in the
 * browser, from data that only this tab holds.
 */
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

export default function SecuritySettingsPage() {
  const status = useMfaStatus()
  const startEnrolment = useStartMfaEnrolment()
  const enableMfa = useEnableMfa()
  const disableMfa = useDisableMfa()

  // Held in component state only: the secret is returned once and is never
  // retrievable again, so it must not outlive this screen.
  const [setup, setSetup] = React.useState<MfaSetupResponse | null>(null)
  const [recoveryCodes, setRecoveryCodes] = React.useState<string[] | null>(null)
  const [code, setCode] = React.useState("")
  const [enrolError, setEnrolError] = React.useState("")

  const [disablePassword, setDisablePassword] = React.useState("")
  const [disableCode, setDisableCode] = React.useState("")
  const [disableError, setDisableError] = React.useState("")
  const [showDisable, setShowDisable] = React.useState(false)

  async function onStart() {
    setEnrolError("")
    try {
      setSetup(await startEnrolment.mutateAsync())
    } catch (error) {
      setEnrolError(message(error, "Could not start two-step verification setup."))
    }
  }

  async function onConfirm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setEnrolError("")
    const trimmed = code.trim()
    if (trimmed.length !== 6) {
      setEnrolError("Enter the 6-digit code shown in your authenticator app.")
      return
    }
    try {
      const result = await enableMfa.mutateAsync(trimmed)
      // Drop the secret the moment it is no longer needed.
      setSetup(null)
      setCode("")
      setRecoveryCodes(result.recoveryCodes)
      toast.success("Two-step verification is on")
    } catch (error) {
      setEnrolError(message(error, "That code was not accepted. Try the next one."))
      setCode("")
    }
  }

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

  const enabled = status.data?.enabled ?? false

  return (
    <div className="relative -mx-2 min-h-full overflow-hidden pb-12 sm:-mx-3 lg:-mx-5">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_5%_2%,rgba(6,182,212,.13),transparent_19%),radial-gradient(circle_at_96%_4%,rgba(99,102,241,.15),transparent_22%)]"
        aria-hidden="true"
      />
      <div className="mx-auto flex max-w-[1680px] flex-col gap-6 px-2 sm:px-4 lg:px-6">
        <PageHero
          id="security-settings-title"
          icon={ShieldCheck}
          title="Security"
          description="Protect your account with a second factor at sign-in."
          variant="light"
          accent="indigo"
          actions={
            <Button asChild variant="outline" className="min-h-11 rounded-2xl bg-white/80">
              <Link href="/settings">
                <ArrowLeft className="size-4" aria-hidden="true" /> Settings
              </Link>
            </Button>
          }
        />

        <Card className="overflow-hidden border-white/80 bg-white/85 shadow-xl shadow-indigo-900/5 backdrop-blur-xl">
          <CardContent className="flex flex-col gap-5 p-6">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Two-step verification</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                After your password, sign-in asks for a 6-digit code from an authenticator
                app such as Google Authenticator, 1Password or Authy.
              </p>
            </div>

            {status.isPending ? (
              <div className="flex flex-col gap-3" role="status" aria-label="Loading security settings">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-11 w-40" />
              </div>
            ) : status.isError ? (
              <ErrorState
                message={message(status.error, "Could not load your security settings.")}
                onRetry={() => void status.refetch()}
              />
            ) : recoveryCodes ? (
              <RecoveryCodes codes={recoveryCodes} onDone={() => setRecoveryCodes(null)} />
            ) : enabled ? (
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
            ) : setup ? (
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
                  {enrolError ? (
                    <Alert variant="destructive">
                      <AlertDescription>{enrolError}</AlertDescription>
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
                        setEnrolError("")
                      }}
                      className="min-h-11"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-sm font-medium text-stone-600">
                  <ShieldOff className="size-5" aria-hidden="true" />
                  Two-step verification is off
                </div>
                {enrolError ? (
                  <Alert variant="destructive">
                    <AlertDescription>{enrolError}</AlertDescription>
                  </Alert>
                ) : null}
                <Button
                  type="button"
                  onClick={onStart}
                  disabled={startEnrolment.isPending}
                  aria-busy={startEnrolment.isPending}
                  className="min-h-11 w-fit gap-2"
                >
                  <ShieldCheck className="size-4" aria-hidden="true" />
                  {startEnrolment.isPending ? "Preparing..." : "Set up two-step verification"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

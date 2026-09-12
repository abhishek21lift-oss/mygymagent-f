"use client"

import * as React from "react"
import Script from "next/script"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, FileText, History, Loader2, MessageCircle, Send, TriangleAlert } from "lucide-react"
import { toast } from "sonner"

import { ErrorState } from "@/components/shared/error-state"
import { PageHero } from "@/components/shared/page-hero"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/lib/auth/auth-context"
import { ApiError } from "@/lib/api/client"
import { useCompleteWhatsAppSignup, useWhatsAppIntegration } from "@/lib/hooks/use-whatsapp"
import {
  useDisconnectWhatsapp,
  useTestSend,
  useWhatsappLogs,
  useWhatsappTemplates,
  type WhatsAppTestSendResult,
} from "@/lib/hooks/use-whatsapp"
import { useBranches } from "@/lib/hooks/use-branches"

declare global {
  interface Window {
    FB?: {
      init: (options: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void
      login: (
        callback: (response: { status?: string; authResponse?: { code?: string } }) => void,
        options: { config_id: string; response_type: "code"; override_default_response_type: boolean; extras: Record<string, unknown> },
      ) => void
    }
  }
}

const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID ?? ""
const META_CONFIG_ID = process.env.NEXT_PUBLIC_META_WHATSAPP_CONFIG_ID ?? ""
const GRAPH_VERSION = process.env.NEXT_PUBLIC_WHATSAPP_GRAPH_VERSION ?? "v25.0"
const LOG_LIMIT = 20

export default function WhatsAppSettingsPage() {
  const { hasPermission } = useAuth()
  const integrationQuery = useWhatsAppIntegration()
  const completeSignup = useCompleteWhatsAppSignup()
  const branchesQuery = useBranches({ page: 1, pageSize: 1 })
  const [sdkReady, setSdkReady] = React.useState(false)
  const [signupBusy, setSignupBusy] = React.useState(false)
  const codeRef = React.useRef<string | null>(null)
  const sessionRef = React.useRef<{ wabaId: string; phoneNumberId?: string } | null>(null)

  const canManage = hasPermission("settings.manage")
  const integration = integrationQuery.data
  const connected = integration?.status === "CONNECTED"
  const configured = Boolean(META_APP_ID && META_CONFIG_ID)
  const orgCountry = branchesQuery.data?.items?.[0]?.country ?? null

  const finishSignup = React.useCallback(async () => {
    const code = codeRef.current
    const session = sessionRef.current
    if (!code || !session || completeSignup.isPending) return
    setSignupBusy(true)
    try {
      await completeSignup.mutateAsync({ code, ...session })
      codeRef.current = null
      sessionRef.current = null
      toast.success("WhatsApp connected successfully")
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "WhatsApp connection failed")
    } finally {
      setSignupBusy(false)
    }
  }, [completeSignup])

  React.useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (!event.origin.includes("facebook.com")) return
      let data: unknown
      try { data = typeof event.data === "string" ? JSON.parse(event.data) : event.data } catch { return }
      if (!data || typeof data !== "object") return
      const payload = data as { type?: string; event?: string; data?: { waba_id?: string; phone_number_id?: string } }
      if (payload.type !== "WA_EMBEDDED_SIGNUP" || !payload.data?.waba_id) return
      sessionRef.current = {
        wabaId: payload.data.waba_id,
        phoneNumberId: payload.data.phone_number_id,
      }
      if (payload.event?.startsWith("FINISH")) void finishSignup()
    }
    window.addEventListener("message", listener)
    return () => window.removeEventListener("message", listener)
  }, [finishSignup])

  function initMetaSdk() {
    if (!window.FB || !META_APP_ID) return
    window.FB.init({ appId: META_APP_ID, cookie: true, xfbml: true, version: GRAPH_VERSION })
    setSdkReady(true)
  }

  function launchSignup() {
    if (!window.FB || !configured) {
      toast.error("Meta WhatsApp onboarding is not configured yet")
      return
    }
    setSignupBusy(true)
    codeRef.current = null
    sessionRef.current = null
    window.FB.login(
      (response) => {
        const code = response.authResponse?.code
        if (!code) {
          setSignupBusy(false)
          toast.error("WhatsApp onboarding was cancelled or did not return a code")
          return
        }
        codeRef.current = code
        void finishSignup()
      },
      {
        config_id: META_CONFIG_ID,
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: "whatsapp_business_app_onboarding",
        },
      },
    )
  }

  if (!canManage) {
    return <div className="relative -mx-2 min-h-full overflow-hidden pb-12 sm:-mx-3 lg:-mx-5"><div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_5%_2%,rgba(6,182,212,.13),transparent_19%),radial-gradient(circle_at_96%_4%,rgba(99,102,241,.15),transparent_22%),radial-gradient(circle_at_70%_38%,rgba(217,70,239,.10),transparent_25%),radial-gradient(circle_at_12%_72%,rgba(16,185,129,.08),transparent_24%)]" aria-hidden="true" /><div className="mx-auto flex max-w-[1680px] flex-col gap-8 px-2 sm:px-4 lg:px-6"><h1 className="font-serif text-3xl font-semibold text-stone-950">WhatsApp</h1><ErrorState message="You need settings.manage permission to manage WhatsApp." /></div></div>
  }

  return (
    <>
      {META_APP_ID && <Script src="https://connect.facebook.net/en_US/sdk.js" strategy="afterInteractive" onLoad={initMetaSdk} />}
      <div className="relative -mx-2 min-h-full overflow-hidden pb-12 sm:-mx-3 lg:-mx-5">
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_5%_2%,rgba(6,182,212,.13),transparent_19%),radial-gradient(circle_at_96%_4%,rgba(99,102,241,.15),transparent_22%),radial-gradient(circle_at_70%_38%,rgba(217,70,239,.10),transparent_25%),radial-gradient(circle_at_12%_72%,rgba(16,185,129,.08),transparent_24%)]"
          aria-hidden="true"
        />
        <div className="mx-auto flex max-w-[1680px] flex-col gap-8 px-2 sm:px-4 lg:px-6">
          <PageHero
            id="wa-title"
            icon={MessageCircle}
            title="WhatsApp"
            variant="light"
            accent="emerald"
            actions={
              <Link href="/settings" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl border border-stone-200 bg-white/80 px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:-translate-y-0.5 hover:border-stone-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950">
                <ArrowLeft className="size-4" aria-hidden="true" /> Back
              </Link>
            }
          />

          {integrationQuery.isLoading ? (
            <Card className="max-w-3xl border-white/90 bg-white/88 backdrop-blur-xl dark:border-white/10 dark:bg-stone-950/80"><CardContent className="space-y-4 pt-6"><Skeleton className="h-20 w-full rounded-2xl" /><Skeleton className="h-11 w-40 rounded-2xl" /></CardContent></Card>
          ) : integrationQuery.isError ? <ErrorState onRetry={() => integrationQuery.refetch()} /> : (
            <Card className="max-w-3xl overflow-hidden border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-stone-950/80">
              <span className="block h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-400" aria-hidden="true" />
              <CardHeader className="border-b border-stone-100/80 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/60 dark:border-white/10 dark:from-emerald-500/10 dark:via-transparent dark:to-teal-500/10">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg"><MessageCircle className="size-6" aria-hidden="true" /></span>
                    <div><CardTitle className="font-serif text-lg tracking-tight text-stone-950 dark:text-stone-50">WhatsApp Business</CardTitle></div>
                  </div>
                  <Badge variant={connected ? "default" : "secondary"} className={connected ? "rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white" : "rounded-full"}>{connected ? "Connected" : "Not connected"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 p-5 sm:p-6">
                {connected ? (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><Info label="Business number" value={integration?.displayPhoneNumber ?? "—"} /><Info label="Business name" value={integration?.displayName ?? "—"} /><Info label="WABA ID" value={integration?.wabaId ?? integration?.businessAccountId ?? "—"} mono /><Info label="Phone Number ID" value={integration?.phoneNumberId ?? "—"} mono /></div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><Step n="1" text="Click Connect WhatsApp" /><Step n="2" text="Complete Meta onboarding" /><Step n="3" text="Confirm the business number" /></div>
                    <Button onClick={launchSignup} disabled={!sdkReady || !configured || signupBusy} size="lg" className="min-h-11 rounded-2xl bg-[linear-gradient(105deg,#059669,#0d9488_55%,#0891b2)] shadow-lg shadow-emerald-500/25">{signupBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />}{configured ? "Connect WhatsApp" : "Meta setup required"}</Button>
                    {!configured && <p className="text-xs font-medium text-stone-600 dark:text-stone-400">Set NEXT_PUBLIC_META_APP_ID and NEXT_PUBLIC_META_WHATSAPP_CONFIG_ID in the frontend deployment.</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex w-full max-w-3xl flex-col gap-5">
            <TestSendCard canManage={canManage} orgCountry={orgCountry} />
            <TemplatesCard />
            <DeliveryLogCard />
            <DangerZoneCard canManage={canManage} />
          </div>
        </div>
      </div>
    </>
  )
}

function TestSendCard({ canManage, orgCountry }: { canManage: boolean; orgCountry: string | null }) {
  const testSend = useTestSend()
  const [phone, setPhone] = React.useState("")
  const [result, setResult] = React.useState<WhatsAppTestSendResult | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSend() {
    const to = phone.trim()
    if (!/^\+\d{7,15}$/.test(to)) {
      setResult(null)
      setError("Enter a valid number in E.164 format, e.g. +919876543210.")
      return
    }
    setError(null)
    setResult(null)
    try {
      const res = await testSend.mutateAsync({ to })
      setResult(res)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send test message.")
    }
  }

  return (
    <Card className="overflow-hidden border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-stone-950/80">
      <CardHeader className="border-b border-stone-100/80 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/60 dark:border-white/10 dark:from-emerald-500/10 dark:via-transparent dark:to-teal-500/10">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg"><Send className="size-5" aria-hidden="true" /></span>
          <div>
            <CardTitle className="font-serif text-lg tracking-tight text-stone-950 dark:text-stone-50">Send test</CardTitle>
            <p className="mt-1 text-xs font-medium text-stone-600 dark:text-stone-400">
              {orgCountry ? `Default org country: ${orgCountry} — always include the country code.` : "Include the country code (E.164 format)."}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="wa-test-phone">Recipient phone</Label>
            <Input
              id="wa-test-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+919876543210"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              disabled={!canManage || testSend.isPending}
              className="min-h-11 rounded-xl"
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!canManage || testSend.isPending || phone.trim().length === 0}
            className="min-h-11 rounded-2xl bg-[linear-gradient(105deg,#059669,#0d9488_55%,#0891b2)] shadow-lg shadow-emerald-500/25"
          >
            {testSend.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="mr-2 h-4 w-4" aria-hidden="true" />}
            {testSend.isPending ? "Sending..." : "Send test"}
          </Button>
        </div>
        {result && (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-400/20 dark:bg-emerald-500/10">
            <Badge variant={statusVariant(result.status)} className="rounded-full">{result.status}</Badge>
            <span className="break-all font-mono text-xs font-medium text-stone-700 dark:text-stone-300">{result.messageLogId}</span>
          </div>
        )}
        {error && (
          <p role="alert" className="text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>
        )}
      </CardContent>
    </Card>
  )
}

function TemplatesCard() {
  const templatesQuery = useWhatsappTemplates()

  return (
    <Card className="overflow-hidden border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-stone-950/80">
      <CardHeader className="border-b border-stone-100/80 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/60 dark:border-white/10 dark:from-emerald-500/10 dark:via-transparent dark:to-teal-500/10">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg"><FileText className="size-5" aria-hidden="true" /></span>
          <div>
            <CardTitle className="font-serif text-lg tracking-tight text-stone-950 dark:text-stone-50">Templates</CardTitle>
            <p className="mt-1 text-xs font-medium text-stone-600 dark:text-stone-400">System templates with your organization overrides.</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 sm:p-6">
        {templatesQuery.isLoading ? (
          <div className="flex flex-col gap-3" aria-label="Loading templates">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        ) : templatesQuery.isError ? (
          <ErrorState onRetry={() => templatesQuery.refetch()} />
        ) : !templatesQuery.data || templatesQuery.data.length === 0 ? (
          <p className="text-sm font-medium text-stone-600 dark:text-stone-400">No templates available yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {templatesQuery.data.map((template) => (
              <li key={template.key} className="rounded-[20px] border border-stone-200/70 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="rounded-full">{template.channel}</Badge>
                  <span className="break-all font-mono text-xs font-bold text-stone-700 dark:text-stone-300">{template.key}</span>
                </div>
                {template.subject && (
                  <p className="mt-2 text-sm font-bold text-stone-900 dark:text-stone-100">{template.subject}</p>
                )}
                <p className="mt-1 line-clamp-2 text-sm font-medium text-stone-600 dark:text-stone-400">{template.body}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function DeliveryLogCard() {
  const logsQuery = useWhatsappLogs(LOG_LIMIT)

  return (
    <Card className="overflow-hidden border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-stone-950/80">
      <CardHeader className="border-b border-stone-100/80 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/60 dark:border-white/10 dark:from-emerald-500/10 dark:via-transparent dark:to-teal-500/10">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg"><History className="size-5" aria-hidden="true" /></span>
          <div>
            <CardTitle className="font-serif text-lg tracking-tight text-stone-950 dark:text-stone-50">Delivery log</CardTitle>
            <p className="mt-1 text-xs font-medium text-stone-600 dark:text-stone-400">Newest first (last {LOG_LIMIT}).</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 sm:p-6">
        {logsQuery.isLoading ? (
          <div className="flex flex-col gap-3" aria-label="Loading delivery log">
            <Skeleton className="h-11 w-full rounded-2xl" />
            <Skeleton className="h-11 w-full rounded-2xl" />
            <Skeleton className="h-11 w-full rounded-2xl" />
          </div>
        ) : logsQuery.isError ? (
          <ErrorState onRetry={() => logsQuery.refetch()} />
        ) : !logsQuery.data || logsQuery.data.length === 0 ? (
          <p className="text-sm font-medium text-stone-600 dark:text-stone-400">No delivery logs yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent at</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logsQuery.data.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium text-stone-900 dark:text-stone-100">{log.recipient}</TableCell>
                  <TableCell className="font-mono text-xs text-stone-700 dark:text-stone-300">{log.templateKey}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(log.status)} className="rounded-full">{log.status}</Badge>
                    {log.status === "FAILED" && log.errorMessage && (
                      <p title={log.errorMessage} className="mt-1 max-w-56 truncate text-xs font-medium text-rose-600 dark:text-rose-400">
                        {log.errorMessage}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="font-medium tabular-nums text-stone-600 dark:text-stone-400">
                    {log.sentAt ? new Date(log.sentAt).toLocaleString() : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function DangerZoneCard({ canManage }: { canManage: boolean }) {
  const disconnect = useDisconnectWhatsapp()
  const [open, setOpen] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) setError(null)
  }

  async function handleConfirm() {
    setError(null)
    try {
      await disconnect.mutateAsync()
      setOpen(false)
      toast.success("WhatsApp disconnected")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to disconnect WhatsApp.")
    }
  }

  return (
    <Card className="overflow-hidden border-rose-200 bg-rose-50/40 shadow-xl shadow-rose-900/5 backdrop-blur-xl dark:border-rose-400/20 dark:bg-rose-500/5">
      <CardHeader className="border-b border-rose-100 bg-gradient-to-r from-rose-50/80 via-white to-orange-50/60 dark:border-rose-400/10 dark:from-rose-500/10 dark:via-transparent dark:to-orange-500/10">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-lg"><TriangleAlert className="size-5" aria-hidden="true" /></span>
          <div>
            <CardTitle className="font-serif text-lg tracking-tight text-stone-950 dark:text-stone-50">Danger zone</CardTitle>
            <p className="mt-1 text-xs font-medium text-stone-600 dark:text-stone-400">Disconnecting stops all WhatsApp messaging for this organization.</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 sm:p-6">
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button variant="destructive" disabled={!canManage} className="min-h-11 rounded-2xl">
              Disconnect WhatsApp
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Disconnect WhatsApp?</DialogTitle>
              <DialogDescription>
                This removes the WhatsApp Business connection. Reminders and notifications will stop sending until you reconnect.
              </DialogDescription>
            </DialogHeader>
            {error && (
              <p role="alert" className="text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={disconnect.isPending} className="min-h-11 rounded-2xl">
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirm} disabled={disconnect.isPending} className="min-h-11 rounded-2xl">
                {disconnect.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                {disconnect.isPending ? "Disconnecting..." : "Yes, disconnect"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "success" | "warning" | "outline" {
  switch (status) {
    case "SENT":
      return "success"
    case "PENDING":
      return "warning"
    case "FAILED":
      return "destructive"
    case "SKIPPED_NO_CONSENT":
      return "secondary"
    default:
      return "outline"
  }
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return <div className="rounded-[20px] border border-stone-200/70 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5"><div className="text-[10px] font-black uppercase tracking-[.16em] text-stone-500 dark:text-stone-400">{label}</div><div className={`mt-1 break-all text-sm font-bold text-stone-900 dark:text-stone-100 ${mono ? "font-mono" : ""}`}>{value}</div></div>
}

function Step({ n, text }: { n: string; text: string }) {
  return <div className="flex items-center gap-3 rounded-[20px] border border-stone-200/70 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-black text-white shadow-md">{n}</span><span className="text-xs font-bold text-stone-700 dark:text-stone-300">{text}</span><CheckCircle2 className="ml-auto size-4 shrink-0 text-emerald-500" aria-hidden="true" /></div>
}

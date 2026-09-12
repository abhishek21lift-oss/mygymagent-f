"use client"

import * as React from "react"
import Script from "next/script"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Loader2, MessageCircle, ShieldCheck, Sparkles, Unplug } from "lucide-react"
import { toast } from "sonner"

import { ErrorState } from "@/components/shared/error-state"
import { PageHero } from "@/components/shared/page-hero"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/lib/auth/auth-context"
import { ApiError } from "@/lib/api/client"
import { useCompleteWhatsAppSignup, useDisconnectWhatsApp, useWhatsAppIntegration } from "@/lib/hooks/use-whatsapp"

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

export default function WhatsAppSettingsPage() {
  const { hasPermission } = useAuth()
  const integrationQuery = useWhatsAppIntegration()
  const completeSignup = useCompleteWhatsAppSignup()
  const disconnect = useDisconnectWhatsApp()
  const [sdkReady, setSdkReady] = React.useState(false)
  const [signupBusy, setSignupBusy] = React.useState(false)
  const codeRef = React.useRef<string | null>(null)
  const sessionRef = React.useRef<{ wabaId: string; phoneNumberId?: string } | null>(null)

  const canManage = hasPermission("settings.manage")
  const integration = integrationQuery.data
  const connected = integration?.status === "CONNECTED"
  const configured = Boolean(META_APP_ID && META_CONFIG_ID)

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
            eyebrow="Meta Cloud API"
            icon={MessageCircle}
            title="WhatsApp"
            description="Connect your gym's official WhatsApp Business number with Meta Cloud API."
            variant="light"
            accent="emerald"
            actions={
              <Link href="/settings" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl border border-stone-200 bg-white/80 px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:-translate-y-0.5 hover:border-stone-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950">
                <ArrowLeft className="size-4" aria-hidden="true" /> Back to settings
              </Link>
            }
          />

          {integrationQuery.isLoading ? (
            <Card className="max-w-3xl border-white/90 bg-white/88 backdrop-blur-xl"><CardContent className="space-y-4 pt-6"><Skeleton className="h-20 w-full rounded-2xl" /><Skeleton className="h-11 w-40 rounded-2xl" /></CardContent></Card>
          ) : integrationQuery.isError ? <ErrorState onRetry={() => integrationQuery.refetch()} /> : (
            <Card className="max-w-3xl overflow-hidden border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl">
              <span className="block h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-400" aria-hidden="true" />
              <CardHeader className="border-b border-stone-100/80 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/60">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg"><MessageCircle className="size-6" aria-hidden="true" /></span>
                    <div><CardTitle className="font-serif text-lg tracking-tight text-stone-950">WhatsApp Business</CardTitle><p className="mt-1 text-xs font-medium text-stone-600">Each gym connects its own WABA and business phone number.</p></div>
                  </div>
                  <Badge variant={connected ? "default" : "secondary"} className={connected ? "rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white" : "rounded-full"}>{connected ? "Connected" : "Not connected"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 p-5 sm:p-6">
                {connected ? (
                  <div className="space-y-5">
                    <div className="grid gap-3 sm:grid-cols-2"><Info label="Business number" value={integration?.displayPhoneNumber ?? "—"} /><Info label="Business name" value={integration?.displayName ?? "—"} /><Info label="WABA ID" value={integration?.wabaId ?? integration?.businessAccountId ?? "—"} mono /><Info label="Phone Number ID" value={integration?.phoneNumberId ?? "—"} mono /></div>
                    <div className="flex items-center gap-3 rounded-[20px] border border-emerald-100 bg-gradient-to-r from-emerald-50/80 to-teal-50/50 p-4 text-sm font-medium text-stone-700"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md"><ShieldCheck className="size-5" aria-hidden="true" /></span>Access credentials are kept server-side and encrypted at rest.</div>
                    <Button variant="outline" onClick={() => disconnect.mutate()} disabled={disconnect.isPending} className="min-h-11 rounded-2xl hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700">{disconnect.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Unplug className="mr-2 h-4 w-4" aria-hidden="true" />}Disconnect WhatsApp</Button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="grid gap-3 sm:grid-cols-3"><Step n="1" text="Click Connect WhatsApp" /><Step n="2" text="Complete Meta onboarding" /><Step n="3" text="Confirm the business number" /></div>
                    <div className="rounded-[20px] border border-stone-200/70 bg-stone-50/70 p-4 text-xs font-medium leading-5 text-stone-600">Meta will guide the gym owner through Business Portfolio and WhatsApp onboarding. If the number already runs on the WhatsApp Business app, the coexistence flow lets the owner keep using that same number on the phone while MyGymAgent gets Cloud API access.</div>
                    <Button onClick={launchSignup} disabled={!sdkReady || !configured || signupBusy} size="lg" className="min-h-11 rounded-2xl bg-[linear-gradient(105deg,#059669,#0d9488_55%,#0891b2)] shadow-lg shadow-emerald-500/25">{signupBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />}{configured ? "Connect WhatsApp" : "Meta setup required"}</Button>
                    {!configured && <p className="text-xs font-medium text-stone-600">Set NEXT_PUBLIC_META_APP_ID and NEXT_PUBLIC_META_WHATSAPP_CONFIG_ID in the frontend deployment.</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return <div className="rounded-[20px] border border-stone-200/70 bg-white/70 p-4"><div className="text-[10px] font-black uppercase tracking-[.16em] text-stone-500">{label}</div><div className={`mt-1 break-all text-sm font-bold text-stone-900 ${mono ? "font-mono" : ""}`}>{value}</div></div>
}

function Step({ n, text }: { n: string; text: string }) {
  return <div className="flex items-center gap-3 rounded-[20px] border border-stone-200/70 bg-white/70 p-4"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-black text-white shadow-md">{n}</span><span className="text-xs font-bold text-stone-700">{text}</span><CheckCircle2 className="ml-auto size-4 shrink-0 text-emerald-500" aria-hidden="true" /></div>
}

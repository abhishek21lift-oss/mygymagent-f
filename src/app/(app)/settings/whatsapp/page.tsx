"use client"

import * as React from "react"
import Script from "next/script"
import { CheckCircle2, Loader2, MessageCircle, ShieldCheck, Unplug } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/shared/page-header"
import { ErrorState } from "@/components/shared/error-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/lib/auth/auth-context"
import { ApiError } from "@/lib/api/client"
import {
  useCompleteWhatsAppSignup,
  useDisconnectWhatsApp,
  useWhatsAppIntegration,
} from "@/lib/hooks/use-whatsapp"

declare global {
  interface Window {
    FB?: {
      init: (options: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void
      login: (
        callback: (response: { status?: string; authResponse?: { code?: string } }) => void,
        options: {
          config_id: string
          response_type: "code"
          override_default_response_type: boolean
          extras: Record<string, unknown>
        },
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
  const sessionRef = React.useRef<{ wabaId: string; phoneNumberId: string } | null>(null)

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
      try {
        data = typeof event.data === "string" ? JSON.parse(event.data) : event.data
      } catch {
        return
      }
      if (!data || typeof data !== "object") return
      const payload = data as {
        type?: string
        event?: string
        data?: { waba_id?: string; phone_number_id?: string }
      }
      if (payload.type !== "WA_EMBEDDED_SIGNUP") return
      if (payload.data?.waba_id && payload.data?.phone_number_id) {
        sessionRef.current = {
          wabaId: payload.data.waba_id,
          phoneNumberId: payload.data.phone_number_id,
        }
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
        extras: { setup: {} },
      },
    )
  }

  if (!canManage) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="WhatsApp" description="Connect your gym's official WhatsApp Business number" />
        <ErrorState title="Permission required" description="You need settings.manage permission to manage WhatsApp." />
      </div>
    )
  }

  return (
    <>
      {META_APP_ID && <Script src="https://connect.facebook.net/en_US/sdk.js" strategy="afterInteractive" onLoad={initMetaSdk} />}
      <div className="flex flex-col gap-6">
        <PageHeader title="WhatsApp" description="Connect your gym's official WhatsApp Business number with Meta Cloud API" />

        {integrationQuery.isLoading ? (
          <Card className="max-w-3xl"><CardContent className="space-y-4 pt-6"><Skeleton className="h-20 w-full" /><Skeleton className="h-10 w-40" /></CardContent></Card>
        ) : integrationQuery.isError ? (
          <ErrorState onRetry={() => integrationQuery.refetch()} />
        ) : (
          <Card className="max-w-3xl overflow-hidden">
            <CardHeader className="border-b bg-muted/20">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-primary/10 p-3"><MessageCircle className="h-6 w-6 text-primary" /></div>
                  <div>
                    <CardTitle className="text-lg">WhatsApp Business</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">Each gym connects its own WABA and business phone number.</p>
                  </div>
                </div>
                <Badge variant={connected ? "default" : "secondary"}>
                  {connected ? "Connected" : "Not connected"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {connected ? (
                <div className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Info label="Business number" value={integration?.display_phone_number ?? "—"} />
                    <Info label="Business name" value={integration?.display_name ?? "—"} />
                    <Info label="WABA ID" value={integration?.waba_id ?? integration?.business_account_id ?? "—"} mono />
                    <Info label="Phone Number ID" value={integration?.phone_number_id ?? "—"} mono />
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border p-4 text-sm">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <span>Access credentials are kept server-side and encrypted at rest.</span>
                  </div>
                  <Button variant="outline" onClick={() => disconnect.mutate()} disabled={disconnect.isPending}>
                    {disconnect.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Unplug className="mr-2 h-4 w-4" />}
                    Disconnect WhatsApp
                  </Button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Step n="1" text="Click Connect WhatsApp" />
                    <Step n="2" text="Complete Meta onboarding" />
                    <Step n="3" text="Your number becomes connected" />
                  </div>
                  <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
                    Meta will guide the gym owner through Business Portfolio, WABA and business phone setup. MyGymAgent never asks the owner to paste a WhatsApp access token.
                  </div>
                  <Button onClick={launchSignup} disabled={!sdkReady || !configured || signupBusy} size="lg">
                    {signupBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageCircle className="mr-2 h-4 w-4" />}
                    {configured ? "Connect WhatsApp" : "Meta setup required"}
                  </Button>
                  {!configured && <p className="text-xs text-muted-foreground">Set NEXT_PUBLIC_META_APP_ID and NEXT_PUBLIC_META_WHATSAPP_CONFIG_ID in the frontend deployment.</p>}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return <div className="rounded-xl border p-4"><div className="text-xs text-muted-foreground">{label}</div><div className={`mt-1 break-all text-sm font-medium ${mono ? "font-mono" : ""}`}>{value}</div></div>
}

function Step({ n, text }: { n: string; text: string }) {
  return <div className="flex items-center gap-3 rounded-xl border p-4"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{n}</span><span className="text-sm font-medium">{text}</span><CheckCircle2 className="ml-auto h-4 w-4 text-muted-foreground" /></div>
}

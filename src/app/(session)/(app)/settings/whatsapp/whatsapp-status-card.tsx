"use client"

import * as React from "react"
import { Loader2, Smartphone } from "lucide-react"

import { ErrorState } from "@/components/shared/error-state"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/lib/auth/auth-context"
import { useWhatsAppAdapterStatus, WhatsAppAdapterStatus } from "@/lib/hooks/use-whatsapp-adapter"

const surface = "rounded-3xl border border-border/60 bg-card p-5 shadow-[var(--shadow-card)] sm:p-6"

/** `919812345678` -> `+91 98123 45678`; anything else as +digits. */
function formatNumber(digits: string | null) {
  if (!digits) return "—"
  if (digits.length === 12 && digits.startsWith("91")) return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`
  return `+${digits}`
}

export function WhatsAppAdapterStatusCard({ canManage }: { canManage: boolean }) {
  const { hasPermission } = useAuth()
  const statusQuery = useWhatsAppAdapterStatus()

  if (!hasPermission("whatsapp.read")) {
    return (
      <Card className="overflow-hidden border-border bg-card dark:bg-card">
        <CardHeader className="border-b border-border bg-muted/40">
          <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground tracking-tight text-stone-950 dark:text-stone-50">WhatsApp Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState message="You need whatsapp.read permission to view WhatsApp status." />
        </CardContent>
      </Card>
    )
  }

  return (
    <section aria-labelledby="wa-adapter-status-title" className={surface}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="wa-adapter-status-title" className="section-title">WhatsApp Status</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Status of your gym's primary WhatsApp number (Baileys session).
          </p>
        </div>
        {statusQuery.data ? <StatusBadge session={statusQuery.data} /> : null}
      </div>

      <div className="mt-5">
        {statusQuery.isPending ? (
          <Skeleton className="h-40 w-full rounded-2xl" />
        ) : statusQuery.isError ? (
          <p className="text-sm text-destructive">Couldn't load WhatsApp status.</p>
        ) : !statusQuery.data ? (
          <p className="text-sm text-muted-foreground">No WhatsApp session found.</p>
        ) : (
          <AdapterStatusSession session={statusQuery.data} canManage={canManage} />
        )}
      </div>
    </section>
  )
}

function StatusBadge({ session }: { session: WhatsAppAdapterStatus }) {
  const label = {
    CONNECTED: "Connected",
    PAIRING: "Pairing",
    DISCONNECTED: "Disconnected",
    LOGGED_OUT: "Logged Out",
    NOT_CONNECTED: "Not Connected",
  }[session.status]
  const tone =
    session.status === "CONNECTED"
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : session.status === "PAIRING"
        ? "bg-amber-500/10 text-amber-800 dark:text-amber-200"
        : session.status === "LOGGED_OUT"
          ? "bg-rose-500/10 text-rose-700 dark:text-rose-300"
          : session.status === "DISCONNECTED"
            ? "bg-amber-500/10 text-amber-800 dark:text-amber-200"
            : "bg-muted text-muted-foreground"
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{label}</span>
}

function AdapterStatusSession({ session, canManage }: { session: WhatsAppAdapterStatus; canManage: boolean }) {
  return (
    <div className="space-y-5">
      {session.lastError ? (
        <p role="alert" className="rounded-2xl bg-rose-500/10 p-4 text-sm font-medium text-rose-800 dark:text-rose-200">
          {session.lastError}
        </p>
      ) : null}
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        {session.status === "PAIRING" && session.qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- a data URL that changes every few seconds; nothing for next/image to optimise
          <img
            src={session.qrDataUrl}
            alt="QR code to link WhatsApp"
            className="size-56 shrink-0 rounded-2xl bg-white p-2 ring-1 ring-border/60"
          />
        ) : session.status === "PAIRING" && session.pairingCode ? (
          <div className="w-full rounded-2xl bg-muted/60 p-5 text-center sm:w-64">
            <p className="text-xs font-medium text-muted-foreground">Your pairing code</p>
            <p className="mt-2 font-mono text-3xl font-semibold tracking-[0.2em] text-foreground">
              {session.pairingCode.slice(0, 4)}-{session.pairingCode.slice(4)}
            </p>
          </div>
        ) : (
          <div className="flex size-56 shrink-0 flex-col items-center justify-center gap-3 rounded-2xl bg-muted/60 p-4 text-center">
            {session.status === "CONNECTED" ? (
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                <Smartphone className="size-5" aria-hidden="true" />
              </span>
            ) : (
              <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
            )}
            <p className="mt-2 text-xs font-medium text-muted-foreground">
              {session.status === "CONNECTED"
                ? `Connected since ${new Date(session.connectedAt ?? 0).toLocaleDateString()}`
                : session.status === "DISCONNECTED"
                  ? "Disconnected"
                  : session.status === "LOGGED_OUT"
                    ? "Logged out"
                    : "Not connected"}
            </p>
          </div>
        )}
      </div>
      {session.phoneNumber ? (
        <div className="flex items-center gap-3 rounded-2xl bg-muted/50 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted/400 text-white">
            <Smartphone className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-foreground">{formatNumber(session.phoneNumber)}</p>
            <p className="text-xs text-muted-foreground">
              {session.connectedAt ? `Connected since ${new Date(session.connectedAt).toLocaleDateString()}` : "Not connected"}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}

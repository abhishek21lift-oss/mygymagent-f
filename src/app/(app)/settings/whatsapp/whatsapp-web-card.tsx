"use client"

import * as React from "react"
import { AlertTriangle, CheckCircle2, Link2, Loader2, Smartphone } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { ConfirmAction } from "@/components/shared/confirm-action"
import { ApiError } from "@/lib/api/client"
import {
  useConnectWhatsAppWeb,
  useDisconnectWhatsAppWeb,
  useUpdateWhatsAppWebSettings,
  useWhatsAppWeb,
} from "@/lib/hooks/use-whatsapp"
import type { WhatsAppWebSession } from "@/lib/types/whatsapp"

const surface = "rounded-3xl border border-border/60 bg-card p-5 shadow-[var(--shadow-card)] sm:p-6"

function errorText(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback
}

/** `919812345678` -> `+91 98123 45678`; anything else as +digits. */
function formatNumber(digits: string | null) {
  if (!digits) return "—"
  if (digits.length === 12 && digits.startsWith("91")) return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`
  return `+${digits}`
}

/**
 * The gym's own WhatsApp number, linked as a WhatsApp Web device, so
 * messages go out from it at no per-message cost.
 *
 * The risk is stated before anything else and has to be accepted in a
 * checkbox: this uses an unofficial client, and WhatsApp can ban a number
 * used this way. Linking alone changes nothing about how messages go out;
 * the "send from this number" switch does.
 */
export function WhatsAppWebCard({ canManage }: { canManage: boolean }) {
  const query = useWhatsAppWeb()

  return (
    <section aria-labelledby="wa-web-title" className={surface}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="wa-web-title" className="section-title">Your own WhatsApp number</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Send from the gym&rsquo;s own number through WhatsApp Web, with no per-message charge.
          </p>
        </div>
        {query.data ? <StatusBadge session={query.data} /> : null}
      </div>

      <div className="mt-5">
        {query.isPending ? (
          <Skeleton className="h-40 w-full rounded-2xl" />
        ) : query.isError ? (
          <p className="text-sm text-destructive">Couldn&rsquo;t load WhatsApp Web status.</p>
        ) : !query.data.available ? (
          <ServerSetup reason={query.data.unavailableReason ?? "DISABLED"} />
        ) : query.data.status === "CONNECTED" ? (
          <Connected session={query.data} canManage={canManage} />
        ) : query.data.status === "PAIRING" ? (
          <Pairing session={query.data} canManage={canManage} />
        ) : (
          <LinkForm session={query.data} canManage={canManage} />
        )}
      </div>
    </section>
  )
}

/** What to change on the server, for the one setting that is wrong. */
function ServerSetup({ reason }: { reason: NonNullable<WhatsAppWebSession["unavailableReason"]> }) {
  const copy = {
    DISABLED: {
      title: "Not switched on on the server yet",
      body: "Linking a number needs two settings on the backend (Render → Environment), then a redeploy:",
      lines: ["WHATSAPP_WEB_ENABLED=true", "WHATSAPP_TOKEN_KEY=<64 hex characters>"],
    },
    KEY_MISSING: {
      title: "WHATSAPP_TOKEN_KEY is not set",
      body: "WhatsApp Web is switched on, but the server has no key to encrypt the linked session with. Add it on the backend (Render → Environment), then redeploy:",
      lines: ["WHATSAPP_TOKEN_KEY=<64 hex characters>"],
    },
    KEY_INVALID: {
      title: "WHATSAPP_TOKEN_KEY is not a valid key",
      body: "It must be exactly 64 characters, using only 0-9 and a-f. Paste the key itself, not the <64 hex characters> placeholder. Generate one with the command below, set it on the backend (Render → Environment), then redeploy:",
      lines: ["openssl rand -hex 32"],
    },
  }[reason]
  return (
    <div className="rounded-2xl bg-amber-500/10 p-4 text-sm leading-6 text-amber-950 dark:text-amber-100">
      <p className="font-semibold">{copy.title}</p>
      <p className="mt-1">{copy.body}</p>
      <ul className="mt-2 space-y-1 break-all font-mono text-xs">
        {copy.lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p className="mt-2">After that, a QR code to scan appears here.</p>
    </div>
  )
}

function StatusBadge({ session }: { session: WhatsAppWebSession }) {
  const label = { CONNECTED: "Linked", PAIRING: "Waiting for phone", LOGGED_OUT: "Unlinked", DISCONNECTED: "Not linked" }[session.status]
  const tone =
    session.status === "CONNECTED"
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : session.status === "PAIRING"
        ? "bg-amber-500/10 text-amber-800 dark:text-amber-200"
        : session.status === "LOGGED_OUT"
          ? "bg-rose-500/10 text-rose-700 dark:text-rose-300"
          : "bg-muted text-muted-foreground"
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{label}</span>
}

function RiskNotice() {
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-950 dark:text-amber-100">
      <p className="flex items-center gap-2 font-semibold">
        <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
        Read before linking
      </p>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 leading-6">
        <li>
          This uses <strong>WhatsApp Web through an unofficial client</strong>. It is against WhatsApp&rsquo;s terms, and
          WhatsApp can <strong>restrict or permanently ban</strong> a number used this way.
        </li>
        <li>Use a number you can afford to lose, not your only business number.</li>
        <li>
          To lower the risk we send one message at a time, 8&ndash;15 seconds apart, up to a daily limit, and never
          send promotional messages this way. Use the official WhatsApp Business setup above for promotions.
        </li>
      </ul>
    </div>
  )
}

function LinkForm({ session, canManage }: { session: WhatsAppWebSession; canManage: boolean }) {
  const connect = useConnectWhatsAppWeb()
  const [accepted, setAccepted] = React.useState(false)
  const [useCode, setUseCode] = React.useState(false)
  const [phone, setPhone] = React.useState("")
  const digits = phone.replace(/\D/g, "")
  const phoneValid = /^\d{11,15}$/.test(digits)

  async function handleLink() {
    try {
      await connect.mutateAsync(useCode ? { phoneNumber: digits } : {})
    } catch (error) {
      toast.error(errorText(error, "Couldn't start linking"))
    }
  }

  return (
    <div className="space-y-5">
      {session.lastError ? (
        <p role="alert" className="rounded-2xl bg-rose-500/10 p-4 text-sm font-medium text-rose-800 dark:text-rose-200">
          {session.lastError}
        </p>
      ) : null}
      <RiskNotice />
      {canManage ? (
        <>
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-6">
            <Checkbox checked={accepted} onCheckedChange={(v) => setAccepted(v === true)} className="mt-1" />
            <span>I understand WhatsApp may ban the number I link, and I accept that risk for this gym.</span>
          </label>

          <div className="rounded-2xl bg-muted/50 p-4">
            <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
              <span>
                <span className="font-medium text-foreground">Link with a code instead of a QR</span>
                <span className="block text-xs text-muted-foreground">For when this page is open on the phone you&rsquo;re linking.</span>
              </span>
              <Switch checked={useCode} onCheckedChange={setUseCode} aria-label="Link with a code instead of a QR" />
            </label>
            {useCode ? (
              <div className="mt-3 space-y-1.5">
                <Label htmlFor="wa-web-phone">WhatsApp number, with country code</Label>
                <Input
                  id="wa-web-phone"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            ) : null}
          </div>

          <Button
            onClick={() => void handleLink()}
            disabled={!accepted || connect.isPending || (useCode && !phoneValid)}
            className="h-11 w-full rounded-2xl font-semibold sm:w-auto"
          >
            {connect.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Link2 className="size-4" aria-hidden="true" />}
            Link my WhatsApp
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Ask an owner or admin to link the gym&rsquo;s number.</p>
      )}
    </div>
  )
}

function Pairing({ session, canManage }: { session: WhatsAppWebSession; canManage: boolean }) {
  const disconnect = useDisconnectWhatsAppWeb()
  const code = session.pairingCode
  return (
    <div className="space-y-5">
      {session.lastError ? (
        <p role="alert" className="rounded-2xl bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-100">
          {session.lastError}
        </p>
      ) : null}
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        {code ? (
          <div className="w-full rounded-2xl bg-muted/60 p-5 text-center sm:w-64">
            <p className="text-xs font-medium text-muted-foreground">Your code</p>
            <p className="mt-2 font-mono text-3xl font-semibold tracking-[0.2em] text-foreground">
              {code.slice(0, 4)}-{code.slice(4)}
            </p>
          </div>
        ) : session.qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- a data URL that changes every few seconds; nothing for next/image to optimise
          <img
            src={session.qrDataUrl}
            alt="QR code to link WhatsApp"
            className="size-56 shrink-0 rounded-2xl bg-white p-2 ring-1 ring-border/60"
          />
        ) : (
          <div className="flex size-56 shrink-0 flex-col items-center justify-center gap-3 rounded-2xl bg-muted/60 p-4 text-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
            <p className="text-xs text-muted-foreground" role="status">
              Connecting to WhatsApp… this can take up to 45 seconds.
            </p>
          </div>
        )}
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
          <li>Open WhatsApp on the gym&rsquo;s phone.</li>
          <li>
            Go to <strong className="text-foreground">Settings → Linked devices → Link a device</strong>.
          </li>
          {code ? (
            <li>
              Tap <strong className="text-foreground">Link with phone number instead</strong> and type the code.
            </li>
          ) : (
            <li>Point the camera at this QR code. It refreshes by itself.</li>
          )}
          <li>This page updates when the phone is linked.</li>
        </ol>
      </div>
      {canManage ? (
        <Button variant="outline" className="h-11 rounded-2xl" disabled={disconnect.isPending} onClick={() => disconnect.mutate()}>
          Cancel
        </Button>
      ) : null}
    </div>
  )
}

function Connected({ session, canManage }: { session: WhatsAppWebSession; canManage: boolean }) {
  const update = useUpdateWhatsAppWebSettings()
  const disconnect = useDisconnectWhatsAppWeb()
  const [limit, setLimit] = React.useState(String(session.dailyLimit))
  const limitNumber = Number(limit)
  const limitValid = Number.isInteger(limitNumber) && limitNumber >= 1 && limitNumber <= 1000
  const used = Math.min(100, Math.round((session.sentLast24h / Math.max(1, session.dailyLimit)) * 100))

  async function save(input: { useForSending?: boolean; autoReply?: boolean; dailyLimit?: number }, done: string) {
    try {
      await update.mutateAsync(input)
      toast.success(done)
    } catch (error) {
      toast.error(errorText(error, "Couldn't save"))
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-2xl bg-emerald-500/10 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
          <Smartphone className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{formatNumber(session.phoneNumber)}</p>
          <p className="text-xs text-muted-foreground">
            Linked{session.connectedAt ? ` since ${new Date(session.connectedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}` : ""}
          </p>
        </div>
        <CheckCircle2 className="ml-auto size-5 shrink-0 text-emerald-600" aria-hidden="true" />
      </div>

      <label className="flex items-center justify-between gap-4 rounded-2xl bg-muted/50 p-4">
        <span>
          <span className="block font-medium text-foreground">Send WhatsApp messages from this number</span>
          <span className="block text-xs leading-5 text-muted-foreground">
            Reminders and messages staff send go out from this number instead of the official WhatsApp Business setup.
            Promotional messages are never sent this way.
          </span>
        </span>
        <Switch
          checked={session.useForSending}
          disabled={!canManage || update.isPending}
          onCheckedChange={(on) => void save({ useForSending: on }, on ? "Messages now go from your number" : "Messages go through the official setup again")}
          aria-label="Send WhatsApp messages from this number"
        />
      </label>

      {session.autoReply !== undefined && (
        <label className="flex items-center justify-between gap-4 rounded-2xl bg-muted/50 p-4">
          <span>
            <span className="block font-medium text-foreground">Auto-reply to members</span>
            <span className="block text-xs leading-5 text-muted-foreground">
              When a member messages PLANS, CLASSES, MY PLAN, CONTACT or HI, they get an instant answer from your plans, class
              schedule and their membership. Other questions get &ldquo;our team will reply soon&rdquo; and stay in the inbox for you.
              {!session.useForSending && " Works while messages are sent from this number."}
            </span>
          </span>
          <Switch
            checked={session.autoReply}
            disabled={!canManage || update.isPending}
            onCheckedChange={(on) => void save({ autoReply: on }, on ? "Auto-replies on" : "Auto-replies off")}
            aria-label="Auto-reply to members"
          />
        </label>
      )}

      <div className="rounded-2xl bg-muted/50 p-4">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="font-medium text-foreground">Sent in the last 24 hours</span>
          <span className="tabular-nums text-muted-foreground">
            {session.sentLast24h} / {session.dailyLimit}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-background" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={used} aria-label="Daily limit used">
          <div className={`h-full rounded-full ${used >= 90 ? "bg-rose-500" : used >= 70 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${used}%` }} />
        </div>
        {canManage ? (
          <div className="mt-4 flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="wa-web-limit">Daily limit</Label>
              <Input id="wa-web-limit" type="number" inputMode="numeric" min={1} max={1000} value={limit} onChange={(e) => setLimit(e.target.value)} />
            </div>
            <Button
              variant="outline"
              className="h-10 rounded-xl"
              disabled={!limitValid || limitNumber === session.dailyLimit || update.isPending}
              onClick={() => void save({ dailyLimit: limitNumber }, "Daily limit saved")}
            >
              Save
            </Button>
          </div>
        ) : null}
        <p className="mt-2 text-xs text-muted-foreground">Keep it low. A new number sending hundreds a day is more likely to be restricted.</p>
      </div>

      {canManage ? (
        <ConfirmAction
          label="Unlink number"
          title="Unlink this number?"
          description="It will be logged out of WhatsApp Web and removed from Linked devices on the phone. Messages will go through the official WhatsApp setup, if you have one."
          confirmLabel="Unlink"
          pendingLabel="Unlinking…"
          successMessage="Number unlinked"
          errorMessage="Couldn't unlink"
          variant="destructive"
          size="default"
          onConfirm={() => disconnect.mutateAsync()}
        />
      ) : null}
    </div>
  )
}

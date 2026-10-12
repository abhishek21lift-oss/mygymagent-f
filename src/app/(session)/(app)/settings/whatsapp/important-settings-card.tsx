"use client"

import * as React from "react"
import { Settings2, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { ErrorState } from "@/components/shared/error-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ApiError } from "@/lib/api/client"
import {
  useUpdateWhatsappProfile,
  useWhatsappProfile,
  type WhatsappProfile,
} from "@/lib/hooks/use-whatsapp-automation"

/** Variables the backend will resolve in a customized bill message; the
 * API rejects a message using anything else, so the hint is exact. */
const BILL_VARIABLES = [
  "{{firstName}}",
  "{{organizationName}}",
  "{{salutation}}",
  "{{invoiceNumber}}",
  "{{amount}}",
  "{{currency}}",
  "{{dueState}}",
  "{{dueDate}}",
] as const

export function ImportantSettingsCard({ canManage }: { canManage: boolean }) {
  const profileQuery = useWhatsappProfile()
  const profile = profileQuery.data

  return (
    <Card className="overflow-hidden border-border bg-card dark:bg-card">
      <CardHeader className="border-b border-border bg-muted/40">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-lg">
            <Settings2 className="size-5" aria-hidden="true" />
          </span>
          <div>
            <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em] text-stone-950 dark:text-stone-50">
              Important settings
            </CardTitle>
            <p className="mt-1 text-xs font-medium text-stone-600 dark:text-stone-400">
              Delivery behaviour for every automation.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 sm:p-6">
        {profileQuery.isLoading ? (
          <div className="flex flex-col gap-4" role="status" aria-label="Loading important settings">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        ) : profileQuery.isError || !profile ? (
          <ErrorState onRetry={() => void profileQuery.refetch()} />
        ) : (
          // Keyed by the server's updatedAt, so the form re-seeds only after
          // a save lands -- no local state synced by an effect.
          <ImportantSettingsForm
            key={profile.updatedAt ?? "defaults"}
            profile={profile}
            canManage={canManage}
          />
        )}
      </CardContent>
    </Card>
  )
}

function ImportantSettingsForm({
  profile,
  canManage,
}: {
  profile: WhatsappProfile
  canManage: boolean
}) {
  const update = useUpdateWhatsappProfile()
  const [autoResend, setAutoResend] = React.useState(profile.autoResend)
  const [maxResendAttempts, setMaxResendAttempts] = React.useState(
    String(profile.maxResendAttempts),
  )
  const [countryCode, setCountryCode] = React.useState(profile.defaultCountryCode)
  const [billMessage, setBillMessage] = React.useState(profile.customBillMessage ?? "")
  const [saving, setSaving] = React.useState(false)

  async function save() {
    const attempts = Number(maxResendAttempts)
    if (autoResend && (!Number.isInteger(attempts) || attempts < 1 || attempts > 8)) {
      toast.error("Resend attempts must be a whole number from 1 to 8.")
      return
    }
    if (!/^\d{1,4}$/.test(countryCode)) {
      toast.error("Country code must be 1–4 digits, e.g. 91.")
      return
    }
    setSaving(true)
    try {
      await update.mutateAsync({
        autoResend,
        maxResendAttempts: attempts,
        defaultCountryCode: countryCode,
        customBillMessage: billMessage.trim() === "" ? null : billMessage,
      })
      toast.success("Settings saved")
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not save settings.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Label htmlFor="auto-resend" className="text-sm font-bold text-stone-900 dark:text-stone-100">
            Auto resend
          </Label>
          <p className="text-xs font-medium text-stone-600 dark:text-stone-400">
            Retry a WhatsApp send that fails, with a short backoff between attempts.
          </p>
        </div>
        <Switch
          id="auto-resend"
          checked={autoResend}
          onCheckedChange={setAutoResend}
          disabled={!canManage || saving}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="resend-attempts" className="text-sm font-bold text-stone-900 dark:text-stone-100">
          Maximum attempts
        </Label>
        <Input
          id="resend-attempts"
          type="number"
          min={1}
          max={8}
          inputMode="numeric"
          value={maxResendAttempts}
          onChange={(event) => setMaxResendAttempts(event.target.value)}
          disabled={!canManage || saving || !autoResend}
          className="h-11 w-32 rounded-lg tabular-nums"
        />
        <p className="text-xs font-medium text-stone-600 dark:text-stone-400">
          Between 1 and 8. Used only while auto resend is on.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="country-code" className="text-sm font-bold text-stone-900 dark:text-stone-100">
          Internationalization — default country code
        </Label>
        <Input
          id="country-code"
          inputMode="numeric"
          placeholder="91"
          value={countryCode}
          onChange={(event) => setCountryCode(event.target.value)}
          disabled={!canManage || saving}
          className="h-11 w-32 rounded-lg tabular-nums"
        />
        <p className="text-xs font-medium text-stone-600 dark:text-stone-400">
          Added to local phone numbers that have no country code, e.g. 91 for India.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="bill-message" className="text-sm font-bold text-stone-900 dark:text-stone-100">
          Customized bill message
        </Label>
        <Textarea
          id="bill-message"
          rows={4}
          value={billMessage}
          onChange={(event) => setBillMessage(event.target.value)}
          disabled={!canManage || saving}
          placeholder="{{salutation}} {{firstName}}, your invoice {{invoiceNumber}} for {{amount}} is due on {{dueDate}}."
          className="rounded-lg"
        />
        <p className="text-xs font-medium text-stone-600 dark:text-stone-400">
          Leave blank to use the built-in bill template. Available: {BILL_VARIABLES.join(", ")}.
        </p>
      </div>

      <div>
        <Button onClick={save} disabled={!canManage || saving} className="btn-sheen min-h-11 rounded-lg bg-primary">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          {saving ? "Saving..." : "Save settings"}
        </Button>
      </div>
    </div>
  )
}
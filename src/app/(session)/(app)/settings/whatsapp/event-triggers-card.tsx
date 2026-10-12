"use client"

import * as React from "react"
import { Zap } from "lucide-react"
import { toast } from "sonner"

import { ErrorState } from "@/components/shared/error-state"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { ApiError } from "@/lib/api/client"
import {
  useAutomationSettings,
  useUpdateAutomationSetting,
  type AutomationSettingRow,
} from "@/lib/hooks/use-whatsapp-automation"

/** Messages that go out the moment something happens, not on a schedule.
 * Each key is the one the matching backend listener checks. */
export const EVENT_TRIGGERS = [
  { key: "LEAD_FIRST_TOUCH", title: "Enquiry", description: "Greet a new enquiry as soon as it is captured." },
  { key: "INVOICE_DUE_REMINDER", title: "Subscription Bill", description: "Send the bill when a membership is sold." },
  { key: "PAYMENT_RECEIPT", title: "Paid Balance", description: "Send a receipt when a payment is completed." },
] as const

export function EventTriggersCard({ canManage }: { canManage: boolean }) {
  const settingsQuery = useAutomationSettings()
  const update = useUpdateAutomationSetting()

  const byKey = React.useMemo(
    () => new Map((settingsQuery.data ?? []).map((row) => [row.key, row])),
    [settingsQuery.data],
  )

  return (
    <Card className="overflow-hidden border-border bg-card dark:bg-card">
      <CardHeader className="border-b border-border bg-muted/40">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-lg">
            <Zap className="size-5" aria-hidden="true" />
          </span>
          <div>
            <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em] text-stone-950 dark:text-stone-50">
              Event triggers
            </CardTitle>
            <p className="mt-1 text-xs font-medium text-stone-600 dark:text-stone-400">
              Sent immediately when the event happens — separate from the daily schedules above.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 sm:p-6">
        {settingsQuery.isLoading ? (
          <div className="flex flex-col gap-3" role="status" aria-label="Loading event triggers">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        ) : settingsQuery.isError ? (
          <ErrorState onRetry={() => void settingsQuery.refetch()} />
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {EVENT_TRIGGERS.map((trigger) => (
              <EventTriggerRow
                key={trigger.key}
                trigger={trigger}
                row={byKey.get(trigger.key)}
                canManage={canManage}
                update={update}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function EventTriggerRow({
  trigger,
  row,
  canManage,
  update,
}: {
  trigger: (typeof EVENT_TRIGGERS)[number]
  row: AutomationSettingRow | undefined
  canManage: boolean
  update: ReturnType<typeof useUpdateAutomationSetting>
}) {
  const enabled = row?.enabled ?? true

  function handleToggle(next: boolean) {
    update.mutate(
      { key: trigger.key, input: { enabled: next } },
      {
        onSuccess: () => toast.success(`${trigger.title} ${next ? "on" : "off"}`),
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : `Could not update ${trigger.title}.`),
      },
    )
  }

  return (
    <li className="flex items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3">
        <Switch
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={!canManage || update.isPending}
          aria-label={`${trigger.title} trigger`}
        />
        <div>
          <p className="text-sm font-bold text-stone-900 dark:text-stone-100">{trigger.title}</p>
          <p className="text-xs font-medium text-stone-600 dark:text-stone-400">{trigger.description}</p>
        </div>
      </div>
      <Badge variant={enabled ? "success" : "secondary"} className="shrink-0 rounded-full">
        {enabled ? "On" : "Off"}
      </Badge>
    </li>
  )
}
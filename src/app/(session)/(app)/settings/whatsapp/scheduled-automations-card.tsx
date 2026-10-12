"use client"

import * as React from "react"
import { CalendarClock, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { ErrorState } from "@/components/shared/error-state"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { ApiError } from "@/lib/api/client"
import {
  useAutomationSettings,
  useUpdateAutomationSetting,
  type AutomationSettingRow,
} from "@/lib/hooks/use-whatsapp-automation"

/** The six scheduled automations, in the order the Control Center shows
 * them, each with the run time the backend falls back to when the gym
 * has not saved one. Kept in sync with DEFAULT_RUN_AT in the API. */
export const SCHEDULED_AUTOMATIONS = [
  { key: "BIRTHDAY_WISH", title: "Birthday", description: "Wish members on their birthday.", defaultRunAt: "04:00" },
  { key: "PAYMENT_OVERDUE_REMINDER", title: "Balance Due", description: "Remind members with an unpaid balance.", defaultRunAt: "05:00" },
  { key: "MEMBERSHIP_RENEWAL_REMINDER", title: "Before Expiry", description: "Renewal reminders before the membership ends.", defaultRunAt: "06:00" },
  { key: "MEMBERSHIP_POST_EXPIRY", title: "After Expiry", description: "Follow up once a membership has lapsed.", defaultRunAt: "07:00" },
  { key: "MEMBERSHIP_EXPIRY_ON_DAY", title: "On Expiry", description: "Notify on the day the membership ends.", defaultRunAt: "08:00" },
  { key: "MEMBER_INACTIVE_RECOVERY", title: "Irregular Members", description: "Re-engage members who stopped visiting.", defaultRunAt: "08:00" },
] as const

export function ScheduledAutomationsCard({ canManage }: { canManage: boolean }) {
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
            <CalendarClock className="size-5" aria-hidden="true" />
          </span>
          <div>
            <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em] text-stone-950 dark:text-stone-50">
              Scheduled automations
            </CardTitle>
            <p className="mt-1 text-xs font-medium text-stone-600 dark:text-stone-400">
              Times are your organization&apos;s local time. Each runs once a day, only when switched on.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 sm:p-6">
        {settingsQuery.isLoading ? (
          <div className="flex flex-col gap-3" role="status" aria-label="Loading scheduled automations">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : settingsQuery.isError ? (
          <ErrorState onRetry={() => void settingsQuery.refetch()} />
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {SCHEDULED_AUTOMATIONS.map((automation) => {
              const row = byKey.get(automation.key)
              return (
                // Keyed by the saved time so the field re-seeds only when the
                // server value actually changes, never mid-edit.
                <ScheduledRow
                  key={`${automation.key}:${row?.runAt ?? ""}`}
                  automation={automation}
                  row={row}
                  canManage={canManage}
                  update={update}
                />
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function ScheduledRow({
  automation,
  row,
  canManage,
  update,
}: {
  automation: (typeof SCHEDULED_AUTOMATIONS)[number]
  row: AutomationSettingRow | undefined
  canManage: boolean
  update: ReturnType<typeof useUpdateAutomationSetting>
}) {
  const enabled = row?.enabled ?? true
  const savedRunAt = row?.runAt ?? automation.defaultRunAt
  const [runAt, setRunAt] = React.useState(savedRunAt)
  const [savingTime, setSavingTime] = React.useState(false)

  function handleToggle(next: boolean) {
    update.mutate(
      { key: automation.key, input: { enabled: next } },
      {
        onSuccess: () => toast.success(`${automation.title} ${next ? "on" : "off"}`),
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : `Could not update ${automation.title}.`),
      },
    )
  }

  async function commitTime() {
    if (runAt === savedRunAt || !/^([01]\d|2[0-3]):[0-5]\d$/.test(runAt)) {
      setRunAt(savedRunAt)
      return
    }
    setSavingTime(true)
    try {
      await update.mutateAsync({ key: automation.key, input: { runAt } })
      toast.success(`${automation.title} set to ${runAt}`)
    } catch (error) {
      setRunAt(savedRunAt)
      toast.error(error instanceof ApiError ? error.message : `Could not save ${automation.title} time.`)
    } finally {
      setSavingTime(false)
    }
  }

  const busy = update.isPending || savingTime

  return (
    <li className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <Switch
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={!canManage || update.isPending}
          aria-label={`${automation.title} automation`}
        />
        <div>
          <p className="text-sm font-bold text-stone-900 dark:text-stone-100">{automation.title}</p>
          <p className="text-xs font-medium text-stone-600 dark:text-stone-400">{automation.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:shrink-0">
        <Label htmlFor={`run-at-${automation.key}`} className="text-xs font-semibold text-stone-600 dark:text-stone-400">
          Run at
        </Label>
        <Input
          id={`run-at-${automation.key}`}
          type="time"
          value={runAt}
          disabled={!canManage || !enabled || busy}
          className="h-11 w-32 rounded-lg tabular-nums"
          onChange={(event) => setRunAt(event.target.value)}
          onBlur={() => void commitTime()}
        />
        {busy ? (
          <Loader2 className="size-4 shrink-0 animate-spin text-stone-500" aria-hidden="true" />
        ) : (
          <Badge variant={enabled ? "success" : "secondary"} className="rounded-full">
            {enabled ? "On" : "Off"}
          </Badge>
        )}
      </div>
    </li>
  )
}
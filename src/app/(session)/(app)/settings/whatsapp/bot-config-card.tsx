"use client"

import * as React from "react"
import { Bot, Loader2, ToggleLeft, ToggleRight } from "lucide-react"
import { toast } from "sonner"
import { DataState } from "@/components/shared/data-state"
import { ErrorState } from "@/components/shared/error-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth/auth-context"
import { ApiError } from "@/lib/api/client"
import {
  useWhatsAppAutomationActivity,
  useWhatsAppBotConfig,
  useWhatsAppUpdateBotConfig,
} from "@/lib/hooks/use-whatsapp-adapter"

/** Per-session bot automation (ping/uptime/welcome). Everything is off
 * until the gym explicitly turns it on; no row means no automation. */
export function BotConfigCard({ canManage }: { canManage: boolean }) {
  const { hasPermission } = useAuth()
  const config = useWhatsAppBotConfig()
  const update = useWhatsAppUpdateBotConfig()
  const [error, setError] = React.useState<string | null>(null)
  const current = config.data
  const activity = useWhatsAppAutomationActivity()
  const [prefix, setPrefix] = React.useState("#")
  const [welcome, setWelcome] = React.useState("")
  // Sync the form when the server config first arrives (or changes
  // elsewhere); afterwards the fields are fully controlled locally.
  const loadedKey = current?.updatedAt ?? "new"
  const [syncedKey, setSyncedKey] = React.useState<string | null>(null)
  if (syncedKey !== loadedKey) {
    setSyncedKey(loadedKey)
    setPrefix(current?.prefix ?? "#")
    setWelcome(current?.welcomeMessage ?? "")
  }

  if (!hasPermission("whatsapp.read")) {
    return (
      <Card className="overflow-hidden border-border bg-card dark:bg-card">
        <CardHeader className="border-b border-border bg-muted/40">
          <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground tracking-tight text-stone-950 dark:text-stone-50">Bot automation</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState message="You need whatsapp.read permission to view bot automation." />
        </CardContent>
      </Card>
    )
  }

  async function save(patch: Record<string, unknown>) {
    setError(null)
    try {
      await update.mutateAsync(patch)
      toast.success("Bot automation saved")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save.")
    }
  }


  return (
    <Card id="bot-automation" className="overflow-hidden border-border bg-card dark:bg-card">
      <CardHeader className="border-b border-border bg-muted/40">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-violet-500 text-white shadow-lg">
            <Bot className="size-5" aria-hidden="true" />
          </span>
          <div>
            <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground tracking-tight text-stone-950 dark:text-stone-50">Bot automation</CardTitle>
            <p className="mt-1 text-xs font-medium text-stone-600 dark:text-stone-400">
              Ping, uptime and first-contact greeting. All off until enabled.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 sm:p-6">
        <DataState
          isLoading={config.isPending}
          isError={config.isError}
          onRetry={() => void config.refetch()}
          errorMessage="Could not load bot automation."
          isEmpty={false}
          emptyTitle=""
          emptyDescription=""
          skeletonRows={3}
        >
          <div className="space-y-5">
            {error && <p role="alert" className="text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
            <div className="flex flex-col gap-2">
              <Label htmlFor="bot-prefix">Command prefix (1-3 characters)</Label>
              <Input
                id="bot-prefix"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                maxLength={3}
                disabled={!canManage || update.isPending}
                className="min-h-11 max-w-32 rounded-xl font-mono"
              />
            </div>
            <ToggleRow
              label="Ping command"
              hint={`Replies "Pong!" to "${current?.prefix ?? "#"}ping".`}
              on={current?.enablePing ?? false}
              disabled={!canManage || update.isPending}
              onToggle={() => void save({ enablePing: !(current?.enablePing ?? false) })}
            />
            <ToggleRow
              label="Uptime command"
              hint={`Replies with link time for "${current?.prefix ?? "#"}uptime".`}
              on={current?.enableUptime ?? false}
              disabled={!canManage || update.isPending}
              onToggle={() => void save({ enableUptime: !(current?.enableUptime ?? false) })}
            />
            <div className="flex flex-col gap-2">
              <Label htmlFor="bot-welcome">First-contact greeting (blank disables)</Label>
              <Textarea
                id="bot-welcome"
                value={welcome}
                onChange={(e) => setWelcome(e.target.value)}
                rows={3}
                maxLength={1000}
                disabled={!canManage || update.isPending}
                placeholder="Welcome to {{organizationName}}! Reply here for help."
                className="min-h-11 rounded-xl"
              />
            </div>
            {canManage && (
              <Button
                onClick={() => void save({ prefix, welcomeMessage: welcome })}
                disabled={update.isPending}
                className="min-h-11 bg-primary"
              >
                {update.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                Save changes
              </Button>
            )}
            <div className="border-t border-border pt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Recent automation
              </p>
              {activity.isPending ? (
                <Skeleton className="mt-3 h-16 w-full rounded-xl" />
              ) : activity.isError ? (
                <ErrorState message="Could not load automation activity." onRetry={() => void activity.refetch()} />
              ) : (activity.data ?? []).length === 0 ? (
                <p className="mt-2 text-sm font-medium text-stone-600 dark:text-stone-400">
                  No automated replies sent yet.
                </p>
              ) : (
                <ul className="mt-2 divide-y divide-border">
                  {(activity.data ?? []).slice(0, 5).map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-3 py-2">
                      <span className="font-mono text-xs text-stone-900 dark:text-stone-100">{a.templateKey}</span>
                      <span className="text-xs font-medium text-stone-600 dark:text-stone-400 tabular-nums">
                        {a.status} · {new Date(a.createdAt).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </DataState>
      </CardContent>
    </Card>
  )
}

function ToggleRow({
  label,
  hint,
  on,
  disabled,
  onToggle,
}: {
  label: string
  hint: string
  on: boolean
  disabled: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-bold text-stone-950 dark:text-stone-50">{label}</p>
        <p className="text-xs font-medium text-stone-600 dark:text-stone-400">{hint}</p>
      </div>
      <Button
        type="button"
        variant={on ? "default" : "outline"}
        size="sm"
        onClick={onToggle}
        disabled={disabled}
        className="min-h-8 shrink-0 rounded-lg"
      >
        {on ? <ToggleRight className="h-4 w-4" aria-hidden="true" /> : <ToggleLeft className="h-4 w-4" aria-hidden="true" />}
      </Button>
    </div>
  )
}

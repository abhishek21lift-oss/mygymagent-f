"use client"

import * as React from "react"
import { Check, Copy, FlaskConical, Loader2, Plus, RefreshCw, ToggleLeft, ToggleRight, Trash2, Webhook, Pencil } from "lucide-react"
import { toast } from "sonner"
import { DataState } from "@/components/shared/data-state"
import { ErrorState } from "@/components/shared/error-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/lib/auth/auth-context"
import { ApiError } from "@/lib/api/client"
import {
  useCreateWebhook,
  useDeleteWebhook,
  useRegenerateWebhook,
  useTestWebhook,
  useUpdateWebhook,
  useWebhookDeliveries,
  useWebhooks,
  type WebhookSubscription,
} from "@/lib/hooks/use-webhooks"

const EVENTS = [
  "message.received",
  "message.sent",
  "message.failed",
  "broadcast.finished",
  "connection.update",
] as const

interface FormState {
  url: string
  events: string[]
  allEvents: boolean
  enabled: boolean
}

const EMPTY_FORM: FormState = { url: "", events: [], allEvents: false, enabled: true }

function lastStatusDot(deliveries: { subscriptionId: string; status: string; createdAt: string }[] | undefined, id: string) {
  const last = (deliveries ?? []).filter((d) => d.subscriptionId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  if (!last) return <span className="text-xs text-stone-400">never fired</span>
  const color = last.status === "SENT" ? "bg-emerald-500" : last.status === "FAILED" ? "bg-rose-500" : "bg-amber-500"
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 dark:text-stone-400">
      <span className={`size-2 rounded-full ${color}`} aria-hidden="true" />
      {last.status}
    </span>
  )
}

export function WebhooksCard({ canManage }: { canManage: boolean }) {
  const { hasPermission } = useAuth()
  const list = useWebhooks()
  const deliveries = useWebhookDeliveries()
  const create = useCreateWebhook()
  const update = useUpdateWebhook()
  const remove = useDeleteWebhook()
  const test = useTestWebhook()
  const regenerate = useRegenerateWebhook()

  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<WebhookSubscription | null>(null)
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM)
  const [error, setError] = React.useState<string | null>(null)
  const [secret, setSecret] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)

  function closeDialog() {
    setOpen(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setError(null)
    setSecret(null)
    setCopied(false)
  }

  function openEdit(sub: WebhookSubscription) {
    setForm({
      url: sub.url,
      events: sub.events.includes("*") ? [] : sub.events,
      allEvents: sub.events.includes("*"),
      enabled: sub.enabled,
    })
    setEditing(sub)
    setSecret(null)
    setError(null)
    setOpen(true)
  }

  function toggleEvent(event: string) {
    setForm((f) => ({
      ...f,
      events: f.events.includes(event) ? f.events.filter((e) => e !== event) : [...f.events, event],
    }))
  }

  async function handleSubmit() {
    setError(null)
    setSecret(null)
    const events = form.allEvents ? ["*"] : form.events
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, input: { url: form.url.trim(), events, enabled: form.enabled } })
        toast.success("Webhook updated")
        closeDialog()
      } else {
        const row = await create.mutateAsync({ url: form.url.trim(), events, enabled: form.enabled })
        setSecret(row.secret)
        toast.success("Webhook created — copy the secret now")
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save webhook.")
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this webhook subscription?")) return
    try {
      await remove.mutateAsync(id)
      toast.success("Webhook deleted")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete webhook.")
    }
  }

  async function handleToggle(sub: WebhookSubscription) {
    try {
      await update.mutateAsync({ id: sub.id, input: { enabled: !sub.enabled } })
      toast.success(sub.enabled ? "Webhook disabled" : "Webhook enabled")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update webhook.")
    }
  }

  async function handleTest(id: string) {
    try {
      const res = await test.mutateAsync(id)
      if (res.ok) toast.success(`Test delivered (${res.httpStatus})`)
      else toast.error(`Test failed: ${res.error ?? "unknown error"}`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Test failed.")
    }
  }

  async function handleRegenerate(id: string) {
    try {
      const res = await regenerate.mutateAsync(id)
      setSecret(res.secret)
      setCopied(false)
      toast.success("New secret — copy it now, it won't be shown again")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to regenerate secret.")
    }
  }

  async function copySecret() {
    if (!secret) return
    try {
      await navigator.clipboard.writeText(secret)
      setCopied(true)
    } catch {
      toast.error("Copy failed — select the secret manually.")
    }
  }

  if (!hasPermission("whatsapp.read")) {
    return (
      <Card className="overflow-hidden border-border bg-card dark:bg-card">
        <CardHeader className="border-b border-border bg-muted/40">
          <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground tracking-tight text-stone-950 dark:text-stone-50">Webhooks</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState message="You need whatsapp.read permission to view webhooks." />
        </CardContent>
      </Card>
    )
  }

  const busy = create.isPending || update.isPending
  const canSave = form.url.trim().length > 0 && (form.allEvents || form.events.length > 0)

  return (
    <Card id="webhooks" className="overflow-hidden border-border bg-card dark:bg-card">
      <CardHeader className="border-b border-border bg-muted/40">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-lg">
              <Webhook className="size-5" aria-hidden="true" />
            </span>
            <div>
              <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground tracking-tight text-stone-950 dark:text-stone-50">Webhooks</CardTitle>
              <p className="mt-1 text-xs font-medium text-stone-600 dark:text-stone-400">Signed POSTs to your tools (n8n, Zapier) on WhatsApp events.</p>
            </div>
          </div>
          {canManage && (
            <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : closeDialog())}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={busy} className="min-h-11">
                  <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                  Add webhook
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editing ? "Edit webhook" : "New webhook"}</DialogTitle>
                  <DialogDescription>URL, events, and status. The secret is shown once after saving.</DialogDescription>
                </DialogHeader>
                {error && <p role="alert" className="text-sm font-semibold text-rose-600 dark:text-rose-400 mb-4">{error}</p>}
                <div className="grid gap-4 py-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="wh-url">URL</Label>
                    <Input
                      id="wh-url"
                      type="url"
                      inputMode="url"
                      value={form.url}
                      onChange={(e) => setForm({ ...form, url: e.target.value })}
                      placeholder="https://n8n.example.com/webhook/wa"
                      className="min-h-11 rounded-xl font-mono text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Events</Label>
                    <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-stone-200 px-3 dark:border-stone-700">
                      <Checkbox
                        checked={form.allEvents}
                        onCheckedChange={(v) => setForm({ ...form, allEvents: v === true })}
                      />
                      <span className="text-sm font-bold">All events (*)</span>
                    </label>
                    {!form.allEvents && (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {EVENTS.map((event) => (
                          <label key={event} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-stone-200 px-3 dark:border-stone-700">
                            <Checkbox checked={form.events.includes(event)} onCheckedChange={() => toggleEvent(event)} />
                            <span className="font-mono text-xs">{event}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={form.enabled ? "default" : "outline"}
                      onClick={() => setForm({ ...form, enabled: !form.enabled })}
                      className="min-h-11 rounded-lg"
                    >
                      {form.enabled ? <ToggleRight className="mr-2 h-4 w-4" aria-hidden="true" /> : <ToggleLeft className="mr-2 h-4 w-4" aria-hidden="true" />}
                      {form.enabled ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                  {secret && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-400/20 dark:bg-amber-500/10">
                      <p className="text-xs font-bold text-amber-800 dark:text-amber-300">Copy the secret now — it is never shown again.</p>
                      <div className="mt-2 flex items-center gap-2">
                        <code className="min-w-0 flex-1 break-all font-mono text-xs text-stone-900 dark:text-stone-100">{secret}</code>
                        <Button type="button" variant="outline" size="sm" onClick={copySecret} className="min-h-8 shrink-0">
                          {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={closeDialog} disabled={busy} className="min-h-11">
                    {secret ? "Done" : "Cancel"}
                  </Button>
                  {!secret && (
                    <Button onClick={handleSubmit} disabled={busy || !canSave} className="min-h-11 bg-primary">
                      {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                      {editing ? "Save changes" : "Create webhook"}
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-5 sm:p-6">
        <DataState
          isLoading={list.isPending}
          isError={list.isError}
          onRetry={() => void list.refetch()}
          errorMessage="Could not load webhooks."
          isEmpty={(list.data ?? []).length === 0}
          emptyIcon={Webhook}
          emptyTitle="No webhooks yet"
          emptyDescription="Add your first URL above to get signed event POSTs."
          skeletonRows={2}
        >
          <div className="rounded-lg border border-stone-200/70 bg-card p-4 dark:bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[38%]">URL / Events</TableHead>
                  <TableHead>Last delivery</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(list.data ?? []).map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="max-w-xs">
                      <div className="break-all font-mono text-xs font-bold text-stone-900 dark:text-stone-100">{sub.url}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        {sub.events.map((event) => (
                          <Badge key={event} variant="outline" className="rounded-full text-[10px]">{event}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{lastStatusDot(deliveries.data, sub.id)}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        type="button"
                        variant={sub.enabled ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToggle(sub)}
                        disabled={update.isPending || !canManage}
                        className="min-h-8 rounded-lg"
                      >
                        {sub.enabled ? <ToggleRight className="h-4 w-4" aria-hidden="true" /> : <ToggleLeft className="h-4 w-4" aria-hidden="true" />}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      {canManage && (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            title="Send a test event"
                            onClick={() => handleTest(sub.id)}
                            disabled={test.isPending}
                            className="min-h-8"
                          >
                            <FlaskConical className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            title="Rotate secret"
                            onClick={() => handleRegenerate(sub.id)}
                            disabled={regenerate.isPending}
                            className="min-h-8"
                          >
                            <RefreshCw className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            title="Edit webhook"
                            onClick={() => openEdit(sub)}
                            disabled={update.isPending}
                            className="min-h-8"
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(sub.id)}
                            disabled={remove.isPending}
                            className="min-h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DataState>

        <div className="mt-5">
          <h3 className="text-xs font-black uppercase tracking-[.16em] text-stone-500 dark:text-stone-400">Recent deliveries</h3>
          <DataState
            isLoading={deliveries.isPending}
            isError={deliveries.isError}
            onRetry={() => void deliveries.refetch()}
            errorMessage="Could not load deliveries."
            isEmpty={(deliveries.data ?? []).length === 0}
            emptyIcon={FlaskConical}
            emptyTitle="No deliveries yet"
            emptyDescription="Events will appear here once webhooks fire."
            skeletonRows={2}
          >
            <ul className="mt-2 flex flex-col gap-2">
              {(deliveries.data ?? []).slice(0, 10).map((d) => (
                <li key={d.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-stone-200 p-3 dark:border-stone-700">
                  <Badge variant={d.status === "SENT" ? "success" : d.status === "FAILED" ? "destructive" : "warning"} className="rounded-full">{d.status}</Badge>
                  <span className="font-mono text-xs">{d.event}</span>
                  <span className="text-xs text-stone-500 tabular-nums">{d.attempts} attempt{d.attempts === 1 ? "" : "s"}{d.httpStatus ? ` · HTTP ${d.httpStatus}` : ""}</span>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">{new Date(d.createdAt).toLocaleString()}</span>
                  {d.error && <p title={d.error} className="w-full truncate text-xs font-medium text-rose-600 dark:text-rose-400">{d.error}</p>}
                </li>
              ))}
            </ul>
          </DataState>
        </div>
      </CardContent>
    </Card>
  )
}

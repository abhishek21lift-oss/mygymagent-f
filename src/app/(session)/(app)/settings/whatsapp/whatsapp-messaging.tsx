"use client"

import * as React from "react"
import { toast } from "sonner"
import { CalendarClock, Reply, Send } from "lucide-react"

import { ConfirmAction } from "@/components/shared/confirm-action"
import { DataState } from "@/components/shared/data-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ApiError } from "@/lib/api/client"
import {
  useCancelScheduledWhatsApp,
  useScheduleWhatsApp,
  useScheduledWhatsApp,
  useSendWhatsAppMessage,
  type ScheduledMessageStatus,
} from "@/lib/hooks/use-whatsapp"

/**
 * Answer a member from the inbox. Until this, a reply to a reminder
 * landed here and the only way to answer was the gym owner's own phone.
 */
export function ReplyBox({ to }: { to: string }) {
  const send = useSendWhatsAppMessage()
  const [open, setOpen] = React.useState(false)
  const [text, setText] = React.useState("")

  async function submit() {
    if (!text.trim()) return
    try {
      await send.mutateAsync({ to, text: text.trim() })
      toast.success("Reply sent")
      setText("")
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Reply could not be sent")
    }
  }

  if (!open) {
    return (
      <Button type="button" size="sm" variant="ghost" className="mt-1 min-h-10 px-2" onClick={() => setOpen(true)}>
        <Reply className="size-4" aria-hidden="true" />
        Reply
      </Button>
    )
  }
  return (
    <div className="mt-2 flex flex-col gap-2">
      <Textarea aria-label={`Reply to ${to}`} value={text} onChange={(e) => setText(e.target.value)} className="min-h-16" placeholder="Type your reply" />
      <div className="flex gap-2">
        <Button type="button" size="sm" className="min-h-10" onClick={() => void submit()} disabled={!text.trim() || send.isPending}>
          <Send className="size-4" aria-hidden="true" />
          {send.isPending ? "Sending…" : "Send"}
        </Button>
        <Button type="button" size="sm" variant="outline" className="min-h-10" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

const STATUS_VARIANT: Record<ScheduledMessageStatus, "secondary" | "success" | "destructive" | "outline"> = {
  PENDING: "secondary",
  SENT: "success",
  FAILED: "destructive",
  CANCELLED: "outline",
}

/** An hour from now, as a datetime-local value. */
function soonLocal() {
  const d = new Date(Date.now() + 60 * 60 * 1000)
  d.setSeconds(0, 0)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * Write a message now, send it later: a holiday notice, a new batch, a
 * reminder for a member who asked to be called back. Goes out from the
 * gym's own number at the chosen time.
 */
export function ScheduledMessagesCard({ canManage }: { canManage: boolean }) {
  const list = useScheduledWhatsApp(50)
  const schedule = useScheduleWhatsApp()
  const cancel = useCancelScheduledWhatsApp()
  const [to, setTo] = React.useState("")
  const [text, setText] = React.useState("")
  const [sendAt, setSendAt] = React.useState(soonLocal)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    const when = new Date(sendAt)
    if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
      toast.error("Pick a time in the future")
      return
    }
    try {
      await schedule.mutateAsync({ to: to.trim(), text: text.trim(), sendAt: when.toISOString() })
      toast.success(`Scheduled for ${when.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`)
      setTo("")
      setText("")
      setSendAt(soonLocal())
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Message could not be scheduled")
    }
  }

  return (
    <Card className="overflow-hidden border-border bg-card">
      <CardHeader className="border-b border-border bg-muted/40">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-lg">
            <CalendarClock className="size-5" aria-hidden="true" />
          </span>
          <div>
            <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Scheduled messages</CardTitle>
            <p className="mt-1 text-xs font-medium text-muted-foreground">Write now, send later from your gym&apos;s number.</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 p-5 sm:p-6">
        {canManage ? (
          <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="sched-to" className="text-xs">To (phone with country code)</Label>
                <Input id="sched-to" inputMode="tel" placeholder="+91 98765 43210" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 min-h-11" />
              </div>
              <div>
                <Label htmlFor="sched-at" className="text-xs">Send at</Label>
                <Input id="sched-at" type="datetime-local" value={sendAt} onChange={(e) => setSendAt(e.target.value)} className="mt-1 min-h-11" />
              </div>
            </div>
            <div>
              <Label htmlFor="sched-text" className="text-xs">Message</Label>
              <Textarea id="sched-text" value={text} onChange={(e) => setText(e.target.value)} className="mt-1 min-h-20" placeholder="Gym closed on Sunday for maintenance. See you Monday!" />
            </div>
            <Button type="submit" className="min-h-11 w-fit" disabled={!to.trim() || !text.trim() || schedule.isPending}>
              <CalendarClock className="size-4" aria-hidden="true" />
              {schedule.isPending ? "Scheduling…" : "Schedule message"}
            </Button>
          </form>
        ) : null}
        <DataState
          isLoading={list.isPending}
          isError={list.isError}
          onRetry={() => void list.refetch()}
          errorMessage="Scheduled messages could not be loaded."
          isEmpty={(list.data ?? []).length === 0}
          emptyTitle="Nothing scheduled"
          emptyDescription="Messages you schedule appear here until they go out."
          skeletonRows={2}
        >
          <ul className="flex flex-col gap-2">
            {(list.data ?? []).map((m) => (
              <li key={m.id} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold">{m.recipient}</span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
                    {new Date(m.sendAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    <Badge variant={STATUS_VARIANT[m.status]}>{m.status}</Badge>
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm [overflow-wrap:anywhere]">{m.body}</p>
                {m.errorMessage ? <p className="mt-1 text-xs text-destructive">{m.errorMessage}</p> : null}
                {canManage && m.status === "PENDING" ? (
                  <ConfirmAction
                    label="Cancel"
                    title="Cancel this message?"
                    description="It won't be sent. You can schedule it again later."
                    confirmLabel="Cancel message"
                    pendingLabel="Cancelling..."
                    successMessage="Scheduled message cancelled"
                    errorMessage="Could not cancel the message."
                    onConfirm={() => cancel.mutateAsync(m.id)}
                    className="mt-2 min-h-10"
                  />
                ) : null}
              </li>
            ))}
          </ul>
        </DataState>
      </CardContent>
    </Card>
  )
}

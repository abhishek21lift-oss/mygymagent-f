"use client"

import * as React from "react"
import { toast } from "sonner"
import { Headphones, MessageSquare } from "lucide-react"

import { ApiError } from "@/lib/api/client"
import { useAuth } from "@/lib/auth/auth-context"
import {
 useAddTicketMessage,
 useTicketMessages,
 useUpdateTicketStatus,
 type SupportTicket,
} from "@/lib/hooks/use-business-os"
import { DataState } from "@/components/shared/data-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

const TICKET_STATUSES = ["OPEN", "IN_PROGRESS", "PENDING", "RESOLVED", "CLOSED"]

const PRIORITY_TONE: Record<string, "destructive" | "warning" | "secondary"> = {
 URGENT: "destructive",
 HIGH: "warning",
 NORMAL: "secondary",
}

function authorName(message: { authorUser?: { firstName: string; lastName: string } | null }) {
  const author = message.authorUser
  if (!author) return "Someone"
  const name = `${author.firstName ?? ""} ${author.lastName ?? ""}`.trim()
  return name || "Someone"
}

function when(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * One support ticket, in full: what was asked, what has been said back,
 * and the two controls that change it.
 *
 * This closes the F-P0-2 gap. The page could raise a ticket, change its
 * status and write a reply, but there was nowhere to *read* the replies:
 * no endpoint returned them, so a reply was accepted and then invisible
 * on the next render. A support inbox where you cannot read the answers
 * is a form, not an inbox.
 */
export function SupportTicketDialog({
  ticket,
  onOpenChange,
}: {
  ticket: SupportTicket | null
  onOpenChange: (open: boolean) => void
}) {
  const { hasPermission } = useAuth()
  const canManage = hasPermission("support.manage")
  const messages = useTicketMessages(ticket?.id ?? null, Boolean(ticket))
  const addMessage = useAddTicketMessage()
  const setStatus = useUpdateTicketStatus()

  const [reply, setReply] = React.useState("")

  // The draft is deliberately NOT reset in an effect. This component is
  // keyed by ticket id at the call site, so switching tickets remounts it
  // and React starts with an empty draft on its own — which also means
  // one member's words can never be carried onto another's ticket.

  async function send() {
    if (!ticket) return
    const body = reply.trim()
    if (!body) return
    try {
      await addMessage.mutateAsync({ id: ticket.id, body })
      setReply("")
      toast.success("Reply sent")
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Could not send the reply",
      )
    }
  }

  if (!ticket) return null

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85svh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle className="truncate text-lg font-semibold tracking-tight">
                {ticket.subject}
              </DialogTitle>
              <DialogDescription className="mt-0.5">
                Opened {when(ticket.createdAt)}
              </DialogDescription>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge variant={PRIORITY_TONE[ticket.priority] ?? "secondary"}>
                {ticket.priority}
              </Badge>
              {canManage ? (
                <select
                  aria-label={`Status for ${ticket.subject}`}
                  value={ticket.status}
                  onChange={(e) =>
                    void setStatus
                      .mutateAsync({ id: ticket.id, status: e.target.value })
                      .then(() => toast.success("Ticket updated"))
                      .catch((error) =>
                        toast.error(
                          error instanceof ApiError
                            ? error.message
                            : "Could not update the ticket",
                        ),
                      )
                  }
                  className="h-9 rounded-xl border border-input bg-card px-2.5 text-xs font-semibold text-foreground"
                >
                  {TICKET_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              ) : (
                <Badge
                  variant={
                    ticket.status === "RESOLVED" || ticket.status === "CLOSED"
                      ? "success"
                      : "secondary"
                  }
                >
                  {ticket.status}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {/* The original ask, so the thread is not read out of context. */}
          <article className="rounded-2xl border border-border bg-surface-sunken px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              What was asked
            </p>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {ticket.description || "No description was given."}
            </p>
          </article>

          <div className="mt-4">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              <MessageSquare className="size-3.5" aria-hidden="true" />
              Replies
            </p>

            <DataState
              isLoading={messages.isPending}
              isError={messages.isError}
              onRetry={() => void messages.refetch()}
              errorMessage="Could not load the replies on this ticket."
              isEmpty={(messages.data ?? []).length === 0}
              emptyIcon={Headphones}
              emptyTitle="No replies yet"
              emptyDescription="Nobody has answered this ticket."
            >
              <ol className="flex flex-col gap-2">
                {(messages.data ?? []).map((message) => (
                  <li
                    key={message.id}
                    className="rounded-2xl border border-border px-4 py-3"
                  >
                    <p className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold">
                        {authorName(message)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {when(message.createdAt)}
                      </span>
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                      {message.body}
                    </p>
                  </li>
                ))}
              </ol>
            </DataState>
          </div>
        </div>

        {canManage ? (
          <div className="flex flex-col gap-2 border-t border-border px-6 py-4">
            <label htmlFor="ticket-reply" className="sr-only">
              Reply
            </label>
            <Textarea
              id="ticket-reply"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Write a reply…"
              className="min-h-20"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                disabled={!reply.trim() || addMessage.isPending}
                onClick={() => void send()}
              >
                {addMessage.isPending ? "Sending…" : "Send reply"}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

"use client"

import * as React from "react"
import { Loader2, RotateCcw, Send } from "lucide-react"
import { ApiError } from "@/lib/api/client"
import { useSendWhatsAppMessage } from "@/lib/hooks/use-whatsapp"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

/**
 * Reply box: Enter sends, Shift+Enter adds a line. Whitespace never sends.
 * A failed send stays visible with its error and a retry button instead
 * of vanishing into a toast.
 */
export function MessageComposer({ to, disabled }: { to: string; disabled: boolean }) {
  const send = useSendWhatsAppMessage()
  const [draft, setDraft] = React.useState("")
  const [failed, setFailed] = React.useState<{ text: string; error: string } | null>(null)

  async function submit(text: string) {
    const body = text.trim()
    if (!body || send.isPending) return
    setFailed(null)
    try {
      await send.mutateAsync({ to, text: body })
      setDraft("")
    } catch (err) {
      setFailed({ text: body, error: err instanceof ApiError ? err.message : "Send failed" })
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {failed && (
        <div role="alert" className="flex flex-wrap items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm dark:border-rose-400/20 dark:bg-rose-500/10">
          <span className="min-w-0 flex-1 truncate font-medium text-rose-700 dark:text-rose-300">
            {failed.error} — “{failed.text}”
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="min-h-11 rounded-lg"
            onClick={() => void submit(failed.text)}
            disabled={disabled || send.isPending}
          >
            <RotateCcw className="mr-1 size-4" aria-hidden="true" /> Retry
          </Button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <Textarea
          aria-label="Message"
          placeholder={disabled ? "You need permission to send" : "Type a message…"}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              void submit(draft)
            }
          }}
          disabled={disabled || send.isPending}
          rows={1}
          className="min-h-11 resize-none rounded-xl"
        />
        <Button
          type="button"
          aria-label="Send"
          onClick={() => void submit(draft)}
          disabled={disabled || send.isPending || draft.trim().length === 0}
          className="min-h-11 shrink-0 rounded-xl"
        >
          {send.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
        </Button>
      </div>
    </div>
  )
}

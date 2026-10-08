"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import type { Conversation, ThreadMsg } from "@/lib/hooks/use-conversations"
import { MessageComposer } from "@/components/inbox/message-composer"

function ticks(status?: string): string | null {
  if (status === "READ") return "✓✓"
  if (status === "DELIVERED") return "✓✓"
  if (status === "SENT") return "✓"
  return null
}

function Bubble({ message }: { message: ThreadMsg }) {
  if (message.fromMe && message.text === null) {
    return (
      <span className="inline-block rounded-lg bg-stone-200 px-2 py-1 font-mono text-xs font-bold text-stone-600 dark:bg-stone-700 dark:text-stone-300">
        {message.templateKey ?? "message"}
      </span>
    )
  }
  return <span className="whitespace-pre-line break-words">{message.text ?? ""}</span>
}

/**
 * One thread: inbound left/stone, outbound right/emerald with delivery
 * ticks. `role=log` announces new arrivals to screen readers.
 */
export function ChatThread({
  conversation,
  canSend,
}: {
  conversation: Conversation
  canSend: boolean
}) {
  const bottomRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    // jsdom (tests) has no scrollIntoView; real browsers do.
    bottomRef.current?.scrollIntoView?.({ block: "nearest" })
  }, [conversation.messages.length])
  return (
    <div className="flex h-full flex-col">
      <div role="log" aria-live="polite" aria-label={`Conversation with ${conversation.phone}`} className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
        {conversation.messages.length === 0 ? (
          <p className="self-center text-sm text-stone-500">No messages yet. Say hello below.</p>
        ) : (
          conversation.messages.map((m) => (
            <div key={m.id} className={cn("flex", m.fromMe ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                  m.fromMe
                    ? "rounded-br-md bg-emerald-600 text-white"
                    : "rounded-bl-md bg-stone-200 text-stone-900 dark:bg-stone-700 dark:text-stone-100",
                )}
              >
                <Bubble message={m} />
                <div className={cn("mt-1 flex items-center gap-1 text-[11px]", m.fromMe ? "justify-end text-emerald-100" : "justify-start text-stone-500")}>
                  <time dateTime={m.createdAt}>{new Date(m.createdAt).toLocaleTimeString()}</time>
                  {m.fromMe && ticks(m.status) && <span aria-label={m.status}>{ticks(m.status)}</span>}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-stone-200 p-3 dark:border-stone-800">
        <MessageComposer to={conversation.phone} disabled={!canSend} />
      </div>
    </div>
  )
}

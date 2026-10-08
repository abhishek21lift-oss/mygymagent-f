import * as React from "react"
import { MessageCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Conversation } from "@/lib/hooks/use-conversations"

function initials(phone: string): string {
  const digits = phone.replace(/\D/g, "").slice(-10)
  return digits.slice(0, 2)
}

function timeLabel(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString()
}

/**
 * The left pane: one row per person, newest first. `listbox` + arrow keys
 * so keyboard users can move through threads without a pointer.
 */
export function ConversationList({
  conversations,
  selectedKey,
  onSelect,
}: {
  conversations: Conversation[]
  selectedKey: string | null
  onSelect: (key: string) => void
}) {
  const refs = React.useRef(new Map<string, HTMLLIElement>())
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 p-8 text-center">
        <MessageCircle className="size-8 text-stone-400" aria-hidden="true" />
        <p className="text-sm font-semibold text-stone-600 dark:text-stone-400">No conversations yet</p>
        <p className="text-xs text-stone-500">Replies from members will appear here.</p>
      </div>
    )
  }
  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return
    event.preventDefault()
    const idx = conversations.findIndex((c) => c.key === selectedKey)
    const next = event.key === "ArrowDown" ? Math.min(idx + 1, conversations.length - 1) : Math.max(idx - 1, 0)
    const target = conversations[next]
    if (target) {
      onSelect(target.key)
      refs.current.get(target.key)?.focus()
    }
  }
  return (
    <ul role="listbox" aria-label="Conversations" onKeyDown={onKeyDown} className="flex flex-col gap-1 p-2">
      {conversations.map((c) => {
        const last = c.messages[c.messages.length - 1]
        const selected = c.key === selectedKey
        return (
          <li
            key={c.key}
            ref={(el) => {
              if (el) refs.current.set(c.key, el)
              else refs.current.delete(c.key)
            }}
            role="option"
            aria-selected={selected}
            tabIndex={0}
            onClick={() => onSelect(c.key)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onSelect(c.key)
              }
            }}
            className={cn(
              "flex min-h-11 cursor-pointer items-center gap-3 rounded-xl p-3 outline-none transition",
              selected ? "bg-stone-200 dark:bg-stone-800" : "hover:bg-stone-100 dark:hover:bg-stone-800/60",
            )}
          >
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white"
            >
              {initials(c.phone)}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-bold text-stone-900 dark:text-stone-100">{c.phone}</span>
                <time dateTime={c.lastAt} className="shrink-0 text-xs text-stone-500 tabular-nums">
                  {timeLabel(c.lastAt)}
                </time>
              </span>
              <span className="flex items-center gap-2">
                <span className="truncate text-xs text-stone-600 dark:text-stone-400">
                  {last?.text ?? last?.templateKey ?? ""}
                </span>
                {c.unmatched && (
                  <Badge variant="secondary" className="shrink-0 rounded-full">
                    New
                  </Badge>
                )}
              </span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}

"use client"

import * as React from "react"
import { Suspense } from "react"
import { ArrowLeft, MessageCircle } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { ChatThread } from "@/components/inbox/chat-thread"
import { ConversationList } from "@/components/inbox/conversation-list"
import { DataState } from "@/components/shared/data-state"
import { ErrorState } from "@/components/shared/error-state"
import { PageHero } from "@/components/shared/page-hero"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth/auth-context"
import { normalizePhone, useConversations } from "@/lib/hooks/use-conversations"
import { cn } from "@/lib/utils"

/**
 * WhatsApp-style inbox: conversation list + thread + reply box.
 * `?to=<digits>` deep-links a thread (member-360, notifications); an
 * unknown number opens an empty thread with a ready composer.
 */
function InboxView() {
  const { hasPermission } = useAuth()
  const params = useSearchParams()
  const { conversations, isLoading } = useConversations()
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null)
  const [unmatchedOnly, setUnmatchedOnly] = React.useState(false)

  const canRead = hasPermission("whatsapp.read")
  const canSend = hasPermission("whatsapp.manage")

  const paramKey = normalizePhone(params.get("to"))
  const visible = unmatchedOnly ? conversations.filter((c) => c.unmatched) : conversations
  const activeKey = selectedKey ?? (paramKey || null)
  const selected =
    visible.find((c) => c.key === activeKey) ??
    (paramKey ? { key: paramKey, phone: params.get("to") ?? paramKey, unmatched: false, lastAt: "", messages: [] } : (visible[0] ?? null))

  if (!canRead) {
    return (
      <div className="flex flex-col gap-5 pb-4">
        <h1 className="text-3xl font-semibold text-stone-950">Inbox</h1>
        <ErrorState message="You need whatsapp.read permission to view the inbox." />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 pb-4">
      <PageHero id="inbox-title" icon={MessageCircle} title="Inbox" />
      <div className="grid min-h-[60vh] grid-cols-1 overflow-hidden rounded-2xl border border-stone-200 bg-white sm:grid-cols-[320px_1fr] dark:border-stone-800 dark:bg-stone-900">
        <div className={cn("flex flex-col border-stone-200 dark:border-stone-800", activeKey ? "hidden sm:flex" : "flex")}>
          <div className="flex items-center justify-between gap-2 border-b border-stone-200 p-3 dark:border-stone-800">
            <span className="text-xs font-black uppercase tracking-widest text-stone-500">Chats</span>
            <Button
              type="button"
              size="sm"
              variant={unmatchedOnly ? "default" : "outline"}
              onClick={() => setUnmatchedOnly((v) => !v)}
              className="min-h-11 rounded-lg"
            >
              Unmatched only
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <DataState
              isLoading={isLoading}
              isEmpty={visible.length === 0}
              emptyIcon={MessageCircle}
              emptyTitle={unmatchedOnly ? "Nothing unmatched" : "No chats yet"}
              emptyDescription={unmatchedOnly ? "Every message was matched to a member." : "Replies from members will appear here."}
              skeletonRows={5}
            >
              <ConversationList conversations={visible} selectedKey={selected?.key ?? null} onSelect={setSelectedKey} />
            </DataState>
          </div>
        </div>
        <div className={cn("min-h-[60vh] flex-col", activeKey ? "flex" : "hidden sm:flex")}>
          {selectedKey !== null && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="m-2 self-start sm:hidden"
              onClick={() => setSelectedKey(null)}
            >
              <ArrowLeft className="mr-1 size-4" aria-hidden="true" /> Back
            </Button>
          )}
          {selected ? (
            <ChatThread conversation={selected} canSend={canSend} />
          ) : (
            <p className="self-center p-8 text-sm text-stone-500">Select a chat to start messaging.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function InboxPage() {
  return (
    <Suspense>
      <InboxView />
    </Suspense>
  )
}

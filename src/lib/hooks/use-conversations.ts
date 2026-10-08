import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import type { InboundWhatsAppMessage } from "@/lib/hooks/use-whatsapp"
import type { WhatsAppMessage } from "@/lib/types/whatsapp"

/** Polling cadence for the inbox: 10s while visible, never in background. */
export const conversationPolling = {
  refetchInterval: 10_000,
  refetchIntervalInBackground: false as const,
} as const

export interface ThreadMsg {
  id: string
  fromMe: boolean
  /** Null for old outbound rows written before bodies were stored. */
  text: string | null
  templateKey?: string
  status?: string
  createdAt: string
}

export interface Conversation {
  /** Last-10 digits: the person, across trunk-0/+91/local spellings. */
  key: string
  /** Fullest form seen, for display and for `?to=` deep-links. */
  phone: string
  unmatched: boolean
  lastAt: string
  messages: ThreadMsg[]
}

/**
 * Digits-only person id: strips formatting, one trunk `0`, then keeps the
 * last 10 digits so +91/international prefixes join the same thread.
 */
export function normalizePhone(raw: string | null | undefined): string {
  let digits = (raw ?? "").replace(/\D/g, "")
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1)
  if (digits.length > 10) digits = digits.slice(-10)
  return digits
}

function fuller(a: string, b: string): string {
  return b.length > a.length ? b : a
}

export function useConversations() {
  const inbound = useQuery({
    queryKey: ["whatsapp", "inbound", { limit: 200 }],
    queryFn: () => api.get<InboundWhatsAppMessage[]>("/whatsapp/inbound", { query: { limit: 200 } }),
    ...conversationPolling,
  })
  const outbound = useQuery({
    queryKey: ["whatsapp", "messages", 200],
    queryFn: () => api.get<WhatsAppMessage[]>("/whatsapp/messages", { query: { limit: 200 } }),
    ...conversationPolling,
  })
  const conversations = buildConversations(inbound.data ?? [], outbound.data ?? [])
  return { conversations, isLoading: inbound.isPending || outbound.isPending }
}

export function buildConversations(
  inbound: InboundWhatsAppMessage[],
  outbound: WhatsAppMessage[],
): Conversation[] {
  const threads = new Map<string, Conversation>()
  const thread = (raw: string): Conversation => {
    const key = normalizePhone(raw)
    let t = threads.get(key)
    if (!t) {
      t = { key, phone: raw.replace(/\D/g, ""), unmatched: false, lastAt: "", messages: [] }
      threads.set(key, t)
    }
    t.phone = fuller(t.phone, raw.replace(/\D/g, ""))
    return t
  }
  for (const m of inbound) {
    const t = thread(m.fromPhone)
    t.messages.push({ id: m.id, fromMe: false, text: m.body, createdAt: m.createdAt })
    if (m.matchedMemberId === null) t.unmatched = true
  }
  for (const m of outbound) {
    const t = thread(m.recipient)
    t.messages.push({
      id: m.id,
      fromMe: true,
      text: m.body,
      templateKey: m.templateKey,
      status: m.status,
      createdAt: m.createdAt,
    })
  }
  const list = [...threads.values()]
  for (const t of list) {
    t.messages.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    t.lastAt = t.messages[t.messages.length - 1]?.createdAt ?? ""
  }
  list.sort((a, b) => b.lastAt.localeCompare(a.lastAt))
  return list
}

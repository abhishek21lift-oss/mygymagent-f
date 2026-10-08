import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import type { WhatsAppIntegration, WhatsAppWebSession } from "@/lib/types/whatsapp"

const KEY = "whatsapp"

export function useWhatsAppIntegration() {
  return useQuery({ queryKey: [KEY, "integration"], queryFn: () => api.get<WhatsAppIntegration | null>("/whatsapp/integration") })
}

export function useCompleteWhatsAppSignup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { code: string; wabaId: string; phoneNumberId?: string }) =>
      api.post<WhatsAppIntegration>("/whatsapp/integration/embedded-signup", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  })
}

/** A free-text WhatsApp message to one number, sent now: a reply to a
 * member who wrote in. */
export function useSendWhatsAppMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { to: string; text: string; mediaKey?: string; replyToMessageId?: string }) =>
      api.post<{ id: string; status: string }>("/whatsapp/messages", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, "logs"] })
      queryClient.invalidateQueries({ queryKey: [KEY, "messages"] })
    },
  })
}

export type ScheduledMessageStatus = "PENDING" | "SENT" | "CANCELLED" | "FAILED"

export interface ScheduledWhatsAppMessage {
  id: string
  recipient: string
  body: string
  memberId: string | null
  sendAt: string
  status: ScheduledMessageStatus
  errorMessage: string | null
  createdAt: string
}

export function useScheduledWhatsApp(limit = 50) {
  return useQuery({
    queryKey: [KEY, "scheduled", limit],
    queryFn: () => api.get<ScheduledWhatsAppMessage[]>("/whatsapp/scheduled", { query: { limit } }),
  })
}

export function useScheduleWhatsApp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { to: string; text: string; sendAt: string; memberId?: string }) =>
      api.post<ScheduledWhatsAppMessage>("/whatsapp/scheduled", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, "scheduled"] }),
  })
}

/** Only a message still waiting to go can be cancelled. */
export function useCancelScheduledWhatsApp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete<ScheduledWhatsAppMessage>(`/whatsapp/scheduled/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, "scheduled"] }),
  })
}

// --- WS-2: test-send / templates / logs / disconnect (new backend surface) ---

export interface WhatsAppTemplate {
  key: string
  channel: string
  subject?: string | null
  body: string
}

export interface WhatsAppLogEntry {
  id: string
  channel: string
  category: string
  templateKey: string
  recipient: string
  status: string
  errorMessage?: string | null
  sentAt: string | null
  createdAt: string
}

export interface WhatsAppTestSendResult {
  messageLogId: string
  status: string
}

export function useWhatsappTemplates() {
  return useQuery({ queryKey: [KEY, "templates"], queryFn: () => api.get<WhatsAppTemplate[]>("/whatsapp/templates") })
}

export function useWhatsappLogs(limit = 20) {
  return useQuery({
    queryKey: [KEY, "logs", limit],
    queryFn: () => api.get<WhatsAppLogEntry[]>("/whatsapp/logs", { query: { limit } }),
  })
}

export function useTestSend() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { to: string }) => api.post<WhatsAppTestSendResult>("/whatsapp/test-send", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, "logs"] })
      queryClient.invalidateQueries({ queryKey: [KEY, "messages"] })
    },
  })
}

export function useDisconnectWhatsapp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<{ status: "DISCONNECTED" }>("/whatsapp/disconnect", {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  })
}

/** A message a member (or anyone) sent the gym, as GET /whatsapp/inbound
 * returns it: the sender's number is `from`. */
export interface InboundWhatsAppMessage {
  id: string
  organizationId: string
  from: string
  body: string | null
  /** The name the sender set in WhatsApp, when it reported one. */
  pushName?: string | null
  matchedMemberId: string | null
  createdAt: string
}

/**
 * Messages members have sent in.
 *
 * The integration screen could send and could list templates, and had no
 * way to show a single reply -- so a member answering a reminder reached
 * nobody. `matched: false` is the queue that matters: a number the system
 * could not tie to a member is a person nobody will follow up.
 */
export function useInboundWhatsApp(params: { matched?: boolean; limit?: number } = {}) {
  return useQuery({
    queryKey: [KEY, "inbound", params],
    queryFn: () =>
      api.get<InboundWhatsAppMessage[]>("/whatsapp/inbound", {
        query: {
          ...(params.matched === undefined ? {} : { matched: String(params.matched) }),
          ...(params.limit ? { limit: params.limit } : {}),
        },
      }),
  })
}

// --- WhatsApp Web: the gym's own number, linked as a device -------------

const WEB_KEY = [KEY, "web"] as const

export function useWhatsAppWeb() {
  return useQuery({
    queryKey: WEB_KEY,
    queryFn: () => api.get<WhatsAppWebSession>("/whatsapp-web"),
    // While a code is on screen, follow it: QR codes rotate every ~20 s,
    // and the page should flip to "linked" the moment the phone scans.
    refetchInterval: (query) => (query.state.data?.status === "PAIRING" ? 2_000 : false),
  })
}

export function useConnectWhatsAppWeb() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { phoneNumber?: string }) =>
      api.post<WhatsAppWebSession>("/whatsapp-web/connect", { acceptRisk: true, ...input }),
    onSuccess: (data) => queryClient.setQueryData(WEB_KEY, data),
  })
}

export function useDisconnectWhatsAppWeb() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<WhatsAppWebSession>("/whatsapp-web/disconnect", {}),
    onSuccess: (data) => queryClient.setQueryData(WEB_KEY, data),
  })
}

export function useUpdateWhatsAppWebSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { useForSending?: boolean; autoReply?: boolean; dailyLimit?: number }) =>
      api.patch<WhatsAppWebSession>("/whatsapp-web/settings", input),
    onSuccess: (data) => queryClient.setQueryData(WEB_KEY, data),
  })
}

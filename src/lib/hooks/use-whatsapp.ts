import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import type { WhatsAppIntegration, WhatsAppMessage } from "@/lib/types/whatsapp"

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

export function useDisconnectWhatsApp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<{ disconnected: boolean }>("/whatsapp/integration/disconnect", {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useWhatsAppMessages(limit = 100) {
  return useQuery({ queryKey: [KEY, "messages", limit], queryFn: () => api.get<WhatsAppMessage[]>("/whatsapp/messages", { query: { limit } }) })
}

export function useSendWhatsAppMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { to: string; text: string }) => api.post<{ id: string; status: string }>("/whatsapp/messages", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, "messages"] }),
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

export interface InboundWhatsAppMessage {
  id: string
  organizationId: string
  fromPhone: string
  body: string | null
  matchedMemberId: string | null
  providerMessageId: string | null
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

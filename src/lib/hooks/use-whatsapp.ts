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
    mutationFn: (input: { to: string; text: string }) => api.post<{ providerMessageId: string | null; status: string }>("/whatsapp/messages", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, "messages"] }),
  })
}

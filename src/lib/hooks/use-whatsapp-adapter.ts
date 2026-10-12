import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import { AutoReplyRule } from "@/lib/hooks/use-auto-replies";

const KEY = ["whatsapp", "adapter"]

export interface WhatsAppAdapterStatus {
  id: string
  organizationId: string
  status: "CONNECTED" | "PAIRING" | "DISCONNECTED" | "LOGGED_OUT" | "NOT_CONNECTED"
  phoneNumber: string | null
  displayPhoneNumber: string | null
  qrDataUrl: string | null
  pairingCode: string | null
  connectedAt: string | null
  createdAt: string
  updatedAt: string
  lastError: string | null;
}

export interface CreateAutoReplyDto {
  keyword: string
  matchType: "EXACT" | "CONTAINS" | "REGEX"
  scope: "ALL" | "PRIVATE" | "GROUP"
  answer: string
  enabled?: boolean
  priority?: number
}

export interface UpdateAutoReplyDto {
  keyword?: string
  matchType?: "EXACT" | "CONTAINS" | "REGEX"
  scope?: "ALL" | "PRIVATE" | "GROUP"
  answer?: string
  enabled?: boolean
  priority?: number
}

export function useWhatsAppAdapterStatus() {
  return useQuery({
    queryKey: [...KEY, "status"],
    queryFn: () => api.get<WhatsAppAdapterStatus>("/whatsapp-adapter/status"),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === "PAIRING" ? 5000 : false
    },
  })
}

export function useWhatsAppAdapterAutoReplies() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get<AutoReplyRule[]>(`/whatsapp-adapter/auto-replies`),
  })
}

export interface WhatsAppAdapterContact {
  jid: string
  name: string | null
  notify: string | null
  updatedAt: string
}

export interface WhatsAppAdapterGroup {
  jid: string
  subject: string
  participantCount: number
}

export interface WhatsAppAdapterGroups {
  available: boolean
  groups: WhatsAppAdapterGroup[]
}

export function useWhatsAppAdapterContacts(search: string) {
  const trimmed = search.trim()
  return useQuery({
    queryKey: [...KEY, "contacts", trimmed],
    queryFn: () =>
      api.get<WhatsAppAdapterContact[]>(`/whatsapp-adapter/contacts`, {
        query: { limit: 50, ...(trimmed ? { search: trimmed } : {}) },
      }),
  })
}

export function useWhatsAppAdapterGroups() {
  return useQuery({
    queryKey: [...KEY, "groups"],
    queryFn: () => api.get<WhatsAppAdapterGroups>(`/whatsapp-adapter/groups`),
  })
}

export interface WhatsAppBotConfig {
  id: string
  organizationId: string
  prefix: string
  enablePing: boolean
  enableUptime: boolean
  welcomeMessage: string | null
  createdAt: string
  updatedAt: string
}

export interface UpdateBotConfigInput {
  prefix?: string
  enablePing?: boolean
  enableUptime?: boolean
  welcomeMessage?: string | null
}

export function useWhatsAppBotConfig() {
  return useQuery({
    queryKey: [...KEY, "bot-config"],
    queryFn: () => api.get<WhatsAppBotConfig | null>(`/whatsapp-adapter/bot/config`),
  })
}

export function useWhatsAppUpdateBotConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateBotConfigInput) =>
      api.patch<WhatsAppBotConfig>(`/whatsapp-adapter/bot/config`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

export interface WhatsAppAutomationActivity {
  id: string
  templateKey: string
  recipient: string
  status: string
  createdAt: string
}

export function useWhatsAppAutomationActivity() {
  return useQuery({
    queryKey: [...KEY, "automation-activity"],
    queryFn: () =>
      api.get<WhatsAppAutomationActivity[]>(`/whatsapp-adapter/automation/activity`),
  })
}

export function useWhatsAppAdapterCreateAutoReply() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateAutoReplyDto) =>
      api.post<AutoReplyRule>(`/whatsapp-adapter/auto-replies`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

export function useWhatsAppAdapterUpdateAutoReply() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAutoReplyDto }) =>
      api.patch<AutoReplyRule>(`/whatsapp-adapter/auto-replies/${id}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

export function useWhatsAppAdapterDeleteAutoReply() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/whatsapp-adapter/auto-replies/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

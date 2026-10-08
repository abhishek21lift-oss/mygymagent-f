import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api/client"

const KEY = ["whatsapp", "webhooks"]
const LOG_KEY = ["whatsapp", "webhooks", "deliveries"]

export interface WebhookSubscription {
  id: string
  url: string
  events: string[]
  enabled: boolean
  createdAt: string
  updatedAt: string
}

/** Returned once, at create/regenerate — never stored, never re-fetched. */
export interface WebhookSecret {
  secret: string
}

export interface WebhookDelivery {
  id: string
  subscriptionId: string
  event: string
  status: "PENDING" | "SENT" | "FAILED"
  attempts: number
  httpStatus: number | null
  error: string | null
  createdAt: string
}

export interface WebhookTestResult {
  ok: boolean
  httpStatus?: number
  error?: string
}

export function useWebhooks() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get<WebhookSubscription[]>("/whatsapp/webhooks"),
  })
}

export function useWebhookDeliveries() {
  return useQuery({
    queryKey: LOG_KEY,
    queryFn: () => api.get<WebhookDelivery[]>("/whatsapp/webhooks/deliveries"),
  })
}

export function useCreateWebhook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { url: string; events: string[]; enabled?: boolean }) =>
      api.post<WebhookSubscription & WebhookSecret>("/whatsapp/webhooks", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateWebhook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<WebhookSubscription> }) =>
      api.patch(`/whatsapp/webhooks/${id}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/whatsapp/webhooks/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

export function useTestWebhook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post<WebhookTestResult>(`/whatsapp/webhooks/${id}/test`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY })
      queryClient.invalidateQueries({ queryKey: LOG_KEY })
    },
  })
}

export function useRegenerateWebhook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post<WebhookSecret>(`/whatsapp/webhooks/${id}/regenerate`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

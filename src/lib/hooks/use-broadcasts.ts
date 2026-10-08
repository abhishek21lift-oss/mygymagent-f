import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api/client"

const KEY = "broadcasts"

export type BroadcastStatus = "PENDING" | "SENDING" | "DONE" | "CANCELLED"

export interface Broadcast {
  id: string
  segmentId: string
  body: string
  mediaFileId: string | null
  sendAt: string | null
  status: BroadcastStatus
  total: number
  queued: number
  sent: number
  failed: number
  skipped: number
  createdAt: string
}

const polling = { refetchInterval: 10_000, refetchIntervalInBackground: false } as const

export function useBroadcasts() {
  return useQuery({ queryKey: [KEY], queryFn: () => api.get<Broadcast[]>("/whatsapp/broadcasts") })
}

export function useBroadcast(id: string | null) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => api.get<Broadcast>(`/whatsapp/broadcasts/${id}`),
    enabled: Boolean(id),
    ...polling,
  })
}

export function useCreateBroadcast() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { segmentId: string; text: string; mediaKey?: string; sendAt?: string }) =>
      api.post<Broadcast>("/whatsapp/broadcasts", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useCancelBroadcast() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete<Broadcast>(`/whatsapp/broadcasts/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  })
}

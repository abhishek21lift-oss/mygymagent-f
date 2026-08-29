import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import type { Paginated, PaginationParams } from "@/lib/types/pagination"

export type PtSessionStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW"
export type PtSessionType = "PERSONAL_TRAINING" | "PARTNER_TRAINING" | "SMALL_GROUP"

export type PtSession = {
  id: string
  organizationId: string
  memberId: string
  trainerId: string | null
  branchId: string
  startTime: string
  endTime: string
  type: PtSessionType
  status: PtSessionStatus
  price: string | null
  isPaid: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
  member?: { id: string; firstName: string; lastName: string; memberCode: string }
  trainer?: { id: string; firstName: string; lastName: string; user?: { firstName: string; lastName: string } }
  branch?: { id: string; name: string }
}

export type BookPtSessionInput = {
  memberId: string
  trainerId?: string
  branchId: string
  startTime: string
  endTime: string
  type?: PtSessionType
  price?: number
  notes?: string
}

const KEY = "pt-sessions"

export function usePtSessions(params: PaginationParams & { memberId?: string; trainerId?: string; branchId?: string; startFrom?: string; endTo?: string } = {}) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<Paginated<PtSession>>("/pt-sessions", { query: params }),
  })
}

export function usePtSession(id: string | null) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => api.get<PtSession>(`/pt-sessions/${id}`),
    enabled: Boolean(id),
  })
}

export function useBookPtSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: BookPtSessionInput) => api.post<PtSession>("/pt-sessions", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function usePtSessionAction(action: "complete" | "cancel" | "no-show") {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.patch<PtSession>(`/pt-sessions/${id}/${action}${action === "cancel" && reason ? `?reason=${encodeURIComponent(reason)}` : ""}`, {}),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      queryClient.invalidateQueries({ queryKey: [KEY, variables.id] })
    },
  })
}

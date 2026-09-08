import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import type { Lead, LeadFollowUp, LeadScore, LeadStatus, Member } from "@/lib/types/gym"
import type { Paginated, PaginationParams } from "@/lib/types/pagination"
import type { CreateFollowUpInput, CreateLeadInput } from "@/lib/validation/gym"

const KEY = "leads"

export interface LeadFollowUpRow extends LeadFollowUp {
  isOverdue: boolean
  lead: {
    id: string
    firstName: string
    lastName: string
    phone: string | null
    email: string | null
    source: string | null
    status: LeadStatus
    assignedToUser?: { id: string; firstName: string; lastName: string } | null
  }
  createdByUser?: { id: string; firstName: string; lastName: string } | null
}

export function useLeads(params: PaginationParams & { status?: LeadStatus } = {}) {
  return useQuery({ queryKey: [KEY, params], queryFn: () => api.get<Paginated<Lead>>("/leads", { query: params }) })
}

export function useLead(id: string | null) {
  return useQuery({ queryKey: [KEY, id], queryFn: () => api.get<Lead>(`/leads/${id}`), enabled: !!id })
}

export function useLeadScore(id: string | null) {
  return useQuery({ queryKey: [KEY, id, "score"], queryFn: () => api.get<LeadScore>(`/leads/${id}/score`), enabled: !!id })
}

export function useLeadFollowUps(params: PaginationParams & { status?: "OPEN" | "COMPLETED" | "ALL"; from?: string; to?: string } = {}) {
  return useQuery({ queryKey: ["lead-follow-ups", params], queryFn: () => api.get<Paginated<LeadFollowUpRow>>("/lead-follow-ups", { query: params }) })
}

export function useCreateLead() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: (input: CreateLeadInput) => api.post<Lead>("/leads", input), onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }) })
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: LeadStatus; reason?: string }) =>
      api.patch<Lead>(`/leads/${id}/status`, { status, ...(reason ? { reason } : {}) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useSendLeadMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, channel, subject, customBody }: { id: string; channel: "EMAIL" | "WHATSAPP"; subject?: string; customBody: string }) =>
      api.post<Lead>(`/leads/${id}/message`, { channel, customBody, ...(subject ? { subject } : {}) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useConvertLead() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: ({ id, branchId }: { id: string; branchId?: string }) => api.post<{ lead: Lead; member: Member }>(`/leads/${id}/convert`, { branchId }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: [KEY] }); queryClient.invalidateQueries({ queryKey: ["members"] }) } })
}

export function useAddFollowUp() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: ({ leadId, input }: { leadId: string; input: CreateFollowUpInput }) => api.post<LeadFollowUp>(`/leads/${leadId}/follow-ups`, input), onSuccess: (_, { leadId }) => { queryClient.invalidateQueries({ queryKey: [KEY, leadId] }); queryClient.invalidateQueries({ queryKey: ["lead-follow-ups"] }) } })
}

export function useCompleteFollowUp() {
  const queryClient = useQueryClient()
  return useMutation({ mutationFn: ({ leadId, followUpId }: { leadId: string; followUpId: string }) => api.patch<LeadFollowUp>(`/leads/${leadId}/follow-ups/${followUpId}/complete`), onSuccess: (_, { leadId }) => { queryClient.invalidateQueries({ queryKey: [KEY, leadId] }); queryClient.invalidateQueries({ queryKey: ["lead-follow-ups"] }) } })
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Lead, LeadFollowUp, LeadStatus, Member } from "@/lib/types/gym";
import type { Paginated, PaginationParams } from "@/lib/types/pagination";
import type { CreateFollowUpInput, CreateLeadInput } from "@/lib/validation/gym";

const KEY = "leads";

export function useLeads(params: PaginationParams & { status?: LeadStatus } = {}) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<Paginated<Lead>>("/leads", { query: params }),
  });
}

export function useLead(id: string | null) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => api.get<Lead>(`/leads/${id}`),
    enabled: !!id,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLeadInput) => api.post<Lead>("/leads", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) =>
      api.patch<Lead>(`/leads/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useConvertLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, branchId }: { id: string; branchId?: string }) =>
      api.post<{ lead: Lead; member: Member }>(`/leads/${id}/convert`, { branchId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useAddFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, input }: { leadId: string; input: CreateFollowUpInput }) =>
      api.post<LeadFollowUp>(`/leads/${leadId}/follow-ups`, input),
    onSuccess: (_, { leadId }) => queryClient.invalidateQueries({ queryKey: [KEY, leadId] }),
  });
}

export function useCompleteFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, followUpId }: { leadId: string; followUpId: string }) =>
      api.patch<LeadFollowUp>(`/leads/${leadId}/follow-ups/${followUpId}/complete`),
    onSuccess: (_, { leadId }) => queryClient.invalidateQueries({ queryKey: [KEY, leadId] }),
  });
}

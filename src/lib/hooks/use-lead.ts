import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import type { Lead, Member } from "@/lib/types/gym"

export function useLead(id: string | undefined) {
  return useQuery({
    queryKey: ["lead", id],
    queryFn: () => api.get<Lead>(`/leads/${id}`),
    enabled: !!id,
  })
}

export function useUpdateLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Pick<Lead, "firstName" | "lastName" | "email" | "phone" | "source" | "branchId" | "notes" | "assignedToUserId">> }) =>
      api.patch<Lead>(`/leads/${id}`, input),
    onSuccess: (lead) => {
      queryClient.setQueryData(["lead", lead.id], lead)
      queryClient.invalidateQueries({ queryKey: ["leads"] })
    },
  })
}

export function useConvertLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: { branchId?: string; assignedTrainerId?: string } }) =>
      api.post<{ lead: Lead; member: Member }>(`/leads/${id}/convert`, dto),
    onSuccess: (result, variables) => {
      queryClient.setQueryData(["lead", variables.id], result.lead)
      queryClient.invalidateQueries({ queryKey: ["leads"] })
      queryClient.invalidateQueries({ queryKey: ["members"] })
    },
  })
}

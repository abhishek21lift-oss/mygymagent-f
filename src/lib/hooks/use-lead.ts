import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import type { Lead } from "@/lib/types/gym"

export function useLead(id: string | undefined) {
  return useQuery({
    queryKey: ["lead", id],
    queryFn: () => api.get<Lead>(`/leads/${id}`),
    enabled: !!id,
  })
}

export function useConvertLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: { primaryBranchId: string; assignedTrainerId?: string } }) =>
      api.post<{ memberId: string }>(`/leads/${id}/convert`, dto),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lead", variables.id] })
      queryClient.invalidateQueries({ queryKey: ["leads"] })
    },
  })
}

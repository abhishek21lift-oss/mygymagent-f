import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import type { MemberScreening } from "@/lib/types/gym"

export function useMemberScreenings(memberId: string | undefined) {
  return useQuery({
    queryKey: ["member-screenings", memberId],
    queryFn: () => api.get<MemberScreening[]>(`/members/${memberId}/screenings`),
    enabled: !!memberId,
  })
}

export interface CreateScreeningInput {
  responses: Record<string, boolean>
  flaggedForMedicalClearance?: boolean
  notes?: string
}

export function useCreateMemberScreening(memberId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateScreeningInput) =>
      api.post<MemberScreening>(`/members/${memberId}/screenings`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["member-screenings", memberId] }),
  })
}

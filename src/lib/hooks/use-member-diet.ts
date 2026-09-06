import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import type { DietAssignment } from "@/lib/types/gym"

export function useMemberDietAssignments(memberId: string | undefined) {
  return useQuery({
    queryKey: ["member-diet-assignments", memberId],
    queryFn: () => api.get<DietAssignment[]>("/diet-assignments", { query: { memberId } }),
    enabled: !!memberId,
  })
}

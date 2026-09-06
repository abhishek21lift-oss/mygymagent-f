import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import type { Attendance } from "@/lib/types/gym"

export function useMemberAttendance(memberId: string | undefined) {
  return useQuery({
    queryKey: ["member-attendance", memberId],
    queryFn: () => api.get<Attendance[]>("/attendance", { query: { memberId } }),
    enabled: !!memberId,
  })
}

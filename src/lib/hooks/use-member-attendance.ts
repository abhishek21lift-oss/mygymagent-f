import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import type { Attendance } from "@/lib/types/gym"

type AttendanceListResponse = Attendance[] | { items: Attendance[] }

export function useMemberAttendance(memberId: string | undefined) {
  return useQuery({
    queryKey: ["member-attendance", memberId],
    queryFn: async () => {
      const response = await api.get<AttendanceListResponse>("/attendance", { query: { memberId } })
      return Array.isArray(response) ? response : response.items
    },
    enabled: !!memberId,
  })
}

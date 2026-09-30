import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import type { Attendance } from "@/lib/types/gym"

type AttendanceListResponse = Attendance[] | { items: Attendance[] }

// The API pages at 20 by default, which cut the profile's totals off at the
// newest 20 check-ins. 100 is the API's maximum page size.
export function useMemberAttendance(memberId: string | undefined) {
  return useQuery({
    queryKey: ["member-attendance", memberId],
    queryFn: async () => {
      const response = await api.get<AttendanceListResponse>("/attendance", { query: { memberId, pageSize: 100 } })
      return Array.isArray(response) ? response : response.items
    },
    enabled: !!memberId,
  })
}

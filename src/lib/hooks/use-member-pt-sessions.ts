import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import type { PtSession } from "@/lib/types/gym"
import type { Paginated } from "@/lib/types/pagination"

export function useMemberPtSessions(memberId: string | undefined) {
  return useQuery({
    queryKey: ["member-pt-sessions", memberId],
    queryFn: () => api.get<Paginated<PtSession>>("/pt-sessions", { query: { memberId } }),
    enabled: !!memberId,
    select: (data) => data.items,
  })
}

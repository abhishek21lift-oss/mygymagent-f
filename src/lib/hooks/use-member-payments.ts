import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import type { Payment } from "@/lib/types/gym"

export function useMemberPayments(memberId: string | undefined) {
  return useQuery({
    queryKey: ["member-payments", memberId],
    queryFn: () => api.get<Payment[]>("/payments", { query: { memberId } }),
    enabled: !!memberId,
  })
}

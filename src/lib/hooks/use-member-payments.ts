import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import type { Payment } from "@/lib/types/gym"

type PaymentListResponse = Payment[] | { items: Payment[] }

// The API pages at 20 by default, which cut the profile's totals off at the
// newest 20 payments. 100 is the API's maximum page size.
export function useMemberPayments(memberId: string | undefined) {
  return useQuery({
    queryKey: ["member-payments", memberId],
    queryFn: async () => {
      const response = await api.get<PaymentListResponse>("/payments", { query: { memberId, pageSize: 100 } })
      return Array.isArray(response) ? response : response.items
    },
    enabled: !!memberId,
  })
}

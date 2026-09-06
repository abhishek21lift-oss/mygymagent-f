import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import type { Payment } from "@/lib/types/gym"

type PaymentListResponse = Payment[] | { items: Payment[] }

export function useMemberPayments(memberId: string | undefined) {
  return useQuery({
    queryKey: ["member-payments", memberId],
    queryFn: async () => {
      const response = await api.get<PaymentListResponse>("/payments", { query: { memberId } })
      return Array.isArray(response) ? response : response.items
    },
    enabled: !!memberId,
  })
}

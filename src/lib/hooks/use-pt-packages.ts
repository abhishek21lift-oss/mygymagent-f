import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api/client"

export interface PtPackage {
  id: string
  organizationId: string
  branchId: string
  memberId: string
  templateId: string | null
  name: string
  totalSessions: number
  usedSessions: number
  remainingSessions: number
  startDate: string
  endDate: string
  price: string
  currency: string
  status: "ACTIVE" | "EXPIRED" | "COMPLETED" | "CANCELLED"
  createdAt: string
  updatedAt: string
}

export interface CreatePtPackageInput {
  memberId: string
  branchId: string
  templateId?: string
  name: string
  totalSessions: number
  startDate: string
  endDate: string
  price: number
  currency?: string
}

const KEY = "pt-packages"

export function usePtPackages(memberId?: string, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: [KEY, memberId],
    queryFn: () =>
      api.get<PtPackage[]>("/pt-packages", { query: memberId ? { memberId } : {} }),
    enabled,
  })
}

export interface PtWalletTotals {
  total: number
  used: number
  remaining: number
  scheduled: number
  completed: number
  cancelled: number
  noShow: number
}

export interface PtWallet {
  package: PtPackage
  totals: PtWalletTotals
  ledger: { sessionId: string; date: string; status: string; sessions: number }[]
}

export function usePtWallet(id: string | null, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: [KEY, id, "wallet"],
    queryFn: () => api.get<PtWallet>(`/pt-packages/${id}/wallet`),
    enabled: Boolean(id) && enabled,
  })
}

export function useCreatePtPackage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePtPackageInput) => api.post<PtPackage>("/pt-packages", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  })
}

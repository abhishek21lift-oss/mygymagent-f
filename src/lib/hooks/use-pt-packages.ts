import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api/client"

export type PtPackage = {
  id: string; organizationId: string; branchId: string; memberId: string; templateId: string | null
  name: string; totalSessions: number; usedSessions: number; remainingSessions: number
  startDate: string; endDate: string; price: string; currency: string
  status: "ACTIVE" | "EXPIRED" | "COMPLETED" | "CANCELLED"
}
export type CreatePtPackageInput = Omit<PtPackage, "id" | "organizationId" | "usedSessions" | "remainingSessions" | "status" | "price"> & { price: number; templateId?: string }
const KEY = "pt-packages"
export function usePtPackages(memberId?: string) { return useQuery({ queryKey: [KEY, memberId], queryFn: () => api.get<PtPackage[]>("/pt-packages", { query: memberId ? { memberId } : undefined }) }) }
export function useCreatePtPackage() { const qc = useQueryClient(); return useMutation({ mutationFn: (input: CreatePtPackageInput) => api.post<PtPackage>("/pt-packages", input), onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }) }) }

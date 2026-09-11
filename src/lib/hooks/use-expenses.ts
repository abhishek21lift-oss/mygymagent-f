import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import type { Paginated, PaginationParams } from "@/lib/types/pagination"

export type ExpenseStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID"

export interface Expense {
  id: string
  organizationId: string
  branchId: string | null
  category: string
  amount: string
  currency: string
  status: ExpenseStatus
  vendor: string | null
  billNo: string | null
  notes: string | null
  expenseDate: string
  paidAt: string | null
  recordedByUserId: string | null
  approvedByUserId: string | null
  createdAt: string
  updatedAt: string
  branch?: { id: string; name: string } | null
}

export interface ExpenseSummary {
  period: { from: string | null; to: string | null }
  totals: Array<{ currency: string; total: string }>
  byCategory: Array<{ category: string; currency: string; total: string; count: number }>
  byStatus: Array<{ status: string; count: number }>
}

export interface CreateExpenseInput {
  branchId?: string
  category: string
  amount: number
  currency?: string
  vendor?: string
  billNo?: string
  notes?: string
  expenseDate?: string
}

const KEY = "expenses"

export function useExpenses(
  params: PaginationParams & { branchId?: string; category?: string; status?: ExpenseStatus; from?: string; to?: string } = {},
) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<Paginated<Expense>>("/expenses", { query: params }),
  })
}

export function useExpenseSummary(params: { branchId?: string; from?: string; to?: string } = {}) {
  return useQuery({
    queryKey: [KEY, "summary", params],
    queryFn: () => api.get<ExpenseSummary>("/expenses/summary", { query: params }),
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateExpenseInput) => api.post<Expense>("/expenses", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useUpdateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Partial<CreateExpenseInput>) =>
      api.patch<Expense>(`/expenses/${id}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useApproveExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post<Expense>(`/expenses/${id}/approve`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useRejectExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.post<Expense>(`/expenses/${id}/reject`, { reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useMarkExpensePaid() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post<Expense>(`/expenses/${id}/mark-paid`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete<{ deleted: boolean }>(`/expenses/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  })
}

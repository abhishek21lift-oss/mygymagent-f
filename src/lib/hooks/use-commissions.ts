import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api/client"

/**
 * Trainer commissions.
 *
 * Distinct from `/hr-payroll`, which is staff salary, leave and payroll
 * runs. This is the other half of `payroll.*`: a percentage (and/or a
 * flat amount) per trainer, applied to completed PT sessions in a pay
 * window. The two live on one page but authorize separately -- `hr.*`
 * for the salary side, `payroll.*` for this one -- which is why the page
 * gates each section rather than the route.
 *
 * `trainerId` is a StaffProfile id throughout, matching `PtSession.trainer`,
 * not a User id. The API resolves the display name server-side because the
 * commission rows carry no relation to join through.
 */
export interface CommissionRule {
  id: string
  organizationId: string
  trainerId: string
  /** Decimal(5,2) as a string, e.g. "12.50". */
  percentage: string
  /** Decimal(10,2) as a string. Added on top of the percentage. */
  fixedAmount: string
  /** null is the trainer's catch-all rule. */
  sessionType: string | null
  createdAt: string
  updatedAt: string
}

export interface Commission {
  id: string
  organizationId: string
  trainerId: string
  trainerName: string | null
  ptSessionId: string
  sessionAt: string
  baseAmount: string
  rate: string
  commissionAmount: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface CommissionSummaryRow {
  trainerId: string
  trainerName: string | null
  baseAmount: string
  commissionAmount: string
  sessions: number
}

export interface UpsertCommissionRuleInput {
  trainerId: string
  percentage: number
  sessionType?: string
  fixedAmount?: number
}

export interface GenerateCommissionsInput {
  from: string
  to: string
}

export interface GenerateCommissionsResult {
  scanned: number
  created: number
}

export interface CommissionWindow {
  from?: string
  to?: string
  trainerId?: string
}

const KEY = "commissions"

export function useCommissionRules(enabled = true) {
  return useQuery({
    queryKey: [KEY, "rules"],
    queryFn: () => api.get<CommissionRule[]>("/payroll/commission-rules"),
    enabled,
  })
}

export function useCommissions(window: CommissionWindow = {}, enabled = true) {
  return useQuery({
    queryKey: [KEY, "list", window],
    queryFn: () =>
      api.get<Commission[]>("/payroll/commissions", {
        query: {
          ...(window.from ? { from: window.from } : {}),
          ...(window.to ? { to: window.to } : {}),
          ...(window.trainerId ? { trainerId: window.trainerId } : {}),
        },
      }),
    enabled,
  })
}

export function useCommissionSummary(
  window: Pick<CommissionWindow, "from" | "to"> = {},
  enabled = true,
) {
  return useQuery({
    queryKey: [KEY, "summary", window],
    queryFn: () =>
      api.get<CommissionSummaryRow[]>("/payroll/summary", {
        query: {
          ...(window.from ? { from: window.from } : {}),
          ...(window.to ? { to: window.to } : {}),
        },
      }),
    enabled,
  })
}

export function useUpsertCommissionRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpsertCommissionRuleInput) =>
      api.post<CommissionRule>("/payroll/commission-rules", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useUpdateCommissionRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: Partial<UpsertCommissionRuleInput> & { id: string }) =>
      api.patch<CommissionRule>(`/payroll/commission-rules/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useGenerateCommissions() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: GenerateCommissionsInput) =>
      api.post<GenerateCommissionsResult>("/payroll/commissions/generate", input),
    // Generating writes commission rows, so the list and the summary are
    // both stale -- not just the list the button sits above.
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  })
}

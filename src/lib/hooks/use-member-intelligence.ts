import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api/client"

/**
 * Churn risk, and what to do about it.
 *
 * The engine that scores members, the analytics that roll those scores up
 * and the recommendation queue that acts on them were all built and
 * almost entirely uncalled: the app could list who was at risk and could
 * not say why, could not recompute a score, and could not execute or
 * dismiss a single one of the actions the engine proposed.
 *
 * `reports.view` covers the roll-ups, `members.read` the per-member reads
 * and the recompute, and `members.update` the two that change something.
 */

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string

export interface RiskDistribution {
  riskLevel: RiskLevel
  count: number
  percentage: number
}

export interface RiskOverview {
  totalMembers: number
  riskDistribution: RiskDistribution[]
  highRiskCount: number
  criticalRiskCount: number
  revenueAtRisk: number
  revenueAtRiskByLevel: { HIGH: number; CRITICAL: number }
}

export interface RiskTrendPoint {
  date: string
  avgScore: number
  highRiskCount: number
  criticalRiskCount: number
}

export interface RevenueAtRisk {
  totalMRR: number
  atRiskMRR: number
  atRiskPercentage: number
  bySegment: { riskLevel: RiskLevel; mrr: number; memberCount: number }[]
}

export interface BranchRiskSummary {
  branchId: string
  branchName: string
  totalMembers: number
  riskDistribution: RiskDistribution[]
  avgRiskScore: number
}

const RISK = "member-risk"
const RECS = "member-recommendations"

/* ------------------------------------------------------------- roll-ups */

export function useRiskOverview(enabled = true) {
  return useQuery({
    queryKey: [RISK, "overview"],
    queryFn: () => api.get<RiskOverview>("/analytics/risk-overview"),
    enabled,
  })
}

export function useRiskTrend(days = 30, enabled = true) {
  return useQuery({
    queryKey: [RISK, "trend", days],
    queryFn: () => api.get<RiskTrendPoint[]>("/analytics/risk-trend", { query: { days } }),
    enabled,
  })
}

export function useRevenueAtRisk(enabled = true) {
  return useQuery({
    queryKey: [RISK, "revenue"],
    queryFn: () => api.get<RevenueAtRisk>("/analytics/revenue-at-risk"),
    enabled,
  })
}

export function useRiskByBranch(enabled = true) {
  return useQuery({
    queryKey: [RISK, "by-branch"],
    queryFn: () => api.get<BranchRiskSummary[]>("/analytics/risk-by-branch"),
    enabled,
  })
}

export interface ChurnAssessment {
  memberId: string
  score?: number
  riskLevel?: RiskLevel
  [key: string]: unknown
}

export function useAtRiskAssessments(enabled = true) {
  return useQuery({
    queryKey: [RISK, "assessments"],
    queryFn: () => api.get<ChurnAssessment[]>("/analytics/members/at-risk/assessments"),
    enabled,
  })
}

export function useChurnAssessment(memberId: string | undefined) {
  return useQuery({
    queryKey: [RISK, "assessment", memberId],
    queryFn: () => api.get<ChurnAssessment>(`/analytics/members/${memberId}/churn-assessment`),
    enabled: Boolean(memberId),
  })
}

/* --------------------------------------------------------- per member */

export function useChurnReason(memberId: string | undefined) {
  return useQuery({
    queryKey: [RISK, "churn-reason", memberId],
    queryFn: () => api.get<{ reason?: string; summary?: string; [k: string]: unknown }>(
      `/members/${memberId}/insights/churn-reason`,
    ),
    enabled: Boolean(memberId),
  })
}

export function useComputeMemberIntelligence() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (memberId: string) =>
      api.post<unknown>(`/members/${memberId}/intelligence/compute`),
    // A recompute moves this member's score and therefore every roll-up
    // that counts them.
    onSuccess: () => qc.invalidateQueries({ queryKey: [RISK] }),
  })
}

export function useBatchComputeIntelligence() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<{ processed?: number }>("/members/intelligence/batch-compute"),
    onSuccess: () => qc.invalidateQueries({ queryKey: [RISK] }),
  })
}

/* ------------------------------------------------------ recommendations */

export interface MemberRecommendation {
  id: string
  memberId: string
  title?: string
  description?: string | null
  actionType?: string
  status?: string
  createdAt?: string
  [key: string]: unknown
}

export function useMemberRecommendations(memberId: string | undefined) {
  return useQuery({
    queryKey: [RECS, memberId],
    queryFn: () => api.get<MemberRecommendation[]>(`/members/${memberId}/recommendations`),
    enabled: Boolean(memberId),
  })
}

export function useGenerateRecommendations(memberId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<MemberRecommendation[]>(`/members/${memberId}/recommendations/generate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [RECS, memberId] }),
  })
}

export function useExecuteRecommendation(memberId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (actionId: string) =>
      api.post<unknown>(`/members/${memberId}/recommendations/${actionId}/execute`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [RECS, memberId] }),
  })
}

export function useDismissRecommendation(memberId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (actionId: string) =>
      api.patch<unknown>(`/members/${memberId}/recommendations/${actionId}/dismiss`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [RECS, memberId] }),
  })
}

/* --------------------------------------------------------------- segments */

export interface SegmentField {
  key: string
  label?: string
  type?: string
  [k: string]: unknown
}

export function useSegmentFields(enabled = true) {
  return useQuery({
    queryKey: ["segment-fields"],
    queryFn: () => api.get<SegmentField[]>("/members/segments/fields"),
    enabled,
  })
}

export function useSegmentInsights() {
  return useMutation({
    mutationFn: (input: { segmentId?: string; rules?: unknown }) =>
      api.post<{ summary?: string; [k: string]: unknown }>("/members/segments/insights", input),
  })
}

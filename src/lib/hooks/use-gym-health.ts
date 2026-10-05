import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api/client"

export type HealthStatus =
  | "healthy"
  | "stable"
  | "needs-attention"
  | "critical"
  | "unknown"

export interface HealthComponent {
  key: "revenue" | "collections" | "retention" | "sales" | "inventory"
  label: string
  score: number | null
  weight: number
  value: string
  explanation: string
  source: string
}

export interface GymHealth {
  score: number | null
  status: HealthStatus
  opportunity: HealthComponent["key"] | null
  components: HealthComponent[]
  branchId: string | null
  computedAt: string
  revenueAtRisk: {
    totalMRR: number
    atRiskMRR: number
    atRiskPercentage: number
    bySegment: { riskLevel: string; mrr: number; memberCount: number }[]
  }
}

const KEY = "gym-health"

/**
 * One request for the whole health picture: score, breakdown and
 * revenue-at-risk arrive together, computed live from the same services
 * the dedicated pages read.
 */
export function useGymHealth(
  params: { branchId?: string } = {},
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () =>
      api.get<GymHealth>("/analytics/gym-health", {
        query: params as Record<string, string | undefined>,
      }),
    enabled,
  })
}

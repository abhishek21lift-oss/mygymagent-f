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
  mixedCurrencies: boolean
  revenueAtRisk: {
    totalMRR: number
    atRiskMRR: number
    atRiskPercentage: number
    bySegment: { riskLevel: string; mrr: number; memberCount: number }[]
    byCurrency: { currency: string; totalMRR: number; atRiskMRR: number }[]
    mixed: boolean
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

export interface CooDelta {
  revenueNetPct: number | null
  collectedPct: number | null
  checkinsPct: number | null
}

export interface CooBriefing {
  computedAt: string
  branchId: string | null
  health: GymHealth
  today: {
    date: string
    revenueNet: string
    collected: string
    checkIns: number
    currency: string
    currencies: string[]
    mixed: boolean
  }
  deltas: CooDelta
  outcomes: { pending: number; executed: number; rejected: number }
  usage: {
    requests24h: number
    tokens24h: number
    costUsd24h: string
    errors24h: number
  }
}

/**
 * One request for the COO morning screen: health, today, deltas,
 * outcomes and AI spend, all computed server-side from owning services.
 */
export function useCooBriefing(
  params: { branchId?: string } = {},
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [KEY, "briefing", params],
    queryFn: () =>
      api.get<CooBriefing>("/analytics/coo-briefing", {
        query: params as Record<string, string | undefined>,
      }),
    enabled,
  })
}

export interface CooTrend {
  metric: "revenue" | "risk"
  label: string
  current: number
  previous: number
  deltaPct: number | null
  direction: "up" | "down" | "flat"
  currency: string | null
  insufficientData: boolean
}

export function useCooTrends(
  params: { branchId?: string } = {},
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [KEY, "trends", params],
    queryFn: () =>
      api.get<{ trends: CooTrend[]; computedAt: string }>("/analytics/coo-trends", {
        query: params as Record<string, string | undefined>,
      }),
    enabled,
  })
}

export interface CooForecast {
  revenueNextMonth: {
    low: string
    high: string
    point: string
    currency: string
    basedOnMonths: number
    confidence: "high" | "moderate"
    method: string
  } | null
  insufficientData: boolean
  computedAt: string
}

export function useCooForecast(
  params: { branchId?: string } = {},
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: [KEY, "forecast", params],
    queryFn: () =>
      api.get<CooForecast>("/analytics/coo-forecast", {
        query: params as Record<string, string | undefined>,
      }),
    enabled,
  })
}

export interface AiEffectiveness {
  total: number
  pending: number
  approved: number
  executed: number
  rejected: number
  failed: number
  acceptanceRate: number | null
  executionRate: number | null
}

export function useAiEffectiveness({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ["ai-actions", "effectiveness"],
    queryFn: () => api.get<AiEffectiveness>("/ai-actions/effectiveness"),
    enabled,
  })
}

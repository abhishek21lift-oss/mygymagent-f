import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api/client"

export interface RevenueSummary {
  period: { from: string; to: string }
  branchId: string | null
  revenue: Array<{ currency: string; paymentCount: number; grossRevenue: string; membershipRevenue: string; otherRevenue: string; refunded: string; netRevenue: string }>
  outstanding: Array<{ currency: string; membershipsWithBalance: number; outstandingBalance: string }>
  notComputable: Array<{ key: string; reason: string }>
}

export interface RevenueTrendMonth {
  month: string
  revenue: Array<{ currency: string; grossRevenue: string; refunded: string; netRevenue: string }>
}

export interface AtRiskMember { id: string; firstName: string; lastName: string; daysSinceLastVisit: number; neverCheckedIn: boolean }
export interface MemberStatusBreakdown { status: string; count: number }

export interface SalesFunnel {
  period?: { from: string | null; to: string | null }
  byStatus?: { status: string; count: number }[]
  totalLeads: number
  wonLeads: number
  lostLeads?: number
  conversionRatePct: number
  averageDaysToConversion?: number | null
  followUps: { total: number; completed: number; completionRatePct: number }
}

interface SalesFunnelApi extends Omit<SalesFunnel, "conversionRatePct" | "followUps"> {
  conversionRatePct?: string | number
  followUps?: { total?: number; completed?: number; completionRatePct?: string | number }
}

export interface SalesSourcePerformance {
  source: string
  totalLeads: number
  wonLeads: number
  lostLeads: number
  conversionRatePct: number | string
}

export interface TrainerWorkload { trainerId: string; trainerName: string; activeMembers: number; pendingPtSessions: number; completedPtSessions: number }
export interface InventoryForecast { productId: string; productName: string; currentStock: number; daysUntilStockout: number | null; lowStock: boolean }

interface RevenueQueryParams { from?: string; to?: string; branchId?: string }
interface SalesDateQueryParams { from?: string; to?: string }

type QueryParams = Record<string, string | number | boolean | undefined>

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

export function useRevenueSummary(params: RevenueQueryParams = {}) {
  return useQuery({
    queryKey: ["analytics", "revenue", params],
    queryFn: async () => {
      const data = await api.get<RevenueSummary>("/analytics/revenue", { query: params as QueryParams })
      return {
        ...data,
        revenue: asArray<RevenueSummary["revenue"][number]>(data?.revenue),
        outstanding: asArray<RevenueSummary["outstanding"][number]>(data?.outstanding),
        notComputable: asArray<RevenueSummary["notComputable"][number]>(data?.notComputable),
      }
    },
  })
}

export function useRevenueTrend(months: number = 6, branchId?: string) {
  return useQuery({
    queryKey: ["analytics", "revenue-trend", months, branchId],
    queryFn: async () => {
      const data = await api.get<RevenueTrendMonth[]>("/analytics/revenue/trend", { query: { months, branchId } })
      return asArray<RevenueTrendMonth>(data)
    },
    enabled: months > 0,
  })
}

export function useAtRiskMembers(branchId?: string) {
  return useQuery({
    queryKey: ["analytics", "at-risk-members", branchId],
    queryFn: async () => asArray<AtRiskMember>(await api.get<AtRiskMember[]>("/analytics/members/at-risk")),
  })
}

export function useMemberStatusBreakdown(branchId?: string) {
  return useQuery({
    queryKey: ["analytics", "member-status-breakdown", branchId],
    queryFn: async () => asArray<MemberStatusBreakdown>(await api.get<MemberStatusBreakdown[]>("/analytics/members/status-breakdown")),
  })
}

export function useSalesFunnel(branchId?: string, params: SalesDateQueryParams = {}) {
  return useQuery({
    queryKey: ["analytics", "sales-funnel", branchId, params],
    queryFn: async (): Promise<SalesFunnel> => {
      const data = await api.get<SalesFunnelApi>("/analytics/sales/funnel", { query: params as QueryParams })
      const followUps = data?.followUps ?? {}
      return {
        ...data,
        totalLeads: Number(data?.totalLeads ?? 0),
        wonLeads: Number(data?.wonLeads ?? 0),
        conversionRatePct: Number(data?.conversionRatePct ?? 0),
        followUps: {
          total: Number(followUps.total ?? 0),
          completed: Number(followUps.completed ?? 0),
          completionRatePct: Number(followUps.completionRatePct ?? 0),
        },
      }
    },
  })
}

export function useSalesSourcePerformance(branchId?: string, params: SalesDateQueryParams = {}) {
  return useQuery({
    queryKey: ["analytics", "sales-sources", branchId, params],
    queryFn: async () => asArray<SalesSourcePerformance>(await api.get<SalesSourcePerformance[]>("/analytics/sales/sources", { query: params as QueryParams })),
  })
}

export interface SalesLostReason {
  reason: string
  lostLeads: number
}

export function useSalesLostReasons(branchId?: string, params: SalesDateQueryParams = {}) {
  return useQuery({
    queryKey: ["analytics", "sales-lost-reasons", branchId, params],
    queryFn: async () => asArray<SalesLostReason>(await api.get<SalesLostReason[]>("/analytics/sales/lost-reasons", { query: params as QueryParams })),
  })
}

export interface SalesAssigneePerformance {
  assigneeId: string | null
  assigneeName: string
  totalLeads: number
  wonLeads: number
  lostLeads: number
  openLeads: number
  conversionRatePct: number
}

export function useSalesAssigneePerformance(branchId?: string, params: SalesDateQueryParams = {}) {
  return useQuery({
    queryKey: ["analytics", "sales-assignees", branchId, params],
    queryFn: async () =>
      asArray<SalesAssigneePerformance>(
        (await api.get<SalesAssigneePerformance[]>("/analytics/sales/assignees", { query: params as QueryParams })).map((row) => ({
          ...row,
          totalLeads: Number(row.totalLeads ?? 0),
          wonLeads: Number(row.wonLeads ?? 0),
          lostLeads: Number(row.lostLeads ?? 0),
          openLeads: Number(row.openLeads ?? 0),
          conversionRatePct: Number(row.conversionRatePct ?? 0),
        })),
    ),
  })
}

export function useTrainerWorkload(branchId?: string) {
  return useQuery({
    queryKey: ["analytics", "trainer-workload", branchId],
    queryFn: async () => asArray<TrainerWorkload>(await api.get<TrainerWorkload[]>("/analytics/trainers/workload")),
  })
}

interface InventoryForecastApi {
  productId: string
  sku?: string
  name?: string
  productName?: string
  quantityOnHand?: number
  currentStock?: number
  reorderLevel?: number
  atOrBelowReorderLevel?: boolean
  lowStock?: boolean
  daysUntilStockout: number | null
}

export function useInventoryForecast() {
  return useQuery({
    queryKey: ["analytics", "inventory-forecast"],
    queryFn: async () => {
      const data = await api.get<InventoryForecastApi[]>("/analytics/inventory/forecast")
      return asArray<InventoryForecastApi>(data).map((item) => ({
        productId: item.productId,
        productName: item.productName ?? item.name ?? "Unknown product",
        currentStock: Number(item.currentStock ?? item.quantityOnHand ?? 0),
        daysUntilStockout: item.daysUntilStockout ?? null,
        lowStock: Boolean(item.lowStock ?? item.atOrBelowReorderLevel ?? false),
      }))
    },
  })
}

export interface MembershipLifecycleAnalytics {
  statusCounts: Array<{ status: string; count: number }>
  activePlanDistribution: Array<{ planId: string; planName: string; count: number }>
  renewalRatePct: number | string
  freezeUtilizationRatePct: number | string
  expiringWithin30Days: number
  newLast90Days: number
  renewedLast90Days: number
  avgClosedTenureDays: number | null
  outstandingByCurrency: Array<{ currency: string; membershipsWithBalance: number; outstandingBalance: string }>
}

interface MembershipLifecycleApi extends Omit<MembershipLifecycleAnalytics, "renewalRatePct" | "freezeUtilizationRatePct"> {
  renewalRatePct?: string | number
  freezeUtilizationRatePct?: string | number
}

export function useMembershipLifecycle(branchId?: string) {
  return useQuery({
    queryKey: ["analytics", "membership-lifecycle", branchId],
    queryFn: async (): Promise<MembershipLifecycleAnalytics> => {
      const data = await api.get<MembershipLifecycleApi>("/analytics/memberships/lifecycle", { query: { branchId } })
      return {
        ...data,
        statusCounts: asArray<MembershipLifecycleAnalytics["statusCounts"][number]>(data?.statusCounts),
        activePlanDistribution: asArray<MembershipLifecycleAnalytics["activePlanDistribution"][number]>(data?.activePlanDistribution),
        renewalRatePct: Number(data?.renewalRatePct ?? 0),
        freezeUtilizationRatePct: Number(data?.freezeUtilizationRatePct ?? 0),
        expiringWithin30Days: Number(data?.expiringWithin30Days ?? 0),
        newLast90Days: Number(data?.newLast90Days ?? 0),
        renewedLast90Days: Number(data?.renewedLast90Days ?? 0),
        avgClosedTenureDays: data?.avgClosedTenureDays === null || data?.avgClosedTenureDays === undefined ? null : Number(data.avgClosedTenureDays),
        outstandingByCurrency: asArray<MembershipLifecycleAnalytics["outstandingByCurrency"][number]>(data?.outstandingByCurrency),
      }
    },
  })
}

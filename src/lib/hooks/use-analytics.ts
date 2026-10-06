import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api/client"

export interface RevenueSummary {
  period: { from: string; to: string }
  branchId: string | null
  revenue: Array<{ currency: string; paymentCount: number; grossRevenue: string; membershipRevenue: string; otherRevenue: string; productRevenue: string; refunded: string; netRevenue: string }>
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

/**
 * Trainer workload, as `GET /analytics/trainers/workload` actually
 * returns it.
 *
 * These field names are not a choice. The backend's `TrainerWorkload`
 * (`analytics/trainer-intelligence.service.ts`) is `{ userId, firstName,
 * lastName, assignedMemberCount, workoutPlansAssignedLast30Days,
 * dietPlansAssignedLast30Days }`, and the endpoint answers with an
 * envelope `{ trainers, notComputable }` rather than a bare array.
 *
 * This type previously read `{ trainerId, trainerName, activeMembers,
 * pendingPtSessions, completedPtSessions }` — no field in common — and
 * the hook pushed the envelope straight through `asArray`, which returns
 * `[]` for anything that is not an array. The panel therefore rendered
 * its "No trainers assigned" empty state on every gym, permanently, with
 * no error to explain it. The same payload is typed correctly on the
 * daily-briefing hook, which is what made the disagreement visible.
 */
export interface TrainerWorkload {
  userId: string
  firstName: string
  lastName: string
  assignedMemberCount: number
  workoutPlansAssignedLast30Days: number
  dietPlansAssignedLast30Days: number
  sessionsCompleted30d: number
  sessionsNoShow30d: number
  sessionCompletionPct: number | null
}

export interface TrainerWorkloadResponse {
  trainers: TrainerWorkload[]
  /** Figures the backend refuses to invent; surfaced, not shown as zero. */
  notComputable: { key: string; reason: string }[]
}

/**
 * Unwrap the trainer-workload envelope.
 *
 * Exported so it can be tested without a QueryClient, and because the
 * bug it exists to prevent was invisible: the hook used to pass the whole
 * response through `asArray`, which returns `[]` for anything that is
 * not an array. The endpoint answers with an object, so every gym saw
 * "No trainers assigned" forever, with no error and no failing request.
 */
export function readTrainerWorkload(payload: unknown): TrainerWorkloadResponse {
  const body = (payload ?? {}) as Partial<TrainerWorkloadResponse>
  return {
    trainers: Array.isArray(body.trainers) ? body.trainers : [],
    notComputable: Array.isArray(body.notComputable) ? body.notComputable : [],
  }
}
export interface InventoryForecast { productId: string; productName: string; currentStock: number; daysUntilStockout: number | null; lowStock: boolean }

interface RevenueQueryParams { from?: string; to?: string; branchId?: string }
interface SalesDateQueryParams { from?: string; to?: string }

type QueryParams = Record<string, string | number | boolean | undefined>

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

export function useRevenueSummary(params: RevenueQueryParams = {}, { enabled = true }: { enabled?: boolean } = {}) {
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
    enabled,
  })
}

export function useRevenueTrend(months: number = 6, branchId?: string, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ["analytics", "revenue-trend", months, branchId],
    queryFn: async () => {
      const data = await api.get<RevenueTrendMonth[]>("/analytics/revenue/trend", { query: { months, branchId } })
      return asArray<RevenueTrendMonth>(data)
    },
    enabled: enabled && months > 0,
  })
}

export function useAtRiskMembers(branchId?: string) {
  return useQuery({
    queryKey: ["analytics", "at-risk-members", branchId],
    queryFn: async () => asArray<AtRiskMember>(await api.get<AtRiskMember[]>("/analytics/members/at-risk", { query: { branchId } })),
  })
}

export function useMemberStatusBreakdown(branchId?: string, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ["analytics", "member-status-breakdown", branchId],
    queryFn: async () => asArray<MemberStatusBreakdown>(await api.get<MemberStatusBreakdown[]>("/analytics/members/status-breakdown", { query: { branchId } })),
    enabled,
  })
}

export function useSalesFunnel(branchId?: string, params: SalesDateQueryParams = {}) {
  return useQuery({
    queryKey: ["analytics", "sales-funnel", branchId, params],
    queryFn: async (): Promise<SalesFunnel> => {
      const data = await api.get<SalesFunnelApi>("/analytics/sales/funnel", { query: { ...params, branchId } as QueryParams })
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
    queryFn: async () => asArray<SalesSourcePerformance>(await api.get<SalesSourcePerformance[]>("/analytics/sales/sources", { query: { ...params, branchId } as QueryParams })),
  })
}

export interface SalesLostReason {
  reason: string
  lostLeads: number
}

export function useSalesLostReasons(branchId?: string, params: SalesDateQueryParams = {}) {
  return useQuery({
    queryKey: ["analytics", "sales-lost-reasons", branchId, params],
    queryFn: async () => asArray<SalesLostReason>(await api.get<SalesLostReason[]>("/analytics/sales/lost-reasons", { query: { ...params, branchId } as QueryParams })),
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
        (await api.get<SalesAssigneePerformance[]>("/analytics/sales/assignees", { query: { ...params, branchId } as QueryParams })).map((row) => ({
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
    // Unwrapped, not `asArray`d: the endpoint answers with an envelope,
    // so `asArray` silently produced an empty list for every gym.
    queryFn: async () =>
      readTrainerWorkload(
        await api.get<TrainerWorkloadResponse>("/analytics/trainers/workload", {
          query: { branchId } as QueryParams,
        }),
      ),
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

export function useInventoryForecast(branchId?: string) {
  return useQuery({
    queryKey: ["analytics", "inventory-forecast", branchId],
    queryFn: async () => {
      const data = await api.get<InventoryForecastApi[]>("/analytics/inventory/forecast", { query: { branchId } })
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

export interface RenewalPipelineItem {
  membershipId: string
  memberId: string
  firstName: string
  lastName: string
  planName: string
  price: string
  currency: string
  endDate: string
  daysUntilExpiry: number
}

export interface RenewalPipeline {
  upcoming: RenewalPipelineItem[]
  overdue: RenewalPipelineItem[]
  highValue: RenewalPipelineItem[]
  counts: { upcoming: number; overdue: number }
}

export function useRenewalPipeline(
  branchId?: string,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ["analytics", "renewal-pipeline", branchId],
    queryFn: () =>
      api.get<RenewalPipeline>("/analytics/memberships/renewal-pipeline", {
        query: { branchId },
      }),
    enabled,
  })
}

export interface PtOpportunity {
  packageId: string
  memberId: string
  firstName: string
  lastName: string
  packageName: string
  sessionsRemaining: number
  daysLeft: number
  reason: "EXPIRING_WITH_SESSIONS" | "NEVER_STARTED"
}

export interface PtOpportunities {
  expiring: PtOpportunity[]
  neverStarted: PtOpportunity[]
  counts: { expiring: number; neverStarted: number; activePackages: number }
}

export function usePtOpportunities(
  branchId?: string,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ["analytics", "pt-opportunities", branchId],
    queryFn: () =>
      api.get<PtOpportunities>("/analytics/trainers/pt-opportunities", {
        query: { branchId },
      }),
    enabled,
  })
}

export interface SalesPriorityItem {
  leadId: string
  firstName: string
  lastName: string
  source: string | null
  status: string
  severity: "hot" | "warm" | "watch"
  reasons: string[]
  followUpDueAt: string | null
  overdueFollowUps: number
}

export interface SalesPriority {
  items: SalesPriorityItem[]
  counts: { hot: number; warm: number; watch: number }
}

export function useSalesPriority(
  branchId?: string,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ["analytics", "sales-priority", branchId],
    queryFn: () =>
      api.get<SalesPriority>("/analytics/sales/priority", {
        query: { branchId },
      }),
    enabled,
  })
}

export type WinBackTier = "HIGH" | "MEDIUM" | "LOW"

export interface WinBackCandidate {
  memberId: string
  firstName: string
  lastName: string
  daysSinceExpiry: number
  lifetimePaid: string
  currency: string
  tenureDays: number
  lastVisitAt: string | null
  priorPtPackages: number
  tier: WinBackTier
  reasons: string[]
}

export interface WinBackList {
  items: WinBackCandidate[]
  counts: { high: number; medium: number; low: number }
}

export function useWinBack(
  branchId?: string,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ["analytics", "win-back", branchId],
    queryFn: () =>
      api.get<WinBackList>("/analytics/members/win-back", {
        query: { branchId },
      }),
    enabled,
  })
}

export interface PtAdherence {
  memberId: string
  windowDays: number
  ptAdherencePct: number | null
  workoutsCompleted30d: number
  visits30d: number
  weeklyStreak: number
  insufficientData: boolean
}

export function usePtAdherence(
  memberId: string | null,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ["analytics", "pt-adherence", memberId],
    queryFn: () =>
      api.get<PtAdherence>("/analytics/pt-adherence", {
        query: { memberId: memberId ?? undefined },
      }),
    enabled: Boolean(memberId) && enabled,
  })
}

export type CapacityBand =
  | "UNDERUTILIZED"
  | "HEALTHY"
  | "HIGH_DEMAND"
  | "OVERBOOKED_RISK"
  | "UNKNOWN"

export interface ClassCapacitySession {
  sessionId: string
  programName: string
  startTime: string
  capacity: number | null
  booked: number
  waitlisted: number
  utilizationPct: number | null
  band: CapacityBand
}

export interface ProgramDemand {
  programId: string
  programName: string
  avgUtilizationPct: number | null
  sessionsCount: number
}

export interface ClassCapacity {
  upcoming: ClassCapacitySession[]
  demand: ProgramDemand[]
}

export interface SchedulingConflict {
  type: "INSTRUCTOR_DOUBLE_BOOKING"
  userId: string
  name: string
  items: {
    kind: "CLASS" | "PT" | "APPOINTMENT"
    id: string
    title: string
    startTime: string
    endTime: string
  }[]
}

export type OperationsHealthStatus =
  | "healthy"
  | "stable"
  | "needs-attention"
  | "critical"
  | "unknown"

export interface OperationsComponent {
  key: string
  label: string
  score: number | null
  weight: number
  value: string
  explanation: string
  source: string
}

export interface OperationsHealth {
  score: number | null
  status: OperationsHealthStatus
  opportunity: string | null
  components: OperationsComponent[]
  staffAway: { name: string; type: string }[]
  branchId: string | null
  computedAt: string
}

export function useOperationsHealth(
  branchId?: string,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ["analytics", "operations-health", branchId],
    queryFn: () =>
      api.get<OperationsHealth>("/analytics/operations-health", {
        query: { branchId },
      }),
    enabled,
  })
}

export function useClassCapacity(
  branchId?: string,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ["analytics", "class-capacity", branchId],
    queryFn: () =>
      api.get<ClassCapacity>("/analytics/classes/capacity", {
        query: { branchId },
      }),
    enabled,
  })
}

export function useSchedulingConflicts(
  branchId?: string,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ["analytics", "scheduling-conflicts", branchId],
    queryFn: () =>
      api.get<SchedulingConflict[]>("/analytics/scheduling/conflicts", {
        query: { branchId },
      }),
    enabled,
  })
}

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export interface RevenueSummary {
  period: { from: string; to: string };
  branchId: string | null;
  revenue: Array<{
    currency: string;
    paymentCount: number;
    grossRevenue: string;
    membershipRevenue: string;
    otherRevenue: string;
    refunded: string;
    netRevenue: string;
  }>;
  outstanding: Array<{
    currency: string;
    membershipsWithBalance: number;
    outstandingBalance: string;
  }>;
  notComputable: Array<{ key: string; reason: string }>;
}

export interface RevenueTrendMonth {
  month: string;
  revenue: Array<{
    currency: string;
    grossRevenue: string;
    refunded: string;
    netRevenue: string;
  }>;
}

export interface AtRiskMember {
  id: string;
  firstName: string;
  lastName: string;
  daysSinceLastVisit: number;
  neverCheckedIn: boolean;
}

export interface MemberStatusBreakdown {
  status: string;
  count: number;
}

export interface SalesFunnel {
  totalLeads: number;
  wonLeads: number;
  lostLeads: number;
  conversionRatePct: number;
  followUps: {
    total: number;
    completed: number;
    completionRatePct: number;
  };
}

export interface TrainerWorkload {
  trainerId: string;
  trainerName: string;
  activeMembers: number;
  pendingPtSessions: number;
  completedPtSessions: number;
}

export interface InventoryForecast {
  productId: string;
  productName: string;
  currentStock: number;
  daysUntilStockout: number | null;
  lowStock: boolean;
}

interface RevenueQueryParams {
  from?: string;
  to?: string;
  branchId?: string;
}

export function useRevenueSummary(params: RevenueQueryParams = {}) {
  return useQuery({
    queryKey: ["analytics", "revenue", params],
    queryFn: () =>
      api.get<RevenueSummary>("/analytics/revenue", {
        query: params as Record<string, string | number | boolean | undefined>,
      }),
  });
}

export function useRevenueTrend(months: number = 6, branchId?: string) {
  return useQuery({
    queryKey: ["analytics", "revenue-trend", months, branchId],
    queryFn: () =>
      api.get<RevenueTrendMonth[]>(`/analytics/revenue/trend`, {
        query: { months, branchId },
      }),
    enabled: months > 0,
  });
}

export function useAtRiskMembers(branchId?: string) {
  return useQuery({
    queryKey: ["analytics", "at-risk-members", branchId],
    queryFn: () => api.get<AtRiskMember[]>("/analytics/members/at-risk"),
  });
}

export function useMemberStatusBreakdown(branchId?: string) {
  return useQuery({
    queryKey: ["analytics", "member-status-breakdown", branchId],
    queryFn: () => api.get<MemberStatusBreakdown[]>("/analytics/members/status-breakdown"),
  });
}

export function useSalesFunnel(branchId?: string) {
  return useQuery({
    queryKey: ["analytics", "sales-funnel", branchId],
    queryFn: () => api.get<SalesFunnel>("/analytics/sales/funnel"),
  });
}

export function useTrainerWorkload(branchId?: string) {
  return useQuery({
    queryKey: ["analytics", "trainer-workload", branchId],
    queryFn: () => api.get<TrainerWorkload[]>("/analytics/trainers/workload"),
  });
}

export function useInventoryForecast() {
  return useQuery({
    queryKey: ["analytics", "inventory-forecast"],
    queryFn: () => api.get<InventoryForecast[]>("/analytics/inventory/forecast"),
  });
}

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export interface DailyBriefing {
  generatedAt: string;
  branchId: string | null;
  /** Members admitted today; denied attempts and staff are not visits. */
  today: { checkIns: number; deniedCheckIns?: number };
  revenue: {
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
  };
  atRiskMembers: {
    count: number;
    top: Array<{
      id: string;
      firstName: string;
      lastName: string;
      daysSinceLastVisit: number;
      neverCheckedIn: boolean;
    }>;
  };
  salesFunnel: {
    totalLeads: number;
    wonLeads: number;
    conversionRatePct: string;
    averageDaysToConversion: number | null;
    followUps: { total: number; completed: number; completionRatePct: string };
  };
  lowStock: { count: number; top: Array<{ productId: string; sku: string; name: string; quantityOnHand: number; reorderLevel: number; daysUntilStockout: number | null }> };
  trainerWorkload: { trainerCount: number; top: Array<{ userId: string; firstName: string; lastName: string; assignedMemberCount: number; workoutPlansAssignedLast30Days: number; dietPlansAssignedLast30Days: number }>; notComputable: Array<{ key: string; reason: string }> };
  pendingAiActions: number;
  /** Open lead follow-ups due by the end of today, on any open lead.
   * Optional only for the window where an older API is still deployed. */
  followUpsDue?: { count: number; overdue: number };
  /** Running terms ending within `withinDays` that nobody has renewed. */
  expiringSoon?: { count: number; withinDays: number };
  /** Open member follow-ups due by the end of today -- including the
   * renewal requests members send from the member app, which otherwise
   * sit unseen on that member's own page. Most urgent first. */
  memberFollowUpsDue?: {
    count: number;
    overdue: number;
    renewalRequests: number;
    top: Array<{
      id: string;
      memberId: string;
      firstName: string;
      lastName: string;
      title: string;
      dueAt: string | null;
      isRenewalRequest: boolean;
    }>;
  };
}

/** Needs `reports.view`; pass `enabled: false` for anyone without it,
 * or the request is a guaranteed 403. */
export function useDailyBriefing({ enabled = true, branchId }: { enabled?: boolean; branchId?: string } = {}) {
  return useQuery({
    // The branch is part of the key: the briefing for one branch is not
    // the briefing for the gym, and must never be served from its cache.
    queryKey: ["daily-briefing", branchId ?? "all"],
    queryFn: () => api.get<DailyBriefing>("/briefing/daily", { query: { branchId } }),
    staleTime: 60_000,
    enabled,
  });
}

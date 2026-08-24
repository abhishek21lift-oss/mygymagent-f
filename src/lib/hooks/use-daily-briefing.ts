import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export interface DailyBriefing {
  date: string;
  checkInsToday: number;
  revenueToday: number;
  atRiskMembers: number;
  salesFunnel: { leads: number; conversions: number };
  lowStock: number;
  trainerWorkload: number;
  pendingAiActions: number;
}

export function useDailyBriefing() {
  return useQuery({
    queryKey: ["daily-briefing"],
    queryFn: () => api.get<DailyBriefing>("/briefing/daily"),
    staleTime: 60_000,
  });
}

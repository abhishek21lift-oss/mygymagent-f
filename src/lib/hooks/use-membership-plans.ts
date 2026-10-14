import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { MembershipPlan, PlanPriceEstimate } from "@/lib/types/gym";
import type { Paginated, PaginationParams } from "@/lib/types/pagination";
import type { CreateMembershipPlanInput } from "@/lib/validation/gym";

const KEY = "membership-plans";

export function useMembershipPlans(params: PaginationParams = {}) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<Paginated<MembershipPlan>>("/membership-plans", { query: params }),
  });
}

export function useMembershipPlan(id: string) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => api.get<MembershipPlan>(`/membership-plans/${id}`),
    enabled: !!id,
  });
}

export function useCreateMembershipPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMembershipPlanInput) =>
      api.post<MembershipPlan>("/membership-plans", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateMembershipPlan(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CreateMembershipPlanInput> & { isActive?: boolean }) =>
      api.patch<MembershipPlan>(`/membership-plans/${id}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export interface PriceEstimateRequest {
  price: number;
  compareAtPrice?: number;
  joiningFee?: number;
  taxMode?: "none" | "inclusive" | "exclusive";
  taxRate?: number;
  currency?: string;
}

/**
 * Server-computed payable preview. The form shows this estimate; the
 * sale path recomputes from stored plan values and never trusts it.
 */
export function usePriceEstimate() {
  return useMutation({
    mutationFn: (input: PriceEstimateRequest) =>
      api.post<PlanPriceEstimate>("/membership-plans/price-estimate", input),
  });
}


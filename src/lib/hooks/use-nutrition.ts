import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { DietAssignment, DietPlan, FoodItem } from "@/lib/types/gym";
import type { Paginated, PaginationParams } from "@/lib/types/pagination";
import type {
  AssignDietPlanInput,
  CreateDietPlanInput,
  CreateFoodItemInput,
} from "@/lib/validation/gym";

const FOOD_ITEMS_KEY = "food-items";
const PLANS_KEY = "diet-plans";
const ASSIGNMENTS_KEY = "diet-assignments";

export function useFoodItems() {
  return useQuery({
    queryKey: [FOOD_ITEMS_KEY],
    queryFn: () => api.get<FoodItem[]>("/food-items"),
  });
}

export function useCreateFoodItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFoodItemInput) => api.post<FoodItem>("/food-items", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [FOOD_ITEMS_KEY] }),
  });
}

export function useDietPlans(params: PaginationParams = {}) {
  return useQuery({
    queryKey: [PLANS_KEY, params],
    queryFn: () => api.get<Paginated<DietPlan>>("/diet-plans", { query: params }),
  });
}

export function useCreateDietPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDietPlanInput) => api.post<DietPlan>("/diet-plans", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [PLANS_KEY] }),
  });
}

export function useAssignDietPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, input }: { planId: string; input: AssignDietPlanInput }) =>
      api.post<DietAssignment>(`/diet-plans/${planId}/assign`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ASSIGNMENTS_KEY] }),
  });
}

export function useDietAssignments(params: PaginationParams & { memberId?: string } = {}) {
  return useQuery({
    queryKey: [ASSIGNMENTS_KEY, params],
    queryFn: () => api.get<Paginated<DietAssignment>>("/diet-assignments", { query: params }),
  });
}

export function useUpdateDietAssignmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "COMPLETED" | "CANCELLED" }) =>
      api.patch<DietAssignment>(`/diet-assignments/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ASSIGNMENTS_KEY] }),
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { DietAssignment, DietPlan, FoodItem } from "@/lib/types/gym";
import type { Paginated, PaginationParams } from "@/lib/types/pagination";
import type {
  AssignDietPlanInput,
  CreateDietPlanInput,
  CreateFoodItemInput,
  UpdateDietPlanInput,
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

/** The single plan, for the edit form -- so a save is built on the plan as
 * it is now, not on a list row that may have aged. */
export function useDietPlan(id: string | undefined) {
  return useQuery({
    queryKey: [PLANS_KEY, "detail", id],
    queryFn: () => api.get<DietPlan>(`/diet-plans/${id}`),
    enabled: Boolean(id),
  });
}

export function useUpdateDietPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDietPlanInput }) =>
      api.patch<DietPlan>(`/diet-plans/${id}`, input),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: [PLANS_KEY] });
      queryClient.invalidateQueries({ queryKey: [PLANS_KEY, "detail", id] });
      // An assignment renders its plan's name, so a rename has to reach it.
      queryClient.invalidateQueries({ queryKey: [ASSIGNMENTS_KEY] });
    },
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

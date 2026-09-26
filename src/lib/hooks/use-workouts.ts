import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Exercise, WorkoutAssignment, WorkoutPlan } from "@/lib/types/gym";
import type { Paginated, PaginationParams } from "@/lib/types/pagination";
import type {
  AssignWorkoutPlanInput,
  CreateExerciseInput,
  CreateWorkoutPlanInput,
  UpdateWorkoutPlanInput,
} from "@/lib/validation/gym";

const EXERCISES_KEY = "exercises";
const PLANS_KEY = "workout-plans";
const ASSIGNMENTS_KEY = "workout-assignments";

export function useExercises() {
  return useQuery({
    queryKey: [EXERCISES_KEY],
    queryFn: () => api.get<Exercise[]>("/exercises"),
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateExerciseInput) => api.post<Exercise>("/exercises", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [EXERCISES_KEY] }),
  });
}

export function useWorkoutPlans(params: PaginationParams = {}) {
  return useQuery({
    queryKey: [PLANS_KEY, params],
    queryFn: () => api.get<Paginated<WorkoutPlan>>("/workout-plans", { query: params }),
  });
}

export function useCreateWorkoutPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWorkoutPlanInput) => api.post<WorkoutPlan>("/workout-plans", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [PLANS_KEY] }),
  });
}

/** The single plan, for the edit form. The list row carries the same shape,
 * but the form must not save a plan that moved since the page loaded. */
export function useWorkoutPlan(id: string | undefined) {
  return useQuery({
    queryKey: [PLANS_KEY, "detail", id],
    queryFn: () => api.get<WorkoutPlan>(`/workout-plans/${id}`),
    enabled: Boolean(id),
  });
}

export function useUpdateWorkoutPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateWorkoutPlanInput }) =>
      api.patch<WorkoutPlan>(`/workout-plans/${id}`, input),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: [PLANS_KEY] });
      queryClient.invalidateQueries({ queryKey: [PLANS_KEY, "detail", id] });
      // An assignment renders its plan's name, so a rename has to reach it.
      queryClient.invalidateQueries({ queryKey: [ASSIGNMENTS_KEY] });
    },
  });
}

export function useAssignWorkoutPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, input }: { planId: string; input: AssignWorkoutPlanInput }) =>
      api.post<WorkoutAssignment>(`/workout-plans/${planId}/assign`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ASSIGNMENTS_KEY] }),
  });
}

export function useWorkoutAssignments(params: PaginationParams & { memberId?: string } = {}) {
  return useQuery({
    queryKey: [ASSIGNMENTS_KEY, params],
    queryFn: () => api.get<Paginated<WorkoutAssignment>>("/workout-assignments", { query: params }),
  });
}

export function useUpdateWorkoutAssignmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "COMPLETED" | "CANCELLED" }) =>
      api.patch<WorkoutAssignment>(`/workout-assignments/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ASSIGNMENTS_KEY] }),
  });
}

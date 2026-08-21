import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Exercise, WorkoutAssignment, WorkoutPlan } from "@/lib/types/gym";
import type { Paginated, PaginationParams } from "@/lib/types/pagination";
import type {
  AssignWorkoutPlanInput,
  CreateExerciseInput,
  CreateWorkoutPlanInput,
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

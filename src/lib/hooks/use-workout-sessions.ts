import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api/client"

export type WorkoutSessionSummary = {
  id: string
  assignmentId: string
  memberId: string
  branchId: string
  sessionDate: string
  status: "IN_PROGRESS" | "COMPLETED"
  startedAt: string
  completedAt: string | null
  notes: string | null
  firstName: string
  lastName: string
  workoutPlanName: string
}

export type WorkoutSession = WorkoutSessionSummary & {
  exercises: Array<{
    id: string
    exerciseId: string | null
    exerciseName: string
    setsTarget: number | null
    repsTarget: string | null
    restSeconds: number | null
    displayOrder: number
    notes: string | null
  }>
  sets: Array<{
    id: string
    sessionExerciseId: string
    setNumber: number
    weightKg: string | null
    reps: number | null
    rpe: string | null
    notes: string | null
    completedAt: string
  }>
}

const KEY = "workout-sessions"

export function useTodayWorkoutSessions() {
  return useQuery({
    queryKey: [KEY, "today"],
    queryFn: () => api.get<WorkoutSessionSummary[]>("/workout-sessions/today"),
  })
}

export function useWorkoutSession(id: string | null) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => api.get<WorkoutSession>(`/workout-sessions/${id}`),
    enabled: Boolean(id),
  })
}

export function useStartWorkoutSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ assignmentId, notes }: { assignmentId: string; notes?: string }) =>
      api.post<WorkoutSession>(`/workout-sessions/assignment/${assignmentId}/start`, { notes }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useLogWorkoutSet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, sessionExerciseId, setNumber, weightKg, reps, rpe, notes }: {
      sessionId: string
      sessionExerciseId: string
      setNumber: number
      weightKg?: number
      reps?: number
      rpe?: number
      notes?: string
    }) => api.post<WorkoutSession>(`/workout-sessions/${sessionId}/exercises/${sessionExerciseId}/sets`, { setNumber, weightKg, reps, rpe, notes }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [KEY, variables.sessionId] })
      queryClient.invalidateQueries({ queryKey: [KEY, "today"] })
    },
  })
}

export function useCompleteWorkoutSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) => api.patch<WorkoutSession>(`/workout-sessions/${sessionId}/complete`, {}),
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: [KEY, sessionId] })
      queryClient.invalidateQueries({ queryKey: [KEY, "today"] })
    },
  })
}

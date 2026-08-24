import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api/client"

type WorkoutHistoryItem = {
  id: string
  sessionDate: string
  status: string
  startedAt?: string | null
  completedAt?: string | null
  workoutPlanName?: string | null
  volumeKg: number | string
  setsLogged: number | string
}

type ExerciseHistoryItem = {
  exerciseId: string
  sessionDate: string
  exerciseName: string
  setNumber: number
  weightKg?: number | string | null
  reps?: number | null
  rpe?: number | string | null
  completedAt?: string | null
}

export function useMemberWorkoutHistory(memberId: string, limit = 30) {
  return useQuery({
    queryKey: ["workout-history", "member", memberId, limit],
    queryFn: () => api.get<WorkoutHistoryItem[]>(`/workout-history/members/${memberId}`, { query: { limit } }),
    enabled: Boolean(memberId),
  })
}

export function useMemberExerciseHistory(memberId: string, exerciseId?: string, limit = 20) {
  return useQuery({
    queryKey: ["workout-history", "member", memberId, "exercise", exerciseId, limit],
    queryFn: () => api.get<ExerciseHistoryItem[]>(`/workout-history/members/${memberId}/exercises/${exerciseId}`, { query: { limit } }),
    enabled: Boolean(memberId && exerciseId),
  })
}

export type { ExerciseHistoryItem, WorkoutHistoryItem }

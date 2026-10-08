import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api/client"

type WorkoutHistoryItem = {
  id: string
  sessionDate: string
  status: string
  startedAt?: string | null
  completedAt?: string | null
  workoutPlanName?: string | null
  volumeKg: number
  setsLogged: number
}

export function useMemberWorkoutHistory(memberId: string, limit = 30) {
  return useQuery({
    queryKey: ["workout-history", "member", memberId, limit],
    queryFn: () => api.get<WorkoutHistoryItem[]>(`/workout-sessions/member/${memberId}/history`, { query: { limit } }),
    enabled: Boolean(memberId),
  })
}

export type { WorkoutHistoryItem }

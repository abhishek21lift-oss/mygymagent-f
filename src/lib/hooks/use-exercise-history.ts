import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api/client"

/**
 * Every logged set of one exercise, for one member, newest session first.
 *
 * The endpoint existed and nothing called it, so a trainer could record
 * sets week after week and had no way to see whether the weight was going
 * up. That is the question the data was being collected to answer.
 *
 * The rows come back in the raw query's snake_case, not the camelCase the
 * rest of this API uses -- the service returns `$queryRaw` output
 * directly. Typed as it actually is rather than renamed here, so the
 * shape in the editor is the shape on the wire.
 */
export interface ExerciseHistoryRow {
  session_id: string
  session_date: string
  session_status: string
  set_number: number
  weight_kg: number | null
  reps: number | null
  rpe: number | null
}

export const EXERCISE_HISTORY_KEY = "exercise-history"

export function useExerciseHistory(
  memberId: string | undefined,
  exerciseId: string | undefined,
  limit = 50,
) {
  return useQuery({
    queryKey: [EXERCISE_HISTORY_KEY, memberId, exerciseId, limit],
    queryFn: () =>
      api.get<ExerciseHistoryRow[]>("/workouts/exercise-history", {
        query: { memberId: memberId!, exerciseId: exerciseId!, limit },
      }),
    enabled: Boolean(memberId && exerciseId),
  })
}

/** Heaviest set, and the estimated one-rep max behind it (Epley). */
export function bestSet(rows: ExerciseHistoryRow[]) {
  let best: ExerciseHistoryRow | null = null
  for (const row of rows) {
    if (row.weight_kg == null) continue
    if (!best || row.weight_kg > (best.weight_kg ?? 0)) best = row
  }
  if (!best || best.weight_kg == null) return null
  const reps = best.reps ?? 1
  return {
    row: best,
    // Epley. Whole kilos: a one-rep max quoted to two decimals implies a
    // precision that a set of eight does not have.
    estimatedOneRepMax: Math.round(best.weight_kg * (1 + reps / 30)),
  }
}

"use client";

import * as React from "react";
import { Dumbbell, TrendingUp } from "lucide-react";

import { DataState } from "@/components/shared/data-state";
import { Panel } from "@/components/shared/panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useExercises } from "@/lib/hooks/use-workouts";
import { bestSet, useExerciseHistory } from "@/lib/hooks/use-exercise-history";

/**
 * How one lift has moved for one member.
 *
 * `/workouts/exercise-history` was built and never called, so sets were
 * being logged week after week with no way to see whether the weight was
 * going up -- which is the question the logging exists to answer.
 *
 * Choosing the exercise is the whole interaction: the endpoint is per
 * exercise by design, because "all history" for a member is the session
 * list that already exists one panel up. The estimated one-rep max is
 * Epley, rounded to whole kilos -- quoting two decimals off a set of
 * eight implies a precision the number does not have.
 */
export function ExerciseHistoryPanel({ memberId }: { memberId: string }) {
  const exercises = useExercises();
  const [exerciseId, setExerciseId] = React.useState("");
  const history = useExerciseHistory(memberId, exerciseId || undefined);

  const rows = history.data ?? [];
  const best = React.useMemo(() => bestSet(rows), [rows]);
  const sessions = React.useMemo(
    () => new Set(rows.map((r) => r.session_id)).size,
    [rows],
  );

  return (
    <Panel
      title="Exercise history"
      titleId="exercise-history"
      description="Every logged set of one lift, newest session first."
      actions={
        <select
          aria-label="Exercise"
          value={exerciseId}
          onChange={(e) => setExerciseId(e.target.value)}
          className="h-9 rounded-md border border-input bg-card px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">
            {exercises.isPending ? "Loading exercises…" : "Choose an exercise"}
          </option>
          {(exercises.data ?? []).map((exercise) => (
            <option key={exercise.id} value={exercise.id}>
              {exercise.name}
            </option>
          ))}
        </select>
      }
    >
      {!exerciseId ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Pick an exercise to see this member&apos;s sets and whether the weight is
          moving.
        </p>
      ) : (
        <DataState
          isLoading={history.isPending}
          isError={history.isError}
          onRetry={() => void history.refetch()}
          errorMessage="Could not load the history for this exercise."
          isEmpty={rows.length === 0}
          emptyIcon={Dumbbell}
          emptyTitle="Nothing logged for this exercise"
          emptyDescription="Sets recorded in a workout session will appear here."
        >
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div className="rounded-lg border border-border px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Sessions
                </p>
                <p className="mt-0.5 text-lg font-semibold tabular-nums">{sessions}</p>
              </div>
              <div className="rounded-lg border border-border px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Heaviest set
                </p>
                <p className="mt-0.5 text-lg font-semibold tabular-nums">
                  {best ? `${best.row.weight_kg} kg × ${best.row.reps ?? "—"}` : "—"}
                </p>
              </div>
              <div className="rounded-lg border border-border px-3 py-2">
                <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <TrendingUp className="size-3" aria-hidden="true" /> Est. 1RM
                </p>
                <p className="mt-0.5 text-lg font-semibold tabular-nums">
                  {best ? `${best.estimatedOneRepMax} kg` : "—"}
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session</TableHead>
                    <TableHead className="text-right">Set</TableHead>
                    <TableHead className="text-right">Weight</TableHead>
                    <TableHead className="text-right">Reps</TableHead>
                    <TableHead className="text-right">RPE</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={`${row.session_id}-${row.set_number}`}>
                      <TableCell className="tabular-nums">
                        {new Date(row.session_date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.set_number}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.weight_kg != null ? `${row.weight_kg} kg` : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.reps ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.rpe ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </DataState>
      )}
    </Panel>
  );
}

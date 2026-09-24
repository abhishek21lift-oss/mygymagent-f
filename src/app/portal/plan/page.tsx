"use client";

import { Dumbbell } from "lucide-react";

import { PageHero } from "@/components/shared/page-hero";
import { DataState } from "@/components/shared/data-state";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/shared/panel";
import { usePortalWorkouts } from "@/lib/hooks/use-portal";

/**
 * `WorkoutPlan.exercises` is a Json column written by the staff-side
 * builder, so its shape is not guaranteed by any type. This reads the
 * fields it knows and renders nothing rather than crashing when one is
 * missing — a member with an oddly-shaped plan should still see the rest
 * of their plan.
 */
type LooseExercise = {
  name?: unknown;
  exerciseName?: unknown;
  sets?: unknown;
  reps?: unknown;
  notes?: unknown;
};

function readExercises(raw: unknown): LooseExercise[] {
  return Array.isArray(raw) ? (raw as LooseExercise[]) : [];
}

const text = (v: unknown) =>
  typeof v === "string" || typeof v === "number" ? String(v) : null;

export default function PortalPlan() {
  const workouts = usePortalWorkouts();
  const items = workouts.data?.items ?? [];

  return (
    <div className="flex flex-col gap-4">
      <PageHero icon={Dumbbell} title="Training" description="The plan your trainer assigned" />
      <DataState
        isLoading={workouts.isPending}
        isError={workouts.isError}
        onRetry={() => void workouts.refetch()}
        errorMessage="Your training plan could not be loaded."
        isEmpty={items.length === 0}
        emptyIcon={Dumbbell}
        emptyTitle="No training plan yet"
        emptyDescription="Your trainer will assign one and it will appear here."
        skeletonRows={4}
      >
        {items.map((assignment) => {
          const exercises = readExercises(assignment.workoutPlan?.exercises);
          return (
            <Panel
              key={assignment.id}
              title={assignment.workoutPlan?.name ?? "Training plan"}
              titleId={`plan-${assignment.id}`}
              description={
                assignment.workoutPlan?.description ??
                `From ${new Date(assignment.startDate).toLocaleDateString()}`
              }
              actions={
                <Badge
                  variant={assignment.status === "ACTIVE" ? "secondary" : "outline"}
                  className="rounded-full"
                >
                  {assignment.status}
                </Badge>
              }
              flush
            >
              {exercises.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground sm:p-5">
                  This plan has no exercises listed yet.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {exercises.map((ex, i) => {
                    const name = text(ex.name) ?? text(ex.exerciseName) ?? `Exercise ${i + 1}`;
                    const sets = text(ex.sets);
                    const reps = text(ex.reps);
                    return (
                      <li key={i} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{name}</p>
                          {text(ex.notes) && (
                            <p className="truncate text-xs text-muted-foreground">
                              {text(ex.notes)}
                            </p>
                          )}
                        </div>
                        {(sets || reps) && (
                          <span className="shrink-0 font-mono text-sm tabular-nums text-muted-foreground">
                            {sets ?? "—"} × {reps ?? "—"}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          );
        })}
      </DataState>
    </div>
  );
}

"use client";

import { CalendarClock, Dumbbell, History } from "lucide-react";

import { PageHero } from "@/components/shared/page-hero";
import { DataState } from "@/components/shared/data-state";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/shared/panel";
import {
  usePortalTraining,
  usePortalWorkouts,
  type PortalPtSession,
} from "@/lib/hooks/use-portal";

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
      <PersonalTraining />
    </div>
  );
}

const PT_STATUS: Record<PortalPtSession["status"], string> = {
  SCHEDULED: "Booked",
  COMPLETED: "Done",
  CANCELLED: "Cancelled",
  NO_SHOW: "Missed",
};

function when(session: PortalPtSession) {
  const start = new Date(session.startTime);
  return `${start.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}, ${start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
}

function SessionRow({ session }: { session: PortalPtSession }) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
      <div className="min-w-0">
        <p className="text-sm font-medium">{when(session)}</p>
        <p className="truncate text-xs text-muted-foreground">
          {[session.trainerName, session.branch?.name].filter(Boolean).join(" · ") || "Personal training"}
        </p>
      </div>
      <Badge
        variant={session.status === "SCHEDULED" ? "secondary" : "outline"}
        className="shrink-0 rounded-full"
      >
        {PT_STATUS[session.status] ?? session.status}
      </Badge>
    </li>
  );
}

/**
 * Personal training and the workouts the member actually logged. Hidden
 * section by section when empty: most members have no PT package, and a
 * panel saying so under their plan is clutter, not information.
 */
function PersonalTraining() {
  const training = usePortalTraining();
  if (training.isPending) return null;
  if (training.isError) {
    return (
      <Panel title="Personal training" titleId="portal-pt">
        <p className="text-sm text-muted-foreground">
          Your personal training could not be loaded.{" "}
          <button
            type="button"
            onClick={() => void training.refetch()}
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Try again
          </button>
        </p>
      </Panel>
    );
  }

  const { packages, upcomingSessions, pastSessions, workoutSessions } = training.data;
  const livePackages = packages.filter((p) => p.status === "ACTIVE");

  return (
    <>
      {(livePackages.length > 0 || upcomingSessions.length > 0) && (
        <Panel title="Personal training" titleId="portal-pt" flush>
          {livePackages.length > 0 && (
            <ul className="divide-y divide-border border-b border-border">
              {livePackages.map((pkg) => {
                const pct = pkg.totalSessions > 0 ? (pkg.usedSessions / pkg.totalSessions) * 100 : 0;
                return (
                  <li key={pkg.id} className="flex flex-col gap-2 px-4 py-3 sm:px-5">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm font-medium">{pkg.name}</p>
                      <p className="shrink-0 text-sm tabular-nums">
                        <span className="font-semibold">{pkg.remainingSessions}</span>
                        <span className="text-muted-foreground"> of {pkg.totalSessions} left</span>
                      </p>
                    </div>
                    <div
                      className="h-1.5 overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                      aria-label={`${pkg.name}: ${pkg.usedSessions} of ${pkg.totalSessions} sessions used`}
                      aria-valuemin={0}
                      aria-valuemax={pkg.totalSessions}
                      aria-valuenow={pkg.usedSessions}
                    >
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Use by {new Date(pkg.endDate).toLocaleDateString()}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
          {upcomingSessions.length > 0 ? (
            <>
              <p className="flex items-center gap-1.5 px-4 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-5">
                <CalendarClock className="size-3.5" aria-hidden="true" />
                Coming up
              </p>
              <ul className="divide-y divide-border">
                {upcomingSessions.map((s) => (
                  <SessionRow key={s.id} session={s} />
                ))}
              </ul>
            </>
          ) : (
            <p className="px-4 py-3 text-sm text-muted-foreground sm:px-5">
              No sessions booked. Your trainer books them with you.
            </p>
          )}
        </Panel>
      )}

      {workoutSessions.length > 0 && (
        <Panel
          title="Workout log"
          titleId="portal-workout-log"
          description="Sessions you have logged, newest first"
          actions={<History className="size-4 text-muted-foreground" aria-hidden="true" />}
          flush
        >
          <ul className="divide-y divide-border">
            {workoutSessions.map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{w.planName}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(w.sessionDate).toLocaleDateString()} · {w.setCount} set
                    {w.setCount === 1 ? "" : "s"}
                    {w.status === "IN_PROGRESS" && " · in progress"}
                  </p>
                </div>
                {Number(w.volumeKg) > 0 && (
                  <span className="shrink-0 text-sm tabular-nums">
                    {Number(w.volumeKg).toLocaleString()} <span className="text-muted-foreground">kg moved</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {pastSessions.length > 0 && (
        <Panel title="Past PT sessions" titleId="portal-pt-history" flush>
          <ul className="divide-y divide-border">
            {pastSessions.slice(0, 10).map((s) => (
              <SessionRow key={s.id} session={s} />
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}

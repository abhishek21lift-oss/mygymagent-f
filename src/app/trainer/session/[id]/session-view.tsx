"use client";

import * as React from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Dumbbell } from "lucide-react";
import { toast } from "sonner";

import { DataState } from "@/components/shared/data-state";
import { ApiError } from "@/lib/api/client";
import {
  useCompleteWorkoutSession,
  useLogWorkoutSet,
  useWorkoutSession,
  type WorkoutSession,
} from "@/lib/hooks/use-workout-sessions";

type Exercise = WorkoutSession["exercises"][number];
type LoggedSet = WorkoutSession["sets"][number];
type Draft = { weightKg: string; reps: string; rpe: string };

const EMPTY_DRAFT: Draft = { weightKg: "", reps: "", rpe: "" };

/**
 * Logging a session from a phone on the gym floor.
 *
 * Each exercise shows its target, the sets already logged and one entry
 * row for the next set. The row keeps what was just entered after a set
 * is logged, because the next set is usually the same weight: a working
 * set of five at 180 kg is one tap per set, not three fields per set.
 */
export function TrainerSessionView({ sessionId }: { sessionId: string }) {
  const session = useWorkoutSession(sessionId);
  const logSet = useLogWorkoutSet();
  const complete = useCompleteWorkoutSession();
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = React.useState<Record<string, Draft>>({});

  // The trainer home reads its own keys; refresh them so "on the floor",
  // "to go" and "done" are right on the way back.
  const refreshHome = () => {
    void queryClient.invalidateQueries({ queryKey: ["trainer-sessions"] });
    void queryClient.invalidateQueries({ queryKey: ["trainer-assignments"] });
  };

  async function saveSet(exercise: Exercise, setNumber: number) {
    const draft = drafts[exercise.id] ?? EMPTY_DRAFT;
    const weightKg = toNumber(draft.weightKg);
    const reps = toNumber(draft.reps);
    const rpe = toNumber(draft.rpe);
    if (weightKg === undefined && reps === undefined) {
      toast.error("Enter the weight or the reps for this set.");
      return;
    }
    try {
      await logSet.mutateAsync({ sessionId, sessionExerciseId: exercise.id, setNumber, weightKg, reps, rpe });
      toast.success(`${exercise.exerciseName}: set ${setNumber} logged`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "The set could not be saved.");
    }
  }

  async function finish() {
    try {
      await complete.mutateAsync(sessionId);
      refreshHome();
      toast.success("Session complete");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "The session could not be completed.");
    }
  }

  const data = session.data;
  const running = data?.status === "IN_PROGRESS";
  const exercises = [...(data?.exercises ?? [])].sort((a, b) => a.displayOrder - b.displayOrder);
  const loggedCount = data?.sets.length ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/trainer"
        onClick={refreshHome}
        className="inline-flex min-h-11 w-fit items-center gap-1.5 rounded-[var(--t-radius-pill)] px-2 text-[0.9375rem] font-bold text-[var(--t-ink-muted)] transition hover:text-[var(--t-ink)]"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Today&rsquo;s sessions
      </Link>

      <DataState
        isLoading={session.isPending}
        isError={session.isError}
        onRetry={() => void session.refetch()}
        errorMessage="This session could not be loaded."
        isEmpty={!data}
        emptyTitle="Session not found"
        emptyDescription="It may have been removed, or it belongs to another gym."
        skeletonRows={4}
      >
        {data ? (
          <>
            <header className="rounded-[var(--t-radius-card)] bg-[var(--t-card)] p-6 shadow-[var(--t-shadow-card)]">
              <p className="text-[0.8125rem] font-extrabold uppercase tracking-[0.14em] text-[var(--t-ink-muted)]">
                {running ? "On the floor" : "Completed"}
              </p>
              <h1 className="mt-1 [overflow-wrap:anywhere] text-[clamp(1.5rem,6vw,1.875rem)] font-extrabold leading-tight tracking-[-0.02em] text-[var(--t-ink)]">
                {`${data.firstName} ${data.lastName}`.trim()}
              </h1>
              <p className="mt-1 text-[1rem] font-medium text-[var(--t-ink-muted)]">
                {data.workoutPlanName || "No programme"} · {loggedCount} {loggedCount === 1 ? "set" : "sets"} logged
              </p>
            </header>

            {exercises.length === 0 ? (
              <p className="rounded-[1.25rem] bg-[var(--t-card)] p-6 text-center text-[0.9375rem] font-medium text-[var(--t-ink-muted)]">
                This plan has no exercises. Add some to the plan, then start a new session.
              </p>
            ) : (
              <ol className="flex flex-col gap-3">
                {exercises.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    sets={data.sets.filter((set) => set.sessionExerciseId === exercise.id)}
                    running={running}
                    draft={drafts[exercise.id] ?? EMPTY_DRAFT}
                    onDraft={(draft) => setDrafts((current) => ({ ...current, [exercise.id]: draft }))}
                    onLog={(setNumber) => void saveSet(exercise, setNumber)}
                    saving={logSet.isPending && logSet.variables?.sessionExerciseId === exercise.id}
                  />
                ))}
              </ol>
            )}

            {running ? (
              <button
                type="button"
                onClick={() => void finish()}
                disabled={complete.isPending}
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-[var(--t-radius-pill)] bg-[linear-gradient(135deg,var(--t-teal-grad-a),var(--t-teal-grad-b))] px-6 text-[1.0625rem] font-extrabold text-white shadow-[var(--t-shadow-cta)] transition-transform active:scale-[0.98] disabled:opacity-50"
              >
                <Check className="size-5" strokeWidth={3} aria-hidden="true" />
                {complete.isPending ? "Finishing…" : "Finish session"}
              </button>
            ) : (
              <p className="flex items-center justify-center gap-2 rounded-[1.25rem] bg-[var(--t-teal-tint)] p-4 text-[0.9375rem] font-bold text-[var(--t-teal)]">
                <Check className="size-4" strokeWidth={3} aria-hidden="true" />
                Session complete{data.completedAt ? ` at ${clock(data.completedAt)}` : ""}
              </p>
            )}
          </>
        ) : null}
      </DataState>
    </div>
  );
}

function ExerciseCard({
  exercise,
  sets,
  running,
  draft,
  onDraft,
  onLog,
  saving,
}: {
  exercise: Exercise;
  sets: LoggedSet[];
  running: boolean;
  draft: Draft;
  onDraft: (draft: Draft) => void;
  onLog: (setNumber: number) => void;
  saving: boolean;
}) {
  const ordered = [...sets].sort((a, b) => a.setNumber - b.setNumber);
  const next = (ordered.at(-1)?.setNumber ?? 0) + 1;
  const target = [exercise.setsTarget ? `${exercise.setsTarget} sets` : null, exercise.repsTarget ? `${exercise.repsTarget} reps` : null]
    .filter(Boolean)
    .join(" × ");
  const done = exercise.setsTarget !== null && ordered.length >= exercise.setsTarget;
  const titleId = `exercise-${exercise.id}`;

  return (
    <li aria-labelledby={titleId} className="rounded-[1.5rem] bg-[var(--t-card)] p-5 shadow-[var(--t-shadow-card)]">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="grid size-11 shrink-0 place-items-center rounded-[0.875rem] text-white"
          style={{ backgroundImage: "linear-gradient(140deg, var(--t-coral), var(--t-pink))" }}
        >
          {done ? <Check className="size-5" strokeWidth={3} /> : <Dumbbell className="size-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="[overflow-wrap:anywhere] text-[1.1875rem] font-extrabold leading-snug text-[var(--t-ink)]">
            {exercise.exerciseName}
          </h2>
          <p className="text-[0.875rem] font-semibold text-[var(--t-ink-muted)]">
            {target ? `Target ${target}` : "No target set"}
            {exercise.restSeconds ? ` · rest ${exercise.restSeconds}s` : ""}
          </p>
        </div>
        <span className="shrink-0 rounded-[var(--t-radius-pill)] bg-[var(--t-card-sunken)] px-3 py-1 text-[0.8125rem] font-bold tabular-nums text-[var(--t-ink)]">
          {ordered.length}
          {exercise.setsTarget ? `/${exercise.setsTarget}` : ""}
        </span>
      </div>

      {exercise.notes ? <p className="mt-2 text-[0.875rem] text-[var(--t-ink-muted)]">{exercise.notes}</p> : null}

      {ordered.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-1.5" aria-label={`${exercise.exerciseName} logged sets`}>
          {ordered.map((set) => (
            <li
              key={set.id}
              className="flex items-center justify-between rounded-[0.75rem] bg-[var(--t-card-sunken)] px-3 py-2 text-[0.9375rem] font-semibold tabular-nums text-[var(--t-ink)]"
            >
              <span className="text-[var(--t-ink-muted)]">Set {set.setNumber}</span>
              <span>
                {set.weightKg !== null ? `${Number(set.weightKg)} kg` : "—"} × {set.reps ?? "—"}
                {set.rpe !== null ? ` · RPE ${Number(set.rpe)}` : ""}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {running ? (
        <form
          className="mt-3 grid grid-cols-[1fr_1fr_1fr] gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            onLog(next);
          }}
        >
          <NumberField label="kg" name={`${exercise.exerciseName} weight in kg`} value={draft.weightKg} decimal onChange={(weightKg) => onDraft({ ...draft, weightKg })} />
          <NumberField label="reps" name={`${exercise.exerciseName} reps`} value={draft.reps} onChange={(reps) => onDraft({ ...draft, reps })} />
          <NumberField label="RPE" name={`${exercise.exerciseName} RPE`} value={draft.rpe} decimal onChange={(rpe) => onDraft({ ...draft, rpe })} />
          <button
            type="submit"
            disabled={saving}
            className="col-span-3 inline-flex min-h-12 items-center justify-center rounded-[var(--t-radius-pill)] bg-[linear-gradient(135deg,var(--t-violet),var(--t-violet-ink))] px-5 text-[1rem] font-extrabold text-white shadow-[var(--t-shadow-cta-violet)] transition-transform active:scale-[0.97] disabled:opacity-50 sm:col-span-1"
          >
            {saving ? "Saving…" : `Log set ${next}`}
          </button>
        </form>
      ) : null}
    </li>
  );
}

function NumberField({
  label,
  name,
  value,
  decimal = false,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  decimal?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex min-h-12 items-center gap-1.5 rounded-[0.875rem] bg-[var(--t-card-sunken)] px-3 ring-1 ring-[var(--t-line)] focus-within:ring-2 focus-within:ring-[var(--t-violet)]">
      <input
        aria-label={name}
        inputMode={decimal ? "decimal" : "numeric"}
        value={value}
        onChange={(event) => onChange(event.target.value.replace(decimal ? /[^\d.]/g : /\D/g, ""))}
        className="w-full min-w-0 bg-transparent text-[1.0625rem] font-bold tabular-nums text-[var(--t-ink)] outline-none placeholder:text-[var(--t-ink-faint)]"
        placeholder="0"
      />
      <span aria-hidden="true" className="text-[0.8125rem] font-bold text-[var(--t-ink-muted)]">
        {label}
      </span>
    </label>
  );
}

function toNumber(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function clock(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

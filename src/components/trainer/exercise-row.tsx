"use client";

import { cn } from "@/lib/utils";
import { ExerciseTag, type ChipTone } from "./exercise-library";

/**
 * One row in the exercise list.
 *
 * The reference's row is a lot of information in a narrow band, and the
 * thing that makes it legible is that the two tiers are typographically
 * far apart: a 26px extrabold name against 15px semibold chips, with
 * the date pushed to the right on the last line. Everything here follows
 * from keeping that gap honest rather than from any one token.
 */

export type ExerciseRowData = {
  id: string;
  name: string;
  primaryMuscle: string;
  secondaryMuscle?: string | null;
  equipment?: string | null;
  difficulty?: string | null;
  exerciseType?: string | null;
  movementPattern?: string | null;
  trainingGoal?: string | null;
  prescription?: string | null;
  updatedLabel?: string | null;
  gradient: [string, string];
};

export function ExerciseRow({
  exercise,
}: {
  exercise: ExerciseRowData;
}) {
  return (
    <article className="flex gap-4 border-b border-[#f1f3f7] py-5 last:border-b-0">
      <span
        data-gradient
        aria-hidden="true"
        className="grid size-16 shrink-0 place-items-center rounded-[1.25rem] text-white"
        style={{
          backgroundImage: `linear-gradient(140deg, ${exercise.gradient[0]}, ${exercise.gradient[1]})`,
          boxShadow: "var(--t-shadow-tile)",
        }}
      >
        <svg
          viewBox="0 0 24 24"
          className="size-8"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
        >
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="3.5" />
        </svg>
      </span>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[1.625rem] font-extrabold tracking-tight text-[#111827]">
          {exercise.name}
        </h3>
        <p className="mt-0.5 flex items-center gap-1.5 text-[1.0625rem] leading-tight">
          <span className="truncate font-extrabold text-[#0d9488]">
            {exercise.primaryMuscle}
          </span>
          {exercise.secondaryMuscle ? (
            <>
              <span aria-hidden="true" className="text-[var(--t-ink-faint)]">
                &middot;
              </span>
              <span className="truncate font-medium text-[var(--t-ink-faint)]">
                {exercise.secondaryMuscle}
              </span>
            </>
          ) : null}
        </p>

        <ul className="mt-2.5 flex flex-wrap gap-2">
          {exercise.equipment ? (
            <li>
              <ExerciseTag tone="neutral">{exercise.equipment}</ExerciseTag>
            </li>
          ) : null}
          {exercise.difficulty ? (
            <li>
              <ExerciseTag tone={difficultyTone(exercise.difficulty)}>
                {exercise.difficulty.toLowerCase()}
              </ExerciseTag>
            </li>
          ) : null}
          {exercise.exerciseType ? (
            <li>
              <ExerciseTag tone="blue">{exercise.exerciseType}</ExerciseTag>
            </li>
          ) : null}
          {exercise.movementPattern ? (
            <li>
              <ExerciseTag
                tone={exercise.movementPattern === "Stretching" ? "neutral" : "blue"}
              >
                {exercise.movementPattern}
              </ExerciseTag>
            </li>
          ) : null}
          {exercise.trainingGoal ? (
            <li>
              <ExerciseTag tone="neutral">{exercise.trainingGoal}</ExerciseTag>
            </li>
          ) : null}
        </ul>

        {/* Prescription only. The reference shows a movement-pattern chip
            on the row and a *different*, more specific movement name on
            this line ("Pull" above, "Trunk Flexion" here) -- two separate
            fields. The adapter carries one, so repeating it here printed
            "Anti-Extension" twice per row and pushed the sets x reps
            into an ellipsis. Showing it once, as the chip, loses nothing
            and leaves this line for the prescription. */}
        <div className="mt-3 flex items-baseline justify-between gap-3">
          <p className="truncate text-[1rem] font-medium text-[#6b7280]">
            {exercise.prescription}
          </p>
          {exercise.updatedLabel ? (
            <p className="shrink-0 text-[1rem] font-medium text-[var(--t-ink-faint)]">
              {exercise.updatedLabel}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

/** The reference colours "beginner" green and "intermediate" orange. */
function difficultyTone(difficulty: string): ChipTone {
  const value = difficulty.toLowerCase();
  if (value.startsWith("begin")) return "green";
  if (value.startsWith("inter")) return "orange";
  return "neutral";
}

export function ExerciseCountLine({
  from,
  to,
  total,
}: {
  from: number;
  to: number;
  total: number;
}) {
  return (
    <p className={cn("text-[1.125rem] font-medium text-[#6b7280]")}>
      Showing <span className="font-semibold text-[#374151]">{from}</span>&ndash;
      <span className="font-semibold text-[#374151]">{to}</span> of{" "}
      <span className="font-semibold text-[#374151]">{total}</span>
    </p>
  );
}

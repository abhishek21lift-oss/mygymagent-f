"use client";

import * as React from "react";
import {
  Activity,
  BicepsFlexed,
  Dumbbell,
  Filter,
  Footprints,
  Grid2x2,
  HeartPulse,
  ListFilter,
  Star,
  Waves,
  type LucideIcon,
} from "lucide-react";

import {
  ExerciseHeaderCard,
  ExerciseSearchBar,
  MuscleCategoryScroller,
  TrainerNewExerciseTrigger,
  type MuscleCategory,
} from "@/components/trainer/exercise-library";
import { NewExerciseDialog } from "@/components/workouts/new-exercise-dialog";
import { ExerciseCountLine, ExerciseRow, type ExerciseRowData } from "@/components/trainer/exercise-row";
import { DataState } from "@/components/shared/data-state";
import { useAuth } from "@/lib/auth/auth-context";
import { useTrainerExercises } from "@/lib/hooks/use-trainer";
import { bucketFor, metaFor, missingFromCatalog } from "@/lib/exercise-metadata";

/**
 * "Browse by muscle" over the real exercise library.
 *
 * Name, primary muscle, equipment and the updated date come from
 * `GET /exercises`. Secondary muscle, difficulty, type, movement pattern,
 * training goal and the sets x reps line come from the curated adapter in
 * `lib/exercise-metadata.ts`, because `Exercise` has no columns for them.
 * Both halves are labelled in that file's comment; this one just consumes
 * the merge.
 */

const MUSCLE_STYLE: Record<
  string,
  { gradient: [string, string]; Icon: LucideIcon }
> = {
  Shoulders: {
    gradient: ["var(--t-muscle-shoulders-a)", "var(--t-muscle-shoulders-b)"],
    Icon: Dumbbell,
  },
  Arms: {
    gradient: ["var(--t-muscle-arms-a)", "var(--t-muscle-arms-b)"],
    Icon: BicepsFlexed,
  },
  Legs: {
    gradient: ["var(--t-muscle-legs-a)", "var(--t-muscle-legs-b)"],
    Icon: Footprints,
  },
  Core: {
    gradient: ["var(--t-muscle-core-a)", "var(--t-muscle-core-b)"],
    Icon: Activity,
  },
  Back: {
    gradient: ["var(--t-muscle-back-a)", "var(--t-muscle-back-b)"],
    Icon: Waves,
  },
  Chest: {
    gradient: ["var(--t-muscle-full-a)", "var(--t-muscle-full-b)"],
    Icon: HeartPulse,
  },
};

const TILE_STYLES: Array<[string, string]> = [
  ["var(--t-tile-cyan-a)", "var(--t-tile-cyan-b)"],
  ["var(--t-tile-teal-a)", "var(--t-tile-teal-b)"],
  ["var(--t-tile-violet-a)", "var(--t-tile-violet-b)"],
  ["var(--t-tile-amber-a)", "var(--t-tile-amber-b)"],
  ["var(--t-tile-rose-a)", "var(--t-tile-rose-b)"],
];

const CHIPS = [
  { key: "filters", label: "Filters", Icon: ListFilter },
  { key: "favorites", label: "Favorites", Icon: Star },
  { key: "custom", label: "Custom", Icon: Grid2x2 },
  { key: "az", label: "A → Z", Icon: Filter },
];

const PAGE_SIZE = 48;

export default function TrainerExercisesPage() {
  const { hasPermission } = useAuth();
  // Same gate the staff workouts page applies. Without it this surface
  // offers a button that every request behind it 403s, which reads as a
  // broken app rather than a permission the user does not hold.
  const canCreate = hasPermission("workouts.create");
  const exercises = useTrainerExercises();
  // Memoised: `?? []` allocates a fresh array on every render, which
  // would change the identity of every useMemo keyed on it and defeat
  // the memoisation they exist to provide.
  const rows = React.useMemo(() => exercises.data ?? [], [exercises.data]);

  const [query, setQuery] = React.useState("");
  const [muscle, setMuscle] = React.useState<string | null>(null);
  const [chip, setChip] = React.useState<string | null>(null);
  const [limit, setLimit] = React.useState(PAGE_SIZE);

  const categories = React.useMemo<MuscleCategory[]>(() => {
    const counts = new Map<string, number>();
    for (const row of rows) {
      const bucket = bucketFor(row.muscleGroup);
      counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
    }
    return [...counts.entries()]
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => ({
        key,
        label: key,
        count,
        gradient: MUSCLE_STYLE[key]?.gradient ?? ["var(--t-muscle-full-a)", "var(--t-muscle-full-b)"],
        Icon: MUSCLE_STYLE[key]?.Icon ?? Dumbbell,
      }));
  }, [rows]);

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    const next = rows.filter((row) => {
      if (muscle && bucketFor(row.muscleGroup) !== muscle) return false;
      if (!needle) return true;
      return [row.name, row.muscleGroup, row.equipment]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(needle));
    });

    // "A → Z" is the only chip that changes the set rather than
    // narrowing it; the rest are placeholders until those screens exist,
    // and are announced as such rather than silently doing nothing.
    if (chip === "az") next.sort((a, b) => a.name.localeCompare(b.name));
    return next;
  }, [rows, query, muscle, chip]);

  const visible = filtered.slice(0, limit);

  const toRow = React.useCallback(
    (row: (typeof rows)[number], index: number): ExerciseRowData => {
      const meta = metaFor(row.name);
      return {
        id: row.id,
        name: row.name,
        primaryMuscle: row.muscleGroup ?? "General",
        secondaryMuscle: meta.secondaryMuscle,
        equipment: row.equipment,
        difficulty: meta.difficulty,
        exerciseType: meta.exerciseType,
        movementPattern: meta.movementPattern,
        trainingGoal: meta.trainingGoal,
        prescription: meta.prescription,
        updatedLabel: `Updated ${new Date(row.updatedAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}`,
        gradient: TILE_STYLES[index % TILE_STYLES.length],
      };
    },
    [],
  );

  // Surfaces in dev only: a name the adapter has no entry for falls back
  // to a plausible-looking row, which is exactly the kind of thing that
  // should be noticed rather than shipped quietly.
  const uncatalogued = React.useMemo(
    () => rows.filter((row) => missingFromCatalog(row.name)).length,
    [rows],
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        <ExerciseHeaderCard
          action={
            canCreate ? (
              <NewExerciseDialog
                trigger={TrainerNewExerciseTrigger}
                onCreated={() => void exercises.refetch()}
              />
            ) : undefined
          }
        />

        <h1 className="text-[length:var(--t-text-section)] font-extrabold tracking-tight text-[#0a0a0a]">
          Browse by muscle
        </h1>

        <DataState
          isLoading={exercises.isPending}
          isError={exercises.isError}
          onRetry={() => void exercises.refetch()}
          errorMessage="The exercise library could not be loaded."
          isEmpty={categories.length === 0}
          emptyTitle="No exercises yet"
          emptyDescription="Add exercises to see them grouped by muscle."
        >
          <MuscleCategoryScroller
            categories={categories}
            active={muscle}
            onSelect={(next) => {
              setMuscle(next);
              setLimit(PAGE_SIZE);
            }}
          />
        </DataState>
      </div>

      <ExerciseSearchBar
        query={query}
        onQueryChange={(value) => {
          setQuery(value);
          setLimit(PAGE_SIZE);
        }}
        chips={CHIPS.map((c) => ({ ...c }))}
        activeChip={chip}
        onChipSelect={(next) => {
          setChip(next);
          setLimit(PAGE_SIZE);
        }}
      />

      <DataState
        isLoading={exercises.isPending}
        isError={exercises.isError}
        onRetry={() => void exercises.refetch()}
        errorMessage="The exercise library could not be loaded."
        isEmpty={filtered.length === 0}
        emptyTitle="Nothing matches"
        emptyDescription="Try a different search or clear the muscle filter."
      >
        <section aria-label="Exercises" className="flex flex-col gap-4">
          <ExerciseCountLine from={visible.length ? 1 : 0} to={visible.length} total={filtered.length} />

          {process.env.NODE_ENV !== "production" && uncatalogued > 0 ? (
            <p className="rounded-xl bg-[var(--t-chip-orange-bg)] px-3 py-2 text-[0.8125rem] font-semibold text-[var(--t-chip-orange-ink)]">
              {uncatalogued} {uncatalogued === 1 ? "exercise has" : "exercises have"} no
              adapter entry and are showing fallback metadata.
            </p>
          ) : null}

          <div>
            {visible.map((row, index) => (
              <ExerciseRow key={row.id} exercise={toRow(row, index)} />
            ))}
          </div>

          {visible.length < filtered.length ? (
            <button
              type="button"
              onClick={() => setLimit((current) => current + PAGE_SIZE)}
              className="mx-auto min-h-12 rounded-[var(--t-radius-pill)] border border-[var(--t-line-strong)] bg-white px-6 text-[1rem] font-bold text-[#1f2937]"
            >
              Show more
            </button>
          ) : null}
        </section>
      </DataState>
    </div>
  );
}

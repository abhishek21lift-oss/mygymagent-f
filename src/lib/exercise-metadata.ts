/**
 * Exercise metadata the database does not carry.
 *
 * The reference list shows, per exercise: a primary muscle, a secondary
 * muscle, difficulty, exercise type, movement pattern, training goal and
 * a sets x reps prescription. `Exercise` in the schema has exactly five
 * columns -- name, muscleGroup, equipment, description, videoUrl -- so
 * four of those seven have nowhere to come from.
 *
 * The brief allows a typed adapter where data does not exist yet, and
 * this is it: name, primary muscle, equipment and the updated date are
 * read from the API and are real. Everything below is a curated catalog
 * keyed by exercise name.
 *
 * **This is a placeholder, not a source of truth, and it is written to
 * look like one in the UI.** Two consequences a reader should know:
 *
 * 1. A name not in the catalog gets a sensible fallback (below), so the
 *    screen never shows a hole -- which also means a missing entry is
 *    invisible rather than absent.
 * 2. Nothing here is tenant-specific. A gym that names an exercise
 *    "Squat" gets whatever the catalog says "Squat" is.
 *
 * The durable fix is columns on `Exercise` (difficulty, movementPattern,
 * trainingGoal, secondaryMuscle) and a real prescription source. That is
 * a schema decision and deliberately not smuggled in as seed data --
 * which is why `prisma/seed-exercises.ts` fills only the five real
 * fields and says so in its own output.
 */

/** The reference's broad buckets, mapped from the finer `muscleGroup`
 *  values the API returns. Twelve fine groups into six cards, because
 *  the reference shows six and a twelve-across scroller would be a
 *  different design. */
export const MUSCLE_BUCKETS: Record<string, string[]> = {
  Shoulders: ["Shoulders", "Traps"],
  Arms: ["Biceps", "Triceps", "Forearms"],
  Legs: ["Legs", "Hamstrings", "Glutes", "Calves"],
  Core: ["Core"],
  Back: ["Back"],
  Chest: ["Chest"],
};

export function bucketFor(muscleGroup: string | null): string {
  if (!muscleGroup) return "Core";
  for (const [bucket, groups] of Object.entries(MUSCLE_BUCKETS)) {
    if (groups.includes(muscleGroup)) return bucket;
  }
  return "Core";
}

export type ExerciseMeta = {
  secondaryMuscle: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  exerciseType: "Compound" | "Isolation";
  movementPattern: string;
  trainingGoal: string;
  prescription: string;
};

/**
 * Curated per exercise. Keys are the exact `Exercise.name` values the
 * seed writes, so a rename upstream degrades to the fallback rather than
 * silently losing its entry.
 */
const CATALOG: Record<string, ExerciseMeta> = {
  "Barbell Back Squat": {
    secondaryMuscle: "glutes, hamstrings",
    difficulty: "intermediate",
    exerciseType: "Compound",
    movementPattern: "Squat",
    trainingGoal: "Strength",
    prescription: "4-6×5-8",
  },
  "Front Squat": {
    secondaryMuscle: "glutes, core",
    difficulty: "intermediate",
    exerciseType: "Compound",
    movementPattern: "Squat",
    trainingGoal: "Strength",
    prescription: "3-5×4-6",
  },
  "Leg Press": {
    secondaryMuscle: "glutes, hamstrings",
    difficulty: "beginner",
    exerciseType: "Compound",
    movementPattern: "Squat",
    trainingGoal: "Hypertrophy",
    prescription: "3-4×8-12",
  },
  "Bulgarian Split Squat": {
    secondaryMuscle: "glutes, adductors",
    difficulty: "intermediate",
    exerciseType: "Compound",
    movementPattern: "Lunge",
    trainingGoal: "Unilateral",
    prescription: "3×8-10 each",
  },
  "Walking Lunge": {
    secondaryMuscle: "glutes",
    difficulty: "beginner",
    exerciseType: "Compound",
    movementPattern: "Lunge",
    trainingGoal: "Endurance",
    prescription: "3×12 each",
  },
  "Leg Extension": {
    secondaryMuscle: "",
    difficulty: "beginner",
    exerciseType: "Isolation",
    movementPattern: "Extension",
    trainingGoal: "Hypertrophy",
    prescription: "3×12-15",
  },
  "Conventional Deadlift": {
    secondaryMuscle: "lower back, glutes",
    difficulty: "advanced",
    exerciseType: "Compound",
    movementPattern: "Hinge",
    trainingGoal: "Strength",
    prescription: "3-5×3-5",
  },
  "Romanian Deadlift": {
    secondaryMuscle: "glutes, lower back",
    difficulty: "intermediate",
    exerciseType: "Compound",
    movementPattern: "Hinge",
    trainingGoal: "Strength",
    prescription: "3-4×6-10",
  },
  "Good Morning": {
    secondaryMuscle: "hamstrings",
    difficulty: "intermediate",
    exerciseType: "Compound",
    movementPattern: "Hinge",
    trainingGoal: "Strength",
    prescription: "3×8-10",
  },
  "Nordic Curl": {
    secondaryMuscle: "calves",
    difficulty: "advanced",
    exerciseType: "Isolation",
    movementPattern: "Flexion",
    trainingGoal: "Strength",
    prescription: "3×3-6",
  },
  "Lying Leg Curl": {
    secondaryMuscle: "calves",
    difficulty: "beginner",
    exerciseType: "Isolation",
    movementPattern: "Flexion",
    trainingGoal: "Hypertrophy",
    prescription: "3×10-12",
  },
  "Barbell Hip Thrust": {
    secondaryMuscle: "hamstrings",
    difficulty: "beginner",
    exerciseType: "Compound",
    movementPattern: "Extension",
    trainingGoal: "Strength",
    prescription: "3-4×8-12",
  },
  "Cable Pull-Through": {
    secondaryMuscle: "hamstrings",
    difficulty: "beginner",
    exerciseType: "Isolation",
    movementPattern: "Extension",
    trainingGoal: "Activation",
    prescription: "3×12-15",
  },
  "Glute Bridge": {
    secondaryMuscle: "hamstrings",
    difficulty: "beginner",
    exerciseType: "Isolation",
    movementPattern: "Extension",
    trainingGoal: "Activation",
    prescription: "3×15-20",
  },
  "Barbell Bench Press": {
    secondaryMuscle: "triceps, shoulders",
    difficulty: "intermediate",
    exerciseType: "Compound",
    movementPattern: "Press",
    trainingGoal: "Strength",
    prescription: "4-5×5-8",
  },
  "Incline Dumbbell Press": {
    secondaryMuscle: "shoulders, triceps",
    difficulty: "beginner",
    exerciseType: "Compound",
    movementPattern: "Press",
    trainingGoal: "Hypertrophy",
    prescription: "3-4×8-12",
  },
  "Push-Up": {
    secondaryMuscle: "triceps, core",
    difficulty: "beginner",
    exerciseType: "Compound",
    movementPattern: "Press",
    trainingGoal: "Conditioning",
    prescription: "3×10-20",
  },
  "Cable Fly": {
    secondaryMuscle: "shoulders",
    difficulty: "beginner",
    exerciseType: "Isolation",
    movementPattern: "Fly",
    trainingGoal: "Hypertrophy",
    prescription: "3×12-15",
  },
  "Dumbbell Pullover": {
    secondaryMuscle: "back",
    difficulty: "beginner",
    exerciseType: "Isolation",
    movementPattern: "Pull",
    trainingGoal: "Hypertrophy",
    prescription: "3×10-12",
  },
  "Barbell Row": {
    secondaryMuscle: "biceps, rear delts",
    difficulty: "intermediate",
    exerciseType: "Compound",
    movementPattern: "Pull",
    trainingGoal: "Strength",
    prescription: "4×6-10",
  },
  "Pull-Up": {
    secondaryMuscle: "biceps, core",
    difficulty: "intermediate",
    exerciseType: "Compound",
    movementPattern: "Pull",
    trainingGoal: "Strength",
    prescription: "4×5-10",
  },
  "Lat Pulldown": {
    secondaryMuscle: "biceps",
    difficulty: "beginner",
    exerciseType: "Compound",
    movementPattern: "Pull",
    trainingGoal: "Hypertrophy",
    prescription: "3-4×8-12",
  },
  "Seated Cable Row": {
    secondaryMuscle: "biceps, rear delts",
    difficulty: "beginner",
    exerciseType: "Compound",
    movementPattern: "Pull",
    trainingGoal: "Hypertrophy",
    prescription: "3-4×10-12",
  },
  "Face Pull": {
    secondaryMuscle: "rear delts",
    difficulty: "beginner",
    exerciseType: "Isolation",
    movementPattern: "Pull",
    trainingGoal: "Posture",
    prescription: "3×15-20",
  },
  "Overhead Press": {
    secondaryMuscle: "triceps, core",
    difficulty: "intermediate",
    exerciseType: "Compound",
    movementPattern: "Press",
    trainingGoal: "Strength",
    prescription: "4×4-6",
  },
  "Seated Dumbbell Press": {
    secondaryMuscle: "triceps",
    difficulty: "beginner",
    exerciseType: "Compound",
    movementPattern: "Press",
    trainingGoal: "Hypertrophy",
    prescription: "3×8-12",
  },
  "Lateral Raise": {
    secondaryMuscle: "traps",
    difficulty: "beginner",
    exerciseType: "Isolation",
    movementPattern: "Raise",
    trainingGoal: "Hypertrophy",
    prescription: "3×12-15",
  },
  "Rear Delt Fly": {
    secondaryMuscle: "upper back",
    difficulty: "beginner",
    exerciseType: "Isolation",
    movementPattern: "Raise",
    trainingGoal: "Posture",
    prescription: "3×12-15",
  },
  "Arnold Press": {
    secondaryMuscle: "triceps",
    difficulty: "intermediate",
    exerciseType: "Compound",
    movementPattern: "Press",
    trainingGoal: "Hypertrophy",
    prescription: "3×8-10",
  },
  "Barbell Curl": {
    secondaryMuscle: "forearms",
    difficulty: "beginner",
    exerciseType: "Isolation",
    movementPattern: "Curl",
    trainingGoal: "Hypertrophy",
    prescription: "3-4×8-12",
  },
  "Incline Dumbbell Curl": {
    secondaryMuscle: "forearms",
    difficulty: "beginner",
    exerciseType: "Isolation",
    movementPattern: "Curl",
    trainingGoal: "Hypertrophy",
    prescription: "3×10-12",
  },
  "Hammer Curl": {
    secondaryMuscle: "forearms",
    difficulty: "beginner",
    exerciseType: "Isolation",
    movementPattern: "Curl",
    trainingGoal: "Hypertrophy",
    prescription: "3×10-12",
  },
  "Preacher Curl": {
    secondaryMuscle: "forearms",
    difficulty: "beginner",
    exerciseType: "Isolation",
    movementPattern: "Curl",
    trainingGoal: "Hypertrophy",
    prescription: "3×10-12",
  },
  "Close-Grip Bench Press": {
    secondaryMuscle: "chest, shoulders",
    difficulty: "intermediate",
    exerciseType: "Compound",
    movementPattern: "Press",
    trainingGoal: "Strength",
    prescription: "3-4×6-8",
  },
  "Triceps Pushdown": {
    secondaryMuscle: "",
    difficulty: "beginner",
    exerciseType: "Isolation",
    movementPattern: "Extension",
    trainingGoal: "Hypertrophy",
    prescription: "3×10-15",
  },
  "Overhead Triceps Extension": {
    secondaryMuscle: "",
    difficulty: "beginner",
    exerciseType: "Isolation",
    movementPattern: "Extension",
    trainingGoal: "Hypertrophy",
    prescription: "3×10-12",
  },
  "Skull Crusher": {
    secondaryMuscle: "",
    difficulty: "intermediate",
    exerciseType: "Isolation",
    movementPattern: "Extension",
    trainingGoal: "Strength",
    prescription: "3×6-10",
  },
  Plank: {
    secondaryMuscle: "obliques, glutes",
    difficulty: "beginner",
    exerciseType: "Isolation",
    movementPattern: "Anti-Extension",
    trainingGoal: "Core",
    prescription: "3×30-60s",
  },
  "Hanging Leg Raise": {
    secondaryMuscle: "obliques",
    difficulty: "intermediate",
    exerciseType: "Isolation",
    movementPattern: "Flexion",
    trainingGoal: "Core",
    prescription: "3×8-12",
  },
  "Cable Woodchop": {
    secondaryMuscle: "obliques, shoulders",
    difficulty: "beginner",
    exerciseType: "Isolation",
    movementPattern: "Rotation",
    trainingGoal: "Core",
    prescription: "3×10-12 each",
  },
  "Ab Wheel Rollout": {
    secondaryMuscle: "obliques, lats",
    difficulty: "advanced",
    exerciseType: "Compound",
    movementPattern: "Anti-Extension",
    trainingGoal: "Core",
    prescription: "3×6-10",
  },
  "Russian Twist": {
    secondaryMuscle: "obliques",
    difficulty: "beginner",
    exerciseType: "Isolation",
    movementPattern: "Rotation",
    trainingGoal: "Core",
    prescription: "3×12-20",
  },
  "Standing Calf Raise": {
    secondaryMuscle: "soleus",
    difficulty: "beginner",
    exerciseType: "Isolation",
    movementPattern: "Plantar Flexion",
    trainingGoal: "Hypertrophy",
    prescription: "4×10-15",
  },
  "Seated Calf Raise": {
    secondaryMuscle: "soleus",
    difficulty: "beginner",
    exerciseType: "Isolation",
    movementPattern: "Plantar Flexion",
    trainingGoal: "Hypertrophy",
    prescription: "3×12-15",
  },
  "Single-Leg Calf Raise": {
    secondaryMuscle: "soleus",
    difficulty: "intermediate",
    exerciseType: "Isolation",
    movementPattern: "Plantar Flexion",
    trainingGoal: "Unilateral",
    prescription: "3×10-15 each",
  },
  "Farmer Carry": {
    secondaryMuscle: "traps, core",
    difficulty: "beginner",
    exerciseType: "Compound",
    movementPattern: "Carry",
    trainingGoal: "Grip",
    prescription: "3×30-40m",
  },
  "Wrist Curl": {
    secondaryMuscle: "",
    difficulty: "beginner",
    exerciseType: "Isolation",
    movementPattern: "Flexion",
    trainingGoal: "Grip",
    prescription: "3×12-15",
  },
  "Reverse Curl": {
    secondaryMuscle: "forearms",
    difficulty: "beginner",
    exerciseType: "Isolation",
    movementPattern: "Curl",
    trainingGoal: "Grip",
    prescription: "3×12-15",
  },
  "Barbell Shrug": {
    secondaryMuscle: "grip",
    difficulty: "beginner",
    exerciseType: "Isolation",
    movementPattern: "Shrug",
    trainingGoal: "Hypertrophy",
    prescription: "3×10-15",
  },
  "Cable Shrug": {
    secondaryMuscle: "grip",
    difficulty: "beginner",
    exerciseType: "Isolation",
    movementPattern: "Shrug",
    trainingGoal: "Hypertrophy",
    prescription: "3×12-15",
  },
};

/** Fallback for a name the catalog has never seen. Deliberately bland:
 * a wrong-but-plausible row is better in a demo than a visibly broken
 * one, and `missingFromCatalog` is how a caller can tell. */
const FALLBACK: ExerciseMeta = {
  secondaryMuscle: "",
  difficulty: "beginner",
  exerciseType: "Compound",
  movementPattern: "General",
  trainingGoal: "General",
  prescription: "3×10",
};

export function metaFor(name: string): ExerciseMeta {
  return CATALOG[name] ?? FALLBACK;
}

export function missingFromCatalog(name: string): boolean {
  return !(name in CATALOG);
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export type TrainerSession = {
  id: string;
  assignmentId: string;
  memberId: string;
  branchId: string;
  sessionDate: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  notes: string | null;
  firstName: string;
  lastName: string;
  workoutPlanName: string | null;
};

/**
 * Today's sessions, from the real endpoint the staff app already uses.
 *
 * The response is a flat array rather than a paginated envelope, and the
 * hook normalises both shapes so a future move to pagination does not
 * reach into the components.
 */
export function useTrainerSessions() {
  return useQuery({
    queryKey: ["trainer-sessions", "today"],
    queryFn: async () => {
      const response = await api.get<TrainerSession[] | { items: TrainerSession[] }>(
        "/workout-sessions/today",
      );
      return Array.isArray(response) ? response : (response?.items ?? []);
    },
  });
}

export type TrainerExercise = {
  id: string;
  name: string;
  muscleGroup: string | null;
  equipment: string | null;
  description: string | null;
  videoUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export function useTrainerExercises() {
  return useQuery({
    queryKey: ["trainer-exercises"],
    queryFn: async () => {
      const response = await api.get<TrainerExercise[] | { items: TrainerExercise[] }>(
        "/exercises",
      );
      return Array.isArray(response) ? response : (response?.items ?? []);
    },
  });
}

export type TrainerAssignment = {
  id: string;
  memberId: string;
  status: string;
  startDate: string;
  firstName: string;
  lastName: string;
  workoutPlanName: string | null;
};

/** What `GET /workout-assignments` actually returns: the plan and the
 *  member come back nested, not flattened. */
type TrainerAssignmentRow = {
  id: string;
  memberId: string;
  status: string;
  startDate: string;
  workoutPlan?: { name: string | null } | null;
  member?: { firstName: string; lastName: string } | null;
};

/**
 * Members with an active plan who have no session yet — the "to go" card.
 *
 * `GET /workout-sessions/today` cannot express this: a session row only
 * exists once work has started, so a plan that has not begun has no
 * session to read back. Assignments are the only place it exists.
 *
 * A user without `workouts.read` gets a 403 here. That is not an error
 * worth surfacing on a dashboard — it means the "to go" card has nothing
 * to show them — so it resolves to an empty list rather than an error
 * state. The sessions query still reports its own failures.
 */
export function useTrainerAwaitingAssignments() {
  return useQuery({
    queryKey: ["trainer-assignments", "awaiting"],
    queryFn: async (): Promise<TrainerAssignment[]> => {
      try {
        const response = await api.get<TrainerAssignmentRow[] | { items: TrainerAssignmentRow[] }>(
          "/workout-assignments",
        );
        const rows = Array.isArray(response) ? response : (response?.items ?? []);
        return rows
          .filter((row) => row.status === "ACTIVE" && row.member)
          .map((row) => ({
            id: row.id,
            memberId: row.memberId,
            status: row.status,
            startDate: row.startDate,
            firstName: row.member?.firstName ?? "",
            lastName: row.member?.lastName ?? "",
            workoutPlanName: row.workoutPlan?.name ?? null,
          }));
      } catch {
        return [];
      }
    },
  });
}

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Paginated } from "@/lib/types/pagination";

interface WorkoutAssignment {
  id: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  startDate: string;
  notes: string | null;
  workoutPlan: { id: string; name: string };
  member: { id: string; firstName: string; lastName: string };
}

export function useMemberWorkoutAssignments(memberId: string | undefined) {
  return useQuery({
    queryKey: ["member-workout-assignments", memberId],
    queryFn: () => api.get<Paginated<WorkoutAssignment>>("/workout-assignments", { query: { memberId } }),
    enabled: !!memberId,
    select: (data) => data.items,
  });
}

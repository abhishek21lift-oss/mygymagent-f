import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

/**
 * The member's own data.
 *
 * Every one of these hits a route that takes no member id — the server
 * resolves the member from the session and scopes the query to them, so
 * there is no parameter here to get wrong and none to tamper with.
 */
const KEY = "portal";

export interface PortalMe {
  member: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    memberCode: string | null;
    status: string;
    primaryBranch: { id: string; name: string } | null;
    assignedTrainer: { firstName: string; lastName: string | null } | null;
  };
  activeMembership: {
    id: string;
    startDate: string;
    endDate: string;
    status: string;
    membershipPlan: { name: string } | null;
  } | null;
}

export interface PortalMembership {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  price: string | number;
  currency: string;
  membershipPlan: { name: string; durationDays: number } | null;
}

export interface PortalVisit {
  id: string;
  checkInAt: string;
  checkOutAt: string | null;
  method: string;
  deniedReason: string | null;
  branch: { name: string } | null;
}

export interface PortalWorkout {
  id: string;
  startDate: string;
  status: string;
  notes: string | null;
  workoutPlan: {
    name: string;
    description: string | null;
    /** A Json column on the plan — whatever the staff-side builder wrote. */
    exercises: unknown;
  } | null;
}

export interface PortalDiet {
  id: string;
  startDate: string;
  status: string;
  dietPlan: {
    name: string;
    description: string | null;
    targetCalories: number | null;
    targetProteinG: string | null;
    items: unknown;
  } | null;
}

export function usePortalMe() {
  return useQuery({
    queryKey: [KEY, "me"],
    queryFn: () => api.get<PortalMe>("/portal/me"),
    retry: false,
  });
}

export function usePortalMemberships() {
  return useQuery({
    queryKey: [KEY, "memberships"],
    queryFn: () => api.get<{ items: PortalMembership[] }>("/portal/memberships"),
  });
}

export function usePortalVisits(limit = 30) {
  return useQuery({
    queryKey: [KEY, "visits", limit],
    queryFn: () =>
      api.get<{ items: PortalVisit[] }>("/portal/attendance", {
        query: { limit },
      }),
  });
}

export function usePortalWorkouts() {
  return useQuery({
    queryKey: [KEY, "workouts"],
    queryFn: () => api.get<{ items: PortalWorkout[] }>("/portal/workouts"),
  });
}

export function usePortalNutrition() {
  return useQuery({
    queryKey: [KEY, "nutrition"],
    queryFn: () => api.get<{ items: PortalDiet[] }>("/portal/nutrition"),
  });
}

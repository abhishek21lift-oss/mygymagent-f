import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
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

export interface PortalEnableResult {
  memberId: string;
  userId: string;
  email: string;
  invited: true;
}

/**
 * Staff-side: grant a member a portal login.
 *
 * The one call in this file that names a member, and the one behind a
 * permission (`portal.manage`). It is idempotent on the server, so
 * calling it again on an already-linked member re-sends the invitation
 * rather than creating a second account.
 *
 * Invalidates the member detail query because the answer changes what
 * that page shows: `Member.user` goes from absent to INVITED.
 */
export function useEnablePortalLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) =>
      api.post<PortalEnableResult>(`/portal/enable/${memberId}`, {}),
    onSuccess: (_result, memberId) => {
      void queryClient.invalidateQueries({ queryKey: ["members", memberId] });
    },
  });
}

// -- The write half (F-P0-1 slice 3) --------------------------------
// Same shape as the reads: no call names a member. The server resolves
// it from the session, so there is no id here to get wrong.

export interface PortalNotificationPreference {
  key: string;
  label: string;
  description: string;
  inApp: boolean;
  email: boolean;
  whatsapp: boolean;
  sms: boolean;
  push: boolean;
}

export interface PortalClassSession {
  id: string;
  className: string;
  startTime: string;
  endTime: string;
  branchName: string;
  effectiveCapacity: number;
  bookedCount: number;
  waitlistCount: number;
  instructorFirstName: string | null;
  instructorLastName: string | null;
  myBookingId: string | null;
  myBookingStatus: "BOOKED" | "WAITLISTED" | null;
  myWaitlistPosition: number | null;
}

export interface PortalRenewalOption {
  id: string;
  name: string;
  description: string | null;
  durationDays: number;
  price: string | number;
  currency: string;
  benefits: string[];
}

export interface PortalProfileUpdate {
  phone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

export function useUpdatePortalProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PortalProfileUpdate) =>
      api.patch<PortalMe>("/portal/me", input),
    onSuccess: (data) => {
      // The server answers with the updated `me`, so seed the cache with
      // it rather than refetching what we were just handed.
      queryClient.setQueryData([KEY, "me"], data);
    },
  });
}

export function usePortalNotificationPreferences() {
  return useQuery({
    queryKey: [KEY, "notification-preferences"],
    queryFn: () =>
      api.get<{ items: PortalNotificationPreference[] }>(
        "/portal/notification-preferences",
      ),
  });
}

export function useUpdatePortalNotificationPreference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      category,
      ...channels
    }: { category: string } & Partial<
      Pick<
        PortalNotificationPreference,
        "inApp" | "email" | "whatsapp" | "sms" | "push"
      >
    >) =>
      api.patch<{ items: PortalNotificationPreference[] }>(
        `/portal/notification-preferences/${category}`,
        channels,
      ),
    onSuccess: (data) => {
      queryClient.setQueryData([KEY, "notification-preferences"], data);
    },
  });
}

export function usePortalClasses() {
  return useQuery({
    queryKey: [KEY, "classes"],
    queryFn: () => api.get<{ items: PortalClassSession[] }>("/portal/classes"),
  });
}

export function useBookPortalClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      api.post<{ status: string }>(`/portal/classes/${sessionId}/book`, {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [KEY, "classes"] });
    },
  });
}

export function useCancelPortalClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) =>
      api.delete(`/portal/classes/bookings/${bookingId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [KEY, "classes"] });
    },
  });
}

export function usePortalRenewalOptions() {
  return useQuery({
    queryKey: [KEY, "renewal-options"],
    queryFn: () =>
      api.get<{ items: PortalRenewalOption[] }>("/portal/renewal-options"),
  });
}

export function useRequestPortalRenewal() {
  return useMutation({
    mutationFn: (input: { membershipPlanId: string; note?: string }) =>
      api.post<{
        requestId: string;
        plan: { name: string };
        alreadyRequested: boolean;
      }>("/portal/renewal-requests", input),
  });
}

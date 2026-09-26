import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export type ClassProgram = {
  id: string
  name: string
  capacity: number
  durationMinutes: number
  branchId: string
  branchName: string
  instructorFirstName?: string | null
  instructorLastName?: string | null
}

export type ClassSession = {
  id: string
  className: string
  startTime: string
  endTime: string
  effectiveCapacity: number
  bookedCount: number
  waitlistCount: number
  branchName: string
  instructorFirstName?: string | null
  instructorLastName?: string | null
}

export type ClassBookingStatus =
  | "BOOKED"
  | "WAITLISTED"
  | "ATTENDED"
  | "NO_SHOW"
  | "CANCELLED"

export type ClassBooking = {
  id: string
  memberId: string
  memberName: string
  memberCode: string
  memberPhone: string | null
  status: ClassBookingStatus
  waitlistPosition: number | null
  bookedAt: string
  cancelledAt: string | null
  attendanceAt: string | null
}

export type ClassProgramAnalytics = {
  classProgramId: string
  className: string
  totalBookings: number
  attended: number
  noShows: number
  waitlisted: number
}

const PROGRAMS_KEY = "class-programs"
const SESSIONS_KEY = "class-sessions"
const BOOKINGS_KEY = "class-bookings"
const ANALYTICS_KEY = "class-analytics"

export function useClassPrograms(branchId: string | undefined) {
  return useQuery({
    queryKey: [PROGRAMS_KEY, branchId],
    queryFn: () => api.get<ClassProgram[]>("/classes/programs", { query: { branchId } }),
    enabled: Boolean(branchId),
  })
}

export function useClassSessions(branchId: string | undefined) {
  return useQuery({
    queryKey: [SESSIONS_KEY, branchId],
    queryFn: () => api.get<ClassSession[]>("/classes/sessions", { query: { branchId } }),
    enabled: Boolean(branchId),
  })
}

/** The roster for one session: the only place a booking id is visible, and
 * therefore the only place attendance and cancellation can be reached. */
export function useClassSessionBookings(sessionId: string | undefined) {
  return useQuery({
    queryKey: [BOOKINGS_KEY, sessionId],
    queryFn: () => api.get<ClassBooking[]>(`/classes/sessions/${sessionId}/bookings`),
    enabled: Boolean(sessionId),
  })
}

export function useClassAnalytics(params: { from?: string; to?: string; branchId?: string }) {
  return useQuery({
    queryKey: [ANALYTICS_KEY, params],
    queryFn: () => api.get<ClassProgramAnalytics[]>("/classes/analytics", { query: params }),
    enabled: Boolean(params.branchId),
  })
}

export function useCreateClassProgram() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      branchId: string; name: string; description?: string
      capacity: number; durationMinutes: number; instructorId?: string
    }) => api.post<ClassProgram>("/classes/programs", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [PROGRAMS_KEY] }),
  })
}

export function useCreateClassSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      branchId: string; classProgramId: string; instructorId?: string
      startTime: string; endTime: string; capacity?: number
    }) => api.post<ClassSession>("/classes/sessions", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SESSIONS_KEY] })
      queryClient.invalidateQueries({ queryKey: [ANALYTICS_KEY] })
    },
  })
}

export function useBookClass() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, memberId }: { sessionId: string; memberId: string }) =>
      api.post<{ id: string; status: ClassBookingStatus; waitlistPosition: number | null }>(
        `/classes/sessions/${sessionId}/book`,
        { memberId },
      ),
    onSuccess: (_data, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: [SESSIONS_KEY] })
      queryClient.invalidateQueries({ queryKey: [BOOKINGS_KEY, sessionId] })
      queryClient.invalidateQueries({ queryKey: [ANALYTICS_KEY] })
    },
  })
}

export function useCancelClassBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId }: { bookingId: string; sessionId: string }) =>
      api.patch(`/classes/bookings/${bookingId}/cancel`, {}),
    // Cancelling a booked place promotes the first person off the waitlist,
    // so the whole roster and the seat counts move, not just this row.
    onSuccess: (_data, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: [SESSIONS_KEY] })
      queryClient.invalidateQueries({ queryKey: [BOOKINGS_KEY, sessionId] })
      queryClient.invalidateQueries({ queryKey: [ANALYTICS_KEY] })
    },
  })
}

export function useMarkClassAttendance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, status }: {
      bookingId: string; sessionId: string; status: "ATTENDED" | "NO_SHOW"
    }) => api.patch<ClassBooking>(`/classes/bookings/${bookingId}/attendance`, { status }),
    onSuccess: (_data, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: [BOOKINGS_KEY, sessionId] })
      queryClient.invalidateQueries({ queryKey: [ANALYTICS_KEY] })
    },
  })
}

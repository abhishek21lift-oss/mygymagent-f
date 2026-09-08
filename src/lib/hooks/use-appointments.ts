import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import type { Paginated, PaginationParams } from "@/lib/types/pagination"

export type AppointmentType = "TRIAL" | "CONSULTATION" | "ASSESSMENT" | "FOLLOW_UP" | "PT_SESSION" | "OTHER"
export type AppointmentStatus = "BOOKED" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | "RESCHEDULED"

export type Appointment = {
  id: string
  organizationId: string
  branchId: string
  staffId: string | null
  memberId: string | null
  leadId: string | null
  type: AppointmentType
  status: AppointmentStatus
  title: string
  startTime: string
  endTime: string
  notes: string | null
  cancellationReason: string | null
  clientName: string | null
  clientEmail: string | null
  clientPhone: string | null
  remindersSent: number
  createdByUserId: string | null
  createdAt: string
  updatedAt: string
  branch?: { id: string; name: string } | null
  staff?: { id: string; firstName: string; lastName: string } | null
  member?: { id: string; firstName: string; lastName: string; email: string | null; phone: string | null } | null
  lead?: { id: string; firstName: string; lastName: string; email: string | null; phone: string | null } | null
}

export type CalendarSlot = {
  id: string
  source: "APPOINTMENT" | "PT_SESSION"
  type: AppointmentType | PtSessionCalendarType
  status: AppointmentStatus | PtSessionCalendarStatus
  title: string
  startTime: string
  endTime: string
  branchId: string
  staffId: string | null
  staffName: string | null
  memberId: string | null
  memberName: string | null
  leadId: string | null
  notes: string | null
}

type PtSessionCalendarType = "PERSONAL_TRAINING" | "PARTNER_TRAINING" | "SMALL_GROUP"
type PtSessionCalendarStatus = "SCHEDULED" | "COMPLETED"

export type TrainerAvailabilityRule = {
  id: string
  organizationId: string
  staffId: string
  branchId: string | null
  dayOfWeek: number
  startMinute: number
  endMinute: number
  isActive: boolean
  staff?: { id: string; firstName: string; lastName: string } | null
}

export type TrainerTimeOff = {
  id: string
  organizationId: string
  staffId: string
  branchId: string | null
  reason: string | null
  startAt: string
  endAt: string
  staff?: { id: string; firstName: string; lastName: string } | null
}

export type FreeSlotWindow = { start: string; end: string; free: { start: string; end: string }[] }

export type CreateAppointmentInput = {
  branchId: string
  staffId?: string
  memberId?: string
  leadId?: string
  type: AppointmentType
  title: string
  startTime: string
  endTime: string
  notes?: string
  clientName?: string
  clientEmail?: string
  clientPhone?: string
}

const KEY = "appointments"

export function useCalendarFeed(params: { from?: string; to?: string; branchId?: string; staffId?: string; memberId?: string; leadId?: string } = {}) {
  return useQuery({
    queryKey: [KEY, "calendar", params],
    queryFn: () => api.get<CalendarSlot[]>("/appointments/calendar", { query: params }),
  })
}

export function useAppointments(params: PaginationParams & { memberId?: string; leadId?: string; staffId?: string; branchId?: string; type?: string; from?: string; to?: string } = {}) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<Paginated<Appointment>>("/appointments", { query: params }),
  })
}

export function useAppointment(id: string | null) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => api.get<Appointment>(`/appointments/${id}`),
    enabled: Boolean(id),
  })
}

export function useCreateAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateAppointmentInput) => api.post<Appointment>("/appointments", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      queryClient.invalidateQueries({ queryKey: ["pt-sessions"] })
    },
  })
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Partial<CreateAppointmentInput>) =>
      api.patch<Appointment>(`/appointments/${id}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useRescheduleAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, startTime, endTime, reason }: { id: string; startTime: string; endTime: string; reason?: string }) =>
      api.patch<Appointment>(`/appointments/${id}/reschedule`, { startTime, endTime, reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useCancelAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.patch<Appointment>(`/appointments/${id}/cancel`, { reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useCompleteAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.patch<Appointment>(`/appointments/${id}/complete`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useNoShowAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.patch<Appointment>(`/appointments/${id}/no-show`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useAvailabilityRules(params: { staffId?: string } = {}) {
  return useQuery({
    queryKey: [KEY, "availability", params],
    queryFn: () => api.get<TrainerAvailabilityRule[]>("/appointments/availability", { query: params }),
  })
}

export function useSetAvailabilityRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { staffId: string; branchId?: string; dayOfWeek: number; startMinute: number; endMinute: number }) =>
      api.post<{ ok: true }>("/appointments/availability", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, "availability"] }),
  })
}

export function useDeleteAvailabilityRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete<{ ok: true }>(`/appointments/availability/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, "availability"] }),
  })
}

export function useTimeOffs(params: { staffId?: string } = {}) {
  return useQuery({
    queryKey: [KEY, "time-off", params],
    queryFn: () => api.get<TrainerTimeOff[]>("/appointments/time-off", { query: params }),
  })
}

export function useAddTimeOff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { staffId: string; branchId?: string; startAt: string; endAt: string; reason?: string }) =>
      api.post<{ ok: true }>("/appointments/time-off", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, "time-off"] }),
  })
}

export function useDeleteTimeOff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete<{ ok: true }>(`/appointments/time-off/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, "time-off"] }),
  })
}

export function useFreeSlots(staffId: string | null, day: string | null) {
  return useQuery({
    queryKey: [KEY, "free-slots", staffId, day],
    queryFn: () => api.get<{ staffId: string; windows: FreeSlotWindow[]; note?: string }>("/appointments/free-slots", { query: { staffId: staffId!, day: day! } }),
    enabled: Boolean(staffId) && Boolean(day),
  })
}

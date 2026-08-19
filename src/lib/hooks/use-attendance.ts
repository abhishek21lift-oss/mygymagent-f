import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Attendance } from "@/lib/types/gym";
import type { Paginated, PaginationParams } from "@/lib/types/pagination";
import type { CheckInInput } from "@/lib/validation/gym";

const KEY = "attendance";

export function useAttendance(params: PaginationParams & { branchId?: string; memberId?: string } = {}) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<Paginated<Attendance>>("/attendance", { query: params }),
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CheckInInput) => api.post<Attendance>("/attendance/check-in", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Attendance>(`/attendance/${id}/check-out`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

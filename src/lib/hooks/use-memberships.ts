import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Membership } from "@/lib/types/gym";
import type { Paginated, PaginationParams } from "@/lib/types/pagination";

const KEY = "memberships";

export function useMemberships(params: PaginationParams & { memberId?: string } = {}) {
  const { memberId, ...query } = params;
  return useQuery({
    queryKey: [KEY, query, memberId],
    queryFn: () => api.get<Paginated<Membership>>("/memberships", { query: { ...query, memberId } }),
  });
}

export function useCreateMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { memberId: string; membershipPlanId: string; autoRenew?: boolean }) =>
      api.post<Membership>("/memberships", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useFreezeMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, days }: { id: string; days: number }) =>
      api.post<Membership>(`/memberships/${id}/freeze`, { days }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useResumeMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Membership>(`/memberships/${id}/resume`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useCancelMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.post<Membership>(`/memberships/${id}/cancel`, { reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

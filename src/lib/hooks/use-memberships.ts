import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Membership } from "@/lib/types/gym";
import type { Paginated, PaginationParams } from "@/lib/types/pagination";

const KEY = "memberships";

export interface ChangePlanResult {
  newMembership: Membership;
  credit: string;
  amountDue: string;
}

function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: [KEY] });
}

export function useMemberships(params: PaginationParams & { memberId?: string } = {}) {
  const { memberId, ...query } = params;
  return useQuery({ queryKey: [KEY, query, memberId], queryFn: () => api.get<Paginated<Membership>>("/memberships", { query: { ...query, memberId } }) });
}

export function useMembershipAnalytics() {
  return useQuery({ queryKey: [KEY, "analytics"], queryFn: () => api.get<Record<string, number | string>>("/memberships/analytics/summary") });
}

export function useMembershipRenewalReminders(days = 7) {
  return useQuery({ queryKey: [KEY, "renewal-reminders", days], queryFn: () => api.get<Membership[]>("/memberships/renewal-reminders", { query: { days } }) });
}

/** Full lifecycle trail (status history) for one membership. */
export function useMembershipHistory(membershipId: string | null) {
  return useQuery({
    queryKey: [KEY, membershipId, "history"],
    queryFn: () => api.get<Array<{ id: string; membershipId: string; fromStatus: Membership["status"] | null; toStatus: Membership["status"]; detail: string | null; changedByUser?: { id: string; firstName: string; lastName: string } | null; createdAt: string }>>(`/memberships/history/${membershipId}`),
    enabled: Boolean(membershipId),
  });
}

export function useCreateMembership() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { memberId: string; membershipPlanId: string; autoRenew?: boolean; discount?: number; initialPayment?: number; paymentMethod?: string; startDate?: string; activate?: boolean }) =>
      api.post<Membership>("/memberships", input),
    onSuccess: () => invalidate(queryClient),
  });
}

function lifecycleMutation<T>(path: string) {
  return (input: { id: string } & T) => {
    const { id, ...body } = input;
    return api.post<Membership>(`/memberships/${id}/${path}`, body);
  };
}

export function useActivateMembership() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => api.post<Membership>(`/memberships/${id}/activate`), onSuccess: () => invalidate(qc) }); }
export function usePauseMembership() { const qc = useQueryClient(); return useMutation({ mutationFn: lifecycleMutation<{ days?: number; reason?: string }>("pause"), onSuccess: () => invalidate(qc) }); }
export function useUnpauseMembership() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => api.post<Membership>(`/memberships/${id}/unpause`), onSuccess: () => invalidate(qc) }); }
export function useFreezeMembership() { const qc = useQueryClient(); return useMutation({ mutationFn: lifecycleMutation<{ days: number }>("freeze"), onSuccess: () => invalidate(qc) }); }
export function useResumeMembership() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => api.post<Membership>(`/memberships/${id}/resume`), onSuccess: () => invalidate(qc) }); }
export function useExtendMembership() { const qc = useQueryClient(); return useMutation({ mutationFn: lifecycleMutation<{ days: number }>("extend"), onSuccess: () => invalidate(qc) }); }
export function useUpgradeMembership() { const qc = useQueryClient(); return useMutation({ mutationFn: lifecycleMutation<{ membershipPlanId: string; initialPayment?: number; paymentMethod?: string; discount?: number }>("upgrade"), onSuccess: () => invalidate(qc) }); }
export function useDowngradeMembership() { const qc = useQueryClient(); return useMutation({ mutationFn: lifecycleMutation<{ membershipPlanId: string; initialPayment?: number; paymentMethod?: string; discount?: number }>("downgrade"), onSuccess: () => invalidate(qc) }); }

/** Plan change with server-side proration. Direction is derived from the
 * plan prices by the backend; the result carries the credit/amount-due
 * breakdown alongside the new membership row. */
export function useChangeMembershipPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, newMembershipPlanId, direction, discount, initialPayment, paymentMethod }: { id: string; newMembershipPlanId: string; direction?: "UPGRADE" | "DOWNGRADE"; discount?: number; initialPayment?: number; paymentMethod?: string }) => {
      void direction; // reserved for callers; server derives it from prices
      return api.post<ChangePlanResult>(`/memberships/${id}/change-plan`, { membershipPlanId: newMembershipPlanId, discount, initialPayment, paymentMethod });
    },
    onSuccess: () => invalidate(qc),
  });
}

export function useTransferMembership() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, toMemberId, reason }: { id: string; toMemberId: string; reason?: string }) =>
      api.post<Membership>(`/memberships/${id}/transfer`, { memberId: toMemberId, reason }),
    onSuccess: () => invalidate(qc),
  });
}

export function useCancelMembership() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, reason }: { id: string; reason?: string }) => api.post<Membership>(`/memberships/${id}/cancel`, { reason }), onSuccess: () => invalidate(qc) }); }
export function useRenewMembership() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, discount }: { id: string; discount?: number }) => api.post<Membership>(`/memberships/${id}/renew`, { discount }), onSuccess: () => invalidate(qc) }); }
export function useRecordPaymentFailure() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, amount, reason }: { id: string; amount?: number; reason?: string }) => api.post(`/memberships/${id}/payment-failed`, { amount, reason }), onSuccess: () => invalidate(qc) }); }

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

const KEY = "member-follow-ups";

export interface MemberFollowUp {
  id: string;
  organizationId: string;
  memberId: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  completedAt: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  createdByUserId: string | null;
  createdByUser: { id: string; firstName: string; lastName: string } | null;
  assignedToUserId: string | null;
  assignedToUser: { id: string; firstName: string; lastName: string } | null;
  createdAt: string;
  updatedAt: string;
  isOverdue: boolean;
}

export function useMemberFollowUps(memberId: string | undefined) {
  return useQuery<MemberFollowUp[]>({
    queryKey: [KEY, memberId],
    queryFn: () => api.get(`/members/${memberId}/follow-ups`),
    enabled: !!memberId,
  });
}

export function useCreateMemberFollowUp(memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; description?: string; dueAt?: string; priority?: string; assignedToUserId?: string }) =>
      api.post(`/members/${memberId}/follow-ups`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [KEY, memberId] });
    },
  });
}

export function useUpdateMemberFollowUp(memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ followUpId, ...input }: { followUpId: string; title?: string; description?: string; dueAt?: string; priority?: string; assignedToUserId?: string }) =>
      api.patch(`/members/${memberId}/follow-ups/${followUpId}`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [KEY, memberId] });
    },
  });
}

export function useCompleteMemberFollowUp(memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (followUpId: string) =>
      api.post(`/members/${memberId}/follow-ups/${followUpId}/complete`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [KEY, memberId] });
    },
  });
}

export function useUncompleteMemberFollowUp(memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (followUpId: string) =>
      api.post(`/members/${memberId}/follow-ups/${followUpId}/uncomplete`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [KEY, memberId] });
    },
  });
}

export function useDeleteMemberFollowUp(memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (followUpId: string) =>
      api.delete(`/members/${memberId}/follow-ups/${followUpId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [KEY, memberId] });
    },
  });
}

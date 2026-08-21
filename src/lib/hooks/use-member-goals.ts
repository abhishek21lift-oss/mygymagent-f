import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { MemberGoal, MemberGoalCategory, MemberGoalMilestone, MemberGoalStatus } from "@/lib/types/gym";

const KEY = "member-goals";

export interface MemberGoalInput {
  title: string;
  description?: string;
  category?: MemberGoalCategory;
  targetValue?: number;
  targetUnit?: string;
  baselineValue?: number;
  startDate?: string;
  targetDate?: string;
}

export function useMemberGoals(memberId: string | undefined) {
  return useQuery({
    queryKey: [KEY, memberId],
    queryFn: () => api.get<MemberGoal[]>(`/members/${memberId}/goals`),
    enabled: !!memberId,
  });
}

export function useCreateMemberGoal(memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MemberGoalInput) => api.post<MemberGoal>(`/members/${memberId}/goals`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, memberId] }),
  });
}

export function useUpdateMemberGoal(memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, status }: { goalId: string; status: MemberGoalStatus }) =>
      api.patch<MemberGoal>(`/members/${memberId}/goals/${goalId}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, memberId] }),
  });
}

export function useCreateMemberGoalMilestone(memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      goalId,
      input,
    }: {
      goalId: string;
      input: { title: string; targetDate?: string; value?: number; note?: string };
    }) => api.post<MemberGoalMilestone>(`/members/${memberId}/goals/${goalId}/milestones`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, memberId] }),
  });
}

export function useAchieveMemberGoalMilestone(memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, milestoneId }: { goalId: string; milestoneId: string }) =>
      api.patch<MemberGoalMilestone>(`/members/${memberId}/goals/${goalId}/milestones/${milestoneId}`, {
        achievedAt: new Date().toISOString(),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, memberId] }),
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

const KEY = "member-tags";

export interface MemberTag {
  id: string;
  organizationId: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  _count?: { memberAssignments: number };
}

export interface MemberTagAssignment {
  id: string;
  organizationId: string;
  memberId: string;
  tagId: string;
  assignedByUserId: string | null;
  assignedAt: string;
  tag: MemberTag;
}

export function useMemberTags() {
  return useQuery<MemberTag[]>({
    queryKey: [KEY],
    queryFn: () => api.get(`/members/tags`),
  });
}

export function useMemberTag(tagId: string | undefined) {
  return useQuery<MemberTag>({
    queryKey: [KEY, tagId],
    queryFn: () => api.get(`/members/tags/${tagId}`),
    enabled: !!tagId,
  });
}

export function useCreateMemberTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; color?: string }) =>
      api.post<MemberTag>(`/members/tags`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [KEY] });
    },
  });
}

export function useUpdateMemberTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tagId, ...input }: { tagId: string; name?: string; color?: string }) =>
      api.patch<MemberTag>(`/members/tags/${tagId}`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [KEY] });
    },
  });
}

export function useDeleteMemberTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tagId: string) => api.delete(`/members/tags/${tagId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [KEY] });
    },
  });
}

export function useMemberTagAssignments(memberId: string | undefined) {
  return useQuery<MemberTagAssignment[]>({
    queryKey: ["member-tag-assignments", memberId],
    queryFn: () => api.get(`/members/${memberId}/tags`),
    enabled: !!memberId,
  });
}

export function useAssignMemberTags(memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tagIds: string[]) =>
      api.post(`/members/${memberId}/tags`, { tagIds }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["member-tag-assignments", memberId] });
    },
  });
}

export function useAddMemberTag(memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tagId: string) =>
      api.post(`/members/${memberId}/tags/${tagId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["member-tag-assignments", memberId] });
      void queryClient.invalidateQueries({ queryKey: [KEY] });
    },
  });
}

export function useRemoveMemberTag(memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tagId: string) =>
      api.delete(`/members/${memberId}/tags/${tagId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["member-tag-assignments", memberId] });
      void queryClient.invalidateQueries({ queryKey: [KEY] });
    },
  });
}

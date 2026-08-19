import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Member } from "@/lib/types/gym";
import type { Paginated, PaginationParams } from "@/lib/types/pagination";
import type { CreateMemberInput } from "@/lib/validation/gym";

const KEY = "members";

export function useMembers(params: PaginationParams & { branchId?: string } = {}) {
  const { branchId, ...query } = params;
  return useQuery({
    queryKey: [KEY, query, branchId],
    queryFn: () => api.get<Paginated<Member>>("/members", { query, branchId }),
  });
}

export function useMember(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => api.get<Member>(`/members/${id}`),
    enabled: !!id,
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMemberInput) => api.post<Member>("/members", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateMember(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CreateMemberInput> & { status?: Member["status"] }) =>
      api.patch<Member>(`/members/${id}`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [KEY] });
      void queryClient.invalidateQueries({ queryKey: [KEY, id] });
    },
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<Member>(`/members/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

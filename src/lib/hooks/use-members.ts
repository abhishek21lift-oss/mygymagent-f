import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Member, MemberStatus, MemberType } from "@/lib/types/gym";
import type { Paginated } from "@/lib/types/pagination";
import type { CreateMemberInput } from "@/lib/validation/gym";

export interface MemberFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  order?: "asc" | "desc";
  orderBy?: "firstName" | "lastName" | "createdAt" | "memberCode";
  status?: MemberStatus[];
  memberType?: MemberType[];
  trainerId?: string[];
  branchId?: string[];
  tagIds?: string[];
  joinedFrom?: string;
  joinedTo?: string;
}

const KEY = "members";

export function useMembers(params: MemberFilters = {}) {
  const { branchId } = params;

  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => {
      const query: Record<string, string | number | boolean | string[] | undefined> = {
        ...(params.page !== undefined && { page: params.page }),
        ...(params.pageSize !== undefined && { pageSize: params.pageSize }),
        ...(params.search && { search: params.search }),
        ...(params.order && { order: params.order }),
        ...(params.orderBy && { orderBy: params.orderBy }),
        ...(params.status && params.status.length > 0 && { status: params.status }),
        ...(params.memberType && params.memberType.length > 0 && { memberType: params.memberType }),
        ...(params.trainerId && params.trainerId.length > 0 && { trainerId: params.trainerId }),
        ...(params.tagIds && params.tagIds.length > 0 && { tagIds: params.tagIds }),
        ...(params.joinedFrom && { joinedFrom: params.joinedFrom }),
        ...(params.joinedTo && { joinedTo: params.joinedTo }),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return api.get<Paginated<Member>>("/members", { query, branchId } as any);
    },
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

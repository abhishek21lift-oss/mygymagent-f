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

export interface MemberMetrics {
  total: number;
  active: number;
  inactive: number;
  frozen: number;
  expired: number;
  pt: number;
}

type MemberDetailPayload = Member & {
  memberships?: unknown;
};

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

/**
 * Every member id the given filter covers, not just the page in view.
 *
 * The directory's row checkboxes are keyed by row index, so a selection
 * can only ever describe the 25 rows on screen. Acting on the 290
 * members the enquiry import left without a membership needs the ids the
 * filter actually matches, so this walks the pages once and collects
 * them. Capped at the 500 the bulk routes accept, which is also the
 * point past which a single bulk write stops being the right tool.
 */
export const BULK_SELECTION_CAP = 500;

export async function fetchAllMemberIds(
  filters: MemberFilters,
  total: number,
): Promise<string[]> {
  const pageSize = 100;
  const pages = Math.min(
    Math.ceil(Math.min(total, BULK_SELECTION_CAP) / pageSize),
    Math.ceil(BULK_SELECTION_CAP / pageSize),
  );
  const ids: string[] = [];
  for (let page = 1; page <= pages; page += 1) {
    const query: Record<string, string | number | boolean | string[] | undefined> = {
      page,
      pageSize,
      ...(filters.search && { search: filters.search }),
      ...(filters.order && { order: filters.order }),
      ...(filters.orderBy && { orderBy: filters.orderBy }),
      ...(filters.status && filters.status.length > 0 && { status: filters.status }),
      ...(filters.memberType && filters.memberType.length > 0 && { memberType: filters.memberType }),
      ...(filters.trainerId && filters.trainerId.length > 0 && { trainerId: filters.trainerId }),
      ...(filters.tagIds && filters.tagIds.length > 0 && { tagIds: filters.tagIds }),
      ...(filters.joinedFrom && { joinedFrom: filters.joinedFrom }),
      ...(filters.joinedTo && { joinedTo: filters.joinedTo }),
    };
    const res = await api.get<Paginated<Member>>("/members", {
      query,
      branchId: filters.branchId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    ids.push(...res.items.map((m) => m.id));
    if (res.items.length < pageSize) break;
  }
  return ids.slice(0, BULK_SELECTION_CAP);
}

export function useMemberMetrics() {
  return useQuery({
    queryKey: [KEY, "metrics"],
    queryFn: () => api.get<MemberMetrics>("/members/metrics"),
    staleTime: 30_000,
  });
}

export function useMember(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: async () => {
      const data = await api.get<MemberDetailPayload>(`/members/${id}`);
      // Member 360 expects memberships to always be an array. Keep the UI
      // resilient to older/partial backend payloads without changing the
      // API contract or hiding request failures.
      return {
        ...data,
        memberships: Array.isArray(data?.memberships) ? data.memberships : [],
      } as Member;
    },
    enabled: !!id,
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMemberInput) => api.post<Member>("/members", input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [KEY] });
      void queryClient.invalidateQueries({ queryKey: [KEY, "metrics"] });
    },
  });
}

export function useUpdateMember(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CreateMemberInput> & { status?: Member["status"] }) =>
      api.patch<Member>(`/members/${id}`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [KEY] });
      void queryClient.invalidateQueries({ queryKey: [KEY, "metrics"] });
      void queryClient.invalidateQueries({ queryKey: [KEY, id] });
    },
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<Member>(`/members/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [KEY] });
      void queryClient.invalidateQueries({ queryKey: [KEY, "metrics"] });
    },
  });
}

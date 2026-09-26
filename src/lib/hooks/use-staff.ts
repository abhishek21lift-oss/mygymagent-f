import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { StaffUser } from "@/lib/types/gym";
import type { Paginated, PaginationParams } from "@/lib/types/pagination";
import type { InviteStaffInput } from "@/lib/validation/gym";

const KEY = "staff";

export function useStaff(params: PaginationParams = {}) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<Paginated<StaffUser>>("/users", { query: params }),
  });
}

export function useInviteStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: InviteStaffInput & { roleBranchId?: string }) =>
      api.post<StaffUser>("/users", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeactivateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<StaffUser>(`/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export interface AssignableRole {
  id: string
  key: string
  name: string
  description: string | null
  isSystem: boolean
  isOrganizationSpecific: boolean
  permissions: string[]
}

/**
 * The roles this organization can actually hand out, from GET /roles.
 *
 * The invite form used to carry its own hardcoded list, which could drift
 * from the catalogue the server validates against -- a key missing from
 * one side is a 400 the operator cannot explain.
 */
export function useAssignableRoles(enabled = true) {
  return useQuery({
    queryKey: ["roles"],
    queryFn: () => api.get<AssignableRole[]>("/roles"),
    // The seeded catalogue changes on deploy, not during a session.
    staleTime: 10 * 60 * 1000,
    enabled,
  })
}

export function useAssignStaffRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleKey, branchId }: {
      userId: string; roleKey: string; branchId?: string
    }) => api.post<{ id: string }>(`/users/${userId}/roles`, { roleKey, branchId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  })
}

export function useRevokeStaffRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, userRoleId }: { userId: string; userRoleId: string }) =>
      api.delete(`/users/${userId}/roles/${userRoleId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  })
}

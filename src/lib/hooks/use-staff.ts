import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { STAFF_PAYROLL_KEY } from "@/lib/hooks/use-staff-payroll";
import type { StaffAccessState, StaffStats, StaffUser } from "@/lib/types/gym";
import type { Paginated, PaginationParams } from "@/lib/types/pagination";
import type { AddStaffPayload, InviteStaffInput } from "@/lib/validation/gym";

const KEY = "staff";

/** Everything that lists staff: this page, its head counts, the payroll
 * roster and the staff pickers (`UserSelect`). */
function invalidateStaff(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: [KEY] }),
    queryClient.invalidateQueries({ queryKey: [STAFF_PAYROLL_KEY] }),
    queryClient.invalidateQueries({ queryKey: ["users"] }),
  ]);
}

export function useStaff(params: PaginationParams = {}) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<Paginated<StaffUser>>("/users", { query: params }),
    placeholderData: (previous) => previous,
  });
}

export function useStaffStats() {
  return useQuery({
    queryKey: [KEY, "stats"],
    queryFn: () => api.get<StaffStats>("/users/stats"),
  });
}

/** Adds a staff member by invite, with a password, or without app access. */
export function useAddStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddStaffPayload) => api.post<StaffUser>("/users", payload),
    onSuccess: () => invalidateStaff(queryClient),
  });
}

/** The original email invite. Kept for callers of the old form. */
export function useInviteStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: InviteStaffInput & { roleBranchId?: string }) =>
      api.post<StaffUser>("/users", input),
    onSuccess: () => invalidateStaff(queryClient),
  });
}

export interface UpdateStaffInput {
  firstName?: string
  lastName?: string
  phone?: string
  primaryBranchId?: string
  jobTitle?: string
  isTrainer?: boolean
  specializations?: string[]
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateStaffInput & { id: string }) =>
      api.patch<StaffUser>(`/users/${id}`, input),
    onSuccess: () => invalidateStaff(queryClient),
  });
}

/** Emails a set-your-password link: a first invite for staff added without
 * app access, or a fresh one for an invite that went astray. */
export function useGrantStaffAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, email }: { id: string; email?: string }) =>
      api.post<StaffUser>(`/users/${id}/invite`, email ? { email } : {}),
    onSuccess: () => invalidateStaff(queryClient),
  });
}

export function useDeactivateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<StaffUser>(`/users/${id}`),
    onSuccess: () => invalidateStaff(queryClient),
  });
}

/**
 * Where a staff member stands with the app. `hasPassword` is missing from
 * API builds before it was added; an ACTIVE account there is taken to be
 * signed in, which is what the old screen showed.
 */
export function staffAccessState(user: Pick<StaffUser, "status" | "email" | "hasPassword">): StaffAccessState {
  if (user.status === "SUSPENDED" || user.status === "DISABLED") return "OFF";
  if (user.status === "INVITED") return "INVITE_PENDING";
  if (!user.email) return "NO_ACCESS";
  if (user.hasPassword === false) return "INVITE_PENDING";
  return "SIGNED_IN";
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
    onSuccess: () => invalidateStaff(queryClient),
  })
}

export function useRevokeStaffRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, userRoleId }: { userId: string; userRoleId: string }) =>
      api.delete(`/users/${userId}/roles/${userRoleId}`),
    onSuccess: () => invalidateStaff(queryClient),
  })
}

export interface PermissionDefinition {
  key: string
  resource: string
  action: string
  description: string
}

/** The permission catalogue, so a role's grants can be shown as what they
 * let someone do rather than as a list of dotted keys. */
export function usePermissionCatalog(enabled = true) {
  return useQuery({
    queryKey: ["roles", "permissions"],
    queryFn: () => api.get<PermissionDefinition[]>("/roles/permissions"),
    staleTime: 10 * 60 * 1000,
    enabled,
  })
}

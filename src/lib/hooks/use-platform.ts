import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Paginated, PaginationParams } from "@/lib/types/pagination";

export type OrganizationStatus = "TRIAL" | "ACTIVE" | "SUSPENDED" | "CANCELLED"

export interface PlatformOrganization {
  id: string
  name: string
  slug: string
  status: OrganizationStatus
  timezone: string
  currency: string
  createdAt: string
  _count: { branches: number; users: number; members: number }
}

export interface PlatformOrganizationDetail {
  id: string
  name: string
  slug: string
  status: OrganizationStatus
  timezone: string
  currency: string
  createdAt: string
  branches: Array<{ id: string; name: string; slug: string; city: string | null }>
  _count: { users: number; members: number }
}

const KEY = "platform-organizations"

/**
 * Cross-tenant organization administration.
 *
 * Gated server-side on `User.platformRole`, not on an RBAC permission, so
 * these hooks are only ever mounted behind that check -- an ordinary gym
 * account calling them gets a 403.
 */
export function usePlatformOrganizations(
  params: PaginationParams & { status?: OrganizationStatus } = {},
) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<Paginated<PlatformOrganization>>("/platform/organizations", { query: params }),
  })
}

export function usePlatformOrganization(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => api.get<PlatformOrganizationDetail>(`/platform/organizations/${id}`),
    enabled: Boolean(id),
  })
}

export function useUpdatePlatformOrganizationStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrganizationStatus }) =>
      api.patch<PlatformOrganization>(`/platform/organizations/${id}/status`, { status }),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      queryClient.invalidateQueries({ queryKey: [KEY, "detail", id] })
    },
  })
}

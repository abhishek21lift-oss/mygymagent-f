import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Paginated } from "@/lib/types/pagination";

export interface AuditLogEntry {
  id: string
  action: string
  resource: string
  resourceId: string | null
  branchId: string | null
  ipAddress: string | null
  userAgent: string | null
  requestId: string | null
  createdAt: string
  actorUserId: string | null
  actorName: string | null
  actorEmail: string | null
  /** Only present when the request asked for them. */
  beforeState?: unknown
  afterState?: unknown
}

export interface AuditFacets {
  resources: Array<{ value: string; count: number }>
  actions: Array<{ value: string; count: number }>
}

const KEY = "audit-logs"

/**
 * The audit trail.
 *
 * Every mutating handler has been writing these rows since the beginning
 * and nothing could read one back, so the gym recorded who changed what
 * and could never look at it.
 */
export function useAuditLog(
  params: {
    page?: number
    pageSize?: number
    resource?: string
    action?: string
    resourceId?: string
    actorUserId?: string
    from?: string
    to?: string
    withState?: boolean
  } = {},
  enabled = true,
) {
  const { withState, ...rest } = params
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () =>
      api.get<Paginated<AuditLogEntry>>("/audit-logs", {
        query: { ...rest, ...(withState ? { withState: "true" } : {}) },
      }),
    enabled,
  })
}

/** The resources and actions this organization has actually recorded, so
 * the filters offer those rather than a hardcoded guess. */
export function useAuditFacets(enabled = true) {
  return useQuery({
    queryKey: [KEY, "facets"],
    queryFn: () => api.get<AuditFacets>("/audit-logs/facets"),
    staleTime: 5 * 60 * 1000,
    enabled,
  })
}

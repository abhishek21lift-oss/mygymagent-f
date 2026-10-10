import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export type AiActionStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "EXECUTED" | "FAILED";

export interface AiAction {
  id: string;
  type: string;
  status: AiActionStatus;
  reasoning: string;
  /** The validated arguments the action would execute with. The list
   * carries it too; it is here so the approver can actually see it. */
  payload?: Record<string, unknown> | null;
  rejectionReason?: string | null;
  createdAt: string;
  decidedAt?: string | null;
  executedAt?: string | null;
  errorMessage?: string | null;
}

interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export function useAiActions(status?: AiActionStatus, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ["ai-actions", status],
    queryFn: () => api.get<Paginated<AiAction>>(`/ai-actions${status ? `?status=${encodeURIComponent(status)}` : ""}`),
    staleTime: 15_000,
    enabled,
  });
}

/**
 * One action, read fresh.
 *
 * The list is cached for 15 seconds and shows the reasoning, not the
 * payload. Approving from that is the rubber stamp the schema comment
 * warns about -- so the review dialog re-reads the action before the
 * decision, and shows what would actually run.
 */
export function useAiAction(id: string | undefined) {
  return useQuery({
    queryKey: ["ai-actions", "detail", id],
    queryFn: () => api.get<AiAction>(`/ai-actions/${id}`),
    enabled: Boolean(id),
  });
}

export function useApproveAiAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<AiAction>(`/ai-actions/${id}/approve`, {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ai-actions"] });
      void queryClient.invalidateQueries({ queryKey: ["daily-briefing"] });
    },
  });
}

export function useRejectAiAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.patch<AiAction>(`/ai-actions/${id}/reject`, { reason }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ai-actions"] });
      void queryClient.invalidateQueries({ queryKey: ["daily-briefing"] });
    },
  });
}

export interface AiActionEffectiveness {
  total: number
  pending: number
  approved: number
  executed: number
  rejected: number
  failed: number
  /** decided/(decided+rejected)-style rates; null when nothing settled. */
  acceptanceRate: number | null
  executionRate: number | null
}

/** Org-wide approval funnel. Read-only aggregates for the queue header. */
export function useAiActionEffectiveness({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ["ai-actions", "effectiveness"],
    queryFn: () => api.get<AiActionEffectiveness>("/ai-actions/effectiveness"),
    staleTime: 60_000,
    enabled,
  })
}

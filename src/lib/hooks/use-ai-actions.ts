import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export type AiActionStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "EXECUTED" | "FAILED";

export interface AiAction {
  id: string;
  type: string;
  status: AiActionStatus;
  reasoning: string;
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

export function useAiActions(status?: AiActionStatus) {
  return useQuery({
    queryKey: ["ai-actions", status],
    queryFn: () => api.get<Paginated<AiAction>>(`/ai-actions${status ? `?status=${encodeURIComponent(status)}` : ""}`),
    staleTime: 15_000,
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

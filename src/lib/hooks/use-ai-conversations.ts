import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

export interface AiConversationSummary {
  id: string;
  title?: string | null;
  updatedAt: string;
  createdAt: string;
}

export function useAiConversations() {
  return useQuery({
    queryKey: ["ai-conversations"],
    queryFn: () => api.get<AiConversationSummary[]>("/ai/conversations"),
    staleTime: 30_000,
  });
}

export function useDeleteAiConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/ai/conversations/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ai-conversations"] });
    },
  });
}

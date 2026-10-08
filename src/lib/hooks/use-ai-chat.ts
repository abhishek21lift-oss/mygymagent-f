import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { ChatMessage, ChatResponse } from "@/lib/types/ai";
import { AI_CONVERSATIONS_KEY } from "./use-ai-conversations";

/**
 * One turn of the AI chat. With a `conversationId` the server continues
 * that stored chat (and ignores `history`); without one it starts a new
 * chat and returns its id.
 */
export function useAiChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ message, history, conversationId }: { message: string; history: ChatMessage[]; conversationId?: string }) =>
      api.post<ChatResponse>("/ai/chat", { message, history, ...(conversationId ? { conversationId } : {}) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [AI_CONVERSATIONS_KEY] });
    },
  });
}

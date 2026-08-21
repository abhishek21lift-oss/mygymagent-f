import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { ChatMessage, ChatResponse } from "@/lib/types/ai";

export function useAiChat() {
  return useMutation({
    mutationFn: ({ message, history }: { message: string; history: ChatMessage[] }) =>
      api.post<ChatResponse>("/ai/chat", { message, history }),
  });
}

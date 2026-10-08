import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { ChatMessage, ChatToolCall } from "@/lib/types/ai";

export const AI_CONVERSATIONS_KEY = "ai-conversations";

/** A past chat, as the history list shows it. */
export interface AiConversationSummary {
  id: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  /** The first message, which is what the chat was about. */
  preview: string | null;
}

interface StoredMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  toolCalls: ChatToolCall[] | null;
  createdAt: string;
}

export interface AiConversationMessage extends ChatMessage {
  toolCalls?: ChatToolCall[];
}

export function useAiConversations(pageSize = 20) {
  return useQuery({
    queryKey: [AI_CONVERSATIONS_KEY, "list", pageSize],
    queryFn: async () =>
      (await api.get<{ items: AiConversationSummary[] }>("/ai/conversations", { query: { pageSize } })).items,
    staleTime: 30_000,
  });
}

/** One past chat's messages, oldest first, in the shape the chat shows. */
export async function fetchAiConversation(id: string): Promise<AiConversationMessage[]> {
  const conversation = await api.get<{ messages: StoredMessage[] }>(`/ai/conversations/${id}`);
  return conversation.messages.map((m) => ({
    role: m.role === "USER" ? "user" : "assistant",
    content: m.content,
    ...(Array.isArray(m.toolCalls) && m.toolCalls.length ? { toolCalls: m.toolCalls } : {}),
  }));
}

export function useDeleteAiConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/ai/conversations/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [AI_CONVERSATIONS_KEY] });
    },
  });
}

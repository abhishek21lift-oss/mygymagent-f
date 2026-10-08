export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export interface ChatToolCall {
  name: string
  args: unknown
}

export interface ChatResponse {
  reply: string
  toolCalls: ChatToolCall[]
  /** The stored chat this turn belongs to; send it back to continue it. */
  conversationId?: string
}

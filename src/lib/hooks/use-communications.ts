import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api/client"

/**
 * Message templates, and the log of what was sent.
 *
 * Five endpoints with no caller. The consequence was concrete: every
 * message this product sends -- renewal reminders, receipts, the WhatsApp
 * flows -- renders from a template, and the only way to change a word of
 * one was a database client. The delivery log was equally unreachable, so
 * "did the reminder go out?" had no answer inside the app.
 *
 * All five are `notifications.manage`, which is why they live beside the
 * notification settings rather than in a section of their own.
 */

export type CommunicationChannel = "EMAIL" | "WHATSAPP" | "SMS" | "PUSH"

export interface MessageTemplate {
  id: string
  organizationId: string | null
  key: string
  channel: CommunicationChannel
  subject: string | null
  body: string
  createdAt: string
  updatedAt: string
}

export interface MessageLogEntry {
  id: string
  organizationId: string | null
  channel: CommunicationChannel
  category: string
  templateKey: string
  recipient: string
  memberId: string | null
  status: string
  attempts: number
  errorMessage: string | null
  sentAt: string | null
  createdAt: string
}

export interface ManageTemplateInput {
  key: string
  channel: CommunicationChannel
  subject?: string
  body: string
}

const TEMPLATES = "message-templates"
const LOGS = "message-logs"

export function useMessageTemplates(enabled = true) {
  return useQuery({
    queryKey: [TEMPLATES],
    queryFn: () => api.get<MessageTemplate[]>("/communications/templates"),
    enabled,
  })
}

export function useMessageLogs(limit = 100, enabled = true) {
  return useQuery({
    queryKey: [LOGS, limit],
    queryFn: () => api.get<MessageLogEntry[]>("/communications/logs", { query: { limit } }),
    enabled,
  })
}

export function useCreateMessageTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ManageTemplateInput) =>
      api.post<MessageTemplate>("/communications/templates", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [TEMPLATES] }),
  })
}

export function useUpdateMessageTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: ManageTemplateInput & { id: string }) =>
      api.patch<MessageTemplate>(`/communications/templates/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [TEMPLATES] }),
  })
}

export function useDeleteMessageTemplate() {
  const qc = useQueryClient()
  return useMutation({
    // Deleting an organization override falls back to the platform
    // default for that key and channel; it does not stop the message.
    mutationFn: (id: string) => api.delete<{ deleted: boolean }>(`/communications/templates/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [TEMPLATES] }),
  })
}

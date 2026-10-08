import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api/client"

const KEY = ["whatsapp", "auto-replies"]

export interface AutoReplyRule {
  id: string
  keyword: string
  matchType: "EXACT" | "CONTAINS" | "REGEX"
  scope: "ALL" | "PRIVATE" | "GROUP"
  answer: string
  enabled: boolean
  priority: number
  createdAt: string
  createdByUserId: string | null
}

export function useAutoReplies() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get<AutoReplyRule[]>("/whatsapp/auto-replies"),
  })
}

export function useCreateAutoReply() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Omit<AutoReplyRule, "id" | "createdAt" | "createdByUserId">) =>
      api.post<AutoReplyRule>("/whatsapp/auto-replies", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateAutoReply() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<AutoReplyRule> }) =>
      api.patch<AutoReplyRule>(`/whatsapp/auto-replies/${id}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteAutoReply() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/whatsapp/auto-replies/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}
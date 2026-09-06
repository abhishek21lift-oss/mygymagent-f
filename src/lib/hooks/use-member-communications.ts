import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { CommunicationChannel } from "@/lib/types/gym";

const KEY = "member-communications";

export interface MessageLogEntry {
  id: string;
  channel: CommunicationChannel;
  category: string;
  templateKey: string;
  recipient: string;
  memberId: string | null;
  status: "PENDING" | "SENT" | "FAILED" | "SKIPPED_NO_CONSENT";
  attempts: number;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
}

export function useMemberCommunications(memberId: string | undefined) {
  return useQuery({
    queryKey: [KEY, memberId],
    queryFn: () => api.get<MessageLogEntry[]>(`/members/${memberId}/communications`),
    enabled: !!memberId,
  });
}

export function useSendMemberMessage(memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      channel: CommunicationChannel;
      templateKey?: string;
      customBody?: string;
      customSubject?: string;
      variables?: Record<string, string>;
    }) =>
      api.post(`/members/${memberId}/communications/send`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, memberId] }),
  });
}

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

interface MessageLogPage {
  items: MessageLogEntry[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * The endpoint is paginated (`{ items, page, … }`), and this was typed as
 * a bare array: `data.length` was undefined, so the empty state never
 * showed, and `data.map` threw, taking the whole member profile down the
 * moment the Messages tab was opened. The hook now returns the items.
 */
export function useMemberCommunications(memberId: string | undefined) {
  return useQuery({
    queryKey: [KEY, memberId],
    queryFn: () =>
      api.get<MessageLogPage>(`/members/${memberId}/communications`, {
        query: { pageSize: 100 },
      }),
    select: (page): MessageLogEntry[] => page.items,
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
    // Settled, not success: a send that fails still writes its attempts
    // to the history (a push logs one row per device), and the error says
    // to look there.
    onSettled: () => queryClient.invalidateQueries({ queryKey: [KEY, memberId] }),
  });
}

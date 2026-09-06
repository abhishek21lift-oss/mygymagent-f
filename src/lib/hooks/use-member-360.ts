import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Member360Overview, Member360Timeline } from "@/lib/types/gym";

const KEY = "member-360";

export function useMemberOverview(memberId: string | undefined) {
  return useQuery({
    queryKey: [KEY, "overview", memberId],
    queryFn: () =>
      api.get<Member360Overview>("/members/overview", {
        query: { memberId: memberId! },
      }),
    enabled: !!memberId,
  });
}

export function useMemberTimeline(
  memberId: string | undefined,
  page: number = 1,
  pageSize: number = 50
) {
  return useQuery({
    queryKey: [KEY, "timeline", memberId, page, pageSize],
    queryFn: () =>
      api.get<Member360Timeline>("/members/timeline", {
        query: { memberId: memberId!, page, pageSize },
      }),
    enabled: !!memberId,
  });
}

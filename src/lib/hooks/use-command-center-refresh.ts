import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { CommandCenterSnapshot } from "./use-command-center";

const KEY = "command-center-snapshot"

/**
 * Re-probes every card and replaces the cached snapshot.
 *
 * `refresh=true` bypasses the server's 10s snapshot cache. Without it, a
 * plain refetch would return the same numbers for up to 10 seconds — which
 * defeats the only reason to press the button: an operator who does not
 * believe the card needs a real re-probe, not the same answer with a newer
 * timestamp.
 */
export function useRefreshCommandCenter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      api.get<CommandCenterSnapshot>("/platform/command-center/snapshot", {
        query: { refresh: "true" },
      }),
    onSuccess: (fresh) => {
      queryClient.setQueryData([KEY], fresh)
    },
  })
}

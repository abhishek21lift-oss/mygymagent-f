import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Organization } from "@/lib/types/auth";

const KEY = "organization";

export function useOrganization() {
  return useQuery({
    queryKey: [KEY],
    queryFn: () => api.get<Organization>("/organizations/current"),
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Pick<Organization, "name" | "timezone" | "currency">>) =>
      api.patch<Organization>("/organizations/current", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

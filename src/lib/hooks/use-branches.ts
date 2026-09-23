import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Branch } from "@/lib/types/gym";
import type { Paginated, PaginationParams } from "@/lib/types/pagination";
import type { CreateBranchInput } from "@/lib/validation/gym";

const KEY = "branches";

export function useBranches(params: PaginationParams = {}) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<Paginated<Branch>>("/branches", { query: params }),
  });
}

export function useBranch(id: string | undefined) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => api.get<Branch>(`/branches/${id}`),
    enabled: !!id,
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBranchInput) => api.post<Branch>("/branches", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateBranch(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CreateBranchInput>) => api.patch<Branch>(`/branches/${id}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

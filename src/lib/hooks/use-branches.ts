import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { OpeningSlot } from "@/lib/opening-hours";
import type { Branch } from "@/lib/types/gym";
import type { Paginated, PaginationParams } from "@/lib/types/pagination";
import type { CreateBranchInput } from "@/lib/validation/gym";

const KEY = "branches";

export function useBranches(params: PaginationParams = {}, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<Paginated<Branch>>("/branches", { query: params }),
    enabled,
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
    mutationFn: (input: BranchUpdate) => api.patch<Branch>(`/branches/${id}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

/** A branch's editable details. null clears a field. */
export interface BranchUpdate {
  name?: string;
  phone?: string | null;
  email?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  mapsUrl?: string | null;
  openingHours?: OpeningSlot[] | null;
}

/** Edits any branch -- for lists, where the id is known only per row. */
export function useEditBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: BranchUpdate }) => api.patch<Branch>(`/branches/${id}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

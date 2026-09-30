import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Organization } from "@/lib/types/auth";

const KEY = "organization";

/** Fields the Gym profile edits. A blank optional field is sent as null,
 * which clears it. */
export type OrganizationUpdate = Partial<
  Pick<
    Organization,
    | "name"
    | "timezone"
    | "currency"
    | "contactPhone"
    | "contactEmail"
    | "website"
    | "instagram"
    | "emailFromName"
    | "emailReplyTo"
  >
>;

/** Largest logo the API accepts. */
export const MAX_LOGO_BYTES = 2 * 1024 * 1024;
export const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function useOrganization() {
  return useQuery({
    queryKey: [KEY],
    queryFn: () => api.get<Organization>("/organizations/current"),
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: OrganizationUpdate) => api.patch<Organization>("/organizations/current", input),
    onSuccess: (data) => queryClient.setQueryData([KEY], data),
  });
}

export function useUploadLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return api.post<Organization>("/organizations/current/logo", formData);
    },
    onSuccess: (data) => queryClient.setQueryData([KEY], data),
  });
}

export function useRemoveLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete<Organization>("/organizations/current/logo"),
    onSuccess: (data) => queryClient.setQueryData([KEY], data),
  });
}

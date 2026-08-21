import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type {
  MemberAddress,
  MemberAddressType,
  MemberBranchHistoryEntry,
  MemberConsent,
  MemberConsentType,
  MemberEmergencyContact,
  MemberNote,
  MemberStatusHistoryEntry,
  MemberTrainerHistoryEntry,
} from "@/lib/types/gym";

const KEY = "member-details";

// -- Addresses ------------------------------------------------------------

export interface MemberAddressInput {
  type?: MemberAddressType;
  isPrimary?: boolean;
  addressLine1: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export function useMemberAddresses(memberId: string | undefined) {
  return useQuery({
    queryKey: [KEY, memberId, "addresses"],
    queryFn: () => api.get<MemberAddress[]>(`/members/${memberId}/addresses`),
    enabled: !!memberId,
  });
}

export function useCreateMemberAddress(memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MemberAddressInput) =>
      api.post<MemberAddress>(`/members/${memberId}/addresses`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, memberId, "addresses"] }),
  });
}

export function useUpdateMemberAddress(memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<MemberAddressInput> }) =>
      api.patch<MemberAddress>(`/members/${memberId}/addresses/${id}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, memberId, "addresses"] }),
  });
}

export function useDeleteMemberAddress(memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<MemberAddress>(`/members/${memberId}/addresses/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, memberId, "addresses"] }),
  });
}

// -- Emergency contacts -----------------------------------------------------

export interface MemberEmergencyContactInput {
  name: string;
  phone: string;
  relationship?: string;
  isPrimary?: boolean;
}

export function useMemberEmergencyContacts(memberId: string | undefined) {
  return useQuery({
    queryKey: [KEY, memberId, "emergency-contacts"],
    queryFn: () => api.get<MemberEmergencyContact[]>(`/members/${memberId}/emergency-contacts`),
    enabled: !!memberId,
  });
}

export function useCreateMemberEmergencyContact(memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MemberEmergencyContactInput) =>
      api.post<MemberEmergencyContact>(`/members/${memberId}/emergency-contacts`, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [KEY, memberId, "emergency-contacts"] }),
  });
}

export function useDeleteMemberEmergencyContact(memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<MemberEmergencyContact>(`/members/${memberId}/emergency-contacts/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [KEY, memberId, "emergency-contacts"] }),
  });
}

// -- Notes ------------------------------------------------------------------

export function useMemberNotes(memberId: string | undefined) {
  return useQuery({
    queryKey: [KEY, memberId, "notes"],
    queryFn: () => api.get<MemberNote[]>(`/members/${memberId}/notes`),
    enabled: !!memberId,
  });
}

export function useCreateMemberNote(memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { body: string; pinned?: boolean }) =>
      api.post<MemberNote>(`/members/${memberId}/notes`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, memberId, "notes"] }),
  });
}

export function useDeleteMemberNote(memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<MemberNote>(`/members/${memberId}/notes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, memberId, "notes"] }),
  });
}

// -- Consents (append-only) ------------------------------------------------

export function useMemberConsents(memberId: string | undefined) {
  return useQuery({
    queryKey: [KEY, memberId, "consents"],
    queryFn: () => api.get<MemberConsent[]>(`/members/${memberId}/consents`),
    enabled: !!memberId,
  });
}

export function useRecordMemberConsent(memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { type: MemberConsentType; granted: boolean; note?: string }) =>
      api.post<MemberConsent>(`/members/${memberId}/consents`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, memberId, "consents"] }),
  });
}

// -- History (read-only) -----------------------------------------------------

export function useMemberStatusHistory(memberId: string | undefined) {
  return useQuery({
    queryKey: [KEY, memberId, "status-history"],
    queryFn: () => api.get<MemberStatusHistoryEntry[]>(`/members/${memberId}/status-history`),
    enabled: !!memberId,
  });
}

export function useMemberBranchHistory(memberId: string | undefined) {
  return useQuery({
    queryKey: [KEY, memberId, "branch-history"],
    queryFn: () => api.get<MemberBranchHistoryEntry[]>(`/members/${memberId}/branch-history`),
    enabled: !!memberId,
  });
}

export function useMemberTrainerHistory(memberId: string | undefined) {
  return useQuery({
    queryKey: [KEY, memberId, "trainer-history"],
    queryFn: () => api.get<MemberTrainerHistoryEntry[]>(`/members/${memberId}/trainer-history`),
    enabled: !!memberId,
  });
}

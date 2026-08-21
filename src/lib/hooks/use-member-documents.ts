import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { MemberDocument, MemberDocumentCategory } from "@/lib/types/gym";

const KEY = "member-documents";

export function useMemberDocuments(memberId: string | undefined) {
  return useQuery({
    queryKey: [KEY, memberId],
    queryFn: () => api.get<MemberDocument[]>(`/members/${memberId}/documents`),
    enabled: !!memberId,
  });
}

export function useUploadMemberDocument(memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      file,
      category,
      description,
    }: {
      file: File;
      category: MemberDocumentCategory;
      description?: string;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);
      if (description) formData.append("description", description);
      return api.post<MemberDocument>(`/members/${memberId}/documents`, formData);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, memberId] }),
  });
}

export function useDeleteMemberDocument(memberId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => api.delete(`/members/${memberId}/documents/${documentId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, memberId] }),
  });
}

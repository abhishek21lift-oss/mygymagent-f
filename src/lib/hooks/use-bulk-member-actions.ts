import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type { MemberStatus } from '@/lib/types/gym';

interface BulkResult {
  updated?: number;
  assigned?: number;
}

export function useBulkStatusChange() {
  return useMutation({
    mutationFn: async (payload: { memberIds: string[]; status: MemberStatus }): Promise<BulkResult> => {
      const res = await api.post<BulkResult>('/members/bulk/status', payload);
      return res;
    },
    onError: (error: Error) => error,
  });
}

export function useBulkTagAssignment() {
  return useMutation({
    mutationFn: async (payload: { memberIds: string[]; tagIds: string[] }): Promise<BulkResult> => {
      const res = await api.post<BulkResult>('/members/bulk/tags', payload);
      return res;
    },
    onError: (error: Error) => error,
  });
}

export function useBulkExport() {
  return useMutation({
    mutationFn: async (payload: { memberIds: string[]; format?: 'csv' | 'xlsx' }) => {
      const res = await api.post<{ members: Record<string, string>[]; total: number }>('/members/bulk/export', payload);
      return res;
    },
    onError: (error: Error) => error,
  });
}

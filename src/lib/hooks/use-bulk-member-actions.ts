import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type { MemberStatus } from '@/lib/types/gym';

interface BulkResult {
  updated?: number;
  assigned?: number;
}

interface BulkExportResult {
  members: Record<string, string>[];
  total: number;
}

const MEMBERS_KEY = ['members'];

function parseCsvRows(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];
    const next = csv[i + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }

  return rows;
}

function escapeCsvField(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function parseBulkExport(csv: string): BulkExportResult {
  const rows = parseCsvRows(csv);
  const headers = rows[0] ?? [];
  const members = rows.slice(1).map((row) =>
    Object.fromEntries(
      headers.map((header, index) => [header, escapeCsvField(row[index] ?? '')]),
    ),
  );
  return { members, total: members.length };
}

export function useBulkStatusChange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { memberIds: string[]; status: MemberStatus }) =>
      api.post<BulkResult>('/members/bulk/status', payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MEMBERS_KEY });
    },
    onError: (error: Error) => error,
  });
}

export function useBulkTagAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { memberIds: string[]; tagIds: string[] }) =>
      api.post<BulkResult>('/members/bulk/tags', payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MEMBERS_KEY });
      void queryClient.invalidateQueries({ queryKey: ['member-tags'] });
    },
    onError: (error: Error) => error,
  });
}

export function useBulkExport() {
  return useMutation({
    mutationFn: async (payload: { memberIds: string[]; format?: 'csv' | 'xlsx' }) => {
      const csv = await api.post<string>('/members/bulk/export', payload);
      return parseBulkExport(csv);
    },
    onError: (error: Error) => error,
  });
}

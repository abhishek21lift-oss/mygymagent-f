import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { Paginated, PaginationParams } from "@/lib/types/pagination";
import type { CreateInvoiceInput } from "@/lib/validation/gym";

const KEY = "invoices";

export type InvoiceStatus = "DRAFT" | "ISSUED" | "PART_PAID" | "PAID" | "OVERDUE" | "VOID";

export interface InvoiceMember {
  id: string;
  firstName: string;
  lastName: string;
}

export interface InvoiceListItem {
  id: string;
  number: string;
  member: InvoiceMember | null;
  status: InvoiceStatus;
  grandTotal: string | number;
  currency: string;
  dueAt: string | null;
  issuedAt: string | null;
}

export interface InvoiceLine {
  label: string;
  amount: string | number;
  qty?: number | null;
  total?: string | number;
}

export interface InvoiceTaxLine {
  label: string;
  amount: string | number;
}

export interface InvoicePayment {
  id: string;
  amount: string | number;
  currency: string;
  method: string;
  status: string;
  createdAt: string;
}

export interface DunningAttempt {
  channel: string;
  templateKey: string;
  status: string;
  sentAt: string;
}

export interface InvoiceDetail {
  id: string;
  number: string;
  member: InvoiceMember | null;
  status: InvoiceStatus;
  grandTotal: string | number;
  currency: string;
  subTotal?: string | number;
  discount?: string | number | null;
  taxTotal?: string | number | null;
  dueAt: string | null;
  issuedAt: string | null;
  lines: InvoiceLine[];
  taxBreakup?: InvoiceTaxLine[] | null;
  payments: InvoicePayment[];
  dunningAttempts: DunningAttempt[];
}

export interface RetryCollectionResult {
  orderId?: string;
  amount: string | number;
  currency: string;
  keyId?: string;
}

export interface AgingBuckets {
  current: string | number;
  d1_7: string | number;
  d8_30: string | number;
  d30plus: string | number;
}

export interface AgingRow extends AgingBuckets {
  currency: string;
}

export type AgingResponse =
  | { buckets: AgingBuckets; currency: string; rows?: AgingRow[] }
  | { rows: AgingRow[]; currency?: string; buckets?: AgingBuckets };

/** Backend may return `{ buckets, currency }` or `{ rows: [...] }` — normalize to per-currency rows. */
export function normalizeAging(data: AgingResponse | undefined): AgingRow[] {
  if (!data) return [];
  if (Array.isArray(data.rows) && data.rows.length > 0) return data.rows;
  if (data.buckets) return [{ currency: data.currency ?? "", ...data.buckets }];
  return [];
}

/** Net still owed on a fully-loaded invoice (display helper; server owns the truth). */
export function getInvoiceOutstanding(invoice: InvoiceDetail): number {
  const paid = (invoice.payments ?? [])
    .filter((p) => p.status !== "FAILED" && p.status !== "REFUNDED")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  return Number(invoice.grandTotal) - paid;
}

export const OPEN_INVOICE_STATUSES: InvoiceStatus[] = ["ISSUED", "PART_PAID", "OVERDUE"];

export const invoiceStatusVariant: Record<string, "success" | "warning" | "secondary" | "destructive" | "outline" | "default"> = {
  DRAFT: "secondary",
  ISSUED: "warning",
  PART_PAID: "warning",
  OVERDUE: "destructive",
  PAID: "success",
  VOID: "outline",
};

export function useInvoices(
  params: PaginationParams & { status?: string; memberId?: string; overdue?: boolean } = {},
) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => api.get<Paginated<InvoiceListItem>>("/invoices", { query: params }),
  });
}

export function useInvoice(id: string | null | undefined) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => api.get<InvoiceDetail>(`/invoices/${id}`),
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInvoiceInput) => api.post<InvoiceDetail>("/invoices", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useVoidInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post<InvoiceDetail>(`/invoices/${id}/void`, { reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useRetryCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<RetryCollectionResult>(`/invoices/${id}/retry-collection`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useAging() {
  return useQuery({
    queryKey: [KEY, "aging"],
    queryFn: () => api.get<AgingResponse>("/billing/aging"),
  });
}

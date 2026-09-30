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
  /** What is still owed, as the server computes it (refunds netted). */
  outstanding?: string | number;
  membershipId?: string | null;
}

/** A payment that could still go towards an invoice. */
export interface LinkablePayment {
  id: string;
  amount: string | number;
  currency: string;
  method: string;
  status: string;
  note: string | null;
  membershipId: string | null;
  createdAt: string;
  /** How much of it is not on any invoice yet. */
  unallocated: string;
}

/**
 * The API sends an invoice's payments as `paymentLinks` (each with the
 * amount put on this invoice and the payment itself), its subtotal as
 * `subtotal`, and a reminder's time as `sentAt` or, for one not yet sent,
 * `createdAt`. The screens were written against `payments`, `subTotal`
 * and `sentAt`, so the drawer showed no payments, an outstanding equal to
 * the full total, and crashed reading `payments.length`.
 */
export function toInvoiceDetail(raw: Record<string, unknown>): InvoiceDetail {
  const links = Array.isArray(raw.paymentLinks)
    ? (raw.paymentLinks as Array<{ amount: string | number; payment?: InvoicePayment }>)
    : [];
  const payments: InvoicePayment[] = Array.isArray(raw.payments)
    ? (raw.payments as InvoicePayment[])
    : links
        .filter((link) => link.payment)
        .map((link) => ({ ...link.payment!, amount: link.amount }));
  const dunning = Array.isArray(raw.dunningAttempts)
    ? (raw.dunningAttempts as Array<DunningAttempt & { createdAt?: string }>)
    : [];
  return {
    ...(raw as unknown as InvoiceDetail),
    subTotal: (raw.subTotal ?? raw.subtotal) as string | number | undefined,
    discount: (raw.discount ?? raw.discountTotal) as string | number | null | undefined,
    lines: Array.isArray(raw.lines) ? (raw.lines as InvoiceLine[]) : [],
    payments,
    dunningAttempts: dunning.map((d) => ({ ...d, sentAt: d.sentAt ?? d.createdAt ?? "" })),
  };
}

export interface RetryCollectionResult {
  orderId?: string;
  amount: string | number;
  currency: string;
  keyId?: string;
}

/** The API answers `{ outstanding, currency, keyId, order: { id } }`. */
export function toRetryResult(raw: Record<string, unknown>): RetryCollectionResult {
  const order = (raw.order ?? {}) as { id?: string; currency?: string };
  return {
    orderId: (raw.orderId as string | undefined) ?? order.id,
    amount: (raw.amount ?? raw.outstanding ?? 0) as string | number,
    currency: ((raw.currency ?? order.currency) as string) ?? "",
    keyId: raw.keyId as string | undefined,
  };
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

/**
 * Aging arrives as one map per bucket, keyed by currency:
 * `{ current: { INR: "1200.00" }, d1_7: {}, d8_30: {}, d30plus: {} }`.
 * The older `{ buckets }` and `{ rows }` shapes are still accepted. Reading
 * only those, the aging strip never showed.
 */
export function normalizeAging(data: AgingResponse | undefined): AgingRow[] {
  if (!data) return [];
  if (Array.isArray(data.rows) && data.rows.length > 0) return data.rows;
  if (data.buckets) return [{ currency: data.currency ?? "", ...data.buckets }];
  const perCurrency = data as unknown as Partial<Record<keyof AgingBuckets, Record<string, string | number>>>;
  const keys: Array<keyof AgingBuckets> = ["current", "d1_7", "d8_30", "d30plus"];
  const currencies = new Set<string>();
  for (const key of keys) {
    const bucket = perCurrency[key];
    if (bucket && typeof bucket === "object") Object.keys(bucket).forEach((c) => currencies.add(c));
  }
  return [...currencies].map((currency) => {
    const row = { currency } as AgingRow;
    for (const key of keys) {
      const bucket = perCurrency[key];
      row[key] = bucket && typeof bucket === "object" ? (bucket[currency] ?? 0) : 0;
    }
    return row;
  });
}

/** Net still owed on a fully-loaded invoice (display helper; server owns the truth). */
export function getInvoiceOutstanding(invoice: InvoiceDetail): number {
  if (invoice.outstanding !== undefined && invoice.outstanding !== null) {
    return Number(invoice.outstanding);
  }
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
    queryFn: async () =>
      toInvoiceDetail(await api.get<Record<string, unknown>>(`/invoices/${id}`)),
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
    mutationFn: async (id: string) =>
      toRetryResult(await api.post<Record<string, unknown>>(`/invoices/${id}/retry-collection`, {})),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useLinkablePayments(invoiceId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: [KEY, invoiceId, "linkable-payments"],
    queryFn: () => api.get<LinkablePayment[]>(`/invoices/${invoiceId}/linkable-payments`),
    enabled: !!invoiceId && enabled,
  });
}

/** Puts an existing payment on an invoice. */
export function useLinkPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ invoiceId, paymentId }: { invoiceId: string; paymentId: string }) =>
      toInvoiceDetail(
        await api.post<Record<string, unknown>>(`/invoices/${invoiceId}/payments`, { paymentId }),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["member-payments"] });
    },
  });
}

export function useAging() {
  return useQuery({
    queryKey: [KEY, "aging"],
    queryFn: () => api.get<AgingResponse>("/billing/aging"),
  });
}

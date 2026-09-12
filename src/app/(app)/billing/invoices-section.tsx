"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/data-table";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { InvoiceDrawer } from "./invoice-drawer";
import { RaiseInvoiceDialog } from "./raise-invoice-dialog";
import { invoiceStatusVariant, normalizeAging, useAging, useInvoices, type InvoiceListItem } from "@/lib/hooks/use-invoices";

const STATUS_OPTIONS = ["ALL", "DRAFT", "ISSUED", "PART_PAID", "OVERDUE", "PAID", "VOID"] as const;

function AgingChips() {
  const aging = useAging();
  const rows = normalizeAging(aging.data);

  if (aging.isLoading) {
    return <div className="h-12 animate-pulse rounded-2xl bg-stone-200/70 dark:bg-white/10" aria-label="Loading aging" />;
  }
  if (aging.isError || rows.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) => (
        <div key={row.currency || "total"} className="flex flex-wrap items-center gap-2">
          {row.currency && (
            <span className="font-mono text-xs font-black tabular-nums text-stone-500">{row.currency}</span>
          )}
          {(
            [
              ["Current", row.current, "border-emerald-200/70 bg-emerald-50/70 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200"],
              ["1–7", row.d1_7, "border-amber-200/70 bg-amber-50/70 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"],
              ["8–30", row.d8_30, "border-orange-200/70 bg-orange-50/70 text-orange-900 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-200"],
              ["30+", row.d30plus, "border-rose-200/70 bg-rose-50/70 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200"],
            ] as const
          ).map(([label, value, tone]) => (
            <span key={label} className={`inline-flex min-h-11 items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-sm font-bold tabular-nums ${tone}`}>
              {label}: {Number(value).toFixed(2)}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

const columns: ColumnDef<InvoiceListItem>[] = [
  {
    header: "Number",
    accessorKey: "number",
    cell: ({ row }) => <span className="font-mono font-bold tabular-nums text-stone-950 dark:text-white">{row.original.number}</span>,
  },
  {
    header: "Member",
    accessorKey: "member",
    cell: ({ row }) => {
      const m = row.original.member;
      return m ? (
        <span className="font-bold text-stone-900 dark:text-stone-100">{m.firstName} {m.lastName}</span>
      ) : "—";
    },
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row }) => <Badge variant={invoiceStatusVariant[row.original.status] ?? "secondary"}>{row.original.status}</Badge>,
  },
  {
    header: "Total",
    accessorKey: "grandTotal",
    cell: ({ row }) => (
      <span className="font-bold tabular-nums text-stone-950 dark:text-white">
        {row.original.currency} {Number(row.original.grandTotal).toFixed(2)}
      </span>
    ),
  },
  {
    header: "Due date",
    accessorKey: "dueAt",
    cell: ({ row }) => (
      <span className="text-sm font-medium text-stone-600 tabular-nums dark:text-stone-400">
        {row.original.dueAt ? new Date(row.original.dueAt).toLocaleDateString() : "—"}
      </span>
    ),
  },
];

export function InvoicesSection() {
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState<string>("ALL");
  const [overdueOnly, setOverdueOnly] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const invoicesQuery = useInvoices({
    page,
    pageSize: 20,
    order: "desc",
    ...(status !== "ALL" ? { status } : {}),
    ...(overdueOnly ? { overdue: true } : {}),
  });

  function handleStatusChange(next: string) {
    setStatus(next);
    setPage(1);
  }

  function handleOverdueChange(next: boolean) {
    setOverdueOnly(next);
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AgingChips />
        <RaiseInvoiceDialog />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-44">
          <Label htmlFor="invoice-status-filter">Status</Label>
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger id="invoice-status-filter" className="mt-1.5 min-h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{s === "ALL" ? "All statuses" : s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex min-h-11 items-center gap-2">
          <Switch id="invoice-overdue-only" checked={overdueOnly} onCheckedChange={handleOverdueChange} />
          <Label htmlFor="invoice-overdue-only">Overdue only</Label>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={invoicesQuery.data}
        isLoading={invoicesQuery.isLoading}
        isError={invoicesQuery.isError}
        onRetry={() => invoicesQuery.refetch()}
        page={page}
        onPageChange={setPage}
        onRowClick={(row) => setSelectedId(row.id)}
        emptyTitle="No invoices yet"
        emptyDescription="Raise an invoice to start billing a member."
      />

      <InvoiceDrawer key={selectedId} invoiceId={selectedId} open={!!selectedId} onOpenChange={(next) => { if (!next) setSelectedId(null); }} />
    </div>
  );
}

export function InvoicesSectionHeader() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
        <Receipt className="size-5" aria-hidden="true" />
      </span>
      <div>
        <h2 id="billing-activity" className="font-serif text-xl font-semibold tracking-tight text-stone-950 dark:text-white">Invoices</h2>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Receipt, Wallet } from "lucide-react";

import { PageHero } from "@/components/shared/page-hero";
import { DataState } from "@/components/shared/data-state";
import { Panel } from "@/components/shared/panel";
import { Badge } from "@/components/ui/badge";
import {
  usePortalBilling,
  type PortalInvoice,
  type PortalPayment,
} from "@/lib/hooks/use-portal";
import { formatMoney } from "@/lib/money";

const INVOICE_STATUS: Record<
  PortalInvoice["status"],
  { label: string; variant: "secondary" | "outline" | "destructive" | "default" }
> = {
  ISSUED: { label: "Due", variant: "secondary" },
  PART_PAID: { label: "Part paid", variant: "secondary" },
  PAID: { label: "Paid", variant: "outline" },
  OVERDUE: { label: "Overdue", variant: "destructive" },
  VOID: { label: "Cancelled", variant: "outline" },
  WRITTEN_OFF: { label: "Waived", variant: "outline" },
};

const PAYMENT_STATUS: Record<PortalPayment["status"], string | null> = {
  COMPLETED: null,
  REFUNDED: "Refunded",
  PARTIALLY_REFUNDED: "Part refunded",
  FAILED: "Failed",
};

const METHOD: Record<string, string> = {
  CASH: "Cash",
  CARD: "Card",
  UPI: "UPI",
  BANK_TRANSFER: "Bank transfer",
  OTHER: "Other",
};

/** What is still owed, per currency -- a gym bills in one, but adding
 * rupees to dollars would be wrong the one time it does not. */
function outstanding(invoices: PortalInvoice[]) {
  const totals = new Map<string, number>();
  for (const inv of invoices) {
    const balance = Number(inv.balance);
    if (balance > 0) totals.set(inv.currency, (totals.get(inv.currency) ?? 0) + balance);
  }
  return [...totals.entries()];
}

export default function PortalBilling() {
  const billing = usePortalBilling();
  const invoices = billing.data?.invoices ?? [];
  const payments = billing.data?.payments ?? [];
  const owed = outstanding(invoices);

  return (
    <div className="flex flex-col gap-4">
      <PageHero icon={Receipt} title="Bills and payments" description="Your bills and what you have paid" />
      <DataState
        isLoading={billing.isPending}
        isError={billing.isError}
        onRetry={() => void billing.refetch()}
        errorMessage="Your bills could not be loaded."
        isEmpty={invoices.length === 0 && payments.length === 0}
        emptyIcon={Receipt}
        emptyTitle="Nothing billed yet"
        emptyDescription="Bills and payments will show up here."
        skeletonRows={4}
      >
        <div className="flex flex-col gap-4">
          <Panel title="Balance" titleId="portal-balance">
            {owed.length === 0 ? (
              <p className="text-sm text-muted-foreground">You are all paid up.</p>
            ) : (
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Outstanding</p>
                  <p className="text-2xl font-semibold tabular-nums">
                    {owed.map(([currency, amount]) => formatMoney(amount, currency)).join(" + ")}
                  </p>
                </div>
                <p className="max-w-xs text-xs text-muted-foreground">
                  Pay at the front desk, or ask them for a payment link.
                </p>
              </div>
            )}
          </Panel>

          <Panel title="Bills" titleId="portal-invoices" flush>
            {invoices.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground sm:p-5">No bills yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {invoices.map((inv) => {
                  const status = INVOICE_STATUS[inv.status] ?? { label: inv.status, variant: "outline" as const };
                  const balance = Number(inv.balance);
                  return (
                    <li key={inv.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{inv.number}</p>
                        <p className="text-xs text-muted-foreground">
                          {inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString() : "Not dated"}
                          {inv.dueAt && balance > 0 && <> · due {new Date(inv.dueAt).toLocaleDateString()}</>}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-sm font-semibold tabular-nums">
                          {formatMoney(inv.grandTotal, inv.currency)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {balance > 0 && inv.status !== "ISSUED" && inv.status !== "OVERDUE" && (
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {formatMoney(balance, inv.currency)} left
                            </span>
                          )}
                          <Badge variant={status.variant} className="rounded-full">
                            {status.label}
                          </Badge>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel title="Payments" titleId="portal-payments" flush>
            {payments.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground sm:p-5">No payments yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {payments.map((p) => {
                  const flag = PAYMENT_STATUS[p.status];
                  return (
                    <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {p.planName ??
                            (p.invoiceNumbers.length > 0
                              ? `Paid against ${p.invoiceNumbers.join(", ")}`
                              : "Payment")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(p.createdAt).toLocaleDateString()} · {METHOD[p.method] ?? p.method}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {flag && (
                          <Badge
                            variant={p.status === "FAILED" ? "destructive" : "outline"}
                            className="rounded-full"
                          >
                            {flag}
                          </Badge>
                        )}
                        <span
                          className={`text-sm font-semibold tabular-nums ${p.status === "FAILED" ? "text-muted-foreground line-through" : ""}`}
                        >
                          {formatMoney(p.amount, p.currency)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Link
            href="/portal/renew"
            className="flex min-h-11 items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/50"
          >
            <Wallet className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            Plans and renewal
          </Link>
        </div>
      </DataState>
    </div>
  );
}

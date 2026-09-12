"use client";

import * as React from "react";
import { toast } from "sonner";
import { Ban, RefreshCw, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiError } from "@/lib/api/client";
import {
  getInvoiceOutstanding,
  invoiceStatusVariant,
  useInvoice,
  useRetryCollection,
  useVoidInvoice,
  type RetryCollectionResult,
} from "@/lib/hooks/use-invoices";

function fmtDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function RetryResult({ result }: { result: RetryCollectionResult }) {
  return (
    <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-3 text-sm dark:border-emerald-900/50 dark:bg-emerald-950/30">
      <p className="font-bold text-emerald-900 dark:text-emerald-200">Collection started</p>
      <p className="mt-1 font-mono text-xs tabular-nums text-emerald-800 dark:text-emerald-300">
        {result.currency} {Number(result.amount).toFixed(2)}
        {result.orderId ? ` · Order ${result.orderId}` : ""}
      </p>
    </div>
  );
}

export function InvoiceDrawer({
  invoiceId,
  open,
  onOpenChange,
}: {
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { hasPermission } = useAuth();
  const detail = useInvoice(open ? invoiceId : null);
  const voidInvoice = useVoidInvoice();
  const retryCollection = useRetryCollection();
  const [voidReason, setVoidReason] = React.useState("");
  const [confirmingVoid, setConfirmingVoid] = React.useState(false);
  const [retryResult, setRetryResult] = React.useState<RetryCollectionResult | null>(null);
  const [unconfigured, setUnconfigured] = React.useState(false);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setVoidReason("");
      setConfirmingVoid(false);
      setRetryResult(null);
      setUnconfigured(false);
    }
    onOpenChange(next);
  }

  const invoice = detail.data;
  const outstanding = invoice ? getInvoiceOutstanding(invoice) : 0;
  const canVoid =
    hasPermission("payments.refund") && invoice && invoice.status !== "VOID" && invoice.status !== "PAID";

  async function handleVoid() {
    if (!invoice || !voidReason.trim()) {
      toast.error("Enter a reason to void this invoice");
      return;
    }
    try {
      await voidInvoice.mutateAsync({ id: invoice.id, reason: voidReason.trim() });
      toast.success(`Invoice ${invoice.number} voided`);
      setConfirmingVoid(false);
      setVoidReason("");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to void invoice");
    }
  }

  async function handleRetry() {
    if (!invoice) return;
    setRetryResult(null);
    setUnconfigured(false);
    try {
      const result = await retryCollection.mutateAsync(invoice.id);
      setRetryResult(result);
      toast.success(`Collection retried for ${invoice.number}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 503) {
        setUnconfigured(true);
      } else {
        toast.error(error instanceof ApiError ? error.message : "Retry failed");
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="left-auto right-0 top-0 flex h-dvh w-full translate-x-0 translate-y-0 flex-col gap-4 overflow-y-auto rounded-none sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{invoice ? `Invoice ${invoice.number}` : "Invoice"}</DialogTitle>
        </DialogHeader>

        {detail.isLoading ? (
          <div className="flex flex-col gap-3" aria-label="Loading invoice">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-stone-200/70 dark:bg-white/10" />)}
          </div>
        ) : detail.isError || !invoice ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-stone-600 dark:text-stone-300">
              Couldn&apos;t load this invoice.
            </p>
            <Button variant="outline" className="min-h-11 w-full sm:w-auto" onClick={() => detail.refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={invoiceStatusVariant[invoice.status] ?? "secondary"}>{invoice.status}</Badge>
              {invoice.member && (
                <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  {invoice.member.firstName} {invoice.member.lastName}
                </span>
              )}
              <span className="ml-auto font-mono text-lg font-black tabular-nums text-stone-950 dark:text-white">
                {invoice.currency} {Number(invoice.grandTotal).toFixed(2)}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <p className="text-stone-600 dark:text-stone-400">Issued: <span className="font-bold text-stone-900 tabular-nums dark:text-stone-100">{fmtDateTime(invoice.issuedAt)}</span></p>
              <p className="text-stone-600 dark:text-stone-400">Due: <span className="font-bold text-stone-900 tabular-nums dark:text-stone-100">{fmtDateTime(invoice.dueAt)}</span></p>
              <p className="text-stone-600 dark:text-stone-400">Outstanding: <span className="font-bold tabular-nums text-rose-600">{invoice.currency} {outstanding.toFixed(2)}</span></p>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-black uppercase tracking-wide text-stone-500">Lines</h3>
              <div className="overflow-hidden rounded-2xl border border-stone-200/70 dark:border-white/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-stone-50 text-left text-[11px] font-black uppercase tracking-wider text-stone-500 dark:bg-white/5 dark:text-stone-400">
                      <th className="px-3 py-2">Label</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.lines.map((line, i) => (
                      <tr key={i} className="border-t border-stone-100 font-medium text-stone-900 dark:border-white/10 dark:text-stone-100">
                        <td className="px-3 py-2">{line.label}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{line.qty ?? 1}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{invoice.currency} {Number(line.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {(invoice.taxBreakup?.length ?? 0) > 0 && (
                <div className="mt-2 rounded-2xl border border-stone-200/70 p-3 text-sm dark:border-white/10">
                  <p className="mb-1 text-[11px] font-black uppercase tracking-wider text-stone-500">Tax breakup</p>
                  {invoice.taxBreakup!.map((t, i) => (
                    <p key={i} className="flex justify-between font-medium text-stone-700 tabular-nums dark:text-stone-300">
                      <span>{t.label}</span><span>{invoice.currency} {Number(t.amount).toFixed(2)}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-sm font-black uppercase tracking-wide text-stone-500">Linked payments</h3>
              {invoice.payments.length === 0 ? (
                <p className="text-sm text-stone-500">No payments linked yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {invoice.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-2xl border border-stone-200/70 bg-white/80 p-3 text-sm dark:border-white/10 dark:bg-white/5">
                      <div>
                        <p className="font-bold tabular-nums">{p.currency} {Number(p.amount).toFixed(2)} · {p.method}</p>
                        <p className="text-xs text-stone-500 tabular-nums">{fmtDateTime(p.createdAt)}</p>
                      </div>
                      <Badge variant="outline">{p.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-sm font-black uppercase tracking-wide text-stone-500">Reminders</h3>
              {invoice.dunningAttempts.length === 0 ? (
                <p className="text-sm text-stone-500">No reminders sent yet.</p>
              ) : (
                <ol className="flex flex-col gap-2">
                  {invoice.dunningAttempts.map((d, i) => (
                    <li key={i} className="flex items-center justify-between rounded-2xl border border-stone-200/70 p-3 text-sm dark:border-white/10">
                      <div>
                        <p className="font-bold">{d.channel} · {d.templateKey}</p>
                        <p className="text-xs text-stone-500 tabular-nums">{fmtDateTime(d.sentAt)}</p>
                      </div>
                      <Badge variant="outline">{d.status}</Badge>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {retryResult && <RetryResult result={retryResult} />}
            {unconfigured && (
              <div className="rounded-2xl border border-amber-200/70 bg-amber-50/70 p-3 text-sm dark:border-amber-900/50 dark:bg-amber-950/30">
                <p className="font-bold text-amber-900 dark:text-amber-200">Online collection isn&apos;t configured</p>
                <p className="mt-1 text-amber-800 dark:text-amber-300">
                  Record a cash payment from the billing page instead.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2 border-t border-stone-200/70 pt-4 sm:flex-row dark:border-white/10">
              {canVoid && (
                confirmingVoid ? (
                  <div className="flex w-full flex-col gap-2">
                    <Input
                      placeholder="Void reason (required)"
                      value={voidReason}
                      onChange={(e) => setVoidReason(e.target.value)}
                    />
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        variant="destructive"
                        className="min-h-11 flex-1"
                        disabled={voidInvoice.isPending}
                        onClick={handleVoid}
                      >
                        {voidInvoice.isPending ? "Voiding..." : "Confirm void"}
                      </Button>
                      <Button variant="outline" className="min-h-11 flex-1" onClick={() => setConfirmingVoid(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" className="min-h-11 flex-1" onClick={() => setConfirmingVoid(true)}>
                    <Ban className="size-4" aria-hidden="true" /> Void invoice
                  </Button>
                )
              )}
              <Button
                className="min-h-11 flex-1"
                disabled={retryCollection.isPending || invoice.status === "VOID" || invoice.status === "PAID"}
                onClick={handleRetry}
              >
                <RefreshCw className="size-4" aria-hidden="true" />
                {retryCollection.isPending ? "Retrying..." : "Retry collection"}
              </Button>
            </div>
            {!hasPermission("payments.refund") && (
              <p className="flex items-center gap-1.5 text-xs text-stone-500">
                <Wallet className="size-3.5" aria-hidden="true" /> Voiding requires the payments.refund permission.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

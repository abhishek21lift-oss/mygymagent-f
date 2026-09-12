"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MemberPicker } from "@/components/shared/member-picker";
import { useAuth } from "@/lib/auth/auth-context";
import { useCreatePayment } from "@/lib/hooks/use-payments";
import {
  OPEN_INVOICE_STATUSES,
  getInvoiceOutstanding,
  useInvoice,
  useInvoices,
  type InvoiceListItem,
} from "@/lib/hooks/use-invoices";
import { ApiError } from "@/lib/api/client";
import { createPaymentSchema, type CreatePaymentInput } from "@/lib/validation/gym";

/** Optional invoice link for a payment. Searches the member's invoices by number. */
function InvoiceLinkPicker({
  memberId,
  value,
  onChange,
}: {
  memberId: string;
  value: string | null;
  onChange: (invoiceId: string | null, outstanding: number | null) => void;
}) {
  const [search, setSearch] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const invoicesQuery = useInvoices({ memberId, pageSize: 50, order: "desc" });
  const detailQuery = useInvoice(value);
  const items = invoicesQuery.data?.items ?? [];
  const selected = items.find((i) => i.id === value) ?? null;
  const outstanding = detailQuery.data ? getInvoiceOutstanding(detailQuery.data) : null;

  const results = items
    .filter((i) => i.number.toLowerCase().includes(search.trim().toLowerCase()))
    .slice(0, 6);

  // Report the outstanding balance upward once the detail loads (prefills amount).
  const lastReported = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (value && detailQuery.data && lastReported.current !== value) {
      lastReported.current = value;
      onChange(value, outstanding);
    }
  }, [value, detailQuery.data, outstanding, onChange]);

  function pick(item: InvoiceListItem) {
    lastReported.current = null;
    onChange(item.id, null);
    setOpen(false);
    setSearch("");
  }

  function clear() {
    lastReported.current = null;
    onChange(null, null);
    setSearch("");
  }

  if (selected) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-200/70 bg-emerald-50/60 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm font-bold tabular-nums text-emerald-950 dark:text-emerald-100">
            {selected.number} · {selected.currency} {Number(selected.grandTotal).toFixed(2)}
          </p>
          <p className="text-xs font-medium text-emerald-800 tabular-nums dark:text-emerald-300">
            {detailQuery.isLoading
              ? "Loading outstanding..."
              : outstanding !== null
                ? `Outstanding: ${detailQuery.data!.currency} ${outstanding.toFixed(2)}`
                : ""}
          </p>
        </div>
        <Badge variant={OPEN_INVOICE_STATUSES.includes(selected.status) ? "warning" : "secondary"}>
          {selected.status}
        </Badge>
        <Button type="button" variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label="Unlink invoice" onClick={clear}>
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Input
        placeholder="Search invoices by number (optional)"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      {open && search.trim() && (
        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-2xl border border-stone-200/80 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-stone-950">
          {invoicesQuery.isLoading && <p className="p-2 text-sm text-muted-foreground">Searching...</p>}
          {!invoicesQuery.isLoading && results.length === 0 && (
            <p className="p-2 text-sm text-muted-foreground">No invoices match.</p>
          )}
          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              className="flex w-full items-center justify-between gap-2 rounded-xl px-2 py-2 text-left text-sm hover:bg-accent"
              onClick={() => pick(item)}
            >
              <span className="font-mono font-bold tabular-nums">{item.number}</span>
              <span className="text-xs font-medium tabular-nums text-stone-600 dark:text-stone-400">
                {item.currency} {Number(item.grandTotal).toFixed(2)} · {item.status}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function RecordPaymentDialog() {
  const { hasPermission } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [member, setMember] = React.useState<{ id: string; label: string } | null>(null);
  const [invoiceId, setInvoiceId] = React.useState<string | null>(null);
  const createPayment = useCreatePayment();
  const form = useForm<Omit<CreatePaymentInput, "memberId">>({
    resolver: zodResolver(createPaymentSchema.omit({ memberId: true })),
    defaultValues: { amount: 0, method: "CASH", note: "" },
  });

  const handleInvoiceChange = React.useCallback(
    (id: string | null, outstanding: number | null) => {
      setInvoiceId(id);
      form.setValue("invoiceId", id ?? undefined);
      if (id && outstanding !== null && outstanding > 0) {
        form.setValue("amount", Math.round(outstanding * 100) / 100);
      }
      if (!id) form.setValue("invoiceId", undefined);
    },
    [form],
  );

  function resetAll() {
    setMember(null);
    setInvoiceId(null);
    form.reset();
  }

  async function onSubmit(values: Omit<CreatePaymentInput, "memberId">) {
    if (!member) {
      toast.error("Select a member first");
      return;
    }
    try {
      // invoiceId is only present when an invoice was picked (server auto-links).
      await createPayment.mutateAsync({ ...values, memberId: member.id });
      toast.success(`Payment recorded for ${member.label}`);
      setOpen(false);
      resetAll();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to record payment");
    }
  }

  if (!hasPermission("payments.create")) return null;

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) resetAll(); }}>
      <DialogTrigger asChild>
        <Button className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[linear-gradient(105deg,#059669,#0d9488_55%,#0ea5e9)] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-500/25 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
          <Plus className="size-4" aria-hidden="true" /> Record payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Record a payment</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-1.5 text-sm font-medium">Member</p>
            <MemberPicker
              value={member}
              onChange={(m) => {
                setMember(m);
                setInvoiceId(null);
                form.setValue("invoiceId", undefined);
              }}
            />
          </div>
          {member && (
            <div>
              <p className="mb-1.5 text-sm font-medium">Invoice (optional)</p>
              <InvoiceLinkPicker memberId={member.id} value={invoiceId} onChange={handleInvoiceChange} />
            </div>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="amount" render={({ field }) => <FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>} />
                <FormField control={form.control} name="method" render={({ field }) => <FormItem><FormLabel>Method</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="CASH">Cash</SelectItem><SelectItem value="CARD">Card</SelectItem><SelectItem value="UPI">UPI</SelectItem><SelectItem value="BANK_TRANSFER">Bank transfer</SelectItem><SelectItem value="OTHER">Other</SelectItem></SelectContent></Select><FormMessage /></FormItem>} />
              </div>
              <FormField control={form.control} name="note" render={({ field }) => <FormItem><FormLabel>Note (optional)</FormLabel><FormControl><Input placeholder="PT session, product sale, ..." {...field} /></FormControl><FormMessage /></FormItem>} />
              <DialogFooter>
                <Button type="submit" className="min-h-11 w-full sm:w-auto" disabled={createPayment.isPending}>
                  {createPayment.isPending ? "Recording..." : "Record payment"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowRight, CreditCard, Plus, Sparkles, Undo2, Wallet, TrendingUp, Clock3 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { MemberPicker } from "@/components/shared/member-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth/auth-context";
import { usePayments, useCreatePayment, useRefundPayment } from "@/lib/hooks/use-payments";
import { ExpensesSection } from "./expenses-section";
import { ApiError } from "@/lib/api/client";
import { createPaymentSchema, refundPaymentSchema, type CreatePaymentInput, type RefundPaymentInput } from "@/lib/validation/gym";
import type { Payment, PaymentStatus } from "@/lib/types/gym";

const statusVariant: Record<PaymentStatus, "success" | "warning" | "secondary" | "destructive"> = { COMPLETED: "success", PARTIALLY_REFUNDED: "warning", REFUNDED: "secondary", FAILED: "destructive" };

function RecordPaymentDialog() {
  const [open, setOpen] = React.useState(false); const [member, setMember] = React.useState<{ id: string; label: string } | null>(null); const createPayment = useCreatePayment();
  const form = useForm<Omit<CreatePaymentInput, "memberId">>({ resolver: zodResolver(createPaymentSchema.omit({ memberId: true })), defaultValues: { amount: 0, method: "CASH", note: "" } });
  async function onSubmit(values: Omit<CreatePaymentInput, "memberId">) { if (!member) { toast.error("Select a member first"); return; } try { await createPayment.mutateAsync({ ...values, memberId: member.id }); toast.success(`Payment recorded for ${member.label}`); setOpen(false); setMember(null); form.reset(); } catch (error) { toast.error(error instanceof ApiError ? error.message : "Failed to record payment"); } }
  return <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) { setMember(null); form.reset(); } }}><DialogTrigger asChild><Button className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[linear-gradient(105deg,#059669,#0d9488_55%,#0ea5e9)] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-500/25 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"><Plus className="size-4" aria-hidden="true" /> Record payment</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Record a payment</DialogTitle></DialogHeader><div className="flex flex-col gap-4"><div><p className="mb-1.5 text-sm font-medium">Member</p><MemberPicker value={member} onChange={setMember} /></div><Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4"><div className="grid grid-cols-2 gap-4"><FormField control={form.control} name="amount" render={({ field }) => <FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>} /><FormField control={form.control} name="method" render={({ field }) => <FormItem><FormLabel>Method</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="CASH">Cash</SelectItem><SelectItem value="CARD">Card</SelectItem><SelectItem value="UPI">UPI</SelectItem><SelectItem value="BANK_TRANSFER">Bank transfer</SelectItem><SelectItem value="OTHER">Other</SelectItem></SelectContent></Select><FormMessage /></FormItem>} /></div><FormField control={form.control} name="note" render={({ field }) => <FormItem><FormLabel>Note (optional)</FormLabel><FormControl><Input placeholder="PT session, product sale, ..." {...field} /></FormControl><FormMessage /></FormItem>} /><DialogFooter><Button type="submit" disabled={createPayment.isPending}>{createPayment.isPending ? "Recording..." : "Record payment"}</Button></DialogFooter></form></Form></div></DialogContent></Dialog>;
}
function RefundDialog({ payment }: { payment: Payment }) { const [open, setOpen] = React.useState(false); const refundPayment = useRefundPayment(); const form = useForm<RefundPaymentInput>({ resolver: zodResolver(refundPaymentSchema), defaultValues: { amount: undefined, reason: "" } }); const alreadyRefunded = (payment.refunds ?? []).reduce((sum, r) => sum + Number(r.amount), 0); const remaining = Number(payment.amount) - alreadyRefunded; async function onSubmit(values: RefundPaymentInput) { try { await refundPayment.mutateAsync({ id: payment.id, input: values }); toast.success("Refund recorded"); setOpen(false); form.reset(); } catch (error) { toast.error(error instanceof ApiError ? error.message : "Refund failed"); } } return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button variant="ghost" size="sm" className="min-h-11 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"><Undo2 className="size-3.5" aria-hidden="true" /> Refund</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Refund payment</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground">Remaining refundable balance: {payment.currency} {remaining.toFixed(2)}</p><Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4"><FormField control={form.control} name="amount" render={({ field }) => <FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" step="0.01" placeholder={remaining.toFixed(2)} {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>} /><FormField control={form.control} name="reason" render={({ field }) => <FormItem><FormLabel>Reason (optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} /><DialogFooter><Button type="submit" variant="destructive" disabled={refundPayment.isPending}>{refundPayment.isPending ? "Refunding..." : "Issue refund"}</Button></DialogFooter></form></Form></DialogContent></Dialog>; }
function RefundCell({ payment }: { payment: Payment }) { const { hasPermission } = useAuth(); if (payment.status === "REFUNDED") return <span className="inline-flex items-center rounded-full bg-stone-500/10 px-2.5 py-1 text-xs font-bold text-stone-600 ring-1 ring-stone-200/60">Fully refunded</span>; if (!hasPermission("payments.refund")) return null; return <RefundDialog payment={payment} />; }
const columns: ColumnDef<Payment>[] = [{ header: "Member", accessorKey: "member", cell: ({ row }) => { const m = row.original.member; return m ? <div><p className="font-bold text-stone-900">{m.firstName} {m.lastName}</p><p className="text-xs font-medium text-stone-600">{row.original.note ?? "Payment"}</p></div> : "—"; } }, { header: "Amount", accessorKey: "amount", cell: ({ row }) => <span className="font-bold tabular-nums text-stone-950">{row.original.currency} {row.original.amount}</span> }, { header: "Method", accessorKey: "method", cell: ({ row }) => <Badge variant="outline">{row.original.method}</Badge> }, { header: "Status", accessorKey: "status", cell: ({ row }) => <Badge variant={statusVariant[row.original.status]}>{row.original.status}</Badge> }, { header: "Date", accessorKey: "createdAt", cell: ({ row }) => <span className="text-sm font-medium text-stone-600 tabular-nums">{new Date(row.original.createdAt).toLocaleString()}</span> }, { id: "actions", header: "", cell: ({ row }) => <RefundCell payment={row.original} /> }];

export default function BillingPage() {
  const { hasPermission } = useAuth();
  const [page, setPage] = React.useState(1);
  const paymentsQuery = usePayments({ page, pageSize: 20, order: "desc" });
  const items = paymentsQuery.data?.items ?? [];
  const totalCollected = items.filter((p) => p.status !== "REFUNDED").reduce((sum, p) => sum + Number(p.amount), 0);
  const totalRefunded = items.flatMap((p) => p.refunds ?? []).reduce((sum, r) => sum + Number(r.amount), 0);
  const currency = items[0]?.currency ?? "INR";
  return (
    <div className="relative -mx-2 min-h-full overflow-hidden pb-12 sm:-mx-3 lg:-mx-5">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_5%_2%,rgba(6,182,212,.13),transparent_19%),radial-gradient(circle_at_96%_4%,rgba(99,102,241,.15),transparent_22%),radial-gradient(circle_at_70%_38%,rgba(217,70,239,.10),transparent_25%),radial-gradient(circle_at_12%_72%,rgba(16,185,129,.08),transparent_24%)]" aria-hidden="true" />
      <div className="mx-auto flex max-w-[1680px] flex-col gap-8 px-2 sm:px-4 lg:px-6">
        <section aria-labelledby="billing-title" className="relative overflow-hidden rounded-[34px] border border-white/90 bg-white/88 p-6 shadow-[0_35px_110px_-48px_rgba(79,70,229,.48)] backdrop-blur-2xl sm:p-8 lg:p-10 dark:border-white/10 dark:bg-stone-950/80">
          <div className="pointer-events-none absolute -left-24 -top-32 size-80 rounded-full bg-emerald-300/30 blur-3xl motion-safe:animate-blob" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-28 -top-24 size-96 rounded-full bg-teal-300/25 blur-3xl motion-safe:animate-blob motion-safe:[animation-delay:2.5s]" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-40 left-[35%] size-96 rounded-full bg-amber-300/20 blur-3xl motion-safe:animate-pulse-slow" aria-hidden="true" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em] text-emerald-800">
                <Sparkles className="size-3.5" aria-hidden="true" /> Finance intelligence
              </div>
              <h1 id="billing-title" className="font-serif text-4xl font-semibold tracking-[-.045em] text-stone-950 sm:text-5xl lg:text-6xl dark:text-white">Finance OS</h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-stone-600 dark:text-stone-400">Know where the money moved — a clean operating view for collections, refunds and payment activity. No fabricated aggregates, only data available to the current finance API.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {hasPermission("payments.create") && <RecordPaymentDialog />}
              <Link href="/ai" className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-emerald-200/80 bg-white/80 px-5 py-3 text-sm font-bold text-emerald-900 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
                <Sparkles className="size-4" aria-hidden="true" /> Ask AI about revenue
              </Link>
            </div>
          </div>
        </section>

        <section aria-labelledby="billing-stats" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 id="billing-stats" className="font-serif text-2xl font-semibold tracking-tight text-stone-950 dark:text-white">Collections snapshot</h2>
              <p className="mt-1 text-xs font-medium text-stone-600 dark:text-stone-400">Live figures from the current page of transactions.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <FinanceMetric icon={Wallet} label="Collected · current page" value={`${currency} ${totalCollected.toFixed(2)}`} hint="Excludes fully refunded" loading={paymentsQuery.isLoading} tone="green" />
            <FinanceMetric icon={Undo2} label="Refunded · current page" value={`${currency} ${totalRefunded.toFixed(2)}`} hint="Warm dues watch" loading={paymentsQuery.isLoading} tone="amber" />
            <FinanceMetric icon={CreditCard} label="Transactions" value={items.length} hint="On this page" loading={paymentsQuery.isLoading} tone="violet" />
            <FinanceMetric icon={TrendingUp} label="Payment activity" value="Live" hint="Real-time ledger" loading={paymentsQuery.isLoading} tone="cyan" />
          </div>
        </section>

        <section aria-labelledby="billing-next" className="grid animate-in fade-in slide-in-from-bottom-2 gap-4 duration-500 [animation-delay:100ms] sm:grid-cols-3">
          <FinanceInsight icon={TrendingUp} title="Revenue trend" text="Period-level revenue analytics can be connected when the backend aggregate is available." />
          <FinanceInsight icon={Clock3} title="Outstanding" text="Next layer: aging, renewal balances and recovery opportunities from real billing data." />
          <FinanceInsight icon={Sparkles} title="AI finance" text="Next layer: explain revenue changes and surface high-impact financial actions." />
        </section>

        <section aria-labelledby="billing-activity" className="overflow-hidden rounded-[28px] border border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-delay:150ms] dark:border-white/10 dark:bg-stone-950/80">
          <div className="flex items-center justify-between gap-3 border-b border-stone-100/80 bg-gradient-to-r from-emerald-50/90 via-white to-teal-50/60 px-5 py-5 sm:px-6 dark:from-emerald-950/40 dark:via-stone-950 dark:to-teal-950/30">
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
                <CreditCard className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 id="billing-activity" className="font-serif text-xl font-semibold tracking-tight text-stone-950 dark:text-white">Payment activity</h2>
                <p className="mt-0.5 text-xs font-medium text-stone-600 dark:text-stone-400">Current transactions and refund actions.</p>
              </div>
            </div>
            <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50/70 font-mono text-xs font-bold text-emerald-800 tabular-nums">Page {page}</Badge>
          </div>
          <div className="p-4 sm:p-5">
            <DataTable columns={columns} data={items} isLoading={paymentsQuery.isLoading} isError={paymentsQuery.isError} onRetry={() => paymentsQuery.refetch()} page={page} onPageChange={setPage} emptyTitle="No payments recorded yet" emptyDescription="Record your first payment to start tracking gym revenue." />
          </div>
        </section>

        <ExpensesSection />
      </div>
    </div>
  );
}

function FinanceMetric({ icon: Icon, label, value, hint, loading, tone }: { icon: typeof Wallet; label: string; value: string | number; hint: string; loading: boolean; tone: "green" | "amber" | "violet" | "cyan" }) {
  const tones = {
    green: { bar: "from-emerald-400 via-teal-500 to-green-600", tile: "from-emerald-500 to-teal-600 shadow-emerald-500/30", orb: "bg-emerald-400/20", ring: "hover:border-emerald-200 hover:shadow-emerald-500/10" },
    amber: { bar: "from-amber-400 via-orange-500 to-amber-600", tile: "from-amber-500 to-orange-600 shadow-amber-500/30", orb: "bg-amber-400/20", ring: "hover:border-amber-200 hover:shadow-amber-500/10" },
    violet: { bar: "from-violet-600 via-purple-600 to-fuchsia-600", tile: "from-violet-600 to-fuchsia-600 shadow-violet-500/30", orb: "bg-fuchsia-400/20", ring: "hover:border-violet-200 hover:shadow-violet-500/10" },
    cyan: { bar: "from-cyan-400 via-sky-500 to-blue-600", tile: "from-cyan-500 to-blue-600 shadow-cyan-500/30", orb: "bg-cyan-400/20", ring: "hover:border-cyan-200 hover:shadow-cyan-500/10" },
  };
  const t = tones[tone];
  return (
    <div className={`group relative overflow-hidden rounded-[22px] border border-white/90 bg-white/85 shadow-[0_20px_60px_-38px_rgba(79,70,229,.35)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_-38px_rgba(79,70,229,.42)] dark:border-white/10 dark:bg-stone-950/80 ${t.ring}`}>
      <span className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${t.bar}`} aria-hidden="true" />
      <div className={`pointer-events-none absolute -right-10 -top-10 size-32 rounded-full blur-2xl transition duration-300 group-hover:scale-125 ${t.orb}`} aria-hidden="true" />
      <div className="relative flex items-center gap-4 p-5 lg:p-6">
        <span className={`flex size-14 shrink-0 items-center justify-center rounded-[19px] bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${t.tile}`}>
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[.18em] text-stone-500">{label}</p>
          {loading ? <div className="mt-2 h-7 w-24 animate-pulse rounded-lg bg-stone-200/70" aria-label="Loading metric" /> : <p className="mt-1 truncate text-2xl font-black tracking-tight text-stone-950 tabular-nums dark:text-white">{value}</p>}
          <p className="mt-1 text-[11px] font-medium text-stone-600 dark:text-stone-400">{hint}</p>
        </div>
      </div>
    </div>
  );
}

function FinanceInsight({ icon: Icon, title, text }: { icon: typeof TrendingUp; title: string; text: string }) {
  return (
    <div className="group relative overflow-hidden rounded-[22px] border border-white/90 bg-white/85 p-5 shadow-[0_16px_45px_-30px_rgba(79,70,229,.4)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 dark:border-white/10 dark:bg-stone-950/80">
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500" aria-hidden="true" />
      <span className="flex size-11 items-center justify-center rounded-[15px] bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 transition-transform duration-300 group-hover:scale-110">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-3 text-sm font-extrabold tracking-tight text-stone-950 dark:text-white">{title}</p>
      <p className="mt-1 text-xs font-medium leading-5 text-stone-600 dark:text-stone-400">{text}</p>
      <span className="mt-3 inline-flex min-h-11 items-center gap-1 text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300">Planned next <ArrowRight className="size-3" aria-hidden="true" /></span>
    </div>
  );
}

"use client";

import * as React from "react";
import { StatCard, toStatTone } from "@/components/shared/stat-card";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Sparkles, Undo2, Wallet } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { PageHero } from "@/components/shared/page-hero";
import { MetricStrip } from "@/components/shared/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/lib/auth/auth-context";
import { usePayments, useRefundPayment } from "@/lib/hooks/use-payments";
import { ExpensesSection } from "./expenses-section";
import { RecordPaymentDialog } from "./record-payment-dialog";
import { InvoicesSection, InvoicesSectionHeader } from "./invoices-section";
import { ApiError } from "@/lib/api/client";
import { refundPaymentSchema, type RefundPaymentInput } from "@/lib/validation/gym";
import type { Payment, PaymentStatus } from "@/lib/types/gym";

const statusVariant: Record<PaymentStatus, "success" | "warning" | "secondary" | "destructive"> = { COMPLETED: "success", PARTIALLY_REFUNDED: "warning", REFUNDED: "secondary", FAILED: "destructive" };

function RefundDialog({ payment }: { payment: Payment }) { const [open, setOpen] = React.useState(false); const refundPayment = useRefundPayment(); const form = useForm<RefundPaymentInput>({ resolver: zodResolver(refundPaymentSchema), defaultValues: { amount: undefined, reason: "" } }); const alreadyRefunded = (payment.refunds ?? []).reduce((sum, r) => sum + Number(r.amount), 0); const remaining = Number(payment.amount) - alreadyRefunded; async function onSubmit(values: RefundPaymentInput) { try { await refundPayment.mutateAsync({ id: payment.id, input: values }); toast.success("Refund recorded"); setOpen(false); form.reset(); } catch (error) { toast.error(error instanceof ApiError ? error.message : "Refund failed"); } } return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button variant="ghost" size="sm" className="min-h-11 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><Undo2 className="size-3.5" aria-hidden="true" /> Refund</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Refund payment</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground">Remaining refundable balance: ₹ {remaining.toFixed(2)}</p><Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4"><FormField control={form.control} name="amount" render={({ field }) => <FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" step="0.01" placeholder={remaining.toFixed(2)} {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>} /><FormField control={form.control} name="reason" render={({ field }) => <FormItem><FormLabel>Reason (optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} /><DialogFooter><Button type="submit" variant="destructive" className="w-full sm:w-auto" disabled={refundPayment.isPending}>{refundPayment.isPending ? "Refunding..." : "Issue refund"}</Button></DialogFooter></form></Form></DialogContent></Dialog>; }
function RefundCell({ payment }: { payment: Payment }) { const { hasPermission } = useAuth(); if (payment.status === "REFUNDED") return <span className="inline-flex items-center rounded-full bg-stone-500/10 px-2.5 py-1 text-xs font-bold text-stone-600 ring-1 ring-stone-200/60">Fully refunded</span>; if (!hasPermission("payments.refund")) return null; return <RefundDialog payment={payment} />; }
const columns: ColumnDef<Payment>[] = [{ header: "Member", accessorKey: "member", cell: ({ row }) => { const m = row.original.member; return m ? <div><p className="font-bold text-stone-900">{m.firstName} {m.lastName}</p><p className="text-xs font-medium text-stone-600">{row.original.note ?? "Payment"}</p></div> : "—"; } }, { header: "Amount", accessorKey: "amount", cell: ({ row }) => <span className="font-bold tabular-nums text-stone-950">₹ {row.original.amount}</span> }, { header: "Method", accessorKey: "method", cell: ({ row }) => <Badge variant="outline">{row.original.method}</Badge> }, { header: "Status", accessorKey: "status", cell: ({ row }) => <Badge variant={statusVariant[row.original.status]}>{row.original.status}</Badge> }, { header: "Date", accessorKey: "createdAt", cell: ({ row }) => <span className="text-sm font-medium text-stone-600 tabular-nums">{new Date(row.original.createdAt).toLocaleString()}</span> }, { id: "actions", header: "", cell: ({ row }) => <RefundCell payment={row.original} /> }];

export default function BillingPage() {
 const { hasPermission } = useAuth();
 const [page, setPage] = React.useState(1);
 const [tab, setTab] = React.useState<"payments" | "invoices">("payments");
 const paymentsQuery = usePayments({ page, pageSize: 20, order: "desc" });
 const items = paymentsQuery.data?.items ?? [];
 const totalCollected = items.filter((p) => p.status !== "REFUNDED").reduce((sum, p) => sum + Number(p.amount), 0);
 const totalRefunded = items.flatMap((p) => p.refunds ?? []).reduce((sum, r) => sum + Number(r.amount), 0);
 const currency = items[0]?.currency ?? "INR";
 return (
 <div className="pb-4">
 <div className="flex w-full flex-col gap-4">
 <PageHero
 id="billing-title"
 icon={Wallet}
 title="Finance"
 description="Payments, invoices and expenses"
 actions={
 <>
 {hasPermission("payments.create") && <RecordPaymentDialog />}
 <Link href="/ai" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border/80 bg-card px-5 py-3 text-sm font-bold text-emerald-900 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
 <Sparkles className="size-4" aria-hidden="true" /> Ask AI
 </Link>
 </>
 }
 />

 {/* No "Collections snapshot" heading: four numbers do not need a line
 telling you they are numbers. The tiles say what they are.
 "Payment activity · Live" went with it -- it was not a figure, it
 was a tile asserting the page was working. */}
 <MetricStrip label="Collections" columns={3}>
 <FinanceMetric label="Collected · this page" value={`₹ ${totalCollected.toFixed(2)}`} loading={paymentsQuery.isLoading} tone="green" />
 <FinanceMetric label="Refunded · this page" value={`₹ ${totalRefunded.toFixed(2)}`} loading={paymentsQuery.isLoading} tone={totalRefunded > 0 ? "amber" : "primary"} />
 <FinanceMetric label="Transactions" value={items.length} loading={paymentsQuery.isLoading} />
 </MetricStrip>

 <section aria-labelledby="billing-activity" className="overflow-hidden rounded-lg border border-border bg-card">
 <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5 sm:px-5">
 {tab === "payments" ? (
 <h2 id="billing-activity" className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Payment activity</h2>
 ) : (
 <InvoicesSectionHeader />
 )}
 <div className="flex flex-wrap items-center gap-2">
 <div role="tablist" aria-label="Billing views" className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1">
 {(["payments", "invoices"] as const).map((t) => (
 <Button
 key={t}
 role="tab"
 aria-selected={tab === t}
 type="button"
 variant={tab === t ? "default" : "ghost"}
 size="sm"
 onClick={() => setTab(t)}
 className="min-h-11 rounded-lg px-4 text-sm"
 >
 {t === "payments" ? "Payments" : "Invoices"}
 </Button>
 ))}
 </div>
 {tab === "payments" && (
 <Badge variant="outline" className="rounded-full font-mono text-xs tabular-nums">Page {page}</Badge>
 )}
 </div>
 </div>
 <div className="p-4 sm:p-5">
 {tab === "payments" ? (
 <DataTable columns={columns} data={items} isLoading={paymentsQuery.isLoading} isError={paymentsQuery.isError} onRetry={() => paymentsQuery.refetch()} page={page} onPageChange={setPage} emptyTitle="No payments recorded yet" emptyDescription="Record a payment to begin." />
 ) : (
 <InvoicesSection />
 )}
 </div>
 </section>

 <ExpensesSection />
 </div>
 </div>
 );
}

function FinanceMetric({ label, value, hint, loading, tone }: { icon?: unknown; label: string; value: React.ReactNode; hint?: string; loading?: boolean; tone?: string }) {
 // Delegates to the shared tile. This page used to carry its own metric
 // component with a coloured top bar, a blurred orb, a 56px white-on-colour
 // icon tile that scaled and rotated on hover, and a two-tone shadow --
 // five decorative devices on one number, reinvented on fourteen pages.
 return (
  <StatCard
   title={label}
   value={typeof value === "string" || typeof value === "number" ? value : String(value ?? "")}
   isLoading={Boolean(loading)}
   hint={hint}
   tone={toStatTone(tone)}
  />
 );
}

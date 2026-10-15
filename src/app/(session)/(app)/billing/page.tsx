"use client";

import * as React from "react";
import { StatCard, toStatTone } from "@/components/shared/stat-card";
import Link from "next/link";
import { Sparkles, Wallet } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { PageHero } from "@/components/shared/page-hero";
import { MetricStrip } from "@/components/shared/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { usePayments } from "@/lib/hooks/use-payments";
import { PaymentDetailDialog } from "./payment-detail-dialog";
import { ExpensesSection } from "./expenses-section";
import { RecordPaymentDialog } from "./record-payment-dialog";
import { InvoicesSection, InvoicesSectionHeader } from "./invoices-section";
import type { Payment, PaymentStatus } from "@/lib/types/gym";

const statusVariant: Record<PaymentStatus, "success" | "warning" | "secondary" | "destructive"> = { COMPLETED: "success", PARTIALLY_REFUNDED: "warning", REFUNDED: "secondary", FAILED: "destructive" };

function RefundCell({ payment }: { payment: Payment }) { if (payment.status === "REFUNDED") return <Badge variant="secondary" className="rounded-full">Fully refunded</Badge>; return null; }
const columns: ColumnDef<Payment>[] = [{ header: "Member", accessorKey: "member", cell: ({ row }) => { const m = row.original.member; return m ? <div><p className="font-bold text-foreground">{m.firstName} {m.lastName}</p><p className="text-xs font-medium text-stone-600">{row.original.note ?? "Payment"}</p></div> : "—"; } }, { header: "Amount", accessorKey: "amount", cell: ({ row }) => <span className="font-bold tabular-nums text-foreground">₹ {row.original.amount}</span> }, { header: "Method", accessorKey: "method", cell: ({ row }) => <Badge variant="outline">{row.original.method}</Badge> }, { header: "Status", accessorKey: "status", cell: ({ row }) => <Badge variant={statusVariant[row.original.status]}>{row.original.status}</Badge> }, { header: "Date", accessorKey: "createdAt", cell: ({ row }) => <span className="text-sm font-medium text-stone-600 tabular-nums">{new Date(row.original.createdAt).toLocaleString()}</span> }, { id: "actions", header: "", cell: ({ row }) => <div className="flex items-center justify-end gap-1"><PaymentDetailDialog payment={row.original} /><RefundCell payment={row.original} /></div> }];

export default function BillingPage() {
 const { hasPermission } = useAuth();
 const [page, setPage] = React.useState(1);
 const [tab, setTab] = React.useState<"payments" | "invoices">("payments");
 // The sidebar links straight to #expenses, but hash scrolling is
 // unreliable inside the app shell (nested scroll containers swallow
 // the browser's anchor jump), so the desk kept landing on Payments.
 // Scroll explicitly on mount and on later hash changes instead.
 React.useEffect(() => {
 const jump = () => {
 if (window.location.hash === "#expenses") {
 document.getElementById("expenses")?.scrollIntoView({ behavior: "smooth", block: "start" });
 }
 };
 jump();
 window.addEventListener("hashchange", jump);
 return () => window.removeEventListener("hashchange", jump);
 }, []);
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
 title="Payments"
 actions={
 <>
 {hasPermission("payments.create") && <RecordPaymentDialog />}
 {/* /ai needs `ai.generate`; without it this link dead-ends. */}
 {hasPermission("ai.generate") && (
 <Link href="/ai" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border/80 bg-card px-5 py-3 text-sm font-bold text-foreground shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
 <Sparkles className="size-4" aria-hidden="true" /> Ask AI
 </Link>
 )}
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
 <h2 id="billing-activity" className="section-title">Payment activity</h2>
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

 {/* The "Expenses" menu item lands here. */}
 <div id="expenses" className="scroll-mt-24"><ExpensesSection /></div>
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

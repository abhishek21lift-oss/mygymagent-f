"use client";

import * as React from "react";
import { Receipt } from "lucide-react";

import { usePayment } from "@/lib/hooks/use-payments";
import type { Payment } from "@/lib/types/gym";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
 return (
  <div className="flex items-baseline justify-between gap-4 border-b border-border py-1.5 last:border-0">
   <span className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</span>
   <span className="text-right text-sm font-bold">{value}</span>
  </div>
 );
}

function DetailBody({ paymentId, currency }: { paymentId: string; currency: string }) {
 const detail = usePayment(paymentId);

 if (detail.isPending) return <div className="grid gap-2"><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /><Skeleton className="h-24 w-full" /></div>;
 if (detail.isError || !detail.data) {
  return (
   <div className="grid gap-3">
    <p role="alert" className="text-sm font-semibold text-destructive">Could not load this payment.</p>
    <Button type="button" variant="outline" onClick={() => void detail.refetch()}>Try again</Button>
   </div>
  );
 }

 const payment = detail.data;
 const refunds = payment.refunds ?? [];
 const refunded = refunds.reduce((sum, refund) => sum + Number(refund.amount), 0);
 const net = Number(payment.amount) - refunded;

 return (
  <div className="grid gap-4">
   <div className="grid">
    <Row label="Amount" value={`${currency} ${Number(payment.amount).toLocaleString()}`} />
    {refunded > 0 && (
     <>
      <Row label="Refunded" value={`− ${currency} ${refunded.toLocaleString()}`} />
      <Row label="Net" value={`${currency} ${net.toLocaleString()}`} />
     </>
    )}
    <Row label="Method" value={<Badge variant="outline">{payment.method}</Badge>} />
    <Row label="Status" value={<Badge variant="outline">{payment.status}</Badge>} />
    <Row label="Taken" value={new Date(payment.createdAt).toLocaleString()} />
    {payment.member && (
     <Row label="Member" value={`${payment.member.firstName} ${payment.member.lastName}`} />
    )}
    {/* Which membership this settled -- absent from the list, and the
        difference between a renewal and a one-off counter payment. */}
    <Row
     label="Against"
     value={payment.membership?.membershipPlan?.name ?? (payment.membershipId ? "A membership" : "Not a membership")}
    />
    {payment.note && <Row label="Note" value={payment.note} />}
   </div>

   {refunds.length > 0 && (
    <div className="grid gap-1.5">
     <p className="text-sm font-bold">Refunds</p>
     {refunds.map((refund) => (
      <div key={refund.id} className="flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-2">
       <div className="min-w-0">
        <p className="text-sm font-bold tabular-nums">{currency} {Number(refund.amount).toLocaleString()}</p>
        <p className="truncate text-xs text-muted-foreground">{refund.reason || "No reason recorded"}</p>
       </div>
       <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
        {new Date(refund.createdAt).toLocaleDateString()}
       </span>
      </div>
     ))}
    </div>
   )}
  </div>
 );
}

export function PaymentDetailDialog({ payment, currency = "₹" }: { payment: Payment; currency?: string }) {
 const [open, setOpen] = React.useState(false);
 return (
  <>
   <Button
    type="button"
    variant="ghost"
    size="sm"
    className="min-h-11 rounded-xl"
    onClick={() => setOpen(true)}
   >
    <Receipt className="size-3.5" aria-hidden="true" />
    <span className="sr-only sm:not-sr-only">Details</span>
   </Button>
   <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent className="sm:max-w-md">
     <DialogHeader>
      <DialogTitle>Payment</DialogTitle>
      <DialogDescription>
       {payment.member ? `${payment.member.firstName} ${payment.member.lastName}` : "Payment"} · {new Date(payment.createdAt).toLocaleDateString()}
      </DialogDescription>
     </DialogHeader>
     {open ? <DetailBody paymentId={payment.id} currency={currency} /> : null}
    </DialogContent>
   </Dialog>
  </>
 );
}

"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Undo2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { MemberPicker } from "@/components/shared/member-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth/auth-context";
import { usePayments, useCreatePayment, useRefundPayment } from "@/lib/hooks/use-payments";
import { ApiError } from "@/lib/api/client";
import {
  createPaymentSchema,
  refundPaymentSchema,
  type CreatePaymentInput,
  type RefundPaymentInput,
} from "@/lib/validation/gym";
import type { Payment, PaymentStatus } from "@/lib/types/gym";

const statusVariant: Record<PaymentStatus, "success" | "warning" | "secondary"> = {
  COMPLETED: "success",
  PARTIALLY_REFUNDED: "warning",
  REFUNDED: "secondary",
};

function RecordPaymentDialog() {
  const [open, setOpen] = React.useState(false);
  const [member, setMember] = React.useState<{ id: string; label: string } | null>(null);
  const createPayment = useCreatePayment();

  const form = useForm<Omit<CreatePaymentInput, "memberId">>({
    resolver: zodResolver(createPaymentSchema.omit({ memberId: true })),
    defaultValues: { amount: 0, method: "CASH", note: "" },
  });

  async function onSubmit(values: Omit<CreatePaymentInput, "memberId">) {
    if (!member) {
      toast.error("Select a member first");
      return;
    }
    try {
      await createPayment.mutateAsync({ ...values, memberId: member.id });
      toast.success(`Payment recorded for ${member.label}`);
      setOpen(false);
      setMember(null);
      form.reset();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to record payment");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setMember(null);
          form.reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Record payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record a payment</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-1.5 text-sm font-medium">Member</p>
            <MemberPicker value={member} onChange={setMember} />
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Method</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CASH">Cash</SelectItem>
                          <SelectItem value="CARD">Card</SelectItem>
                          <SelectItem value="UPI">UPI</SelectItem>
                          <SelectItem value="BANK_TRANSFER">Bank transfer</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="PT session, product sale, ..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={createPayment.isPending}>
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

function RefundDialog({ payment }: { payment: Payment }) {
  const [open, setOpen] = React.useState(false);
  const refundPayment = useRefundPayment();

  const form = useForm<RefundPaymentInput>({
    resolver: zodResolver(refundPaymentSchema),
    defaultValues: { amount: undefined, reason: "" },
  });

  const alreadyRefunded = (payment.refunds ?? []).reduce((sum, r) => sum + Number(r.amount), 0);
  const remaining = Number(payment.amount) - alreadyRefunded;

  async function onSubmit(values: RefundPaymentInput) {
    try {
      await refundPayment.mutateAsync({ id: payment.id, input: values });
      toast.success("Refund recorded");
      setOpen(false);
      form.reset();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Refund failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Undo2 className="size-3.5" />
          Refund
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Refund payment</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Remaining refundable balance: {payment.currency} {remaining.toFixed(2)}
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (leave blank to refund the full remaining balance)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={remaining.toFixed(2)}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" variant="destructive" disabled={refundPayment.isPending}>
                {refundPayment.isPending ? "Refunding..." : "Issue refund"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function RefundCell({ payment }: { payment: Payment }) {
  const { hasPermission } = useAuth();
  if (payment.status === "REFUNDED") {
    return <span className="text-sm text-muted-foreground">Fully refunded</span>;
  }
  if (!hasPermission("payments.refund")) return null;
  return <RefundDialog payment={payment} />;
}

const columns: ColumnDef<Payment>[] = [
  {
    header: "Member",
    accessorKey: "member",
    cell: ({ row }) => {
      const m = row.original.member;
      return m ? `${m.firstName} ${m.lastName}` : "—";
    },
  },
  {
    header: "Amount",
    accessorKey: "amount",
    cell: ({ row }) => `${row.original.currency} ${row.original.amount}`,
  },
  {
    header: "Method",
    accessorKey: "method",
    cell: ({ row }) => <Badge variant="outline">{row.original.method}</Badge>,
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row }) => (
      <Badge variant={statusVariant[row.original.status]}>{row.original.status}</Badge>
    ),
  },
  {
    header: "Date",
    accessorKey: "createdAt",
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => <RefundCell payment={row.original} />,
  },
];

export default function BillingPage() {
  const { hasPermission } = useAuth();
  const [page, setPage] = React.useState(1);
  const paymentsQuery = usePayments({ page, pageSize: 20, order: "desc" });

  const items = paymentsQuery.data?.items ?? [];
  const totalCollected = items
    .filter((p) => p.status !== "REFUNDED")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const totalRefunded = items
    .flatMap((p) => p.refunds ?? [])
    .reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Billing"
        description="Member payments and refunds"
        actions={hasPermission("payments.create") && <RecordPaymentDialog />}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Collected (this page)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {totalCollected.toFixed(2)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Refunded (this page)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {totalRefunded.toFixed(2)}
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={paymentsQuery.data}
        isLoading={paymentsQuery.isLoading}
        isError={paymentsQuery.isError}
        onRetry={() => paymentsQuery.refetch()}
        page={page}
        onPageChange={setPage}
        emptyTitle="No payments recorded yet"
        emptyDescription="Record your first payment to start tracking gym revenue."
      />
    </div>
  );
}

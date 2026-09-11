"use client"

import * as React from "react"
import { Plus, Receipt, Wallet } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/shared/data-table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth/auth-context"
import { ApiError } from "@/lib/api/client"
import {
  useApproveExpense,
  useCreateExpense,
  useDeleteExpense,
  useExpenseSummary,
  useExpenses,
  useMarkExpensePaid,
  useRejectExpense,
  type Expense,
} from "@/lib/hooks/use-expenses"

const CATEGORIES = ["RENT", "SALARIES", "UTILITIES", "MARKETING", "EQUIPMENT", "MAINTENANCE", "SUPPLIES", "OTHER"]

const statusVariant: Record<Expense["status"], "secondary" | "default" | "destructive" | "success"> = {
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
  PAID: "success",
}

function RecordExpenseDialog() {
  const [open, setOpen] = React.useState(false)
  const create = useCreateExpense()
  const [category, setCategory] = React.useState("RENT")
  const [amount, setAmount] = React.useState("")
  const [vendor, setVendor] = React.useState("")
  const [notes, setNotes] = React.useState("")

  async function submit() {
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter a valid amount")
      return
    }
    try {
      await create.mutateAsync({ category, amount: value, vendor: vendor || undefined, notes: notes || undefined })
      toast.success("Expense recorded")
      setOpen(false)
      setAmount("")
      setVendor("")
      setNotes("")
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to record expense")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl"><Plus className="size-4" /> Record expense</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Record an expense</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Category</Label><Select value={category} onValueChange={setCategory}><SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Amount</Label><Input className="mt-1.5" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" /></div>
          </div>
          <div><Label>Vendor (optional)</Label><Input className="mt-1.5" value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="Landlord, utility company..." /></div>
          <div><Label>Notes (optional)</Label><Input className="mt-1.5" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What was this for?" /></div>
        </div>
        <DialogFooter><Button onClick={submit} disabled={create.isPending}>{create.isPending ? "Recording..." : "Record expense"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ExpenseActions({ expense }: { expense: Expense }) {
  const { hasPermission } = useAuth()
  const approve = useApproveExpense()
  const reject = useRejectExpense()
  const markPaid = useMarkExpensePaid()
  const remove = useDeleteExpense()
  if (!hasPermission("expenses.update")) return null
  const busy = approve.isPending || reject.isPending || markPaid.isPending || remove.isPending
  return (
    <div className="flex flex-wrap gap-1">
      {expense.status === "PENDING" && (
        <>
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => approve.mutate(expense.id, { onError: (e) => toast.error(e instanceof ApiError ? e.message : "Approve failed") })}>Approve</Button>
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => reject.mutate({ id: expense.id }, { onError: (e) => toast.error(e instanceof ApiError ? e.message : "Reject failed") })}>Reject</Button>
        </>
      )}
      {(expense.status === "PENDING" || expense.status === "APPROVED") && (
        <Button variant="ghost" size="sm" disabled={busy} onClick={() => markPaid.mutate(expense.id, { onError: (e) => toast.error(e instanceof ApiError ? e.message : "Mark-paid failed") })}>Mark paid</Button>
      )}
      {expense.status !== "PAID" && hasPermission("expenses.delete") && (
        <Button variant="ghost" size="sm" disabled={busy} onClick={() => remove.mutate(expense.id, { onError: (e) => toast.error(e instanceof ApiError ? e.message : "Delete failed") })}>Delete</Button>
      )}
    </div>
  )
}

const columns: ColumnDef<Expense>[] = [
  { header: "Category", accessorKey: "category", cell: ({ row }) => <Badge variant="outline">{row.original.category}</Badge> },
  { header: "Vendor", accessorKey: "vendor", cell: ({ row }) => row.original.vendor ?? "—" },
  { header: "Amount", accessorKey: "amount", cell: ({ row }) => <span className="font-semibold tabular-nums">{row.original.currency} {row.original.amount}</span> },
  { header: "Status", accessorKey: "status", cell: ({ row }) => <Badge variant={statusVariant[row.original.status]}>{row.original.status}</Badge> },
  { header: "Date", accessorKey: "expenseDate", cell: ({ row }) => <span className="text-sm text-muted-foreground">{new Date(row.original.expenseDate).toLocaleDateString()}</span> },
  { id: "actions", header: "", cell: ({ row }) => <ExpenseActions expense={row.original} /> },
]

export function ExpensesSection() {
  const { hasPermission } = useAuth()
  const [page, setPage] = React.useState(1)
  const summary = useExpenseSummary()
  const list = useExpenses({ page, pageSize: 10, order: "desc" })

  if (!hasPermission("expenses.read")) return null

  const totals = summary.data?.totals ?? []
  const headline = totals.length > 0
    ? totals.map((t) => `${t.currency} ${Number(t.total).toFixed(2)}`).join(" · ")
    : "—"

  return (
    <section className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="border-0 shadow-sm ring-1 ring-border/70">
          <CardContent className="p-4">
            <span className="flex size-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600"><Wallet className="size-4.5" /></span>
            {summary.isLoading ? <div className="mt-4 h-7 w-32 animate-pulse rounded bg-muted" /> : <p className="mt-4 text-2xl font-semibold tracking-tight tabular-nums">{headline}</p>}
            <p className="mt-1 text-xs font-medium text-muted-foreground">Total spend · approved + paid</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm ring-1 ring-border/70">
          <CardContent className="p-4">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Receipt className="size-4.5" /></span>
            {summary.isLoading ? <div className="mt-4 h-7 w-16 animate-pulse rounded bg-muted" /> : <p className="mt-4 text-2xl font-semibold tracking-tight tabular-nums">{summary.data?.byCategory.length ?? 0}</p>}
            <p className="mt-1 text-xs font-medium text-muted-foreground">Active spend categories</p>
          </CardContent>
        </Card>
      </div>
      <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-border/70">
        <CardHeader className="border-b bg-muted/20">
          <div className="flex items-center justify-between gap-3">
            <div><CardTitle className="text-base">Expenses</CardTitle><p className="mt-1 text-xs text-muted-foreground">Rent, salaries, utilities and everything the gym spends.</p></div>
            {hasPermission("expenses.create") && <RecordExpenseDialog />}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable columns={columns} data={list.data} isLoading={list.isLoading} isError={list.isError} onRetry={() => list.refetch()} page={page} onPageChange={setPage} emptyTitle="No expenses recorded yet" emptyDescription="Record rent, salaries or utilities to complete the profit picture." />
        </CardContent>
      </Card>
    </section>
  )
}

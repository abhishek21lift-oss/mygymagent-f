"use client"

import * as React from "react"
import { Plus, Receipt, Wallet } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
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
        <Button className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[linear-gradient(105deg,#059669,#0d9488_55%,#0ea5e9)] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-500/25 transition duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"><Plus className="size-4" aria-hidden="true" /> Record expense</Button>
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
          <Button variant="ghost" size="sm" className="min-h-11 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600" disabled={busy} onClick={() => approve.mutate(expense.id, { onError: (e) => toast.error(e instanceof ApiError ? e.message : "Approve failed") })}>Approve</Button>
          <Button variant="ghost" size="sm" className="min-h-11 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600" disabled={busy} onClick={() => reject.mutate({ id: expense.id }, { onError: (e) => toast.error(e instanceof ApiError ? e.message : "Reject failed") })}>Reject</Button>
        </>
      )}
      {(expense.status === "PENDING" || expense.status === "APPROVED") && (
        <Button variant="ghost" size="sm" className="min-h-11 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600" disabled={busy} onClick={() => markPaid.mutate(expense.id, { onError: (e) => toast.error(e instanceof ApiError ? e.message : "Mark-paid failed") })}>Mark paid</Button>
      )}
      {expense.status !== "PAID" && hasPermission("expenses.delete") && (
        <Button variant="ghost" size="sm" className="min-h-11 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600" disabled={busy} onClick={() => remove.mutate(expense.id, { onError: (e) => toast.error(e instanceof ApiError ? e.message : "Delete failed") })}>Delete</Button>
      )}
    </div>
  )
}

const columns: ColumnDef<Expense>[] = [
  { header: "Category", accessorKey: "category", cell: ({ row }) => <Badge variant="outline">{row.original.category}</Badge> },
  { header: "Vendor", accessorKey: "vendor", cell: ({ row }) => <span className="font-medium text-stone-700 dark:text-stone-300">{row.original.vendor ?? "—"}</span> },
  { header: "Amount", accessorKey: "amount", cell: ({ row }) => <span className="font-bold tabular-nums text-stone-950 dark:text-white">{row.original.currency} {row.original.amount}</span> },
  { header: "Status", accessorKey: "status", cell: ({ row }) => <Badge variant={statusVariant[row.original.status]}>{row.original.status}</Badge> },
  { header: "Date", accessorKey: "expenseDate", cell: ({ row }) => <span className="text-sm font-medium text-stone-600 tabular-nums dark:text-stone-400">{new Date(row.original.expenseDate).toLocaleDateString()}</span> },
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
    <section aria-labelledby="expenses-title" className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-delay:200ms]">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="group relative overflow-hidden rounded-[22px] border border-white/90 bg-white/85 shadow-[0_20px_60px_-38px_rgba(79,70,229,.35)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 dark:border-white/10 dark:bg-stone-950/80">
          <span className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-green-600" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-emerald-400/20 blur-2xl transition duration-300 group-hover:scale-125" aria-hidden="true" />
          <CardContent className="relative flex items-center gap-4 p-5 lg:p-6">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-[19px] bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"><Wallet className="size-6" aria-hidden="true" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[.18em] text-stone-500">Total spend</p>
              {summary.isLoading ? <div className="mt-2 h-7 w-32 animate-pulse rounded-lg bg-stone-200/70" aria-label="Loading total spend" /> : <p className="mt-1 truncate text-2xl font-black tracking-tight text-stone-950 tabular-nums dark:text-white">{headline}</p>}
              <p className="mt-1 text-[11px] font-medium text-stone-600 dark:text-stone-400">Total spend · approved + paid</p>
            </div>
          </CardContent>
        </div>
        <div className="group relative overflow-hidden rounded-[22px] border border-white/90 bg-white/85 shadow-[0_20px_60px_-38px_rgba(79,70,229,.35)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 dark:border-white/10 dark:bg-stone-950/80">
          <span className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-amber-400/20 blur-2xl transition duration-300 group-hover:scale-125" aria-hidden="true" />
          <CardContent className="relative flex items-center gap-4 p-5 lg:p-6">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-[19px] bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"><Receipt className="size-6" aria-hidden="true" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[.18em] text-stone-500">Spend categories</p>
              {summary.isLoading ? <div className="mt-2 h-7 w-16 animate-pulse rounded-lg bg-stone-200/70" aria-label="Loading categories" /> : <p className="mt-1 text-2xl font-black tracking-tight text-stone-950 tabular-nums dark:text-white">{summary.data?.byCategory.length ?? 0}</p>}
              <p className="mt-1 text-[11px] font-medium text-stone-600 dark:text-stone-400">Active spend categories</p>
            </div>
          </CardContent>
        </div>
      </div>
      <div className="overflow-hidden rounded-[28px] border border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-stone-950/80">
        <div className="flex items-center justify-between gap-3 border-b border-stone-100/80 bg-gradient-to-r from-emerald-50/90 via-white to-amber-50/60 px-5 py-5 sm:px-6 dark:from-emerald-950/40 dark:via-stone-950 dark:to-amber-950/20">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
              <Receipt className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="expenses-title" className="font-serif text-xl font-semibold tracking-tight text-stone-950 dark:text-white">Expenses</h2>
              <p className="mt-0.5 text-xs font-medium text-stone-600 dark:text-stone-400">Rent, salaries, utilities and everything the gym spends.</p>
            </div>
          </div>
          {hasPermission("expenses.create") && <RecordExpenseDialog />}
        </div>
        <div className="p-4 sm:p-5">
          <DataTable columns={columns} data={list.data} isLoading={list.isLoading} isError={list.isError} onRetry={() => list.refetch()} page={page} onPageChange={setPage} emptyTitle="No expenses recorded yet" emptyDescription="Record rent, salaries or utilities to complete the profit picture." />
        </div>
      </div>
    </section>
  )
}

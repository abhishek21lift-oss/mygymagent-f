"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/shared/data-table"
import { MetricStrip } from "@/components/shared/panel"
import { StatCard } from "@/components/shared/stat-card"
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
 useUpdateExpense,
 type Expense,
} from "@/lib/hooks/use-expenses"

const CATEGORIES = ["RENT", "SALARIES", "UTILITIES", "MARKETING", "EQUIPMENT", "MAINTENANCE", "SUPPLIES", "OTHER"]

const statusVariant: Record<Expense["status"], "secondary" | "default" | "destructive" | "success"> = {
 PENDING: "secondary",
 APPROVED: "default",
 REJECTED: "destructive",
 PAID: "success",
}

/** Records a new expense, or edits one that isn't paid yet (the API
 * keeps paid expenses as they are). */
function ExpenseDialog({ expense }: { expense?: Expense }) {
 const [open, setOpen] = React.useState(false)
 const create = useCreateExpense()
 const update = useUpdateExpense()
 const pending = create.isPending || update.isPending
 const [category, setCategory] = React.useState("RENT")
 const [amount, setAmount] = React.useState("")
 const [vendor, setVendor] = React.useState("")
 const [notes, setNotes] = React.useState("")
 const [date, setDate] = React.useState("")

 function onOpenChange(next: boolean) {
 if (next) {
 setCategory(expense?.category ?? "RENT")
 setAmount(expense ? String(Number(expense.amount)) : "")
 setVendor(expense?.vendor ?? "")
 setNotes(expense?.notes ?? "")
 setDate(expense ? expense.expenseDate.slice(0, 10) : "")
 }
 setOpen(next)
 }

 async function submit() {
 const value = Number(amount)
 if (!Number.isFinite(value) || value <= 0) {
 toast.error("Enter a valid amount")
 return
 }
 try {
 if (expense) {
 await update.mutateAsync({
 id: expense.id,
 category,
 amount: value,
 vendor: vendor.trim(),
 notes: notes.trim(),
 ...(date ? { expenseDate: date } : {}),
 })
 toast.success("Expense updated")
 } else {
 await create.mutateAsync({
 category,
 amount: value,
 vendor: vendor.trim() || undefined,
 notes: notes.trim() || undefined,
 ...(date ? { expenseDate: date } : {}),
 })
 toast.success("Expense recorded")
 }
 setOpen(false)
 } catch (e) {
 toast.error(e instanceof ApiError ? e.message : expense ? "Failed to update expense" : "Failed to record expense")
 }
 }

 const categories = expense && !CATEGORIES.includes(expense.category) ? [...CATEGORIES, expense.category] : CATEGORIES

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogTrigger asChild>
 {expense ? (
 <Button variant="ghost" size="sm" className="min-h-11 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">Edit</Button>
 ) : (
 <Button className="btn-sheen inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground transition duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><Plus className="size-4" aria-hidden="true" /> Record expense</Button>
 )}
 </DialogTrigger>
 <DialogContent>
 <DialogHeader><DialogTitle>{expense ? "Edit expense" : "Record an expense"}</DialogTitle></DialogHeader>
 <div className="flex flex-col gap-4">
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
 <div><Label htmlFor="expense-category">Category</Label><Select value={category} onValueChange={setCategory}><SelectTrigger id="expense-category" className="mt-1.5 w-full"><SelectValue /></SelectTrigger><SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
 <div><Label htmlFor="expense-amount">Amount</Label><Input id="expense-amount" className="mt-1.5" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" /></div>
 </div>
 <div><Label htmlFor="expense-date">Date</Label><Input id="expense-date" className="mt-1.5" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
 <div><Label htmlFor="expense-vendor">Vendor (optional)</Label><Input id="expense-vendor" className="mt-1.5" value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="Landlord, utility company..." /></div>
 <div><Label htmlFor="expense-notes">Notes (optional)</Label><Input id="expense-notes" className="mt-1.5" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What was this for?" /></div>
 </div>
 <DialogFooter><Button className="w-full sm:w-auto" onClick={submit} disabled={pending}>{pending ? "Saving..." : expense ? "Save expense" : "Record expense"}</Button></DialogFooter>
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
 <Button variant="ghost" size="sm" className="min-h-11 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" disabled={busy} onClick={() => approve.mutate(expense.id, { onError: (e) => toast.error(e instanceof ApiError ? e.message : "Approve failed") })}>Approve</Button>
 <Button variant="ghost" size="sm" className="min-h-11 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" disabled={busy} onClick={() => reject.mutate({ id: expense.id }, { onError: (e) => toast.error(e instanceof ApiError ? e.message : "Reject failed") })}>Reject</Button>
 </>
 )}
 {(expense.status === "PENDING" || expense.status === "APPROVED") && (
 <Button variant="ghost" size="sm" className="min-h-11 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" disabled={busy} onClick={() => markPaid.mutate(expense.id, { onError: (e) => toast.error(e instanceof ApiError ? e.message : "Mark-paid failed") })}>Mark paid</Button>
 )}
 {expense.status !== "PAID" && <ExpenseDialog expense={expense} />}
 {expense.status !== "PAID" && hasPermission("expenses.delete") && (
 <Button variant="ghost" size="sm" className="min-h-11 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" disabled={busy} onClick={() => remove.mutate(expense.id, { onError: (e) => toast.error(e instanceof ApiError ? e.message : "Delete failed") })}>Delete</Button>
 )}
 </div>
 )
}

const columns: ColumnDef<Expense>[] = [
 { header: "Category", accessorKey: "category", cell: ({ row }) => <Badge variant="outline">{row.original.category}</Badge> },
 { header: "Vendor", accessorKey: "vendor", cell: ({ row }) => <span className="font-medium text-stone-700 dark:text-stone-300">{row.original.vendor ?? "—"}</span> },
 { header: "Amount", accessorKey: "amount", cell: ({ row }) => <span className="font-bold tabular-nums text-stone-950 dark:text-white">₹ {row.original.amount}</span> },
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
 ? totals.map((t) => `₹ ${Number(t.total).toFixed(2)}`).join(" · ")
 : "—"

 return (
 <section aria-labelledby="expenses-title" className="flex flex-col gap-4">
 {/* Two figures on the shared tile. This pair carried the same four
 decorations the inventory page did -- a coloured top bar, a blurred
 orb, a 56px icon tile that scaled and rotated on hover, and a
 two-tone shadow -- which is how a spend total came to look more
 important than the list of expenses under it. */}
 <MetricStrip label="Spend" columns={2}>
 <StatCard title="Total spend" value={headline} isLoading={summary.isLoading} hint="Approved + paid" />
 <StatCard title="Spend categories" value={summary.data?.byCategory.length ?? 0} isLoading={summary.isLoading} hint="Active" />
 </MetricStrip>
 <div className="overflow-hidden rounded-lg border border-border bg-card">
 <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5 sm:px-5 dark:from-emerald-950/40 dark:via-stone-950 dark:to-amber-950/20">
 <div className="flex items-center gap-3">
 <div>
 <h2 id="expenses-title" className="section-title">Expenses</h2>
 <p className="mt-0.5 text-xs font-medium text-stone-600 dark:text-stone-400">Rent, salaries, utilities and everything the gym spends.</p>
 </div>
 </div>
 {hasPermission("expenses.create") && <ExpenseDialog />}
 </div>
 <div className="p-4 sm:p-5">
 <DataTable columns={columns} data={list.data} isLoading={list.isLoading} isError={list.isError} onRetry={() => list.refetch()} page={page} onPageChange={setPage} emptyTitle="No expenses recorded yet" emptyDescription="Record rent, salaries or utilities to complete the profit picture." />
 </div>
 </div>
 </section>
 )
}

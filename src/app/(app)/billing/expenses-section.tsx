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
 <Button className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[linear-gradient(105deg,#059669,#0d9488_55%,#0ea5e9)] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-500/25 transition duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"><Plus className="size-4" aria-hidden="true" /> Record expense</Button>
 </DialogTrigger>
 <DialogContent>
 <DialogHeader><DialogTitle>Record an expense</DialogTitle></DialogHeader>
 <div className="flex flex-col gap-4">
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
 <div><Label>Category</Label><Select value={category} onValueChange={setCategory}><SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
 <div><Label>Amount</Label><Input className="mt-1.5" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" /></div>
 </div>
 <div><Label>Vendor (optional)</Label><Input className="mt-1.5" value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="Landlord, utility company..." /></div>
 <div><Label>Notes (optional)</Label><Input className="mt-1.5" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What was this for?" /></div>
 </div>
 <DialogFooter><Button className="w-full sm:w-auto" onClick={submit} disabled={create.isPending}>{create.isPending ? "Recording..." : "Record expense"}</Button></DialogFooter>
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
 <h2 id="expenses-title" className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Expenses</h2>
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

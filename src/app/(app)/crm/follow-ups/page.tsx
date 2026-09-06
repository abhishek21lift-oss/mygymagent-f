"use client"

import * as React from "react"
import Link from "next/link"
import { CalendarClock, Check, Flame, ListChecks, RefreshCw, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/shared/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCompleteFollowUp, useLeadFollowUps } from "@/lib/hooks/use-leads"
import { ApiError } from "@/lib/api/client"

export default function SalesFollowUpsPage() {
  const [status, setStatus] = React.useState<"OPEN" | "COMPLETED" | "ALL">("OPEN")
  const query = useLeadFollowUps({ page: 1, pageSize: 50, status })
  const complete = useCompleteFollowUp()
  const rows = query.data?.items ?? []
  const overdue = rows.filter((row) => row.isOverdue).length

  async function markDone(leadId: string, followUpId: string) {
    try { await complete.mutateAsync({ leadId, followUpId }); toast.success("Follow-up completed") }
    catch (error) { toast.error(error instanceof ApiError ? error.message : "Failed to complete follow-up") }
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      <PageHeader title="Follow-up Command Center" description="Never lose the next sales action across your entire pipeline." actions={<Button asChild variant="outline" className="rounded-xl"><Link href="/crm"><Sparkles className="size-4" /> Back to Sales OS</Link></Button>} />
      <section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-violet-500/[0.12] via-card to-cyan-500/[0.08] p-6 shadow-sm sm:p-8"><div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-primary/10 blur-3xl" /><div className="relative grid gap-4 sm:grid-cols-3"><Metric icon={ListChecks} label="Visible actions" value={rows.length} /><Metric icon={Flame} label="Overdue" value={overdue} /><Metric icon={CalendarClock} label="Open" value={status === "OPEN" ? rows.length : rows.filter((row) => !row.completedAt).length} /></div></section>
      <Card className="border-0 shadow-sm ring-1 ring-border/70"><CardHeader className="border-b bg-muted/15"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle className="text-base">Sales actions</CardTitle><p className="mt-1 text-xs text-muted-foreground">Sorted by open work first, then due date.</p></div><Button variant="ghost" size="sm" onClick={() => query.refetch()} disabled={query.isFetching}><RefreshCw className={query.isFetching ? "size-4 animate-spin" : "size-4"} /> Refresh</Button></div><Tabs value={status} onValueChange={(value) => setStatus(value as typeof status)}><TabsList><TabsTrigger value="OPEN">Open</TabsTrigger><TabsTrigger value="COMPLETED">Completed</TabsTrigger><TabsTrigger value="ALL">All</TabsTrigger></TabsList></Tabs></CardHeader><CardContent className="space-y-3 p-4">
        {query.isLoading && <p className="p-6 text-center text-sm text-muted-foreground">Loading follow-ups...</p>}
        {query.isError && <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center"><p className="text-sm font-medium">Could not load follow-ups.</p><Button variant="outline" className="mt-3" onClick={() => query.refetch()}>Retry</Button></div>}
        {!query.isLoading && !query.isError && rows.map((row) => <div key={row.id} className="flex flex-col gap-4 rounded-2xl border bg-background/50 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant={row.completedAt ? "secondary" : row.isOverdue ? "destructive" : "warning"}>{row.completedAt ? "Completed" : row.isOverdue ? "Overdue" : "Open"}</Badge><span className="text-xs text-muted-foreground">{new Date(row.dueAt).toLocaleString()}</span></div><Link href={`/crm/leads/${row.lead.id}`} className="mt-2 block truncate text-sm font-semibold hover:underline">{row.lead.firstName} {row.lead.lastName}</Link><p className="mt-1 text-sm text-muted-foreground">{row.note}</p><p className="mt-1 text-xs text-muted-foreground">{row.lead.assignedToUser ? `Owner: ${row.lead.assignedToUser.firstName} ${row.lead.assignedToUser.lastName}` : "Unassigned"}{row.lead.source ? ` · ${row.lead.source}` : ""}</p></div>{!row.completedAt && <Button size="sm" variant="outline" onClick={() => markDone(row.lead.id, row.id)} disabled={complete.isPending}><Check className="size-3.5" /> Done</Button>}</div>)}
        {!query.isLoading && !query.isError && rows.length === 0 && <div className="rounded-2xl border border-dashed p-10 text-center"><CalendarClock className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 text-sm font-semibold">No follow-ups in this view</p><p className="mt-1 text-xs text-muted-foreground">Schedule the next action from any Lead 360 workspace.</p></div>}
      </CardContent></Card>
    </div>
  )
}

function Metric({ icon: Icon, label, value }: { icon: typeof ListChecks; label: string; value: number }) { return <div className="rounded-2xl border bg-background/55 p-4"><span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4" /></span><p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div> }

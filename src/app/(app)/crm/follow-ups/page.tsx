"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, CalendarClock, Check, Flame, ListChecks, RefreshCw, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { PageHero } from "@/components/shared/page-hero"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCompleteFollowUp, useLeadFollowUps } from "@/lib/hooks/use-leads"
import { ApiError } from "@/lib/api/client"
import { StatCard, toStatTone } from "@/components/shared/stat-card";

type StatTone = "cyan" | "rose" | "violet"

const STAT_TONES: Record<StatTone, { bar: string; tile: string; orb: string; ring: string }> = {
 cyan: {
 bar: "bg-cyan-400",
 tile: "bg-cyan-500 shadow-cyan-500/30",
 orb: "bg-cyan-400/20",
 ring: "hover:border-cyan-200 hover:shadow-cyan-500/10",
 },
 rose: {
 bar: "bg-rose-500",
 tile: "bg-rose-500 shadow-rose-500/30",
 orb: "bg-rose-400/20",
 ring: "hover:border-rose-200 hover:shadow-rose-500/10",
 },
 violet: {
 bar: "bg-violet-600",
 tile: "bg-violet-600 shadow-violet-500/30",
 orb: "bg-fuchsia-400/20",
 ring: "hover:border-violet-200 hover:shadow-violet-500/10",
 },
}

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
 <div className="pb-4">
 <div className="flex flex-col gap-5">
 <PageHero
 id="followups-title"
 icon={CalendarClock}
 title="Follow-ups"
 variant="light"
 accent="blue"
 actions={
 <>
 <Button asChild variant="outline" className="min-h-11 rounded-lg border-blue-200 bg-card hover:bg-stone-950 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
 <Link href="/crm"><Sparkles className="size-4" aria-hidden="true" /> Sales OS</Link>
 </Button>
 <Button asChild className="min-h-11 rounded-lg bg-[linear-gradient(105deg,#2563eb,#4f46e5_55%,#7c3aed)] shadow-lg shadow-blue-500/25 transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
 <Link href="/crm/analytics">Analytics <ArrowRight className="size-4" aria-hidden="true" /></Link>
 </Button>
 </>
 }
 />

 <section aria-label="Follow-up snapshot">
 <div className="grid gap-4 sm:grid-cols-3">
 <Metric icon={ListChecks} label="Visible actions" value={rows.length} tone="cyan" />
 <Metric icon={Flame} label="Overdue" value={overdue} tone="rose" />
 <Metric icon={CalendarClock} label="Open" value={status === "OPEN" ? rows.length : rows.filter((row) => !row.completedAt).length} tone="violet" />
 </div>
 </section>

 <section aria-labelledby="followups-list" className="overflow-hidden rounded-xl border border-white/90 bg-card shadow-sm shadow-violet-900/5 ">
 <div className="flex flex-col gap-4 border-b border-stone-100/80 bg-muted/40 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
 <div className="flex items-center gap-3">
 <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md shadow-blue-500/25">
 <ListChecks className="size-5" aria-hidden="true" />
 </span>
 <div>
 <h2 id="followups-list" className="font-semibold text-xl font-semibold tracking-tight text-stone-950">
 Sales actions
 </h2>
 </div>
 </div>
 <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
 <Tabs value={status} onValueChange={(value) => setStatus(value as typeof status)}>
 <TabsList className="rounded-lg">
 <TabsTrigger value="OPEN" className="min-h-11">Open</TabsTrigger>
 <TabsTrigger value="COMPLETED" className="min-h-11">Completed</TabsTrigger>
 <TabsTrigger value="ALL" className="min-h-11">All</TabsTrigger>
 </TabsList>
 </Tabs>
 <Button variant="ghost" size="sm" onClick={() => query.refetch()} disabled={query.isFetching} className="min-h-11 rounded-xl hover:bg-blue-500/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
 <RefreshCw className={query.isFetching ? "size-4 animate-spin" : "size-4"} aria-hidden="true" /> Refresh
 </Button>
 </div>
 </div>
 <div className="space-y-3 p-4 sm:p-5">
 {query.isLoading && (
 <div className="space-y-2" aria-label="Loading follow-ups">
 {[1, 2, 3].map((i) => (
 <div key={i} className="h-[86px] animate-pulse rounded-xl bg-muted/40" />
 ))}
 </div>
 )}
 {query.isError && (
 <div role="alert" className="rounded-xl border border-rose-200 bg-muted/40 p-6 text-center">
 <p className="text-sm font-extrabold text-stone-900">Could not load follow-ups.</p>
 <p className="mt-1 text-xs font-medium text-stone-600">Check your connection and try again.</p>
 <Button variant="outline" className="mt-3 min-h-11 rounded-xl" onClick={() => query.refetch()}>Retry</Button>
 </div>
 )}
 {!query.isLoading && !query.isError && rows.map((row) => (
 <div
 key={row.id}
 className="relative flex flex-col gap-4 overflow-hidden rounded-xl border border-white/90 bg-card p-4 shadow-sm transition hover:-translate-y-px hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
 >
 <span
 className={`absolute inset-y-3 left-0 w-1 rounded-full ${row.completedAt ? "bg-emerald-500" : row.isOverdue ? "bg-rose-500" : "bg-blue-600"}`}
 aria-hidden="true"
 />
 <div className="min-w-0 pl-2">
 <div className="flex flex-wrap items-center gap-2">
 <Badge variant={row.completedAt ? "secondary" : row.isOverdue ? "destructive" : "warning"}>
 {row.completedAt ? "Completed" : row.isOverdue ? "Overdue" : "Open"}
 </Badge>
 <span className="text-xs font-medium text-stone-600">{new Date(row.dueAt).toLocaleString()}</span>
 </div>
 <Link
 href={`/crm/leads/${row.lead.id}`}
 className="mt-2 block truncate text-sm font-extrabold text-stone-900 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 hover:underline"
 >
 {row.lead.firstName} {row.lead.lastName}
 </Link>
 <p className="mt-1 text-sm font-medium text-stone-600">{row.note}</p>
 <p className="mt-1 text-xs font-medium text-stone-600">
 {row.lead.assignedToUser ? `Owner: ${row.lead.assignedToUser.firstName} ${row.lead.assignedToUser.lastName}` : "Unassigned"}
 {row.lead.source ? ` · ${row.lead.source}` : ""}
 </p>
 </div>
 {!row.completedAt && (
 <Button
 size="sm"
 variant="outline"
 onClick={() => markDone(row.lead.id, row.id)}
 disabled={complete.isPending}
 className="min-h-11 shrink-0 rounded-xl border-blue-200 hover:bg-stone-950 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
 >
 <Check className="size-3.5" aria-hidden="true" /> Done
 </Button>
 )}
 </div>
 ))}
 {!query.isLoading && !query.isError && rows.length === 0 && (
 <div className="rounded-xl border border-dashed border-blue-200 bg-muted/40 p-10 text-center">
 <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/25">
 <CalendarClock className="size-6" aria-hidden="true" />
 </span>
 <p className="mt-3 text-sm font-extrabold text-stone-900">No follow-ups in this view</p>
 <p className="mt-1 text-xs font-medium text-stone-600">Schedule the next action soon.</p>
 </div>
 )}
 </div>
 </section>
 </div>
 </div>
 )
}

function Metric({ label, value, hint, loading, tone }: { icon?: unknown; label: string; value: React.ReactNode; hint?: string; loading?: boolean; tone?: string }) {
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

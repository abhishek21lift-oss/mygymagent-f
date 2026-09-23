"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, BarChart3, CalendarDays, Clock3, Flame, ListChecks, RefreshCw, Sparkles, Target, TrendingUp, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { PageHero } from "@/components/shared/page-hero"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/shared/empty-state"
import { useSalesFunnel, useSalesSourcePerformance, useSalesLostReasons, useSalesAssigneePerformance } from "@/lib/hooks/use-analytics"
import { StatCard, toStatTone } from "@/components/shared/stat-card";

const statusLabels: Record<string, string> = { NEW: "New", CONTACTED: "Contacted", QUALIFIED: "Qualified", TRIAL: "Trial", PROPOSAL: "Proposal", WON: "Won", LOST: "Lost" }

const STATUS_BARS: Record<string, string> = {
 NEW: "bg-blue-500",
 CONTACTED: "bg-cyan-400",
 QUALIFIED: "bg-violet-500",
 TRIAL: "bg-fuchsia-500",
 PROPOSAL: "bg-amber-400",
 WON: "bg-emerald-400",
 LOST: "bg-rose-500",
}

type MetricTone = "cyan" | "violet" | "blue" | "amber" | "emerald"

const METRIC_TONES: Record<MetricTone, { bar: string; tile: string; orb: string; ring: string }> = {
 cyan: {
 bar: "bg-cyan-400",
 tile: "bg-cyan-500 shadow-cyan-500/30",
 orb: "bg-cyan-400/20",
 ring: "hover:border-cyan-200 hover:shadow-cyan-500/10",
 },
 violet: {
 bar: "bg-violet-600",
 tile: "bg-violet-600 shadow-violet-500/30",
 orb: "bg-fuchsia-400/20",
 ring: "hover:border-violet-200 hover:shadow-violet-500/10",
 },
 blue: {
 bar: "bg-blue-500",
 tile: "bg-blue-600 shadow-blue-500/30",
 orb: "bg-blue-400/20",
 ring: "hover:border-blue-200 hover:shadow-blue-500/10",
 },
 amber: {
 bar: "bg-amber-400",
 tile: "bg-amber-500 shadow-amber-500/30",
 orb: "bg-amber-400/20",
 ring: "hover:border-amber-200 hover:shadow-amber-500/10",
 },
 emerald: {
 bar: "bg-emerald-400",
 tile: "bg-emerald-500 shadow-emerald-500/30",
 orb: "bg-emerald-400/20",
 ring: "hover:border-emerald-200 hover:shadow-emerald-500/10",
 },
}

export default function SalesAnalyticsPage() {
 const [from, setFrom] = React.useState("")
 const [to, setTo] = React.useState("")
 const params = React.useMemo(() => ({ from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined, to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined }), [from, to])
 const funnel = useSalesFunnel(undefined, params)
 const sources = useSalesSourcePerformance(undefined, params)
 const lostReasons = useSalesLostReasons(undefined, params)
 const assignees = useSalesAssigneePerformance(undefined, params)
 const data = funnel.data
 const sourceRows = sources.data ?? []
 const lostReasonRows = lostReasons.data ?? []
 const assigneeRows = assignees.data ?? []
 const statusRows = data?.byStatus ?? []

 return (
 <div className="pb-4">
 <div className="flex flex-col gap-5">
 <PageHero
 id="analytics-title"
 icon={BarChart3}
 title="Analytics"
 variant="light"
 accent="violet"
 actions={
 <>
 <Button asChild variant="outline" className="min-h-11 rounded-lg border-blue-200 bg-card hover:bg-stone-950 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
 <Link href="/crm"><Sparkles className="size-4" aria-hidden="true" /> Sales OS</Link>
 </Button>
 <Button asChild className="min-h-11 rounded-lg bg-[linear-gradient(105deg,#2563eb,#4f46e5_55%,#7c3aed)] shadow-lg shadow-blue-500/25 transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
 <Link href="/crm/follow-ups">Follow-ups <ArrowRight className="size-4" aria-hidden="true" /></Link>
 </Button>
 </>
 }
 />

 <section aria-labelledby="analytics-window" className="overflow-hidden rounded-xl border border-white/90 bg-card shadow-sm shadow-violet-900/5 ">
 <div className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
 <div>
 <h2 id="analytics-window" className="font-semibold text-xl font-semibold tracking-tight text-stone-950">
 Reporting window
 </h2>
 </div>
 <div className="grid grid-cols-2 gap-2 sm:flex sm:items-end">
 <div>
 <label htmlFor="sales-from" className="mb-1 block text-xs font-bold text-stone-600">From</label>
 <Input id="sales-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
 </div>
 <div>
 <label htmlFor="sales-to" className="mb-1 block text-xs font-bold text-stone-600">To</label>
 <Input id="sales-to" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
 </div>
 <Button variant="ghost" className="min-h-11 rounded-xl hover:bg-blue-500/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:mt-5" onClick={() => { setFrom(""); setTo("") }}>Reset</Button>
 </div>
 </div>
 </section>

 <section aria-label="Funnel snapshot">
 <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
 <Metric icon={Users} label="Total leads" value={data?.totalLeads ?? 0} tone="cyan" />
 <Metric icon={TrendingUp} label="Won" value={data?.wonLeads ?? 0} tone="emerald" />
 <Metric icon={Target} label="Conversion" value={`${data?.conversionRatePct ?? 0}%`} tone="violet" />
 <Metric icon={Clock3} label="Avg. conversion" value={data?.averageDaysToConversion == null ? "—" : `${data.averageDaysToConversion}d`} tone="amber" />
 <Metric icon={ListChecks} label="Follow-up completion" value={`${data?.followUps?.completionRatePct ?? 0}%`} tone="blue" />
 </div>
 </section>

 <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
 <div className="overflow-hidden rounded-xl border border-white/90 bg-card shadow-sm shadow-violet-900/5 ">
 <div className="flex items-center justify-between gap-3 border-b border-stone-100/80 bg-muted/40 px-5 py-5">
 <div>
 <h2 className="font-semibold text-xl font-semibold tracking-tight text-stone-950">Pipeline distribution</h2>
 </div>
 <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md shadow-blue-500/25">
 <Flame className="size-5" aria-hidden="true" />
 </span>
 </div>
 <div className="space-y-4 p-5 sm:p-6">
 {statusRows.length === 0 && <p className="py-8 text-center text-sm font-medium text-stone-600">No sales data for this window.</p>}
 {statusRows.map((row) => {
 const percent = data?.totalLeads ? Math.round((row.count / data.totalLeads) * 100) : 0
 const bar = STATUS_BARS[row.status] ?? "bg-blue-500"
 return (
 <div key={row.status}>
 <div className="mb-2 flex items-center justify-between text-sm">
 <div className="flex items-center gap-2">
 <Badge variant={row.status === "WON" ? "success" : row.status === "LOST" ? "destructive" : row.status === "TRIAL" || row.status === "QUALIFIED" ? "warning" : row.status === "PROPOSAL" ? "secondary" : "secondary"}>{statusLabels[row.status] ?? row.status}</Badge>
 <span className="font-medium text-stone-600">{row.count} leads</span>
 </div>
 <span className="font-extrabold text-stone-950 tabular-nums">{percent}%</span>
 </div>
 <div className="h-2 overflow-hidden rounded-full bg-stone-100" role="presentation">
 <div className={`h-full rounded-full transition-all ${bar}`} style={{ width: `${percent}%` }} />
 </div>
 </div>
 )
 })}
 </div>
 </div>

 <div className="overflow-hidden rounded-xl border border-white/90 bg-card shadow-sm shadow-violet-900/5 ">
 <div className="flex items-center justify-between gap-3 border-b border-stone-100/80 bg-muted/40 px-5 py-5">
 <div>
 <h2 className="font-semibold text-xl font-semibold tracking-tight text-stone-950">Follow-up discipline</h2>
 </div>
 <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white shadow-md shadow-violet-500/25">
 <CalendarDays className="size-5" aria-hidden="true" />
 </span>
 </div>
 <div className="grid gap-3 p-5 sm:grid-cols-3 xl:grid-cols-1">
 <Mini label="Scheduled" value={data?.followUps?.total ?? 0} tint="bg-blue-50/80" />
 <Mini label="Completed" value={data?.followUps?.completed ?? 0} tint="bg-emerald-50/80" />
 <Mini label="Completion rate" value={`${data?.followUps?.completionRatePct ?? 0}%`} tint="bg-violet-50/80" />
 </div>
 </div>
 </section>

 <section aria-labelledby="analytics-sources" className="overflow-hidden rounded-xl border border-white/90 bg-card shadow-sm shadow-violet-900/5 ">
 <div className="flex flex-col gap-3 border-b border-stone-100/80 bg-muted/40 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
 <div>
 <h2 id="analytics-sources" className="font-semibold text-xl font-semibold tracking-tight text-stone-950">Lead source performance</h2>
 </div>
 <Button variant="ghost" size="sm" onClick={() => { funnel.refetch(); sources.refetch(); lostReasons.refetch(); assignees.refetch() }} disabled={funnel.isFetching || sources.isFetching} className="min-h-11 w-fit rounded-xl hover:bg-cyan-500/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600">
 <RefreshCw className={(funnel.isFetching || sources.isFetching) ? "size-4 animate-spin" : "size-4"} aria-hidden="true" /> Refresh
 </Button>
 </div>
 <div className="p-4 sm:p-5">
 {sourceRows.length === 0 ? (
 <EmptyState title="No source data" description="No source data available for this window." />
 ) : (
 <div className="overflow-x-auto rounded-lg">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>Source</TableHead>
 <TableHead>Leads</TableHead>
 <TableHead>Won</TableHead>
 <TableHead>Lost</TableHead>
 <TableHead>Conversion</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {sourceRows.map((row) => (
 <TableRow key={row.source}>
 <TableCell className="text-sm font-semibold">{row.source}</TableCell>
 <TableCell className="text-sm tabular-nums">{row.totalLeads}</TableCell>
 <TableCell className="text-sm tabular-nums">{row.wonLeads}</TableCell>
 <TableCell className="text-sm tabular-nums">{row.lostLeads}</TableCell>
 <TableCell className="text-sm font-semibold tabular-nums">{row.conversionRatePct}%</TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </div>
 )}
 </div>
 </section>

 <section className="grid gap-5 xl:grid-cols-2">
 <div className="overflow-hidden rounded-xl border border-white/90 bg-card shadow-sm shadow-violet-900/5 ">
 <div className="flex items-center justify-between gap-3 border-b border-stone-100/80 bg-muted/40 px-5 py-5">
 <div>
 <h2 className="font-semibold text-xl font-semibold tracking-tight text-stone-950">Why leads are lost</h2>
 </div>
 <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-rose-500 text-white shadow-md shadow-rose-500/25">
 <Flame className="size-5" aria-hidden="true" />
 </span>
 </div>
 <div className="space-y-3 p-5 sm:p-6">
 {lostReasonRows.length === 0 && <p className="py-6 text-center text-sm font-medium text-stone-600">No lost leads recorded in this window.</p>}
 {lostReasonRows.map((row) => {
 const max = Math.max(...lostReasonRows.map((r) => r.lostLeads), 1)
 const percent = Math.round((row.lostLeads / max) * 100)
 return (
 <div key={row.reason}>
 <div className="mb-1 flex items-center justify-between text-sm">
 <span className="pr-2 font-medium text-stone-800">{row.reason}</span>
 <span className="font-extrabold tabular-nums text-stone-600">{row.lostLeads}</span>
 </div>
 <div className="h-2 overflow-hidden rounded-full bg-stone-100" role="presentation">
 <div className="h-full rounded-full bg-rose-500" style={{ width: `${percent}%` }} />
 </div>
 </div>
 )
 })}
 </div>
 </div>

 <div className="overflow-hidden rounded-xl border border-white/90 bg-card shadow-sm shadow-violet-900/5 ">
 <div className="flex items-center justify-between gap-3 border-b border-stone-100/80 bg-muted/40 px-5 py-5">
 <div>
 <h2 className="font-semibold text-xl font-semibold tracking-tight text-stone-950">Rep performance</h2>
 </div>
 <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md shadow-blue-500/25">
 <Users className="size-5" aria-hidden="true" />
 </span>
 </div>
 <div className="p-4 sm:p-5">
 {assigneeRows.length === 0 ? (
 <EmptyState title="No assignment data" description="No assignment data for this window." />
 ) : (
 <div className="overflow-x-auto rounded-lg">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>Rep</TableHead>
 <TableHead>Total</TableHead>
 <TableHead>Open</TableHead>
 <TableHead>Won</TableHead>
 <TableHead>Lost</TableHead>
 <TableHead>Conv.</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {assigneeRows.map((row) => (
 <TableRow key={row.assigneeId ?? "unassigned"}>
 <TableCell className="text-sm font-semibold">{row.assigneeName}</TableCell>
 <TableCell className="text-sm tabular-nums">{row.totalLeads}</TableCell>
 <TableCell className="text-sm tabular-nums">{row.openLeads}</TableCell>
 <TableCell className="text-sm tabular-nums">{row.wonLeads}</TableCell>
 <TableCell className="text-sm tabular-nums">{row.lostLeads}</TableCell>
 <TableCell className="text-sm font-semibold tabular-nums">{row.conversionRatePct}%</TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </div>
 )}
 </div>
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

function Mini({ label, value, tint }: { label: string; value: string | number; tint: string }) {
 return (
 <div className={`rounded-xl border border-white/80 p-4 shadow-sm ${tint}`}>
 <p className="text-xs font-black uppercase tracking-[.16em] text-stone-500">{label}</p>
 <p className="mt-1 text-2xl font-black tracking-tight text-stone-950 tabular-nums">{value}</p>
 </div>
 )
}

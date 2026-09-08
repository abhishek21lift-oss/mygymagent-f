"use client"

import * as React from "react"
import Link from "next/link"
import { BarChart3, CalendarDays, Clock3, Flame, ListChecks, RefreshCw, Sparkles, Target, TrendingUp, Users } from "lucide-react"

import { PageHeader } from "@/components/shared/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useSalesFunnel, useSalesSourcePerformance, useSalesLostReasons, useSalesAssigneePerformance } from "@/lib/hooks/use-analytics"

const statusLabels: Record<string, string> = { NEW: "New", CONTACTED: "Contacted", QUALIFIED: "Qualified", TRIAL: "Trial", PROPOSAL: "Proposal", WON: "Won", LOST: "Lost" }

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
    <div className="flex flex-col gap-6 pb-8">
      <PageHeader title="Sales Intelligence" description="Understand pipeline health, conversion speed, follow-up discipline and acquisition sources." actions={<Button asChild variant="outline" className="rounded-xl"><Link href="/crm"><Sparkles className="size-4" /> Sales OS</Link></Button>} />

      <Card className="border-0 bg-gradient-to-br from-violet-500/[0.10] via-card to-cyan-500/[0.08] shadow-sm ring-1 ring-primary/15">
        <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-end lg:justify-between">
          <div><div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/65 px-3 py-1 text-xs font-semibold text-primary"><BarChart3 className="size-3.5" /> Real sales data</div><h2 className="text-xl font-semibold">Measure what turns into membership.</h2><p className="mt-1 text-sm text-muted-foreground">Choose a reporting window. Empty dates intentionally mean all-time.</p></div>
          <div className="grid grid-cols-2 gap-2 sm:flex"><div><label className="mb-1 block text-[11px] font-medium text-muted-foreground">From</label><Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></div><div><label className="mb-1 block text-[11px] font-medium text-muted-foreground">To</label><Input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></div><Button variant="ghost" className="mt-5" onClick={() => { setFrom(""); setTo("") }}>Reset</Button></div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric icon={Users} label="Total leads" value={data?.totalLeads ?? 0} />
        <Metric icon={TrendingUp} label="Won" value={data?.wonLeads ?? 0} />
        <Metric icon={Target} label="Conversion" value={`${data?.conversionRatePct ?? 0}%`} />
        <Metric icon={Clock3} label="Avg. conversion" value={data?.averageDaysToConversion == null ? "—" : `${data.averageDaysToConversion}d`} />
        <Metric icon={ListChecks} label="Follow-up completion" value={`${data?.followUps?.completionRatePct ?? 0}%`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-0 shadow-sm ring-1 ring-border/70">
          <CardHeader className="border-b bg-muted/15"><div className="flex items-center justify-between"><div><CardTitle className="text-base">Pipeline distribution</CardTitle><p className="mt-1 text-xs text-muted-foreground">Every lead in the selected window by current stage.</p></div><Flame className="size-4 text-rose-500" /></div></CardHeader>
          <CardContent className="space-y-4 p-5">
            {statusRows.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No sales data for this window.</p>}
            {statusRows.map((row) => { const percent = data?.totalLeads ? Math.round((row.count / data.totalLeads) * 100) : 0; return <div key={row.status}><div className="mb-2 flex items-center justify-between text-sm"><div className="flex items-center gap-2"><Badge variant={row.status === "WON" ? "success" : row.status === "LOST" ? "destructive" : row.status === "TRIAL" || row.status === "QUALIFIED" ? "warning" : row.status === "PROPOSAL" ? "secondary" : "secondary"}>{statusLabels[row.status] ?? row.status}</Badge><span className="text-muted-foreground">{row.count} leads</span></div><span className="font-semibold tabular-nums">{percent}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} /></div></div> })}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-border/70">
          <CardHeader className="border-b bg-muted/15"><div className="flex items-center justify-between"><div><CardTitle className="text-base">Follow-up discipline</CardTitle><p className="mt-1 text-xs text-muted-foreground">Scheduled actions and completion.</p></div><CalendarDays className="size-4 text-primary" /></div></CardHeader>
          <CardContent className="grid gap-3 p-5 sm:grid-cols-3 xl:grid-cols-1"><Mini label="Scheduled" value={data?.followUps?.total ?? 0} /><Mini label="Completed" value={data?.followUps?.completed ?? 0} /><Mini label="Completion rate" value={`${data?.followUps?.completionRatePct ?? 0}%`} /></CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm ring-1 ring-border/70">
        <CardHeader className="border-b bg-muted/15"><div className="flex items-center justify-between"><div><CardTitle className="text-base">Lead source performance</CardTitle><p className="mt-1 text-xs text-muted-foreground">Real source strings grouped with won/lost conversion performance.</p></div><Button variant="ghost" size="sm" onClick={() => { funnel.refetch(); sources.refetch(); lostReasons.refetch(); assignees.refetch() }} disabled={funnel.isFetching || sources.isFetching}><RefreshCw className={(funnel.isFetching || sources.isFetching) ? "size-4 animate-spin" : "size-4"} /> Refresh</Button></div></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm"><thead><tr className="border-b bg-muted/10 text-left text-xs text-muted-foreground"><th className="px-5 py-3 font-medium">Source</th><th className="px-5 py-3 font-medium">Leads</th><th className="px-5 py-3 font-medium">Won</th><th className="px-5 py-3 font-medium">Lost</th><th className="px-5 py-3 font-medium">Conversion</th></tr></thead><tbody>{sourceRows.map((row) => <tr key={row.source} className="border-b last:border-0"><td className="px-5 py-4 font-medium">{row.source}</td><td className="px-5 py-4 tabular-nums">{row.totalLeads}</td><td className="px-5 py-4 tabular-nums text-emerald-600">{row.wonLeads}</td><td className="px-5 py-4 tabular-nums text-rose-600">{row.lostLeads}</td><td className="px-5 py-4 font-semibold tabular-nums">{row.conversionRatePct}%</td></tr>)}</tbody></table></div>
          {sourceRows.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No source data available for this window.</p>}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-0 shadow-sm ring-1 ring-border/70">
          <CardHeader className="border-b bg-muted/15"><div className="flex items-center justify-between"><div><CardTitle className="text-base">Why leads are lost</CardTitle><p className="mt-1 text-xs text-muted-foreground">Reasons recorded when deals are marked lost.</p></div><Flame className="size-4 text-rose-500" /></div></CardHeader>
          <CardContent className="space-y-3 p-5">
            {lostReasonRows.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No lost leads recorded in this window.</p>}
            {lostReasonRows.map((row) => { const max = Math.max(...lostReasonRows.map((r) => r.lostLeads), 1); const percent = Math.round((row.lostLeads / max) * 100); return <div key={row.reason}><div className="mb-1 flex items-center justify-between text-sm"><span className="pr-2">{row.reason}</span><span className="font-semibold tabular-nums text-muted-foreground">{row.lostLeads}</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-rose-500/80" style={{ width: `${percent}%` }} /></div></div> })}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-border/70">
          <CardHeader className="border-b bg-muted/15"><div className="flex items-center justify-between"><div><CardTitle className="text-base">Rep performance</CardTitle><p className="mt-1 text-xs text-muted-foreground">Leads per assignee with real conversion outcomes.</p></div><Users className="size-4 text-primary" /></div></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b bg-muted/10 text-left text-xs text-muted-foreground"><th className="px-5 py-3 font-medium">Rep</th><th className="px-5 py-3 font-medium">Total</th><th className="px-5 py-3 font-medium">Open</th><th className="px-5 py-3 font-medium">Won</th><th className="px-5 py-3 font-medium">Lost</th><th className="px-5 py-3 font-medium">Conv.</th></tr></thead><tbody>{assigneeRows.map((row) => <tr key={row.assigneeId ?? "unassigned"} className="border-b last:border-0"><td className="px-5 py-4 font-medium">{row.assigneeName}</td><td className="px-5 py-4 tabular-nums">{row.totalLeads}</td><td className="px-5 py-4 tabular-nums text-muted-foreground">{row.openLeads}</td><td className="px-5 py-4 tabular-nums text-emerald-600">{row.wonLeads}</td><td className="px-5 py-4 tabular-nums text-rose-600">{row.lostLeads}</td><td className="px-5 py-4 font-semibold tabular-nums">{row.conversionRatePct}%</td></tr>)}</tbody></table></div>
            {assigneeRows.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No assignment data for this window.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Metric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string | number }) { return <Card className="border-0 shadow-sm ring-1 ring-border/70"><CardContent className="p-4"><span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4" /></span><p className="mt-3 text-xl font-semibold tabular-nums">{value}</p><p className="text-xs text-muted-foreground">{label}</p></CardContent></Card> }
function Mini({ label, value }: { label: string; value: string | number }) { return <div className="rounded-2xl border bg-background/55 p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold tabular-nums">{value}</p></div> }

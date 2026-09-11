"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, BarChart3, CalendarDays, Clock3, Flame, ListChecks, RefreshCw, Sparkles, Target, TrendingUp, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useSalesFunnel, useSalesSourcePerformance, useSalesLostReasons, useSalesAssigneePerformance } from "@/lib/hooks/use-analytics"

const statusLabels: Record<string, string> = { NEW: "New", CONTACTED: "Contacted", QUALIFIED: "Qualified", TRIAL: "Trial", PROPOSAL: "Proposal", WON: "Won", LOST: "Lost" }

const STATUS_BARS: Record<string, string> = {
  NEW: "from-blue-500 to-indigo-500",
  CONTACTED: "from-cyan-400 to-blue-500",
  QUALIFIED: "from-violet-500 to-purple-500",
  TRIAL: "from-fuchsia-500 to-violet-500",
  PROPOSAL: "from-amber-400 to-orange-500",
  WON: "from-emerald-400 to-teal-500",
  LOST: "from-rose-500 to-orange-500",
}

type MetricTone = "cyan" | "violet" | "blue" | "amber" | "emerald"

const METRIC_TONES: Record<MetricTone, { bar: string; tile: string; orb: string; ring: string }> = {
  cyan: {
    bar: "from-cyan-400 via-sky-500 to-blue-600",
    tile: "from-cyan-500 to-blue-600 shadow-cyan-500/30",
    orb: "bg-cyan-400/20",
    ring: "hover:border-cyan-200 hover:shadow-cyan-500/10",
  },
  violet: {
    bar: "from-violet-600 via-purple-600 to-fuchsia-600",
    tile: "from-violet-600 to-fuchsia-600 shadow-violet-500/30",
    orb: "bg-fuchsia-400/20",
    ring: "hover:border-violet-200 hover:shadow-violet-500/10",
  },
  blue: {
    bar: "from-blue-500 via-indigo-500 to-violet-600",
    tile: "from-blue-600 to-indigo-600 shadow-blue-500/30",
    orb: "bg-blue-400/20",
    ring: "hover:border-blue-200 hover:shadow-blue-500/10",
  },
  amber: {
    bar: "from-amber-400 via-orange-500 to-rose-500",
    tile: "from-amber-500 to-orange-600 shadow-amber-500/30",
    orb: "bg-amber-400/20",
    ring: "hover:border-amber-200 hover:shadow-amber-500/10",
  },
  emerald: {
    bar: "from-emerald-400 via-teal-500 to-green-600",
    tile: "from-emerald-500 to-teal-600 shadow-emerald-500/30",
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
    <div className="relative -mx-2 min-h-full overflow-hidden pb-12 sm:-mx-3 lg:-mx-5">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_5%_2%,rgba(6,182,212,.13),transparent_19%),radial-gradient(circle_at_96%_4%,rgba(99,102,241,.15),transparent_22%),radial-gradient(circle_at_70%_38%,rgba(217,70,239,.10),transparent_25%),radial-gradient(circle_at_12%_72%,rgba(16,185,129,.08),transparent_24%)]"
        aria-hidden="true"
      />
      <div className="mx-auto flex max-w-[1680px] flex-col gap-8 px-2 sm:px-4 lg:px-6">
        <section
          aria-labelledby="analytics-title"
          className="relative overflow-hidden rounded-[34px] border border-white/90 bg-white/88 p-6 shadow-[0_35px_110px_-48px_rgba(79,70,229,.48)] backdrop-blur-2xl sm:p-8 lg:p-10"
        >
          <div className="pointer-events-none absolute -left-24 -top-32 size-80 rounded-full bg-blue-300/30 blur-3xl motion-safe:animate-blob" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-28 -top-24 size-96 rounded-full bg-violet-300/30 blur-3xl motion-safe:animate-blob motion-safe:[animation-delay:2.5s]" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-40 left-[35%] size-96 rounded-full bg-cyan-300/25 blur-3xl" aria-hidden="true" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white/75 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em] text-violet-700">
                <BarChart3 className="size-3.5" aria-hidden="true" /> Real sales data
              </div>
              <h1 id="analytics-title" className="font-serif text-4xl font-semibold tracking-[-.045em] text-stone-950 sm:text-5xl">
                Sales Intelligence
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-stone-600">
                Pipeline health, conversion speed, follow-up discipline and acquisition
                sources — measure what turns into membership.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline" className="min-h-11 rounded-2xl border-blue-200 bg-white/80 hover:bg-stone-950 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                <Link href="/crm"><Sparkles className="size-4" aria-hidden="true" /> Sales OS</Link>
              </Button>
              <Button asChild className="min-h-11 rounded-2xl bg-[linear-gradient(105deg,#2563eb,#4f46e5_55%,#7c3aed)] shadow-lg shadow-blue-500/25 transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                <Link href="/crm/follow-ups">Follow-ups <ArrowRight className="size-4" aria-hidden="true" /></Link>
              </Button>
            </div>
          </div>
        </section>

        <section aria-labelledby="analytics-window" className="overflow-hidden rounded-[28px] border border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl">
          <div className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 id="analytics-window" className="font-serif text-xl font-semibold tracking-tight text-stone-950">
                Measure what turns into membership.
              </h2>
              <p className="mt-1 text-xs font-medium text-stone-600">Choose a reporting window. Empty dates intentionally mean all-time.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-end">
              <div>
                <label htmlFor="sales-from" className="mb-1 block text-[11px] font-bold text-stone-600">From</label>
                <Input id="sales-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
              </div>
              <div>
                <label htmlFor="sales-to" className="mb-1 block text-[11px] font-bold text-stone-600">To</label>
                <Input id="sales-to" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
              </div>
              <Button variant="ghost" className="min-h-11 rounded-xl hover:bg-blue-500/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:mt-5" onClick={() => { setFrom(""); setTo("") }}>Reset</Button>
            </div>
          </div>
        </section>

        <section aria-label="Funnel snapshot">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Metric icon={Users} label="Total leads" value={data?.totalLeads ?? 0} hint="In selected window" tone="cyan" />
            <Metric icon={TrendingUp} label="Won" value={data?.wonLeads ?? 0} hint="Converted to members" tone="emerald" />
            <Metric icon={Target} label="Conversion" value={`${data?.conversionRatePct ?? 0}%`} hint="Lead to member rate" tone="violet" />
            <Metric icon={Clock3} label="Avg. conversion" value={data?.averageDaysToConversion == null ? "—" : `${data.averageDaysToConversion}d`} hint="Speed to close" tone="amber" />
            <Metric icon={ListChecks} label="Follow-up completion" value={`${data?.followUps?.completionRatePct ?? 0}%`} hint="Sales discipline" tone="blue" />
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="overflow-hidden rounded-[28px] border border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 border-b border-stone-100/80 bg-gradient-to-r from-blue-50/90 via-white to-cyan-50/60 px-5 py-5">
              <div>
                <h2 className="font-serif text-xl font-semibold tracking-tight text-stone-950">Pipeline distribution</h2>
                <p className="mt-0.5 text-xs font-medium text-stone-600">Every lead in the selected window by current stage.</p>
              </div>
              <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/25">
                <Flame className="size-5" aria-hidden="true" />
              </span>
            </div>
            <div className="space-y-4 p-5 sm:p-6">
              {statusRows.length === 0 && <p className="py-8 text-center text-sm font-medium text-stone-600">No sales data for this window.</p>}
              {statusRows.map((row) => {
                const percent = data?.totalLeads ? Math.round((row.count / data.totalLeads) * 100) : 0
                const bar = STATUS_BARS[row.status] ?? "from-blue-500 to-cyan-500"
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
                      <div className={`h-full rounded-full bg-gradient-to-r transition-all ${bar}`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 border-b border-stone-100/80 bg-gradient-to-r from-violet-50/90 via-white to-cyan-50/60 px-5 py-5">
              <div>
                <h2 className="font-serif text-xl font-semibold tracking-tight text-stone-950">Follow-up discipline</h2>
                <p className="mt-0.5 text-xs font-medium text-stone-600">Scheduled actions and completion.</p>
              </div>
              <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/25">
                <CalendarDays className="size-5" aria-hidden="true" />
              </span>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-3 xl:grid-cols-1">
              <Mini label="Scheduled" value={data?.followUps?.total ?? 0} tint="from-blue-50/80 to-cyan-50/50" />
              <Mini label="Completed" value={data?.followUps?.completed ?? 0} tint="from-emerald-50/80 to-teal-50/50" />
              <Mini label="Completion rate" value={`${data?.followUps?.completionRatePct ?? 0}%`} tint="from-violet-50/80 to-fuchsia-50/50" />
            </div>
          </div>
        </section>

        <section aria-labelledby="analytics-sources" className="overflow-hidden rounded-[28px] border border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl">
          <div className="flex flex-col gap-3 border-b border-stone-100/80 bg-gradient-to-r from-cyan-50/90 via-white to-blue-50/60 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 id="analytics-sources" className="font-serif text-xl font-semibold tracking-tight text-stone-950">Lead source performance</h2>
              <p className="mt-0.5 text-xs font-medium text-stone-600">Real source strings grouped with won/lost conversion performance.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { funnel.refetch(); sources.refetch(); lostReasons.refetch(); assignees.refetch() }} disabled={funnel.isFetching || sources.isFetching} className="min-h-11 w-fit rounded-xl hover:bg-cyan-500/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600">
              <RefreshCw className={(funnel.isFetching || sources.isFetching) ? "size-4 animate-spin" : "size-4"} aria-hidden="true" /> Refresh
            </Button>
          </div>
          <div className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/60 text-left text-xs font-bold text-stone-600">
                    <th className="px-5 py-3 font-bold">Source</th>
                    <th className="px-5 py-3 font-bold">Leads</th>
                    <th className="px-5 py-3 font-bold">Won</th>
                    <th className="px-5 py-3 font-bold">Lost</th>
                    <th className="px-5 py-3 font-bold">Conversion</th>
                  </tr>
                </thead>
                <tbody>
                  {sourceRows.map((row) => (
                    <tr key={row.source} className="border-b border-stone-100 transition last:border-0 hover:bg-blue-50/40">
                      <td className="px-5 py-4 font-bold text-stone-900">{row.source}</td>
                      <td className="px-5 py-4 tabular-nums text-stone-700">{row.totalLeads}</td>
                      <td className="px-5 py-4 tabular-nums text-emerald-600">{row.wonLeads}</td>
                      <td className="px-5 py-4 tabular-nums text-rose-600">{row.lostLeads}</td>
                      <td className="px-5 py-4 font-extrabold tabular-nums text-stone-950">{row.conversionRatePct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {sourceRows.length === 0 && <p className="p-8 text-center text-sm font-medium text-stone-600">No source data available for this window.</p>}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <div className="overflow-hidden rounded-[28px] border border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 border-b border-stone-100/80 bg-gradient-to-r from-rose-50/90 via-white to-orange-50/60 px-5 py-5">
              <div>
                <h2 className="font-serif text-xl font-semibold tracking-tight text-stone-950">Why leads are lost</h2>
                <p className="mt-0.5 text-xs font-medium text-stone-600">Reasons recorded when deals are marked lost.</p>
              </div>
              <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-md shadow-rose-500/25">
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
                      <div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-400" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 border-b border-stone-100/80 bg-gradient-to-r from-blue-50/90 via-white to-violet-50/60 px-5 py-5">
              <div>
                <h2 className="font-serif text-xl font-semibold tracking-tight text-stone-950">Rep performance</h2>
                <p className="mt-0.5 text-xs font-medium text-stone-600">Leads per assignee with real conversion outcomes.</p>
              </div>
              <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-md shadow-blue-500/25">
                <Users className="size-5" aria-hidden="true" />
              </span>
            </div>
            <div className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-100 bg-stone-50/60 text-left text-xs font-bold text-stone-600">
                      <th className="px-5 py-3 font-bold">Rep</th>
                      <th className="px-5 py-3 font-bold">Total</th>
                      <th className="px-5 py-3 font-bold">Open</th>
                      <th className="px-5 py-3 font-bold">Won</th>
                      <th className="px-5 py-3 font-bold">Lost</th>
                      <th className="px-5 py-3 font-bold">Conv.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assigneeRows.map((row) => (
                      <tr key={row.assigneeId ?? "unassigned"} className="border-b border-stone-100 transition last:border-0 hover:bg-violet-50/40">
                        <td className="px-5 py-4 font-bold text-stone-900">{row.assigneeName}</td>
                        <td className="px-5 py-4 tabular-nums text-stone-700">{row.totalLeads}</td>
                        <td className="px-5 py-4 tabular-nums text-stone-600">{row.openLeads}</td>
                        <td className="px-5 py-4 tabular-nums text-emerald-600">{row.wonLeads}</td>
                        <td className="px-5 py-4 tabular-nums text-rose-600">{row.lostLeads}</td>
                        <td className="px-5 py-4 font-extrabold tabular-nums text-stone-950">{row.conversionRatePct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {assigneeRows.length === 0 && <p className="p-8 text-center text-sm font-medium text-stone-600">No assignment data for this window.</p>}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function Metric({ icon: Icon, label, value, hint, tone }: { icon: typeof Users; label: string; value: string | number; hint: string; tone: MetricTone }) {
  const t = METRIC_TONES[tone]
  return (
    <Card className={`group relative overflow-hidden border-white/90 bg-white/85 shadow-[0_20px_60px_-38px_rgba(79,70,229,.35)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 ${t.ring}`}>
      <span className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${t.bar}`} aria-hidden="true" />
      <div className={`pointer-events-none absolute -right-10 -top-10 size-32 rounded-full blur-2xl transition duration-300 group-hover:scale-125 ${t.orb}`} aria-hidden="true" />
      <CardContent className="relative flex items-center gap-4 p-5">
        <span className={`flex size-14 shrink-0 items-center justify-center rounded-[19px] bg-gradient-to-br text-white shadow-lg ${t.tile} transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}>
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[.18em] text-stone-500">{label}</p>
          <p className="mt-1 truncate text-2xl font-black tracking-tight text-stone-950 tabular-nums">{value}</p>
          <p className="mt-1 text-[11px] font-medium text-stone-600">{hint}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function Mini({ label, value, tint }: { label: string; value: string | number; tint: string }) {
  return (
    <div className={`rounded-[20px] border border-white/80 bg-gradient-to-br p-4 shadow-sm ${tint}`}>
      <p className="text-[10px] font-black uppercase tracking-[.16em] text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-tight text-stone-950 tabular-nums">{value}</p>
    </div>
  )
}

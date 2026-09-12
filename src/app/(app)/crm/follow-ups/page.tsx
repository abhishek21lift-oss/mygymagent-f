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

type StatTone = "cyan" | "rose" | "violet"

const STAT_TONES: Record<StatTone, { bar: string; tile: string; orb: string; ring: string }> = {
  cyan: {
    bar: "from-cyan-400 via-sky-500 to-blue-600",
    tile: "from-cyan-500 to-blue-600 shadow-cyan-500/30",
    orb: "bg-cyan-400/20",
    ring: "hover:border-cyan-200 hover:shadow-cyan-500/10",
  },
  rose: {
    bar: "from-rose-500 via-red-500 to-orange-500",
    tile: "from-rose-500 to-orange-500 shadow-rose-500/30",
    orb: "bg-rose-400/20",
    ring: "hover:border-rose-200 hover:shadow-rose-500/10",
  },
  violet: {
    bar: "from-violet-600 via-purple-600 to-fuchsia-600",
    tile: "from-violet-600 to-fuchsia-600 shadow-violet-500/30",
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
    <div className="relative -mx-2 min-h-full overflow-hidden pb-12 sm:-mx-3 lg:-mx-5">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_5%_2%,rgba(6,182,212,.13),transparent_19%),radial-gradient(circle_at_96%_4%,rgba(99,102,241,.15),transparent_22%),radial-gradient(circle_at_70%_38%,rgba(217,70,239,.10),transparent_25%),radial-gradient(circle_at_12%_72%,rgba(16,185,129,.08),transparent_24%)]"
        aria-hidden="true"
      />
      <div className="mx-auto flex max-w-[1680px] flex-col gap-8 px-2 sm:px-4 lg:px-6">
        <PageHero
          id="followups-title"
          eyebrow="Follow-up discipline"
          icon={CalendarClock}
          title="Follow-ups"
          description="Never lose the next sales action — open work first, overdue on top."
          variant="light"
          accent="blue"
          actions={
            <>
              <Button asChild variant="outline" className="min-h-11 rounded-2xl border-blue-200 bg-white/80 hover:bg-stone-950 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                <Link href="/crm"><Sparkles className="size-4" aria-hidden="true" /> Back to Sales OS</Link>
              </Button>
              <Button asChild className="min-h-11 rounded-2xl bg-[linear-gradient(105deg,#2563eb,#4f46e5_55%,#7c3aed)] shadow-lg shadow-blue-500/25 transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                <Link href="/crm/analytics">Sales analytics <ArrowRight className="size-4" aria-hidden="true" /></Link>
              </Button>
            </>
          }
        />

        <section aria-label="Follow-up snapshot">
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric icon={ListChecks} label="Visible actions" value={rows.length} hint="In this view" tone="cyan" />
            <Metric icon={Flame} label="Overdue" value={overdue} hint="Needs action right now" tone="rose" />
            <Metric icon={CalendarClock} label="Open" value={status === "OPEN" ? rows.length : rows.filter((row) => !row.completedAt).length} hint="Still awaiting a rep" tone="violet" />
          </div>
        </section>

        <section aria-labelledby="followups-list" className="overflow-hidden rounded-[28px] border border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl">
          <div className="flex flex-col gap-4 border-b border-stone-100/80 bg-gradient-to-r from-blue-50/90 via-white to-cyan-50/60 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/25">
                <ListChecks className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 id="followups-list" className="font-serif text-xl font-semibold tracking-tight text-stone-950">
                  Sales actions
                </h2>
                <p className="mt-0.5 text-xs font-medium text-stone-600">
                  Sorted by open work first, then due date.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Tabs value={status} onValueChange={(value) => setStatus(value as typeof status)}>
                <TabsList className="rounded-2xl">
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
                  <div key={i} className="h-[86px] animate-pulse rounded-[20px] bg-gradient-to-r from-stone-100 to-stone-50" />
                ))}
              </div>
            )}
            {query.isError && (
              <div role="alert" className="rounded-[20px] border border-rose-200 bg-gradient-to-r from-rose-50 to-orange-50 p-6 text-center">
                <p className="text-sm font-extrabold text-stone-900">Could not load follow-ups.</p>
                <p className="mt-1 text-xs font-medium text-stone-600">Check your connection and try again.</p>
                <Button variant="outline" className="mt-3 min-h-11 rounded-xl" onClick={() => query.refetch()}>Retry</Button>
              </div>
            )}
            {!query.isLoading && !query.isError && rows.map((row) => (
              <div
                key={row.id}
                className="relative flex flex-col gap-4 overflow-hidden rounded-[20px] border border-white/90 bg-white/80 p-4 shadow-sm transition hover:-translate-y-px hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
              >
                <span
                  className={`absolute inset-y-3 left-0 w-1 rounded-full ${row.completedAt ? "bg-gradient-to-b from-emerald-500 to-teal-400" : row.isOverdue ? "bg-gradient-to-b from-rose-500 to-orange-400" : "bg-gradient-to-b from-blue-600 to-cyan-400"}`}
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
              <div className="rounded-[20px] border border-dashed border-blue-200 bg-gradient-to-br from-blue-50/60 to-cyan-50/40 p-10 text-center">
                <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25">
                  <CalendarClock className="size-6" aria-hidden="true" />
                </span>
                <p className="mt-3 text-sm font-extrabold text-stone-900">No follow-ups in this view</p>
                <p className="mt-1 text-xs font-medium text-stone-600">Schedule the next action from any Lead 360 workspace.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function Metric({ icon: Icon, label, value, hint, tone }: { icon: typeof ListChecks; label: string; value: number; hint: string; tone: StatTone }) {
  const t = STAT_TONES[tone]
  return (
    <div className={`group relative overflow-hidden rounded-[22px] border border-white/90 bg-white/85 p-5 shadow-[0_20px_60px_-38px_rgba(79,70,229,.35)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 ${t.ring}`}>
      <span className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${t.bar}`} aria-hidden="true" />
      <div className={`pointer-events-none absolute -right-10 -top-10 size-28 rounded-full blur-2xl transition group-hover:scale-125 ${t.orb}`} aria-hidden="true" />
      <span className={`relative flex size-14 items-center justify-center rounded-[19px] bg-gradient-to-br text-white shadow-lg ${t.tile}`}>
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <p className="relative mt-3 text-2xl font-black tracking-tight text-stone-950 tabular-nums">{value}</p>
      <p className="relative text-[10px] font-black uppercase tracking-[.18em] text-stone-500">{label}</p>
      <p className="relative mt-1 text-[11px] font-medium text-stone-600">{hint}</p>
    </div>
  )
}

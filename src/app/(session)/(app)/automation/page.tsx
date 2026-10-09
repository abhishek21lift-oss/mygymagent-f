"use client"

import * as React from "react"
import Link from "next/link"
import { AlertTriangle, Bot, CheckCircle2, Clock, Mail, MessageCircle, MessageSquare, Workflow, XCircle } from "lucide-react"

import { useAuth } from "@/lib/auth/auth-context"
import {
 useAutomationOverview,
 type AutomationRunRow,
 type AutomationScanner,
} from "@/lib/hooks/use-automation"
import { DataState } from "@/components/shared/data-state"
import { PageHero } from "@/components/shared/page-hero"
import { Panel } from "@/components/shared/panel"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

/** Minutes/hours/days ago, or until. Computed at render from the server's
 * timestamps; the query refetches every minute, which is as fresh as a
 * relative time needs to be here. */
function relative(iso: string | null, now: number): string {
 if (!iso) return "—"
 const diff = new Date(iso).getTime() - now
 const abs = Math.abs(diff)
 const unit =
  abs < 3_600_000 ? { n: Math.max(1, Math.round(abs / 60_000)), u: "min" }
  : abs < 86_400_000 ? { n: Math.round(abs / 3_600_000), u: "h" }
  : { n: Math.round(abs / 86_400_000), u: "d" }
 return diff >= 0 ? `in ${unit.n}${unit.u}` : `${unit.n}${unit.u} ago`
}

function ChannelPill({ label, ready }: { label: string; ready: boolean }) {
 return (
  <span
   className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${
    ready
     ? "bg-emerald-500/10 text-emerald-800 ring-emerald-500/30 dark:text-emerald-300"
     : "bg-rose-500/10 text-rose-800 ring-rose-500/30 dark:text-rose-300"
   }`}
  >
   {ready ? <CheckCircle2 className="size-3.5" aria-hidden="true" /> : <XCircle className="size-3.5" aria-hidden="true" />}
   {label} {ready ? "ready" : "not configured"}
  </span>
 )
}

function ScannerCard({ scanner, now }: { scanner: AutomationScanner; now: number }) {
 const failedJob = scanner.lastRunState === "failed"
 // A reminder job whose channel is down is worth flagging even when the
 // job itself is healthy -- it will run on time and reach nobody.
 const blocked = scanner.channel !== "none" && !scanner.channelReady
 const total = scanner.outcomes.SENT + scanner.outcomes.SKIPPED + scanner.outcomes.FAILED

 return (
  <Card className={blocked || failedJob ? "border-rose-300/70 dark:border-rose-500/40" : undefined}>
   <CardContent className="flex h-full flex-col gap-3 p-4">
    <div className="flex items-start justify-between gap-3">
     <div className="min-w-0">
      <p className="font-bold leading-tight">{scanner.title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{scanner.description}</p>
     </div>
     {scanner.viaWhatsapp || scanner.channel === "whatsapp" ? (
      <MessageCircle className="size-4 shrink-0 text-emerald-600" aria-label="Sends on WhatsApp" />
     ) : scanner.channel === "email" ? (
      <Mail className="size-4 shrink-0 text-muted-foreground" aria-label="Sends email" />
     ) : scanner.channel === "sms" ? (
      <MessageSquare className="size-4 shrink-0 text-muted-foreground" aria-label="Sends SMS" />
     ) : (
      <Bot className="size-4 shrink-0 text-muted-foreground" aria-label="Runs in the background" />
     )}
    </div>

    {/* A chip, not a paragraph: when email is down it is down for every
        reminder, and the banner above already says so in full. Seven
        repeats of the same sentence buried the jobs themselves. */}
    {scanner.viaWhatsapp && (
     <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-800 ring-1 ring-emerald-500/30 dark:text-emerald-300">
      <MessageCircle className="size-3" aria-hidden="true" />
      On WhatsApp · email if no phone
     </span>
    )}
    {blocked && (
     <span className="inline-flex w-fit items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-bold text-rose-800 ring-1 ring-rose-500/30 dark:text-rose-300">
      <XCircle className="size-3" aria-hidden="true" />
      Can&apos;t reach anyone — {scanner.channel} is down
     </span>
    )}

    <dl className="grid grid-cols-2 gap-2 text-xs">
     <div>
      <dt className="text-muted-foreground">Runs</dt>
      <dd className="font-semibold">{scanner.cadence}</dd>
     </div>
     <div>
      <dt className="text-muted-foreground">Next</dt>
      <dd className="font-semibold tabular-nums">{scanner.job ? relative(scanner.nextRunAt, now) : "On event"}</dd>
     </div>
     <div className="col-span-2">
      <dt className="text-muted-foreground">Last run</dt>
      <dd className="flex items-center gap-1.5 font-semibold tabular-nums">
       {scanner.job ? relative(scanner.lastRunAt, now) : "—"}
       {scanner.lastRunState === "completed" && <CheckCircle2 className="size-3.5 text-emerald-600" aria-label="Completed" />}
       {failedJob && <XCircle className="size-3.5 text-rose-600" aria-label="Failed" />}
      </dd>
     </div>
    </dl>

    {scanner.key && (
     <div className="mt-auto flex flex-wrap gap-1.5 border-t border-border pt-3 text-xs">
      {total === 0 ? (
       <span className="text-muted-foreground">Nothing to act on lately</span>
      ) : (
       <>
        {scanner.outcomes.SENT > 0 && <Badge variant="success">{scanner.outcomes.SENT} sent</Badge>}
        {scanner.outcomes.SKIPPED > 0 && <Badge variant="secondary">{scanner.outcomes.SKIPPED} skipped</Badge>}
        {scanner.outcomes.FAILED > 0 && <Badge variant="destructive">{scanner.outcomes.FAILED} failed</Badge>}
       </>
      )}
     </div>
    )}
   </CardContent>
  </Card>
 )
}

/** What a mail-server error means, for the few that are common enough to
 * recognise. The raw text is still shown beneath: it is what whoever
 * fixes the server will need. */
function explain(reason: string): string | null {
 if (/not configured/i.test(reason)) return "Email isn't set up on this deployment."
 if (/ECONNREFUSED/.test(reason)) return "The email server refused the connection."
 if (/ETIMEDOUT|ETIMEOUT|timed out/i.test(reason)) return "The email server didn't answer in time."
 if (/EAUTH|Invalid login|535/i.test(reason)) return "The email server rejected its username or password."
 if (/ENOTFOUND|getaddrinfo/i.test(reason)) return "The email server's address couldn't be found."
 if (/consent/i.test(reason)) return "The member hasn't agreed to be contacted this way."
 return null
}

/** The fields worth a person's attention in a run's detail blob. */
function describeDetail(row: AutomationRunRow): string | null {
 const d = row.detail ?? {}
 if (typeof d.error === "string") return d.error
 if (d.outstanding != null) return `₹${d.outstanding} outstanding`
 if (typeof d.daysInactive === "number") return `${d.daysInactive} days since last visit`
 return null
}

function RecentRow({ row, titles }: { row: AutomationRunRow; titles: Map<string, string> }) {
 const who = row.subjectLabel ?? "Unknown record"
 const detail = describeDetail(row)
 return (
  <tr className="border-b border-border last:border-0 align-top">
   <td className="py-2 pr-3 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
    {new Date(row.createdAt).toLocaleString()}
   </td>
   <td className="py-2 pr-3 text-sm">{titles.get(row.key) ?? row.key.replaceAll("_", " ").toLowerCase()}</td>
   <td className="py-2 pr-3 text-sm font-semibold">
    {row.memberId ? <Link href={`/members/${row.memberId}`} className="underline-offset-2 hover:underline">{who}</Link> : who}
   </td>
   <td className="py-2 pr-3">
    <Badge variant={row.status === "SENT" ? "success" : row.status === "FAILED" ? "destructive" : "secondary"}>
     {row.status.toLowerCase()}
    </Badge>
   </td>
   <td className="py-2 text-xs text-muted-foreground">{detail ?? ""}</td>
  </tr>
 )
}

export default function AutomationPage() {
 const { hasPermission } = useAuth()
 const canView = hasPermission("reports.view")
 const overview = useAutomationOverview(canView)
 // Captured when the data arrives rather than read during render, which
 // keeps render pure; it moves forward with every refetch.
 const now = overview.dataUpdatedAt || 0

 if (!canView) {
  return (
   <div className="p-8">
    <Card><CardContent className="p-8">You do not have permission to view automations.</CardContent></Card>
   </div>
  )
 }

 const data = overview.data
 const titles = new Map((data?.scanners ?? []).filter((s) => s.key).map((s) => [s.key as string, s.title]))
 const failedTotal = (data?.blockers ?? []).reduce((sum, b) => sum + b.count, 0)

 return (
  <div className="flex flex-col gap-5 pb-4">
   <PageHero
    id="automation-title"
    icon={Workflow}
    title="Automations"
   />

   <DataState
    isLoading={overview.isPending}
    isError={overview.isError}
    onRetry={() => void overview.refetch()}
    errorMessage="Automations could not be loaded."
    isEmpty={false}
    emptyTitle=""
    skeletonRows={6}
   >
    {data && (
     <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
       <ChannelPill label="Email" ready={data.channels.email} />
       <ChannelPill label="SMS" ready={data.channels.sms} />
       {data.channels.whatsapp !== undefined && <ChannelPill label="WhatsApp" ready={data.channels.whatsapp} />}
      </div>

      {data.blockers.length > 0 && (
       <Panel
        title={
         <span className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
          <AlertTriangle className="size-4" aria-hidden="true" />
          {failedTotal} message{failedTotal === 1 ? "" : "s"} couldn&apos;t be sent in the last {data.windowDays} days
         </span>
        }
        titleId="automation-blockers"
        description="Each reason below is one thing to fix, however many members it affected."
       >
        <ul className="flex flex-col gap-2">
         {data.blockers.map((blocker) => (
          <li key={blocker.reason} className="flex items-start justify-between gap-3 rounded-lg border border-rose-300/60 bg-rose-500/5 p-3 dark:border-rose-500/30">
           <div className="min-w-0">
            <p className="text-sm font-semibold">{explain(blocker.reason) ?? blocker.reason}</p>
            {explain(blocker.reason) && (
             <p className="mt-0.5 break-all font-mono text-[11px] text-muted-foreground">{blocker.reason}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
             Affects: {blocker.keys.map((k) => titles.get(k) ?? k).join(", ")}
            </p>
           </div>
           <Badge variant="destructive" className="shrink-0 tabular-nums">{blocker.count}×</Badge>
          </li>
         ))}
        </ul>
       </Panel>
      )}

      <section aria-labelledby="automation-jobs">
       <h2 id="automation-jobs" className="mb-3 section-title">
        Jobs
       </h2>
       <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {data.scanners.map((scanner) => (
         <ScannerCard key={scanner.title} scanner={scanner} now={now} />
        ))}
       </div>
      </section>

      <Panel title="Recent activity" titleId="automation-recent" description="The last fifty things these jobs did, or tried to.">
       {data.recent.length === 0 ? (
        <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
         <Clock className="size-4" aria-hidden="true" />
         Nothing yet. Reminders appear here as members fall into their windows.
        </p>
       ) : (
        <div className="overflow-x-auto">
         <table className="w-full min-w-[640px]">
          <thead>
           <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
            <th className="py-2 pr-3 font-semibold">When</th>
            <th className="py-2 pr-3 font-semibold">Job</th>
            <th className="py-2 pr-3 font-semibold">Who</th>
            <th className="py-2 pr-3 font-semibold">Result</th>
            <th className="py-2 font-semibold">Detail</th>
           </tr>
          </thead>
          <tbody>
           {data.recent.map((row) => <RecentRow key={row.id} row={row} titles={titles} />)}
          </tbody>
         </table>
        </div>
       )}
      </Panel>
     </div>
    )}
   </DataState>
  </div>
 )
}

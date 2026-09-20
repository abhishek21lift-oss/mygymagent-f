"use client"

import { useState } from "react"
import Link from "next/link"
import { CalendarClock, CreditCard, PauseCircle, PlayCircle, Users, Wallet } from "lucide-react"
import { PageHero } from "@/components/shared/page-hero"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { StatCard } from "@/components/shared/stat-card"
import { useMembershipPlans } from "@/lib/hooks/use-membership-plans"
import { useMembershipAnalytics, useMembershipRenewalReminders, useMemberships, usePauseMembership, useResumeMembership, useExtendMembership, useUpgradeMembership, useDowngradeMembership, useRenewMembership, useCancelMembership, useTransferMembership } from "@/lib/hooks/use-memberships"
import type { Membership } from "@/lib/types/gym"

const STATUS_PILL: Record<string, string> = {
 ACTIVE: "bg-emerald-500/15 text-emerald-800 ring-emerald-200/60",
 FROZEN: "bg-cyan-500/15 text-cyan-800 ring-cyan-200/60",
 EXPIRED: "bg-stone-500/10 text-stone-600 ring-stone-200/60",
 CANCELLED: "bg-rose-500/10 text-rose-700 ring-rose-200/60",
 PENDING: "bg-amber-500/15 text-amber-800 ring-amber-200/60",
}

function statusPill(status: string) {
 return STATUS_PILL[status] ?? "bg-stone-500/10 text-stone-600 ring-stone-200/60"
}

export default function MembershipLifecyclePage() {
 const [selectedPlan, setSelectedPlan] = useState("")
 const memberships = useMemberships({ page: 1, pageSize: 100 })
 const plans = useMembershipPlans({ page: 1, pageSize: 100 })
 const analytics = useMembershipAnalytics()
 const reminders = useMembershipRenewalReminders(30)
 const pause = usePauseMembership(); const resume = useResumeMembership(); const extend = useExtendMembership()
 const upgrade = useUpgradeMembership(); const downgrade = useDowngradeMembership(); const renew = useRenewMembership()
 const cancel = useCancelMembership(); const transfer = useTransferMembership()
 const data = memberships.data?.items ?? []
 const stats = analytics.data ?? {}
 const loading = memberships.isLoading || analytics.isLoading

 const run = async (promise: Promise<unknown>) => { await promise; await memberships.refetch(); await analytics.refetch(); await reminders.refetch() }
 const promptNumber = (label: string) => { const value = window.prompt(label); if (!value) return null; const n = Number(value); return Number.isFinite(n) && n > 0 ? n : null }

 const act = async (membership: Membership, action: string) => {
  try {
   if (action === "pause") { const days = promptNumber("Pause for how many days?"); if (days) await run(pause.mutateAsync({ id: membership.id, days })) }
   if (action === "resume") await run(resume.mutateAsync(membership.id))
   if (action === "extend") { const days = promptNumber("Extend by how many days?"); if (days) await run(extend.mutateAsync({ id: membership.id, days })) }
   if (action === "renew") await run(renew.mutateAsync({ id: membership.id }))
   if (action === "cancel") { const reason = window.prompt("Cancellation reason") ?? "Cancelled by staff"; await run(cancel.mutateAsync({ id: membership.id, reason })) }
   if (action === "upgrade" || action === "downgrade") { if (!selectedPlan) { window.alert("Select a target plan first"); return }; const fn = action === "upgrade" ? upgrade : downgrade; await run(fn.mutateAsync({ id: membership.id, membershipPlanId: selectedPlan })) }
   if (action === "transfer") { const memberId = window.prompt("Target member ID"); if (memberId) await run(transfer.mutateAsync({ id: membership.id, toMemberId: memberId })) }
  } catch (error) { window.alert(error instanceof Error ? error.message : "Membership action failed") }
 }

 const activePlans = (plans.data?.items ?? []).filter(p => p.isActive)

 return (
  <div className="flex flex-col gap-4">
   <PageHero
    id="memberships-title"
    icon={CreditCard}
    title="Membership Lifecycle"
    variant="light"
    accent="emerald"
    actions={
     <>
      <Button asChild size="sm" className="min-h-10 rounded-lg focus-visible:ring-ring">
       <Link href="/membership-plans"><CreditCard className="size-4" aria-hidden="true" /> Plans</Link>
      </Button>
      <Button asChild variant="outline" size="sm" className="min-h-10 rounded-lg focus-visible:ring-ring">
       <Link href="/billing"><Wallet className="size-4" aria-hidden="true" /> Recover dues</Link>
      </Button>
     </>
    }
   />

   <section aria-labelledby="memberships-pulse">
    <h2 id="memberships-pulse" className="mb-3 text-lg font-semibold tracking-tight">Lifecycle pulse</h2>
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
     <StatCard icon={Users} title="Total" value={stats.total as string | number | undefined} isLoading={loading} tone="primary" />
     <StatCard icon={PlayCircle} title="Active" value={stats.active as string | number | undefined} isLoading={loading} tone="success" />
     <StatCard icon={PauseCircle} title="Frozen" value={stats.frozen as string | number | undefined} isLoading={loading} tone="primary" />
     <StatCard icon={CalendarClock} title="Expiring 30d" value={stats.expiringNext30Days as string | number | undefined} isLoading={loading} tone="warning" />
     <StatCard icon={CreditCard} title="Expired" value={stats.expired as string | number | undefined} isLoading={loading} tone="destructive" />
    </div>
   </section>

   <Card className="overflow-hidden rounded-xl">
    <CardHeader className="border-b px-5 py-4 sm:px-6">
     <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
       <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <CreditCard className="size-5" aria-hidden="true" />
       </span>
       <div>
        <CardTitle id="memberships-plan-change" className="text-lg">Plan change</CardTitle>
        <CardDescription className="text-sm">Select a target plan for upgrades or downgrades.</CardDescription>
       </div>
      </div>
      <Select value={selectedPlan || "__none"} onValueChange={(v) => setSelectedPlan(v === "__none" ? "" : v)}>
       <SelectTrigger aria-label="Select target plan" className="h-11 min-h-11 rounded-lg border-input bg-card text-sm focus-visible:ring-ring">
        <SelectValue placeholder="Select target plan" />
       </SelectTrigger>
       <SelectContent>
        <SelectItem value="__none">Select target plan</SelectItem>
        {activePlans.map(plan => <SelectItem key={plan.id} value={plan.id}>{plan.name} · ₹ {plan.price}</SelectItem>)}
       </SelectContent>
      </Select>
     </div>
    </CardHeader>
   </Card>

   <Card className="overflow-hidden rounded-xl">
    <CardHeader className="border-b px-5 py-4 sm:px-6">
     <div className="flex items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
       <CalendarClock className="size-5" aria-hidden="true" />
      </span>
      <div>
       <CardTitle id="memberships-renewals" className="text-lg">Renewal watchlist</CardTitle>
       <CardDescription className="text-sm">Memberships expiring soon.</CardDescription>
      </div>
     </div>
    </CardHeader>
    <CardContent className="p-4 sm:p-5">
     {reminders.isLoading ? (
      <div className="space-y-2" aria-label="Loading renewals">
       {[1, 2, 3].map(i => <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />)}
      </div>
     ) : reminders.isError ? (
      <ErrorState message="Unable to load renewals." onRetry={() => reminders.refetch()} />
     ) : (reminders.data ?? []).length === 0 ? (
      <EmptyState title="No renewals" description="No memberships need renewal attention." />
     ) : (
      <div className="flex flex-col gap-2">
       {(reminders.data ?? []).slice(0, 8).map(m => (
        <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3">
         <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{m.member?.firstName} {m.member?.lastName}</div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground">{m.membershipPlan?.name} · expires {new Date(m.endDate).toLocaleDateString()}</div>
         </div>
         <div className="flex items-center gap-2">
          <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold uppercase text-amber-800 ring-1 ring-amber-200/60">Dues soon</span>
          <Button type="button" size="sm" className="min-h-10 rounded-lg focus-visible:ring-ring" onClick={() => act(m, "renew")}>Renew</Button>
         </div>
        </div>
       ))}
      </div>
     )}
    </CardContent>
   </Card>

   <Card className="overflow-hidden rounded-xl">
    <CardHeader className="border-b px-5 py-4 sm:px-6">
     <div className="flex items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
       <Users className="size-5" aria-hidden="true" />
      </span>
      <div>
       <CardTitle id="memberships-all" className="text-lg">All memberships</CardTitle>
       <CardDescription className="text-sm">Full lifecycle directory with quick actions.</CardDescription>
      </div>
     </div>
    </CardHeader>
    <CardContent className="p-0">
     {memberships.isLoading ? (
      <div className="space-y-2 p-4" aria-label="Loading memberships">
       {[1, 2, 3].map(i => <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />)}
      </div>
     ) : memberships.isError ? (
      <div className="p-4">
       <ErrorState message="Unable to load memberships." onRetry={() => memberships.refetch()} />
      </div>
     ) : data.length === 0 ? (
      <div className="p-4">
       <EmptyState title="No memberships found" description="Memberships will appear here once created." />
      </div>
     ) : (
      <Table>
       <TableHeader>
        <TableRow>
         <TableHead>Member</TableHead>
         <TableHead>Plan</TableHead>
         <TableHead>Status</TableHead>
         <TableHead>End</TableHead>
         <TableHead className="text-right">Actions</TableHead>
        </TableRow>
       </TableHeader>
       <TableBody>
        {data.map(m => (
         <TableRow key={m.id}>
          <TableCell className="text-sm font-semibold">{m.member?.firstName} {m.member?.lastName}</TableCell>
          <TableCell className="text-sm text-muted-foreground">{m.membershipPlan?.name}</TableCell>
          <TableCell><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusPill(m.status)}`}>{m.status}</span></TableCell>
          <TableCell className="text-sm tabular-nums text-muted-foreground">{new Date(m.endDate).toLocaleDateString()}</TableCell>
          <TableCell>
           <div className="flex flex-wrap justify-end gap-1.5">
            <Button type="button" variant="outline" size="sm" className="min-h-10 rounded-lg focus-visible:ring-ring" onClick={() => act(m, m.status === "FROZEN" ? "resume" : "pause")}>{m.status === "FROZEN" ? "Resume" : "Pause"}</Button>
            <Button type="button" variant="outline" size="sm" className="min-h-10 rounded-lg focus-visible:ring-ring" onClick={() => act(m, "extend")}>Extend</Button>
            <Button type="button" variant="outline" size="sm" className="min-h-10 rounded-lg focus-visible:ring-ring" onClick={() => act(m, "upgrade")}>Upgrade</Button>
            <Button type="button" variant="outline" size="sm" className="min-h-10 rounded-lg focus-visible:ring-ring" onClick={() => act(m, "downgrade")}>Downgrade</Button>
            <Button type="button" variant="outline" size="sm" className="min-h-10 rounded-lg focus-visible:ring-ring" onClick={() => act(m, "transfer")}>Transfer</Button>
            <Button type="button" size="sm" className="min-h-10 rounded-lg focus-visible:ring-ring" onClick={() => act(m, "renew")}>Renew</Button>
            <Button type="button" variant="destructive" size="sm" className="min-h-10 rounded-lg focus-visible:ring-ring" onClick={() => act(m, "cancel")}>Cancel</Button>
           </div>
          </TableCell>
         </TableRow>
        ))}
       </TableBody>
      </Table>
     )}
    </CardContent>
   </Card>
  </div>
 )
}

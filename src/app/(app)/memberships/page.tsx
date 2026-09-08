"use client"

import { useState } from "react"
import { CreditCard } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { useMembershipPlans } from "@/lib/hooks/use-membership-plans"
import { useMembershipAnalytics, useMembershipRenewalReminders, useMemberships, usePauseMembership, useResumeMembership, useExtendMembership, useUpgradeMembership, useDowngradeMembership, useRenewMembership, useCancelMembership, useTransferMembership } from "@/lib/hooks/use-memberships"
import type { Membership } from "@/lib/types/gym"

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

  return (
    <div className="space-y-6">
      <PageHeader title="Membership Lifecycle" description="Manage the complete membership lifecycle without leaving the gym OS." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard title="Total" icon={CreditCard} value={stats.total as string | number | undefined} isLoading={loading} />
        <StatCard title="Active" icon={CreditCard} value={stats.active as string | number | undefined} isLoading={loading} />
        <StatCard title="Frozen" icon={CreditCard} value={stats.frozen as string | number | undefined} isLoading={loading} />
        <StatCard title="Expiring 30d" icon={CreditCard} value={stats.expiringNext30Days as string | number | undefined} isLoading={loading} />
        <StatCard title="Expired" icon={CreditCard} value={stats.expired as string | number | undefined} isLoading={loading} />
      </div>
      <section className="rounded-xl border bg-card p-4 space-y-3"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Plan Change</h2><p className="text-sm text-muted-foreground">Select the target plan before using Upgrade/Downgrade.</p></div><select className="h-9 rounded-md border bg-background px-3 text-sm" value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)}><option value="">Select target plan</option>{(plans.data?.items ?? []).filter(p => p.isActive).map(plan => <option key={plan.id} value={plan.id}>{plan.name} · {plan.currency} {plan.price}</option>)}</select></div></section>
      <section className="rounded-xl border bg-card overflow-hidden"><div className="border-b px-4 py-3"><h2 className="font-semibold">Renewal Watchlist</h2><p className="text-sm text-muted-foreground">Active memberships expiring within 30 days.</p></div><div className="divide-y">{(reminders.data ?? []).slice(0, 8).map(m => <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"><div><div className="font-medium">{m.member?.firstName} {m.member?.lastName}</div><div className="text-xs text-muted-foreground">{m.membershipPlan?.name} · expires {new Date(m.endDate).toLocaleDateString()}</div></div><button className="rounded-md border px-3 py-1.5 text-sm" onClick={() => act(m, "renew")}>Renew</button></div>)}{!reminders.data?.length && <div className="px-4 py-6 text-sm text-muted-foreground">No memberships need renewal attention.</div>}</div></section>
      <section className="rounded-xl border bg-card overflow-hidden"><div className="border-b px-4 py-3"><h2 className="font-semibold">All Memberships</h2></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="px-4 py-3">Member</th><th>Plan</th><th>Status</th><th>End</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody>{data.map(m => <tr key={m.id} className="border-b last:border-0"><td className="px-4 py-3 font-medium">{m.member?.firstName} {m.member?.lastName}</td><td>{m.membershipPlan?.name}</td><td><span className="rounded-full border px-2 py-1 text-xs">{m.status}</span></td><td>{new Date(m.endDate).toLocaleDateString()}</td><td className="px-4 py-3"><div className="flex flex-wrap justify-end gap-1.5"><button className="rounded border px-2 py-1 text-xs" onClick={() => act(m, m.status === "FROZEN" ? "resume" : "pause")}>{m.status === "FROZEN" ? "Resume" : "Pause"}</button><button className="rounded border px-2 py-1 text-xs" onClick={() => act(m, "extend")}>Extend</button><button className="rounded border px-2 py-1 text-xs" onClick={() => act(m, "upgrade")}>Upgrade</button><button className="rounded border px-2 py-1 text-xs" onClick={() => act(m, "downgrade")}>Downgrade</button><button className="rounded border px-2 py-1 text-xs" onClick={() => act(m, "transfer")}>Transfer</button><button className="rounded border px-2 py-1 text-xs" onClick={() => act(m, "renew")}>Renew</button><button className="rounded border px-2 py-1 text-xs text-destructive" onClick={() => act(m, "cancel")}>Cancel</button></div></td></tr>)}{!data.length && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No memberships found.</td></tr>}</tbody></table></div></section>
    </div>
  )
}

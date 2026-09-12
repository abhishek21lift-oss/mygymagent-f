"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, CalendarClock, CreditCard, PauseCircle, PlayCircle, Users, Wallet } from "lucide-react"
import { PageHero } from "@/components/shared/page-hero"
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

function LifecycleStat({ icon: Icon, label, value, hint, loading, tone }: { icon: typeof Users; label: string; value: React.ReactNode; hint: string; loading: boolean; tone: "emerald" | "cyan" | "amber" | "violet" | "rose" }) {
  const tones = {
    emerald: { bar: "from-emerald-400 via-teal-500 to-green-600", tile: "from-emerald-500 to-teal-600 shadow-emerald-500/30", orb: "bg-emerald-400/20", ring: "hover:border-emerald-200 hover:shadow-emerald-500/10" },
    cyan: { bar: "from-cyan-400 via-sky-500 to-blue-600", tile: "from-cyan-500 to-blue-600 shadow-cyan-500/30", orb: "bg-cyan-400/20", ring: "hover:border-cyan-200 hover:shadow-cyan-500/10" },
    amber: { bar: "from-amber-400 via-orange-500 to-amber-600", tile: "from-amber-500 to-orange-600 shadow-amber-500/30", orb: "bg-amber-400/20", ring: "hover:border-amber-200 hover:shadow-amber-500/10" },
    violet: { bar: "from-violet-600 via-purple-600 to-fuchsia-600", tile: "from-violet-600 to-fuchsia-600 shadow-violet-500/30", orb: "bg-fuchsia-400/20", ring: "hover:border-violet-200 hover:shadow-violet-500/10" },
    rose: { bar: "from-rose-500 via-red-500 to-orange-500", tile: "from-rose-500 to-orange-500 shadow-rose-500/30", orb: "bg-rose-400/20", ring: "hover:border-rose-200 hover:shadow-rose-500/10" },
  }
  const t = tones[tone]
  return (
    <div className={`group relative overflow-hidden rounded-[22px] border border-white/90 bg-white/85 shadow-[0_20px_60px_-38px_rgba(79,70,229,.35)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 dark:border-white/10 dark:bg-stone-950/80 ${t.ring}`}>
      <span className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${t.bar}`} aria-hidden="true" />
      <div className={`pointer-events-none absolute -right-10 -top-10 size-32 rounded-full blur-2xl transition duration-300 group-hover:scale-125 ${t.orb}`} aria-hidden="true" />
      <div className="relative flex items-center gap-4 p-5">
        <span className={`flex size-14 shrink-0 items-center justify-center rounded-[19px] bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${t.tile}`}>
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[.18em] text-stone-500">{label}</p>
          {loading ? <div className="mt-2 h-7 w-16 animate-pulse rounded-lg bg-stone-200/70" aria-label={`Loading ${label}`} /> : <p className="mt-1 truncate text-2xl font-black tracking-tight text-stone-950 tabular-nums dark:text-white">{value ?? 0}</p>}
          <p className="mt-1 text-[11px] font-medium text-stone-600 dark:text-stone-400">{hint}</p>
        </div>
      </div>
    </div>
  )
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

  return (
    <div className="relative -mx-2 min-h-full overflow-hidden pb-12 sm:-mx-3 lg:-mx-5">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_5%_2%,rgba(6,182,212,.13),transparent_19%),radial-gradient(circle_at_96%_4%,rgba(99,102,241,.15),transparent_22%),radial-gradient(circle_at_70%_38%,rgba(217,70,239,.10),transparent_25%),radial-gradient(circle_at_12%_72%,rgba(16,185,129,.08),transparent_24%)]" aria-hidden="true" />
      <div className="mx-auto flex max-w-[1680px] flex-col gap-8 px-2 sm:px-4 lg:px-6">
        <PageHero
          id="memberships-title"
          eyebrow="Recurring revenue engine"
          icon={CreditCard}
          title="Membership Lifecycle"
          description="Pauses, renewals, upgrades and dues recovery — without leaving the gym OS."
          variant="light"
          accent="emerald"
          actions={
            <>
              <Link href="/membership-plans" className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[linear-gradient(105deg,#059669,#0d9488_55%,#0ea5e9)] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-500/25 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
                <CreditCard className="size-4" aria-hidden="true" /> Manage plans <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link href="/billing" className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-amber-200/80 bg-amber-50/80 px-5 py-3 text-sm font-bold text-amber-900 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600">
                <Wallet className="size-4" aria-hidden="true" /> Recover dues
              </Link>
            </>
          }
        />

        <section aria-labelledby="memberships-pulse" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="mb-4">
            <h2 id="memberships-pulse" className="font-serif text-2xl font-semibold tracking-tight text-stone-950 dark:text-white">Lifecycle pulse</h2>
            <p className="mt-1 text-xs font-medium text-stone-600 dark:text-stone-400">Every stage of the member journey owns one vivid color.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <LifecycleStat icon={Users} label="Total" value={stats.total as string | number | undefined} hint="All memberships" loading={loading} tone="emerald" />
            <LifecycleStat icon={PlayCircle} label="Active" value={stats.active as string | number | undefined} hint="In good standing" loading={loading} tone="cyan" />
            <LifecycleStat icon={PauseCircle} label="Frozen" value={stats.frozen as string | number | undefined} hint="Paused by staff" loading={loading} tone="violet" />
            <LifecycleStat icon={CalendarClock} label="Expiring 30d" value={stats.expiringNext30Days as string | number | undefined} hint="Dues watchlist" loading={loading} tone="amber" />
            <LifecycleStat icon={CreditCard} label="Expired" value={stats.expired as string | number | undefined} hint="Needs renewal" loading={loading} tone="rose" />
          </div>
        </section>

        <section aria-labelledby="memberships-plan-change" className="overflow-hidden rounded-[28px] border border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-delay:100ms] dark:border-white/10 dark:bg-stone-950/80">
          <div className="border-b border-stone-100/80 bg-gradient-to-r from-emerald-50/90 via-white to-teal-50/60 px-5 py-5 sm:px-6 dark:from-emerald-950/40 dark:via-stone-950 dark:to-teal-950/30">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
                  <CreditCard className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 id="memberships-plan-change" className="font-serif text-xl font-semibold tracking-tight text-stone-950 dark:text-white">Plan change</h2>
                  <p className="mt-0.5 text-xs font-medium text-stone-600 dark:text-stone-400">Select the target plan before using Upgrade / Downgrade.</p>
                </div>
              </div>
              <select aria-label="Select target plan" className="min-h-11 rounded-2xl border border-emerald-200/70 bg-white/90 px-4 py-2.5 text-sm font-bold text-stone-800 shadow-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-white/10 dark:bg-stone-900 dark:text-stone-100" value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)}>
                <option value="">Select target plan</option>
                {(plans.data?.items ?? []).filter(p => p.isActive).map(plan => <option key={plan.id} value={plan.id}>{plan.name} · {plan.currency} {plan.price}</option>)}
              </select>
            </div>
          </div>
        </section>

        <section aria-labelledby="memberships-renewals" className="overflow-hidden rounded-[28px] border border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-delay:150ms] dark:border-white/10 dark:bg-stone-950/80">
          <div className="flex items-center gap-3 border-b border-stone-100/80 bg-gradient-to-r from-amber-50/90 via-white to-orange-50/60 px-5 py-5 sm:px-6 dark:from-amber-950/30 dark:via-stone-950 dark:to-orange-950/20">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25">
              <CalendarClock className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="memberships-renewals" className="font-serif text-xl font-semibold tracking-tight text-stone-950 dark:text-white">Renewal watchlist</h2>
              <p className="mt-0.5 text-xs font-medium text-stone-600 dark:text-stone-400">Active memberships expiring within 30 days — warm dues recovery.</p>
            </div>
          </div>
          <div className="divide-y divide-stone-100 p-2 dark:divide-white/10">
            {(reminders.data ?? []).slice(0, 8).map(m => (
              <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] bg-gradient-to-r from-amber-50/80 via-white to-orange-50/50 px-4 py-3 ring-1 ring-amber-100/70 dark:from-amber-950/20 dark:via-transparent dark:to-orange-950/10 dark:ring-white/10">
                <div className="min-w-0">
                  <div className="truncate text-sm font-extrabold text-stone-900 dark:text-stone-100">{m.member?.firstName} {m.member?.lastName}</div>
                  <div className="mt-0.5 truncate text-xs font-medium text-stone-600 dark:text-stone-400">{m.membershipPlan?.name} · expires {new Date(m.endDate).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-800 ring-1 ring-amber-200/60">Dues soon</span>
                  <button type="button" className="inline-flex min-h-11 items-center rounded-xl bg-stone-950 px-4 py-2 text-xs font-extrabold text-white shadow-sm transition hover:-translate-y-px hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600" onClick={() => act(m, "renew")}>Renew</button>
                </div>
              </div>
            ))}
            {!reminders.isLoading && !reminders.data?.length && <div className="rounded-[20px] border border-dashed border-stone-200 bg-stone-50/60 px-4 py-8 text-center text-sm font-medium text-stone-600 dark:text-stone-400">No memberships need renewal attention.</div>}
            {reminders.isLoading && <div className="space-y-2 p-2" aria-label="Loading renewals">{[1, 2, 3].map(i => <div key={i} className="h-14 animate-pulse rounded-[18px] bg-stone-100 dark:bg-white/5" />)}</div>}
            {reminders.isError && <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-5 text-sm font-bold text-rose-700">Unable to load renewals. <button type="button" className="underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600" onClick={() => reminders.refetch()}>Retry</button></div>}
          </div>
        </section>

        <section aria-labelledby="memberships-all" className="overflow-hidden rounded-[28px] border border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-delay:200ms] dark:border-white/10 dark:bg-stone-950/80">
          <div className="flex items-center gap-3 border-b border-stone-100/80 bg-gradient-to-r from-emerald-50/90 via-white to-cyan-50/60 px-5 py-5 sm:px-6 dark:from-emerald-950/40 dark:via-stone-950 dark:to-cyan-950/20">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
              <Users className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="memberships-all" className="font-serif text-xl font-semibold tracking-tight text-stone-950 dark:text-white">All memberships</h2>
              <p className="mt-0.5 text-xs font-medium text-stone-600 dark:text-stone-400">Pause, extend, upgrade, transfer, renew or cancel in place.</p>
            </div>
          </div>
          <div className="overflow-x-auto p-2">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[10px] font-black uppercase tracking-[.16em] text-stone-500"><th className="px-4 py-3">Member</th><th className="px-2 py-3">Plan</th><th className="px-2 py-3">Status</th><th className="px-2 py-3">End</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
              <tbody>
                {memberships.isLoading ? (
                  <tr><td colSpan={5} className="px-4 py-6"><div className="space-y-2" aria-label="Loading memberships">{[1, 2, 3].map(i => <div key={i} className="h-12 animate-pulse rounded-xl bg-stone-100 dark:bg-white/5" />)}</div></td></tr>
                ) : memberships.isError ? (
                  <tr><td colSpan={5} className="px-4 py-6"><div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-bold text-rose-700">Unable to load memberships. <button type="button" className="underline focus-visible:outline-2 focus-visible:outline-rose-600" onClick={() => memberships.refetch()}>Retry</button></div></td></tr>
                ) : data.map(m => (
                  <tr key={m.id} className="border-t border-stone-100 transition hover:bg-emerald-50/40 first:border-0 dark:border-white/10 dark:hover:bg-white/5">
                    <td className="px-4 py-3 font-bold text-stone-900 dark:text-stone-100">{m.member?.firstName} {m.member?.lastName}</td>
                    <td className="px-2 py-3 font-medium text-stone-700 dark:text-stone-300">{m.membershipPlan?.name}</td>
                    <td className="px-2 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold ring-1 ${statusPill(m.status)}`}>{m.status}</span></td>
                    <td className="px-2 py-3 font-medium tabular-nums text-stone-600 dark:text-stone-400">{new Date(m.endDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><div className="flex flex-wrap justify-end gap-1.5">
                      <button type="button" className="inline-flex min-h-11 items-center rounded-xl border border-stone-200/80 bg-white/80 px-2.5 py-1.5 text-xs font-bold text-stone-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600" onClick={() => act(m, m.status === "FROZEN" ? "resume" : "pause")}>{m.status === "FROZEN" ? "Resume" : "Pause"}</button>
                      <button type="button" className="inline-flex min-h-11 items-center rounded-xl border border-stone-200/80 bg-white/80 px-2.5 py-1.5 text-xs font-bold text-stone-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600" onClick={() => act(m, "extend")}>Extend</button>
                      <button type="button" className="inline-flex min-h-11 items-center rounded-xl border border-stone-200/80 bg-white/80 px-2.5 py-1.5 text-xs font-bold text-stone-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600" onClick={() => act(m, "upgrade")}>Upgrade</button>
                      <button type="button" className="inline-flex min-h-11 items-center rounded-xl border border-stone-200/80 bg-white/80 px-2.5 py-1.5 text-xs font-bold text-stone-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600" onClick={() => act(m, "downgrade")}>Downgrade</button>
                      <button type="button" className="inline-flex min-h-11 items-center rounded-xl border border-stone-200/80 bg-white/80 px-2.5 py-1.5 text-xs font-bold text-stone-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600" onClick={() => act(m, "transfer")}>Transfer</button>
                      <button type="button" className="inline-flex min-h-11 items-center rounded-xl bg-stone-950 px-2.5 py-1.5 text-xs font-extrabold text-white shadow-sm transition hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950" onClick={() => act(m, "renew")}>Renew</button>
                      <button type="button" className="inline-flex min-h-11 items-center rounded-xl border border-rose-200/70 bg-rose-50/70 px-2.5 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600" onClick={() => act(m, "cancel")}>Cancel</button>
                    </div></td>
                  </tr>
                ))}
                {!memberships.isLoading && !memberships.isError && !data.length && <tr><td colSpan={5} className="px-4 py-10 text-center font-medium text-stone-600 dark:text-stone-400">No memberships found.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

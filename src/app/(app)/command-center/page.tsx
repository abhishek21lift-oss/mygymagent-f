"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Dumbbell,
  Package,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";
import { useDailyBriefing } from "@/lib/hooks/use-daily-briefing";
import { MetricCard3D } from "@/components/three/metric-card-3d";

function money(value: string | undefined, currency: string) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount)
    ? `${currency} ${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
    : `${currency} 0`;
}

export default function CommandCenterPage() {
  const { user, hasPermission } = useAuth();
  const briefing = useDailyBriefing();
  const data = briefing.data;
  const currency = data?.revenue.revenue[0]?.currency ?? "INR";
  const revenue = data?.revenue.revenue.find((item) => item.currency === currency);
  const outstanding = data?.revenue.outstanding.find((item) => item.currency === currency);

  const priorities = data
    ? [
        data.atRiskMembers.count > 0 && {
          icon: AlertTriangle,
          tone: "rose",
          title: `${data.atRiskMembers.count} members need attention`,
          detail: "Retention risk detected from recent activity.",
          href: "/members",
          action: "Review members",
        },
        data.salesFunnel.followUps.total > 0 && {
          icon: TrendingUp,
          tone: "blue",
          title: `${data.salesFunnel.followUps.total} follow-ups in the pipeline`,
          detail: `${data.salesFunnel.followUps.completionRatePct}% completed so far.`,
          href: "/crm",
          action: "Open Sales",
        },
        data.lowStock.count > 0 && {
          icon: Package,
          tone: "amber",
          title: `${data.lowStock.count} products below reorder level`,
          detail: "Protect availability before the next stockout.",
          href: "/inventory",
          action: "Review stock",
        },
        data.pendingAiActions > 0 && {
          icon: Sparkles,
          tone: "violet",
          title: `${data.pendingAiActions} AI actions await approval`,
          detail: "Review before anything is executed.",
          href: "/ai-actions",
          action: "Review actions",
        },
      ].filter(Boolean)
    : [];

  return (
    <div className="relative -mx-2 overflow-hidden pb-8 sm:-mx-3 lg:-mx-5">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(circle_at_12%_8%,rgba(99,102,241,.16),transparent_28%),radial-gradient(circle_at_84%_4%,rgba(6,182,212,.14),transparent_25%),radial-gradient(circle_at_65%_32%,rgba(168,85,247,.10),transparent_25%)]" />

      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-2 sm:px-3 lg:px-5">
        <section className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white/75 p-5 shadow-[0_24px_80px_-35px_rgba(79,70,229,.35)] backdrop-blur-xl sm:p-7 lg:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 right-28 size-72 rounded-full bg-violet-400/15 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-700 shadow-sm">
                <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex size-2 rounded-full bg-emerald-500" /></span>
                Live Command Center
              </div>
              <h1 className="text-3xl font-bold tracking-[-0.04em] text-slate-950 sm:text-4xl lg:text-[42px]">Good morning, {user?.firstName ?? "Owner"}.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">Your gym at a glance — members, cash flow, sales, inventory and AI decisions in one calm operating view.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/owner-os" className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">Insights <ChevronRight className="size-4" /></Link>
              <Link href="/ai" className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:shadow-xl"><Sparkles className="size-4" /> Ask MyGymAgent <ArrowRight className="size-4" /></Link>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between px-1"><div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600">Business pulse</p><h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">Today at a glance</h2></div><span className="hidden text-xs font-medium text-slate-500 sm:block">Live tenant context · refreshed every minute</span></div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard3D icon={CalendarCheck} label="Today's check-ins" value={data?.today.checkIns} loading={briefing.isLoading} accent="cyan" hint="Today" trend="neutral" delay={0} />
            <MetricCard3D icon={Wallet} label="Net revenue" value={data ? money(revenue?.netRevenue, currency) : undefined} loading={briefing.isLoading} accent="green" hint="Current period" trend="neutral" delay={80} />
            <MetricCard3D icon={Users} label="Members at risk" value={data?.atRiskMembers.count} loading={briefing.isLoading} accent="amber" hint="14+ days inactive" trend="neutral" delay={160} />
            <MetricCard3D icon={Sparkles} label="Pending AI actions" value={data?.pendingAiActions} loading={briefing.isLoading} accent="violet" hint="Needs approval" trend="neutral" delay={240} />
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.35fr_.9fr]">
          <Card className="overflow-hidden border-0 bg-white/80 shadow-[0_18px_55px_-35px_rgba(15,23,42,.35)] ring-1 ring-slate-200/80 backdrop-blur-xl">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/70 px-5 py-4">
              <div className="flex items-center justify-between gap-3"><div><CardTitle className="flex items-center gap-2 text-base font-bold text-slate-950"><span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-rose-100 to-amber-100 text-rose-600"><Zap className="size-4" /></span>Decision queue</CardTitle><p className="mt-1 text-xs text-slate-500">Priorities surfaced from live operational signals.</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Today</span></div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              {briefing.isLoading ? <div className="space-y-2">{[1, 2, 3].map((item) => <div key={item} className="h-[72px] animate-pulse rounded-2xl bg-slate-100" />)}</div> : priorities.length ? <div className="space-y-2">{priorities.map((item) => { if (!item) return null; const Icon = item.icon; const tone = toneClasses[item.tone as keyof typeof toneClasses]; return <Link key={item.title} href={item.href} className={`group flex items-center gap-3 rounded-2xl border border-transparent p-3 transition-all hover:-translate-y-0.5 hover:border-slate-200 hover:bg-white hover:shadow-md ${tone.surface}`}><span className={`flex size-11 shrink-0 items-center justify-center rounded-[15px] ${tone.icon}`}><Icon className="size-5" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-slate-900">{item.title}</span><span className="mt-1 block text-xs text-slate-500">{item.detail}</span></span><span className="hidden items-center gap-1 text-xs font-bold text-slate-600 sm:flex">{item.action}<ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" /></span></Link>; })}</div> : <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 p-9 text-center"><span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600"><CheckCircle2 className="size-6" /></span><p className="mt-3 text-sm font-bold text-slate-900">Command queue is clear</p><p className="mt-1 text-xs text-slate-500">No urgent signals were returned by the live briefing.</p></div>}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-[0_24px_65px_-35px_rgba(109,40,217,.7)]">
            <CardHeader className="border-b border-white/15 px-5 py-4"><CardTitle className="flex items-center gap-2 text-base font-bold"><span className="flex size-8 items-center justify-center rounded-xl bg-white/15"><TrendingUp className="size-4" /></span>Sales health</CardTitle><p className="mt-1 text-xs text-white/65">Pipeline momentum and follow-up discipline.</p></CardHeader>
            <CardContent className="space-y-4 p-5"><div className="grid grid-cols-2 gap-2.5">{[
              ["Total leads", data?.salesFunnel.totalLeads ?? "—"], ["Won leads", data?.salesFunnel.wonLeads ?? "—"], ["Conversion", data ? `${data.salesFunnel.conversionRatePct}%` : "—"], ["Follow-ups", data ? `${data.salesFunnel.followUps.completionRatePct}%` : "—"],
            ].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur"><p className="text-[10px] font-semibold uppercase tracking-wider text-white/55">{label}</p><p className="mt-1 text-xl font-bold tabular-nums">{value}</p></div>)}</div><Link href="/crm" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-indigo-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">Open Sales OS <ArrowRight className="size-4" /></Link></CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <DataCard title="At-risk members" subtitle="Retention watchlist" icon={Users} href="/members" action="View all" accent="rose">{data?.atRiskMembers.top.length ? data.atRiskMembers.top.map((member) => <div key={member.id} className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-0"><div className="flex min-w-0 items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-orange-100 text-xs font-bold text-rose-700">{member.firstName.charAt(0)}{member.lastName.charAt(0)}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{member.firstName} {member.lastName}</p><p className="text-xs text-slate-500">{member.neverCheckedIn ? "Never checked in" : `${member.daysSinceLastVisit} days since visit`}</p></div></div><span className="rounded-full bg-rose-50 px-2 py-1 text-[10px] font-bold uppercase text-rose-600">Risk</span></div>) : <EmptyState text="No at-risk members returned." />}</DataCard>
          <DataCard title="Low stock" subtitle="Inventory watchlist" icon={Package} href="/inventory" action="Open inventory" accent="amber">{data?.lowStock.top.length ? data.lowStock.top.map((product) => <div key={product.productId} className="flex items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-0"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{product.name}</p><p className="text-xs text-slate-500">{product.sku} · reorder at {product.reorderLevel}</p></div><span className="rounded-xl bg-amber-50 px-2.5 py-1.5 text-sm font-bold tabular-nums text-amber-700">{product.quantityOnHand}</span></div>) : <EmptyState text="Stock levels look healthy." />}</DataCard>
          <DataCard title="Finance snapshot" subtitle="Revenue & receivables" icon={CreditCard} href="/billing" action="Open billing" accent="emerald"><div className="grid grid-cols-2 gap-2.5"><MiniMetric label="Net revenue" value={data ? money(revenue?.netRevenue, currency) : "—"} /><MiniMetric label="Payments" value={revenue?.paymentCount ?? "—"} /><MiniMetric label="Outstanding" value={data ? money(outstanding?.outstandingBalance, currency) : "—"} /><MiniMetric label="Balances" value={outstanding?.membershipsWithBalance ?? "—"} /></div></DataCard>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
          <DataCard title="Trainer workload" subtitle="Capacity and assignment overview" icon={Dumbbell} href="/staff" action="Open staff" accent="blue">{data?.trainerWorkload.top.length ? data.trainerWorkload.top.map((trainer) => <div key={trainer.userId} className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 last:border-0"><div className="flex min-w-0 items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Dumbbell className="size-4" /></span><div><p className="text-sm font-semibold text-slate-900">{trainer.firstName} {trainer.lastName}</p><p className="text-xs text-slate-500">{trainer.assignedMemberCount} assigned members</p></div></div><div className="text-right text-xs text-slate-500"><p><b className="text-slate-800">{trainer.workoutPlansAssignedLast30Days}</b> workouts</p><p><b className="text-slate-800">{trainer.dietPlansAssignedLast30Days}</b> diets · 30d</p></div></div>) : <EmptyState text="Trainer workload is not available for this context." />}</DataCard>
          <Card className="relative overflow-hidden border-0 bg-white/80 shadow-[0_18px_55px_-35px_rgba(15,23,42,.35)] ring-1 ring-violet-200/80 backdrop-blur-xl"><div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-violet-400/15 blur-3xl" /><CardHeader className="relative px-5 pb-2"><CardTitle className="flex items-center gap-2 text-base font-bold text-slate-950"><span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-600"><Sparkles className="size-4" /></span>AI command layer</CardTitle></CardHeader><CardContent className="relative space-y-4 p-5 pt-2"><div className="rounded-2xl bg-gradient-to-br from-violet-50 via-fuchsia-50/50 to-white p-4"><p className="text-sm leading-6 text-slate-600">{data ? <><span className="font-bold text-violet-700">{data.pendingAiActions} proposals</span> are waiting for approval. MyGymAgent keeps AI decision-support human-controlled.</> : "Loading the AI command layer…"}</p></div><Link href="/ai-actions" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/15 transition hover:-translate-y-0.5 hover:shadow-xl">Open Action Queue <ArrowRight className="size-4" /></Link></CardContent></Card>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">{hasPermission("attendance.read") && <QuickLink href="/attendance" icon={CalendarCheck} title="Attendance" text="Check-ins and floor activity." tone="cyan" />}{hasPermission("members.read") && <QuickLink href="/members" icon={Users} title="Members" text="Retention, lifecycle and client health." tone="violet" />}{hasPermission("payments.read") && <QuickLink href="/billing" icon={Wallet} title="Cash flow" text="Payments, balances and revenue." tone="emerald" />}</section>
      </div>
    </div>
  );
}

const toneClasses = {
  rose: { surface: "bg-rose-50/35", icon: "bg-rose-100 text-rose-600" },
  blue: { surface: "bg-blue-50/35", icon: "bg-blue-100 text-blue-600" },
  amber: { surface: "bg-amber-50/35", icon: "bg-amber-100 text-amber-600" },
  violet: { surface: "bg-violet-50/35", icon: "bg-violet-100 text-violet-600" },
};

function DataCard({ title, subtitle, icon: Icon, href, action, accent, children }: { title: string; subtitle: string; icon: typeof Users; href: string; action: string; accent: "rose" | "amber" | "emerald" | "blue"; children: React.ReactNode }) {
  const icons = { rose: "bg-rose-100 text-rose-600", amber: "bg-amber-100 text-amber-600", emerald: "bg-emerald-100 text-emerald-600", blue: "bg-blue-100 text-blue-600" };
  return <Card className="overflow-hidden border-0 bg-white/80 shadow-[0_18px_55px_-35px_rgba(15,23,42,.35)] ring-1 ring-slate-200/80 backdrop-blur-xl"><CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 px-4 py-3.5"><div className="flex min-w-0 items-center gap-3"><span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${icons[accent]}`}><Icon className="size-4" /></span><div><CardTitle className="text-sm font-bold text-slate-950">{title}</CardTitle><p className="text-[11px] text-slate-500">{subtitle}</p></div></div><Link href={href} className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-indigo-600">{action}<ChevronRight className="size-3.5" /></Link></CardHeader><CardContent className="p-4">{children}</CardContent></Card>;
}
function MiniMetric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-base font-bold tabular-nums text-slate-900">{value}</p></div>; }
function EmptyState({ text }: { text: string }) { return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center text-xs text-slate-500">{text}</div>; }
function QuickLink({ href, icon: Icon, title, text, tone }: { href: string; icon: typeof Users; title: string; text: string; tone: "cyan" | "violet" | "emerald" }) { const styles = { cyan: "bg-cyan-50 text-cyan-600", violet: "bg-violet-50 text-violet-600", emerald: "bg-emerald-50 text-emerald-600" }; return <Link href={href} className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-lg"><span className={`flex size-10 items-center justify-center rounded-xl ${styles[tone]}`}><Icon className="size-4" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-slate-900">{title}</span><span className="mt-0.5 block text-xs text-slate-500">{text}</span></span><ArrowRight className="size-4 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-slate-500" /></Link>; }

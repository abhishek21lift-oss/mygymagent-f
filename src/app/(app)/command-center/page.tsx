"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarCheck, CheckCircle2, CreditCard, Dumbbell, Megaphone, Package, Sparkles, TrendingUp, Users, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";
import { useDailyBriefing } from "@/lib/hooks/use-daily-briefing";
import { MetricCard3D } from "@/components/three/metric-card-3d";

function money(value: string | undefined, currency: string) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? `${currency} ${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : `${currency} 0`;
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
        data.atRiskMembers.count > 0 && { icon: AlertTriangle, title: `${data.atRiskMembers.count} members need attention`, detail: "Inactive members are the clearest retention risk today.", href: "/members", action: "Review members" },
        data.salesFunnel.followUps.total > 0 && { icon: Megaphone, title: `${data.salesFunnel.followUps.total} follow-ups in the pipeline`, detail: `${data.salesFunnel.followUps.completionRatePct}% completed.`, href: "/crm", action: "Open Sales" },
        data.lowStock.count > 0 && { icon: Package, title: `${data.lowStock.count} products below reorder level`, detail: "Protect availability before the next stockout.", href: "/inventory", action: "Review stock" },
        data.pendingAiActions > 0 && { icon: Sparkles, title: `${data.pendingAiActions} AI actions await approval`, detail: "Human approval is required before execution.", href: "/ai-actions", action: "Review actions" },
      ].filter(Boolean)
    : [];

  return (
    <div className="relative flex flex-col gap-6">
      <section className="overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/[0.10] via-card to-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/70 px-3 py-1.5 text-xs font-semibold text-primary backdrop-blur"><Sparkles className="size-3.5" /> MyGymAgent Command Center</div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Good morning, {user?.firstName ?? "Owner"}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">One operational view for members, revenue, sales, inventory and AI decisions — powered by live tenant data.</p>
          </div>
          <Link href="/ai" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><Sparkles className="size-4" /> Ask MyGymAgent <ArrowRight className="size-4" /></Link>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between"><div><h2 className="text-base font-semibold tracking-tight">Business pulse</h2><p className="text-xs text-muted-foreground">Live metrics from your current tenant and branch context.</p></div><Link href="/owner-os" className="text-xs font-medium text-primary hover:underline">Open Insights</Link></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard3D icon={CalendarCheck} label="Today's check-ins" value={data?.today.checkIns} loading={briefing.isLoading} accent="cyan" hint="Today" trend="neutral" delay={0} />
          <MetricCard3D icon={Wallet} label="Net revenue" value={data ? money(revenue?.netRevenue, currency) : undefined} loading={briefing.isLoading} accent="green" hint="Current period" trend="neutral" delay={80} />
          <MetricCard3D icon={Users} label="Members at risk" value={data?.atRiskMembers.count} loading={briefing.isLoading} accent="amber" hint="14+ days inactive" trend="neutral" delay={160} />
          <MetricCard3D icon={Sparkles} label="Pending AI actions" value={data?.pendingAiActions} loading={briefing.isLoading} accent="violet" hint="Needs approval" trend="neutral" delay={240} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card className="border-0 shadow-sm ring-1 ring-border/70"><CardHeader className="border-b bg-muted/20"><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="size-4 text-primary" /> Decision queue</CardTitle><p className="text-xs text-muted-foreground">Only signals backed by the live daily briefing are shown.</p></CardHeader><CardContent className="p-3 sm:p-4">
          {briefing.isLoading ? <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-muted" />)}</div> : priorities.length ? <div className="space-y-2">{priorities.map((item) => { if (!item) return null; const Icon = item.icon; return <Link key={item.title} href={item.href} className="group flex items-center gap-3 rounded-2xl border border-transparent p-3 transition hover:border-border hover:bg-muted/30"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4.5" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{item.title}</span><span className="mt-0.5 block text-xs text-muted-foreground">{item.detail}</span></span><span className="hidden items-center gap-1 text-xs font-medium text-primary sm:flex">{item.action}<ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" /></span></Link>; })}</div> : <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center"><CheckCircle2 className="size-8 text-primary" /><p className="mt-3 text-sm font-semibold">Command queue is clear</p><p className="mt-1 text-xs text-muted-foreground">No urgent signals were returned by the live briefing.</p></div>}
        </CardContent></Card>

        <Card className="border-0 shadow-sm ring-1 ring-border/70"><CardHeader className="border-b bg-muted/20"><CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="size-4 text-primary" /> Sales health</CardTitle></CardHeader><CardContent className="space-y-4 p-4"><div className="grid grid-cols-2 gap-3"><Signal label="Total leads" value={data?.salesFunnel.totalLeads ?? "—"} /><Signal label="Won leads" value={data?.salesFunnel.wonLeads ?? "—"} /><Signal label="Conversion" value={data ? `${data.salesFunnel.conversionRatePct}%` : "—"} /><Signal label="Follow-up completion" value={data ? `${data.salesFunnel.followUps.completionRatePct}%` : "—"} /></div><Link href="/crm" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border bg-background/60 px-4 py-2.5 text-sm font-semibold hover:bg-muted/40">Open Sales OS <ArrowRight className="size-4" /></Link></CardContent></Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <DataCard title="At-risk members" icon={Users} href="/members" action="View members">{data?.atRiskMembers.top.length ? data.atRiskMembers.top.map((member) => <div key={member.id} className="flex items-center justify-between gap-3 border-b py-2.5 last:border-0"><div className="min-w-0"><p className="truncate text-sm font-medium">{member.firstName} {member.lastName}</p><p className="text-xs text-muted-foreground">{member.neverCheckedIn ? "Never checked in" : `${member.daysSinceLastVisit} days since visit`}</p></div><span className="rounded-full bg-destructive/10 px-2 py-1 text-[11px] font-semibold text-destructive">Risk</span></div>) : <EmptyState text="No at-risk members returned." />}</DataCard>
        <DataCard title="Low stock" icon={Package} href="/inventory" action="Open inventory">{data?.lowStock.top.length ? data.lowStock.top.map((product) => <div key={product.productId} className="flex items-center justify-between gap-3 border-b py-2.5 last:border-0"><div className="min-w-0"><p className="truncate text-sm font-medium">{product.name}</p><p className="text-xs text-muted-foreground">{product.sku} · reorder at {product.reorderLevel}</p></div><span className="text-sm font-semibold tabular-nums">{product.quantityOnHand}</span></div>) : <EmptyState text="Stock levels look healthy." />}</DataCard>
        <DataCard title="Finance snapshot" icon={CreditCard} href="/billing" action="Open billing"><Signal label="Net revenue" value={data ? money(revenue?.netRevenue, currency) : "—"} /><Signal label="Payments" value={revenue?.paymentCount ?? "—"} /><Signal label="Outstanding" value={data ? money(outstanding?.outstandingBalance, currency) : "—"} /><Signal label="Members with balance" value={outstanding?.membershipsWithBalance ?? "—"} /></DataCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <DataCard title="Trainer workload" icon={Dumbbell} href="/staff" action="Open staff">{data?.trainerWorkload.top.length ? data.trainerWorkload.top.map((trainer) => <div key={trainer.userId} className="flex items-center justify-between gap-3 border-b py-2.5 last:border-0"><div><p className="text-sm font-medium">{trainer.firstName} {trainer.lastName}</p><p className="text-xs text-muted-foreground">{trainer.assignedMemberCount} assigned members</p></div><div className="text-right text-xs text-muted-foreground"><p>{trainer.workoutPlansAssignedLast30Days} workouts</p><p>{trainer.dietPlansAssignedLast30Days} diets · 30d</p></div></div>) : <EmptyState text="Trainer workload is not available for this context." />}</DataCard>
        <Card className="border-0 bg-gradient-to-br from-violet-500/[0.08] via-card to-card shadow-sm ring-1 ring-primary/15"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Sparkles className="size-4 text-primary" /> AI command layer</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm leading-6 text-muted-foreground">{data ? `${data.pendingAiActions} proposals are waiting for approval. The AI layer is decision-support first: review, then execute.` : "Loading the AI command layer…"}</p><Link href="/ai-actions" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Open Action Queue <ArrowRight className="size-4" /></Link></CardContent></Card>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">{hasPermission("attendance.read") && <Link href="/attendance" className="rounded-2xl border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-sm"><div className="flex items-center gap-2 text-sm font-semibold"><CalendarCheck className="size-4 text-primary" /> Attendance</div><p className="mt-1 text-xs text-muted-foreground">Check-ins and daily floor activity.</p></Link>}{hasPermission("members.read") && <Link href="/members" className="rounded-2xl border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-sm"><div className="flex items-center gap-2 text-sm font-semibold"><Users className="size-4 text-primary" /> Members</div><p className="mt-1 text-xs text-muted-foreground">Retention, lifecycle and client health.</p></Link>}{hasPermission("payments.read") && <Link href="/billing" className="rounded-2xl border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-sm"><div className="flex items-center gap-2 text-sm font-semibold"><Wallet className="size-4 text-primary" /> Cash flow</div><p className="mt-1 text-xs text-muted-foreground">Payments, balances and revenue.</p></Link>}</section>
    </div>
  );
}

function Signal({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl border bg-background/60 p-3"><p className="text-[11px] text-muted-foreground">{label}</p><p className="mt-1 text-lg font-semibold tabular-nums">{value}</p></div>; }
function DataCard({ title, icon: Icon, href, action, children }: { title: string; icon: typeof Users; href: string; action: string; children: React.ReactNode }) { return <Card className="border-0 shadow-sm ring-1 ring-border/70"><CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 pb-3"><CardTitle className="flex items-center gap-2 text-sm"><Icon className="size-4 text-primary" /> {title}</CardTitle><Link href={href} className="text-xs font-medium text-primary hover:underline">{action}</Link></CardHeader><CardContent className="p-4">{children}</CardContent></Card>; }
function EmptyState({ text }: { text: string }) { return <div className="rounded-xl border border-dashed p-5 text-center text-xs text-muted-foreground">{text}</div>; }

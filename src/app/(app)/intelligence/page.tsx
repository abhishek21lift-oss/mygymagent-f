"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  DollarSign,
  Dumbbell,
  Gauge,
  Layers3,
  Package,
  RefreshCw,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useRevenueSummary,
  useRevenueTrend,
  useAtRiskMembers,
  useMemberStatusBreakdown,
  useSalesFunnel,
  useTrainerWorkload,
  useInventoryForecast,
  type RevenueSummary,
  type RevenueTrendMonth,
  type AtRiskMember,
  type TrainerWorkload,
} from "@/lib/hooks/use-analytics";
import { useBranches } from "@/lib/hooks/use-branches";

const glass = "border-white/70 bg-white/75 shadow-[0_20px_70px_-35px_rgba(15,23,42,0.28)] backdrop-blur-xl";
const soft = "border-white/70 bg-white/60 backdrop-blur-md";

function SectionEyebrow({ children, icon: Icon = Sparkles }: { children: React.ReactNode; icon?: typeof Sparkles }) {
  return (
    <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
      <Icon className="size-3.5" />
      {children}
    </div>
  );
}

function KpiCard({ title, value, subtext, trend, trendValue, icon: Icon, accent = "violet", loading, href }: {
  title: string; value: string | number | undefined; subtext?: string; trend?: "up" | "down" | "neutral"; trendValue?: string;
  icon: typeof Activity; accent?: "violet" | "cyan" | "green" | "amber" | "red"; loading?: boolean; href?: string;
}) {
  const accents = {
    violet: "from-violet-500/15 to-fuchsia-500/5 text-violet-600 ring-violet-500/10",
    cyan: "from-cyan-500/15 to-sky-500/5 text-cyan-600 ring-cyan-500/10",
    green: "from-emerald-500/15 to-teal-500/5 text-emerald-600 ring-emerald-500/10",
    amber: "from-amber-500/15 to-orange-500/5 text-amber-600 ring-amber-500/10",
    red: "from-rose-500/15 to-red-500/5 text-rose-600 ring-rose-500/10",
  };
  const body = (
    <Card className={`${glass} overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_25px_80px_-35px_rgba(15,23,42,0.35)] ${href ? "cursor-pointer" : ""}`}>
      <CardContent className="relative p-5">
        <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-gradient-to-br from-primary/5 to-transparent blur-2xl" />
        <div className="relative flex items-start justify-between">
          <div className={`flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br ring-1 ${accents[accent]}`}>
            <Icon className="size-5" />
          </div>
          {trend && <div className="flex items-center gap-1 rounded-full bg-slate-100/80 px-2 py-1 text-[11px] font-semibold">{trend === "up" ? <TrendingUp className="size-3.5 text-emerald-500" /> : trend === "down" ? <TrendingDown className="size-3.5 text-rose-500" /> : <Activity className="size-3.5 text-slate-400" />}{trendValue}</div>}
        </div>
        <div className="relative mt-5">
          {loading ? <Skeleton className="h-9 w-28" /> : <p className="font-[Manrope,ui-sans-serif] text-3xl font-extrabold tracking-tight tabular-nums text-slate-950">{value ?? "—"}</p>}
          <p className="mt-1 font-[DM_Sans,ui-sans-serif] text-sm font-semibold text-slate-700">{title}</p>
          {subtext && <p className="mt-1 text-xs leading-5 text-slate-500">{subtext}</p>}
        </div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href} className="block">{body}</Link> : body;
}

function RevenueChart({ data }: { data: RevenueTrendMonth[] }) {
  if (!data?.length) return <div className="flex h-52 items-center justify-center text-sm text-slate-400">No revenue data available</div>;
  const max = Math.max(...data.map((d) => Math.max(...d.revenue.map((r) => Number(r.netRevenue)), 0)), 1);
  return (
    <div className="space-y-4">
      <div className="flex h-52 items-end gap-2 rounded-2xl bg-slate-50/70 px-3 pt-5">
        {data.map((month) => {
          const value = Number(month.revenue[0]?.netRevenue ?? 0);
          const height = Math.max((value / max) * 100, 5);
          return <div key={month.month} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
            <span className="opacity-0 transition-opacity group-hover:opacity-100 rounded-full bg-slate-950 px-2 py-1 text-[10px] font-bold text-white">₹{value.toLocaleString()}</span>
            <div className="w-full max-w-9 rounded-t-xl bg-gradient-to-t from-violet-600 via-fuchsia-500 to-cyan-400 shadow-lg shadow-violet-500/10 transition-all duration-500 group-hover:scale-x-110" style={{ height: `${height}%` }} />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{new Date(`${month.month}-01`).toLocaleDateString(undefined, { month: "short" })}</span>
          </div>;
        })}
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500"><span className="size-2 rounded-full bg-gradient-to-r from-violet-600 to-cyan-400" /> Net Revenue</div>
    </div>
  );
}

function AtRiskMembersList({ members }: { members: AtRiskMember[] }) {
  if (!members?.length) return <div className="flex flex-col items-center py-10 text-center"><CheckCircle2 className="size-9 text-emerald-500" /><p className="mt-3 text-sm font-bold text-slate-800">No active risk signals</p><p className="text-xs text-slate-500">No members have been inactive for 14+ days.</p></div>;
  return <div className="space-y-2">{members.slice(0, 5).map((m) => <Link key={m.id} href={`/members/${m.id}`} className="group flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white/70 p-3 transition-all hover:-translate-y-0.5 hover:border-amber-200 hover:bg-amber-50/40"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600"><AlertTriangle className="size-4" /></div><div><p className="text-sm font-bold text-slate-800">{m.firstName} {m.lastName}</p><p className="text-xs text-slate-500">{m.neverCheckedIn ? "Never checked in" : `${m.daysSinceLastVisit} days since last visit`}</p></div></div><ChevronRight className="size-4 text-slate-400 transition-transform group-hover:translate-x-1" /></Link>)}{members.length > 5 && <Link href="/members?filter=at-risk" className="flex items-center justify-center gap-1 py-2 text-xs font-bold text-violet-600">View all {members.length} at-risk members <ArrowRight className="size-3.5" /></Link>}</div>;
}

function TrainerWorkloadList({ trainers }: { trainers: TrainerWorkload[] }) {
  if (!trainers?.length) return <div className="py-10 text-center text-sm text-slate-500">No trainers assigned. Assign trainers to members to see workload.</div>;
  return <div className="space-y-2">{trainers.map((t) => <div key={t.trainerId} className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white/70 p-3"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600"><Dumbbell className="size-4" /></div><div><p className="text-sm font-bold text-slate-800">{t.trainerName}</p><p className="text-xs text-slate-500">{t.activeMembers} active members</p></div></div><div className="text-right"><p className="text-sm font-extrabold tabular-nums text-slate-900">{t.completedPtSessions}</p><p className="text-[10px] uppercase tracking-wider text-slate-400">sessions</p></div></div>)}</div>;
}

function StatusBreakdownChart({ data }: { data: { status: string; count: number }[] }) {
  if (!data?.length) return <div className="flex h-40 items-center justify-center text-sm text-slate-400">No member data available</div>;
  const total = data.reduce((s, x) => s + x.count, 0);
  const colors: Record<string, string> = { ACTIVE: "bg-emerald-500", INACTIVE: "bg-amber-400", FROZEN: "bg-sky-500", EXPIRED: "bg-rose-500", CANCELLED: "bg-slate-400" };
  return <div className="space-y-4"><div className="flex h-5 overflow-hidden rounded-full bg-slate-100">{data.map((x) => <div key={x.status} className={`${colors[x.status] || "bg-slate-400"} transition-all`} style={{ width: `${total ? (x.count / total) * 100 : 0}%` }} title={`${x.status}: ${x.count}`} />)}</div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{data.map((x) => <div key={x.status} className="flex items-center gap-2 text-xs"><span className={`size-2 rounded-full ${colors[x.status] || "bg-slate-400"}`} /><span className="font-medium text-slate-500">{x.status}</span><span className="ml-auto font-bold text-slate-800">{x.count}</span></div>)}</div></div>;
}

function SalesFunnelDisplay({ data }: { data: { totalLeads: number; wonLeads: number; conversionRatePct: number; followUps: { total: number; completed: number; completionRatePct: number } } | undefined }) {
  if (!data) return <Skeleton className="h-40 w-full" />;
  const won = data.totalLeads ? (data.wonLeads / data.totalLeads) * 100 : 0;
  return <div className="space-y-5"><div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Conversion rate</p><p className="mt-1 font-[Manrope] text-4xl font-extrabold tracking-tight text-slate-950">{data.conversionRatePct}%</p></div><Badge className="rounded-full px-3 py-1">{data.wonLeads} won</Badge></div><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400" style={{ width: `${won}%` }} /></div><div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-2xl bg-emerald-50 p-3"><p className="text-lg font-extrabold text-emerald-600">{data.wonLeads}</p><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Won</p></div><div className="rounded-2xl bg-rose-50 p-3"><p className="text-lg font-extrabold text-rose-600">{data.totalLeads - data.wonLeads}</p><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lost</p></div><div className="rounded-2xl bg-sky-50 p-3"><p className="text-lg font-extrabold text-sky-600">{data.totalLeads}</p><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</p></div></div><div className="border-t border-slate-200/70 pt-4"><div className="flex items-center justify-between text-xs"><span className="font-semibold text-slate-500">Follow-ups completed</span><span className="font-extrabold text-slate-800">{data.followUps.completed}/{data.followUps.total} · {data.followUps.completionRatePct}%</span></div></div></div>;
}

function IntelligenceSignal({ icon: Icon, title, copy, tone, href }: { icon: typeof BrainCircuit; title: string; copy: string; tone: "violet" | "amber" | "cyan" | "green"; href: string }) {
  const tones = { violet: "bg-violet-50 text-violet-600 border-violet-100", amber: "bg-amber-50 text-amber-600 border-amber-100", cyan: "bg-cyan-50 text-cyan-600 border-cyan-100", green: "bg-emerald-50 text-emerald-600 border-emerald-100" };
  return <Link href={href} className={`group rounded-3xl border p-4 transition-all hover:-translate-y-1 hover:shadow-lg ${tones[tone]}`}><div className="flex items-start gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/80"><Icon className="size-5" /></div><div className="min-w-0"><p className="text-sm font-extrabold text-slate-900">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{copy}</p></div><ArrowRight className="ml-auto size-4 shrink-0 opacity-50 transition-transform group-hover:translate-x-1" /></div></Link>;
}

export default function IntelligencePage() {
  const [branchId, setBranchId] = React.useState<string>("all");
  const [months, setMonths] = React.useState(6);
  const selectedBranch = branchId === "all" ? undefined : branchId;
  const branches = useBranches({ page: 1, pageSize: 100 });
  const revenue = useRevenueSummary({ branchId: selectedBranch });
  const trend = useRevenueTrend(months, selectedBranch);
  const atRisk = useAtRiskMembers(selectedBranch);
  const status = useMemberStatusBreakdown(selectedBranch);
  const sales = useSalesFunnel(selectedBranch);
  const trainers = useTrainerWorkload(selectedBranch);
  const inventory = useInventoryForecast();
  const revenueRows = revenue.data?.revenue ?? [];
  const outstanding = revenue.data?.outstanding?.reduce((s, x) => s + Number(x.outstandingBalance), 0) ?? 0;
  const lowStock = (inventory.data ?? []).filter((x) => x.lowStock).length;
  const refreshAll = () => { void Promise.all([revenue.refetch(), trend.refetch(), atRisk.refetch(), status.refetch(), sales.refetch(), trainers.refetch(), inventory.refetch()]); toast.success("Intelligence refreshed"); };
  const loading = revenue.isLoading && trend.isLoading;

  return (
    <main className="min-h-full bg-[radial-gradient(circle_at_8%_0%,rgba(139,92,246,0.13),transparent_30%),radial-gradient(circle_at_95%_10%,rgba(6,182,212,0.12),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <section className="relative overflow-hidden rounded-[36px] border border-white/80 bg-slate-950 px-6 py-8 text-white shadow-[0_30px_100px_-45px_rgba(15,23,42,0.65)] sm:px-9 lg:px-11">
          <div className="absolute -right-24 -top-32 size-96 rounded-full bg-violet-500/25 blur-3xl" /><div className="absolute bottom-0 right-1/3 size-72 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/70"><BrainCircuit className="size-3.5 text-cyan-300" /> Intelligence OS</div><h1 className="max-w-3xl font-[Manrope,ui-sans-serif] text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl lg:text-6xl">Know what is happening.<br /><span className="bg-gradient-to-r from-violet-300 via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent">Act before it matters.</span></h1><p className="mt-4 max-w-2xl font-[Inter,ui-sans-serif] text-sm leading-6 text-slate-300 sm:text-base">A decision layer for members, revenue, sales, trainers and inventory — preserving the full analytics surface while turning raw signals into clear next actions.</p></div>
            <div className="flex flex-wrap gap-2 lg:justify-end"><Select value={branchId} onValueChange={setBranchId}><SelectTrigger className="h-10 w-[180px] rounded-2xl border-white/10 bg-white/10 text-white"><SelectValue placeholder="All branches" /></SelectTrigger><SelectContent><SelectItem value="all">All branches</SelectItem>{(branches.data?.data ?? []).map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select><Select value={String(months)} onValueChange={(v) => setMonths(Number(v))}><SelectTrigger className="h-10 w-[120px] rounded-2xl border-white/10 bg-white/10 text-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="3">3 months</SelectItem><SelectItem value="6">6 months</SelectItem><SelectItem value="12">12 months</SelectItem></SelectContent></Select><Button onClick={refreshAll} variant="secondary" className="h-10 gap-2 rounded-2xl bg-white text-slate-900 hover:bg-white/90"><RefreshCw className="size-4" /> Refresh</Button></div>
          </div>
          <div className="relative mt-8 grid gap-2 sm:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-white/5 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Decision layer</p><p className="mt-1 text-sm font-semibold">Live operational signals</p></div><div className="rounded-2xl border border-white/10 bg-white/5 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Scope</p><p className="mt-1 text-sm font-semibold">Tenant + branch aware</p></div><div className="rounded-2xl border border-white/10 bg-white/5 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Mode</p><p className="mt-1 text-sm font-semibold">Explainable intelligence</p></div></div>
        </section>

        <section><SectionEyebrow icon={Gauge}>Executive signal layer</SectionEyebrow><h2 className="font-[Manrope,ui-sans-serif] text-2xl font-extrabold tracking-tight text-slate-950">The numbers that move the business</h2><div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><KpiCard title="Net revenue" value={revenueRows[0]?.netRevenue ? `₹${Number(revenueRows[0].netRevenue).toLocaleString()}` : undefined} subtext="Current selected period" icon={DollarSign} accent="green" loading={revenue.isLoading} /><KpiCard title="Outstanding balance" value={`₹${outstanding.toLocaleString()}`} subtext="Memberships with balance" icon={CreditCard} accent="amber" loading={revenue.isLoading} /><KpiCard title="At-risk members" value={atRisk.data?.length} subtext="14+ day inactivity signal" icon={AlertTriangle} accent="red" loading={atRisk.isLoading} href="/members?filter=at-risk" /><KpiCard title="Sales conversion" value={sales.data ? `${sales.data.conversionRatePct}%` : undefined} subtext="Lead → won" icon={Target} accent="cyan" loading={sales.isLoading} /><KpiCard title="Low-stock signals" value={lowStock} subtext="Inventory forecast" icon={Package} accent="violet" loading={inventory.isLoading} href="/inventory" /></div></section>

        <section className="grid gap-5 xl:grid-cols-[1.55fr_1fr]"><Card className={`${glass} rounded-[30px]`}><CardHeader className="flex flex-row items-end justify-between pb-3"><div><SectionEyebrow icon={TrendingUp}>Financial intelligence</SectionEyebrow><CardTitle className="font-[Manrope] text-xl font-extrabold tracking-tight">Revenue trajectory</CardTitle><p className="mt-1 text-xs text-slate-500">Net revenue across the selected horizon.</p></div><Badge variant="secondary" className="rounded-full">{months}M view</Badge></CardHeader><CardContent><RevenueChart data={trend.data ?? []} /></CardContent></Card><Card className={`${glass} rounded-[30px]`}><CardHeader><SectionEyebrow icon={AlertTriangle}>Member intelligence</SectionEyebrow><CardTitle className="font-[Manrope] text-xl font-extrabold tracking-tight">At-risk member queue</CardTitle><p className="mt-1 text-xs text-slate-500">The first people your team should look at.</p></CardHeader><CardContent><AtRiskMembersList members={atRisk.data ?? []} /></CardContent></Card></section>

        <section><div className="mb-4 flex items-end justify-between"><div><SectionEyebrow icon={Zap}>AI decision surface</SectionEyebrow><h2 className="font-[Manrope] text-2xl font-extrabold tracking-tight text-slate-950">From signal to action</h2></div><Link href="/members" className="hidden items-center gap-1 text-xs font-bold text-violet-600 sm:flex">Open Member OS <ArrowRight className="size-3.5" /></Link></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><IntelligenceSignal icon={BrainCircuit} title="Risk & churn" copy="Prioritize members whose engagement is weakening before renewal becomes a problem." tone="violet" href="/members?filter=at-risk" /><IntelligenceSignal icon={Users} title="Smart segmentation" copy="Turn member behavior into focused cohorts for retention and growth workflows." tone="cyan" href="/members" /><IntelligenceSignal icon={CreditCard} title="Revenue recovery" copy="Surface balances and payment signals that need attention from the team." tone="amber" href="/finance" /><IntelligenceSignal icon={Zap} title="Recommended actions" copy="Move from analytics into operational follow-up instead of stopping at a dashboard." tone="green" href="/members" /></div></section>

        <section className="grid gap-5 xl:grid-cols-3"><Card className={`${glass} rounded-[30px]`}><CardHeader><SectionEyebrow icon={Users}>Member health</SectionEyebrow><CardTitle className="font-[Manrope] text-lg font-extrabold">Status distribution</CardTitle></CardHeader><CardContent><StatusBreakdownChart data={status.data ?? []} /></CardContent></Card><Card className={`${glass} rounded-[30px]`}><CardHeader><SectionEyebrow icon={Target}>Sales OS</SectionEyebrow><CardTitle className="font-[Manrope] text-lg font-extrabold">Conversion funnel</CardTitle></CardHeader><CardContent><SalesFunnelDisplay data={sales.data} /></CardContent></Card><Card className={`${glass} rounded-[30px]`}><CardHeader><SectionEyebrow icon={Dumbbell}>Trainer intelligence</SectionEyebrow><CardTitle className="font-[Manrope] text-lg font-extrabold">Workload</CardTitle></CardHeader><CardContent><TrainerWorkloadList trainers={trainers.data ?? []} /></CardContent></Card></section>

        <section className="grid gap-5 lg:grid-cols-[1fr_1fr]"><Card className={`${glass} rounded-[30px]`}><CardHeader><div className="flex items-center justify-between"><div><SectionEyebrow icon={Package}>Inventory intelligence</SectionEyebrow><CardTitle className="font-[Manrope] text-lg font-extrabold">Stockout forecast</CardTitle></div><Link href="/inventory"><Button variant="ghost" size="sm" className="gap-1 rounded-xl">Open inventory <ChevronRight className="size-4" /></Button></Link></div></CardHeader><CardContent>{inventory.isLoading ? <Skeleton className="h-40 w-full" /> : (inventory.data ?? []).length ? <div className="space-y-2">{(inventory.data ?? []).slice(0, 6).map((item) => <div key={item.productId} className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white/70 p-3"><div className="flex min-w-0 items-center gap-3"><div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${item.lowStock ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-500"}`}><Package className="size-4" /></div><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800">{item.productName}</p><p className="text-xs text-slate-500">{item.currentStock} units on hand</p></div></div><div className="text-right">{item.daysUntilStockout == null ? <span className="text-xs font-semibold text-slate-400">No forecast</span> : <><p className={`text-sm font-extrabold ${item.daysUntilStockout <= 7 ? "text-rose-600" : "text-slate-800"}`}>{item.daysUntilStockout}d</p><p className="text-[10px] uppercase tracking-wider text-slate-400">stockout</p></>}</div></div>)}</div> : <div className="py-10 text-center text-sm text-slate-500">No inventory forecast data available.</div>}</CardContent></Card><Card className={`${glass} rounded-[30px] overflow-hidden`}><CardContent className="relative p-0"><div className="absolute -right-16 -top-16 size-56 rounded-full bg-violet-500/20 blur-3xl" /><div className="relative p-7 sm:p-9"><div className="mb-5 inline-flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-500/20"><Sparkles className="size-5" /></div><SectionEyebrow icon={Layers3}>Intelligence architecture</SectionEyebrow><h3 className="font-[Manrope] text-2xl font-extrabold tracking-tight text-slate-950">A command layer, not another report.</h3><p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">Risk Engine, Analytics, Churn & Retention, AI Insights, Recommended Actions, Automation and Smart Segmentation are designed to sit above the existing Member OS — preserving the underlying operational system while making decisions faster.</p><div className="mt-6 grid gap-2 sm:grid-cols-2"><div className="rounded-2xl bg-slate-50 p-3 text-xs font-semibold text-slate-600"><Gauge className="mb-2 size-4 text-violet-500" />Explainable signals</div><div className="rounded-2xl bg-slate-50 p-3 text-xs font-semibold text-slate-600"><BarChart3 className="mb-2 size-4 text-cyan-500" />Live analytics</div><div className="rounded-2xl bg-slate-50 p-3 text-xs font-semibold text-slate-600"><Zap className="mb-2 size-4 text-amber-500" />Recommended actions</div><div className="rounded-2xl bg-slate-50 p-3 text-xs font-semibold text-slate-600"><RefreshCw className="mb-2 size-4 text-emerald-500" />Automation-ready</div></div></div></CardContent></Card></section>

        <footer className="flex flex-col gap-2 border-t border-slate-200/70 px-1 py-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between"><span>Intelligence is contextual to the selected tenant and branch scope.</span><span className="font-semibold">{loading ? "Updating signals…" : "Signals ready"}</span></footer>
      </div>
    </main>
  );
}

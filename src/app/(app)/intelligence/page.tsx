"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  DollarSign,
  Dumbbell,
  Filter,
  Package,
  RefreshCw,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  WalletCards,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAtRiskMembers,
  useInventoryForecast,
  useMemberStatusBreakdown,
  useRevenueSummary,
  useRevenueTrend,
  useSalesFunnel,
  useSalesSourcePerformance,
  useTrainerWorkload,
  type AtRiskMember,
  type InventoryForecast,
  type RevenueSummary,
  type RevenueTrendMonth,
  type SalesFunnel,
  type SalesSourcePerformance,
  type TrainerWorkload,
} from "@/lib/hooks/use-analytics";
import { useBranches } from "@/lib/hooks/use-branches";

const glass = "border-white/70 bg-white/75 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.38)] backdrop-blur-2xl";

function formatMoney(value: string | number | undefined, currency = "INR") {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
  trend,
  href,
  loading,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: typeof Activity;
  tone: "violet" | "cyan" | "emerald" | "amber" | "rose" | "blue";
  trend?: string;
  href?: string;
  loading?: boolean;
}) {
  const tones = {
    violet: "from-violet-500/18 via-fuchsia-500/10 to-transparent text-violet-700",
    cyan: "from-cyan-500/18 via-sky-500/10 to-transparent text-cyan-700",
    emerald: "from-emerald-500/18 via-teal-500/10 to-transparent text-emerald-700",
    amber: "from-amber-500/18 via-orange-500/10 to-transparent text-amber-700",
    rose: "from-rose-500/18 via-pink-500/10 to-transparent text-rose-700",
    blue: "from-blue-500/18 via-indigo-500/10 to-transparent text-blue-700",
  };
  const body = (
    <Card className={`group relative overflow-hidden rounded-[28px] border transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_80px_-38px_rgba(15,23,42,0.45)] ${glass}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${tones[tone]} opacity-90`} />
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-white/80 ring-1 ring-black/5 shadow-sm">
            <Icon className="size-5" />
          </div>
          {trend ? <Badge variant="secondary" className="rounded-full bg-white/75 px-2.5 py-1 text-[11px] font-semibold">{trend}</Badge> : null}
        </div>
        <div className="mt-6">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
          {loading ? <Skeleton className="mt-2 h-9 w-32" /> : <p className="mt-1 font-sans text-3xl font-extrabold tracking-[-0.04em] text-slate-950">{value}</p>}
          <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href} className="block">{body}</Link> : body;
}

function SectionHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-violet-600">{eyebrow}</p>
        <h2 className="mt-1 font-sans text-xl font-extrabold tracking-[-0.035em] text-slate-950">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

function RevenueChart({ data }: { data: RevenueTrendMonth[] | undefined }) {
  if (!data?.length) return <div className="flex h-56 items-center justify-center text-sm text-slate-400">No revenue data available</div>;
  const values = data.map((m) => Number(m.revenue?.[0]?.netRevenue ?? 0));
  const max = Math.max(...values, 1);
  return (
    <div className="space-y-4">
      <div className="flex h-56 items-end gap-2 sm:gap-3">
        {data.map((month, index) => {
          const value = values[index] ?? 0;
          const height = Math.max((value / max) * 100, 4);
          const label = new Date(`${month.month}-01`).toLocaleDateString(undefined, { month: "short" });
          return (
            <div key={month.month} className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
              <div className="relative flex h-44 w-full items-end justify-center">
                <div className="absolute bottom-0 h-full w-px bg-slate-100" />
                <div className="relative w-full max-w-10 rounded-t-2xl bg-gradient-to-t from-violet-600 via-indigo-500 to-cyan-400 shadow-[0_14px_30px_-18px_rgba(79,70,229,0.9)] transition-all duration-500 group-hover:from-violet-500 group-hover:to-cyan-300" style={{ height: `${height}%` }}>
                  <span className="absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-950 px-2 py-1 font-mono text-[9px] text-white group-hover:block">{formatMoney(value)}</span>
                </div>
              </div>
              <span className="font-mono text-[10px] font-semibold uppercase text-slate-400">{label}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-xs text-slate-500">Net revenue</span>
        <span className="font-mono text-xs font-semibold text-slate-700">{formatMoney(values.reduce((a, b) => a + b, 0))}</span>
      </div>
    </div>
  );
}

function StatusBreakdown({ data }: { data: { status: string; count: number }[] | undefined }) {
  if (!data?.length) return <div className="py-12 text-center text-sm text-slate-400">No member data available</div>;
  const total = data.reduce((sum, item) => sum + item.count, 0) || 1;
  const colors: Record<string, string> = { ACTIVE: "bg-emerald-500", INACTIVE: "bg-amber-400", FROZEN: "bg-sky-500", EXPIRED: "bg-rose-500", CANCELLED: "bg-slate-400" };
  return (
    <div className="space-y-5">
      <div className="flex h-5 overflow-hidden rounded-full bg-slate-100 p-0.5">
        {data.map((item) => <div key={item.status} className={`${colors[item.status] ?? "bg-slate-400"} first:rounded-l-full last:rounded-r-full transition-all`} style={{ width: `${(item.count / total) * 100}%` }} title={`${item.status}: ${item.count}`} />)}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {data.map((item) => (
          <div key={item.status} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
            <div className="flex items-center gap-2"><span className={`size-2 rounded-full ${colors[item.status] ?? "bg-slate-400"}`} /><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{item.status}</span></div>
            <p className="mt-1 text-xl font-extrabold tracking-tight text-slate-900">{item.count}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AtRiskList({ members }: { members: AtRiskMember[] | undefined }) {
  if (!members?.length) return <div className="flex flex-col items-center justify-center py-12 text-center"><CheckCircle2 className="size-9 text-emerald-500" /><p className="mt-3 text-sm font-bold text-slate-800">No immediate inactivity signals</p><p className="mt-1 text-xs text-slate-500">No members have been inactive for 14+ days.</p></div>;
  return <div className="space-y-2">{members.slice(0, 6).map((member) => <Link key={member.id} href={`/members/${member.id}`} className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-white/80 p-3 transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md"><div className="flex min-w-0 items-center gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"><AlertTriangle className="size-4" /></div><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800">{member.firstName} {member.lastName}</p><p className="text-xs text-slate-500">{member.neverCheckedIn ? "Never checked in" : `${member.daysSinceLastVisit} days since last visit`}</p></div></div><ChevronRight className="size-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-700" /></Link>)}{members.length > 6 ? <Link href="/members?filter=at-risk" className="flex items-center justify-center gap-1 pt-2 text-xs font-bold text-violet-600">View all {members.length} at-risk members <ArrowRight className="size-3.5" /></Link> : null}</div>;
}

function TrainerList({ trainers }: { trainers: TrainerWorkload[] | undefined }) {
  if (!trainers?.length) return <div className="py-12 text-center text-sm text-slate-400">No trainers assigned</div>;
  return <div className="space-y-2">{trainers.map((trainer) => <div key={trainer.trainerId} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white/80 p-3"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-600"><Dumbbell className="size-4" /></div><div><p className="text-sm font-bold text-slate-800">{trainer.trainerName}</p><p className="text-xs text-slate-500">{trainer.activeMembers} active members · {trainer.pendingPtSessions} pending</p></div></div><div className="text-right"><p className="font-mono text-sm font-bold text-slate-800">{trainer.completedPtSessions}</p><p className="text-[10px] uppercase tracking-wider text-slate-400">completed</p></div></div>)}</div>;
}

function SalesFunnel({ data }: { data: SalesFunnel | undefined }) {
  if (!data) return <Skeleton className="h-48 w-full rounded-2xl" />;
  const won = data.wonLeads;
  const lost = data.lostLeads ?? Math.max(data.totalLeads - won, 0);
  const conversion = Math.min(Math.max(Number(data.conversionRatePct) || 0, 0), 100);
  const follow = Math.min(Math.max(Number(data.followUps.completionRatePct) || 0, 0), 100);
  return <div className="space-y-5"><div className="flex items-center justify-between"><div><p className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">Conversion</p><p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">{conversion}%</p></div><div className="flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-8 ring-emerald-50/50"><Target className="size-6" /></div></div><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400" style={{ width: `${conversion}%` }} /></div><div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-2xl bg-emerald-50 p-3"><p className="text-lg font-extrabold text-emerald-700">{won}</p><p className="text-[10px] uppercase tracking-wider text-slate-500">Won</p></div><div className="rounded-2xl bg-rose-50 p-3"><p className="text-lg font-extrabold text-rose-700">{lost}</p><p className="text-[10px] uppercase tracking-wider text-slate-500">Lost</p></div><div className="rounded-2xl bg-sky-50 p-3"><p className="text-lg font-extrabold text-sky-700">{data.totalLeads}</p><p className="text-[10px] uppercase tracking-wider text-slate-500">Total</p></div></div><div className="border-t border-slate-100 pt-4"><div className="flex items-center justify-between text-xs"><span className="text-slate-500">Follow-up completion</span><span className="font-mono font-bold text-slate-800">{follow}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-500" style={{ width: `${follow}%` }} /></div><p className="mt-2 text-[11px] text-slate-400">{data.followUps.completed} of {data.followUps.total} follow-ups completed</p></div></div>;
}

function SourcePerformance({ data }: { data: SalesSourcePerformance[] | undefined }) {
  if (!data?.length) return <div className="py-10 text-center text-sm text-slate-400">No source performance data available</div>;
  return <div className="space-y-2">{data.slice(0, 6).map((item) => <div key={item.source} className="rounded-2xl border border-slate-100 bg-white/70 p-3"><div className="flex items-center justify-between gap-3"><p className="truncate text-sm font-bold text-slate-800">{item.source || "Unknown"}</p><Badge variant="secondary" className="rounded-full">{Number(item.conversionRatePct).toFixed(1)}%</Badge></div><div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500"><span>{item.totalLeads} leads</span><span>·</span><span>{item.wonLeads} won</span><span>·</span><span>{item.lostLeads} lost</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${Math.min(Math.max(Number(item.conversionRatePct), 0), 100)}%` }} /></div></div>)}</div>;
}

function InventoryList({ items }: { items: InventoryForecast[] | undefined }) {
  if (!items?.length) return <div className="py-12 text-center text-sm text-slate-400">No inventory forecast available</div>;
  return <div className="space-y-2">{items.slice(0, 6).map((item) => <div key={item.productId} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white/80 p-3"><div className="flex min-w-0 items-center gap-3"><div className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ${item.lowStock ? "bg-rose-50 text-rose-600" : "bg-cyan-50 text-cyan-600"}`}><Package className="size-4" /></div><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800">{item.productName}</p><p className="text-xs text-slate-500">{item.currentStock} units · {item.lowStock ? "Low stock" : "Healthy stock"}</p></div></div><div className="text-right"><p className={`font-mono text-sm font-bold ${item.daysUntilStockout !== null && item.daysUntilStockout <= 7 ? "text-rose-600" : "text-slate-800"}`}>{item.daysUntilStockout === null ? "—" : `${item.daysUntilStockout}d`}</p><p className="text-[10px] uppercase tracking-wider text-slate-400">stockout</p></div></div>)}</div>;
}

export default function IntelligencePage() {
  const [branchId, setBranchId] = React.useState("all");
  const [months, setMonths] = React.useState("6");
  const branch = branchId === "all" ? undefined : branchId;
  const { data: branches } = useBranches({ page: 1, pageSize: 100 });
  const revenue = useRevenueSummary({ branchId: branch });
  const trend = useRevenueTrend(Number(months), branch);
  const atRisk = useAtRiskMembers(branch);
  const status = useMemberStatusBreakdown(branch);
  const sales = useSalesFunnel(branch);
  const sources = useSalesSourcePerformance(branch);
  const trainers = useTrainerWorkload(branch);
  const inventory = useInventoryForecast();

  const revenueRow = revenue.data?.revenue?.[0];
  const outstanding = revenue.data?.outstanding?.[0];
  const totalMembers = status.data?.reduce((sum, item) => sum + item.count, 0) ?? 0;
  const activeMembers = status.data?.find((item) => item.status === "ACTIVE")?.count ?? 0;
  const riskCount = atRisk.data?.length ?? 0;
  const lowStockCount = inventory.data?.filter((item) => item.lowStock).length ?? 0;
  const refresh = () => {
    void Promise.all([revenue.refetch(), trend.refetch(), atRisk.refetch(), status.refetch(), sales.refetch(), sources.refetch(), trainers.refetch(), inventory.refetch()]);
    toast.success("Intelligence refreshed");
  };

  return (
    <main className="min-h-full overflow-hidden bg-[radial-gradient(circle_at_10%_0%,rgba(124,58,237,0.13),transparent_28%),radial-gradient(circle_at_90%_8%,rgba(6,182,212,0.12),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#f5f7fb_55%,#eef2f7_100%)] text-slate-950">
      <div className="mx-auto max-w-[1600px] space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section className="relative overflow-hidden rounded-[36px] border border-white/80 bg-slate-950 p-6 text-white shadow-[0_40px_120px_-55px_rgba(15,23,42,0.8)] sm:p-8 lg:p-10">
          <div className="absolute -right-24 -top-28 size-80 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute -bottom-36 left-1/3 size-96 rounded-full bg-violet-500/25 blur-3xl" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2"><Badge className="rounded-full border border-white/15 bg-white/10 font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-200 hover:bg-white/10"><Sparkles className="mr-1.5 size-3" /> Intelligence OS</Badge><span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">Decision layer · live data</span></div>
              <h1 className="mt-5 font-sans text-4xl font-extrabold tracking-[-0.055em] sm:text-5xl lg:text-6xl">See the gym.<br /><span className="bg-gradient-to-r from-white via-cyan-100 to-violet-200 bg-clip-text text-transparent">Decide what happens next.</span></h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">A premium intelligence cockpit for revenue, member health, sales performance, trainer capacity, and inventory signals — without replacing any of the underlying analytics.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:min-w-[260px]">
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-xl"><Filter className="ml-2 size-4 text-cyan-200" /><Select value={branchId} onValueChange={setBranchId}><SelectTrigger className="h-9 border-0 bg-transparent text-white shadow-none focus:ring-0"><SelectValue placeholder="All branches" /></SelectTrigger><SelectContent>{<SelectItem value="all">All branches</SelectItem>}{branches?.data?.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-xl"><BarChart3 className="ml-2 size-4 text-violet-200" /><Select value={months} onValueChange={setMonths}><SelectTrigger className="h-9 border-0 bg-transparent text-white shadow-none focus:ring-0"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="3">Last 3 months</SelectItem><SelectItem value="6">Last 6 months</SelectItem><SelectItem value="12">Last 12 months</SelectItem></SelectContent></Select><Button size="icon" variant="ghost" onClick={refresh} className="text-white hover:bg-white/10 hover:text-white" title="Refresh intelligence"><RefreshCw className="size-4" /></Button></div>
            </div>
          </div>
          <div className="relative mt-8 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"><p className="font-mono text-[9px] uppercase tracking-widest text-white/40">Decision signals</p><p className="mt-1 text-2xl font-extrabold">{riskCount + lowStockCount}</p><p className="text-xs text-white/50">member + inventory attention</p></div><div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"><p className="font-mono text-[9px] uppercase tracking-widest text-white/40">Member health</p><p className="mt-1 text-2xl font-extrabold">{totalMembers ? Math.round((activeMembers / totalMembers) * 100) : 0}%</p><p className="text-xs text-white/50">active member ratio</p></div><div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"><p className="font-mono text-[9px] uppercase tracking-widest text-white/40">Cash visibility</p><p className="mt-1 text-2xl font-extrabold">{formatMoney(revenueRow?.netRevenue)}</p><p className="text-xs text-white/50">current net revenue snapshot</p></div></div>
        </section>

        <section>
          <SectionHeader eyebrow="01 · pulse" title="Executive signal layer" description="The fastest read on financial health, member health, sales velocity, and operational pressure." />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <MetricCard label="Net revenue" value={formatMoney(revenueRow?.netRevenue)} detail={`${revenueRow?.paymentCount ?? 0} recorded payments`} icon={DollarSign} tone="violet" loading={revenue.isLoading} />
            <MetricCard label="Outstanding" value={formatMoney(outstanding?.outstandingBalance)} detail={`${outstanding?.membershipsWithBalance ?? 0} memberships with balance`} icon={WalletCards} tone="rose" loading={revenue.isLoading} href="/finance" />
            <MetricCard label="Members" value={totalMembers} detail={`${activeMembers} currently active`} icon={Users} tone="cyan" loading={status.isLoading} href="/members" />
            <MetricCard label="At risk" value={riskCount} detail="14+ day inactivity signal" icon={AlertTriangle} tone="amber" loading={atRisk.isLoading} href="/members?filter=at-risk" />
            <MetricCard label="Conversion" value={`${Number(sales.data?.conversionRatePct ?? 0)}%`} detail={`${sales.data?.wonLeads ?? 0} won leads`} icon={TrendingUp} tone="emerald" loading={sales.isLoading} href="/sales" />
            <MetricCard label="Low stock" value={lowStockCount} detail="Products requiring attention" icon={Boxes} tone="blue" loading={inventory.isLoading} href="/inventory" />
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.55fr_0.9fr]">
          <Card className={`rounded-[30px] ${glass}`}><CardHeader className="border-b border-slate-100/80 pb-4"><div className="flex items-center justify-between gap-4"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600">02 · finance</p><CardTitle className="mt-1 text-xl font-extrabold tracking-tight">Revenue trajectory</CardTitle><p className="mt-1 text-xs text-slate-500">Net revenue by month, using the selected branch scope.</p></div><Badge variant="secondary" className="rounded-full bg-violet-50 text-violet-700">{months}M view</Badge></div></CardHeader><CardContent className="p-5"><RevenueChart data={trend.data} /></CardContent></Card>
          <Card className={`rounded-[30px] ${glass}`}><CardHeader className="border-b border-slate-100/80 pb-4"><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-600">03 · member health</p><CardTitle className="mt-1 text-xl font-extrabold tracking-tight">Member status mix</CardTitle></CardHeader><CardContent className="p-5"><StatusBreakdown data={status.data} /></CardContent></Card>
        </section>

        <section>
          <SectionHeader eyebrow="04 · attention queue" title="Signals that need a decision" description="Turn analytics into action without leaving the intelligence workspace." action={<Link href="/members"><Button variant="outline" className="rounded-full bg-white/70">Open Members <ArrowRight className="ml-2 size-4" /></Button></Link>} />
          <div className="grid gap-5 lg:grid-cols-2">
            <Card className={`rounded-[30px] ${glass}`}><CardHeader><div className="flex items-center justify-between"><div><CardTitle className="text-lg font-extrabold">At-risk members</CardTitle><p className="mt-1 text-xs text-slate-500">Members with 14+ days of inactivity.</p></div><div className="flex size-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"><AlertTriangle className="size-5" /></div></div></CardHeader><CardContent className="pt-0"><AtRiskList members={atRisk.data} /></CardContent></Card>
            <Card className={`rounded-[30px] ${glass}`}><CardHeader><div className="flex items-center justify-between"><div><CardTitle className="text-lg font-extrabold">Trainer workload</CardTitle><p className="mt-1 text-xs text-slate-500">Active members and PT session pressure.</p></div><div className="flex size-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-600"><Dumbbell className="size-5" /></div></div></CardHeader><CardContent className="pt-0"><TrainerList trainers={trainers.data} /></CardContent></Card>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <Card className={`rounded-[30px] ${glass}`}><CardHeader><div className="flex items-center justify-between"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">05 · sales</p><CardTitle className="mt-1 text-xl font-extrabold tracking-tight">Sales funnel</CardTitle><p className="mt-1 text-xs text-slate-500">Lead conversion and follow-up execution.</p></div><CreditCard className="size-5 text-emerald-600" /></div></CardHeader><CardContent><SalesFunnel data={sales.data} /></CardContent></Card>
          <Card className={`rounded-[30px] ${glass}`}><CardHeader><div className="flex items-center justify-between"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600">06 · acquisition</p><CardTitle className="mt-1 text-xl font-extrabold tracking-tight">Source performance</CardTitle><p className="mt-1 text-xs text-slate-500">Which lead sources are producing conversion.</p></div><Zap className="size-5 text-violet-600" /></div></CardHeader><CardContent><SourcePerformance data={sources.data} /></CardContent></Card>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <Card className={`rounded-[30px] ${glass}`}><CardHeader><div className="flex items-center justify-between"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-600">07 · inventory</p><CardTitle className="mt-1 text-xl font-extrabold tracking-tight">Inventory forecast</CardTitle><p className="mt-1 text-xs text-slate-500">Current stock and projected stockout pressure.</p></div><Package className="size-5 text-cyan-600" /></div></CardHeader><CardContent><InventoryList items={inventory.data} /></CardContent></Card>
          <Card className={`rounded-[30px] ${glass}`}><CardHeader><div className="flex items-center justify-between"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-rose-600">08 · cash intelligence</p><CardTitle className="mt-1 text-xl font-extrabold tracking-tight">Revenue quality</CardTitle><p className="mt-1 text-xs text-slate-500">Gross, refunds, membership mix, and data-computability notes.</p></div><WalletCards className="size-5 text-rose-600" /></div></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gross revenue</p><p className="mt-1 text-xl font-extrabold">{formatMoney(revenueRow?.grossRevenue)}</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Refunded</p><p className="mt-1 text-xl font-extrabold text-rose-600">{formatMoney(revenueRow?.refunded)}</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Membership revenue</p><p className="mt-1 text-xl font-extrabold">{formatMoney(revenueRow?.membershipRevenue)}</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Other revenue</p><p className="mt-1 text-xl font-extrabold">{formatMoney(revenueRow?.otherRevenue)}</p></div></div>{revenue.data?.notComputable?.length ? <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-center gap-2"><AlertTriangle className="size-4 text-amber-600" /><p className="text-xs font-bold text-amber-800">Data quality notes</p></div><div className="mt-2 space-y-1">{revenue.data.notComputable.map((item) => <p key={item.key} className="text-xs text-amber-700"><span className="font-semibold">{item.key}:</span> {item.reason}</p>)}</div></div> : null}</CardContent></Card>
        </section>

        <section className="rounded-[30px] border border-slate-200/80 bg-white/55 p-5 shadow-sm backdrop-blur-xl sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-500/20"><Sparkles className="size-5" /></div><div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600">Next layer</p><h3 className="text-lg font-extrabold tracking-tight text-slate-900">Member Intelligence OS</h3><p className="text-xs text-slate-500">Risk, churn, recommendations, automation, and smart segmentation build on this analytics foundation.</p></div></div><Link href="/members"><Button className="rounded-full bg-slate-950 text-white hover:bg-slate-800">Open Member Command Center <ArrowRight className="ml-2 size-4" /></Button></Link></div></section>
      </div>
    </main>
  );
}

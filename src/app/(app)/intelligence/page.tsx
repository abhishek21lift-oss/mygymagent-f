"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Boxes,
  Calendar,
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
  useMembershipLifecycle,
  useRevenueSummary,
  useRevenueTrend,
  useSalesFunnel,
  useSalesSourcePerformance,
  useTrainerWorkload,
  type AtRiskMember,
  type InventoryForecast,
  type MembershipLifecycleAnalytics,
  type RevenueTrendMonth,
  type SalesFunnel,
  type SalesSourcePerformance,
  type TrainerWorkload,
} from "@/lib/hooks/use-analytics";
import { useBranches } from "@/lib/hooks/use-branches";
import { PageHero } from "@/components/shared/page-hero";

function formatMoney(value: string | number | undefined, currency = "INR") {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

type MetricTone = "violet" | "cyan" | "emerald" | "amber" | "rose" | "blue";

const METRIC_TONES: Record<MetricTone, { bar: string; tile: string; ring: string }> = {
  violet: { bar: "from-violet-600 via-purple-600 to-fuchsia-600", tile: "from-violet-600 to-fuchsia-600 shadow-violet-500/30", ring: "hover:border-violet-200 hover:shadow-violet-500/10" },
  cyan: { bar: "from-cyan-400 via-sky-500 to-blue-600", tile: "from-cyan-500 to-blue-600 shadow-cyan-500/30", ring: "hover:border-cyan-200 hover:shadow-cyan-500/10" },
  emerald: { bar: "from-emerald-400 via-teal-500 to-green-600", tile: "from-emerald-500 to-teal-600 shadow-emerald-500/30", ring: "hover:border-emerald-200 hover:shadow-emerald-500/10" },
  amber: { bar: "from-amber-400 to-orange-500", tile: "from-amber-500 to-orange-600 shadow-amber-500/30", ring: "hover:border-amber-200 hover:shadow-amber-500/10" },
  rose: { bar: "from-rose-500 via-red-500 to-orange-500", tile: "from-rose-500 to-orange-500 shadow-rose-500/30", ring: "hover:border-rose-200 hover:shadow-rose-500/10" },
  blue: { bar: "from-blue-600 via-indigo-600 to-violet-600", tile: "from-blue-600 to-indigo-600 shadow-blue-500/30", ring: "hover:border-blue-200 hover:shadow-blue-500/10" },
};

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
  detail?: string;
  icon: typeof Activity;
  tone: MetricTone;
  trend?: string;
  href?: string;
  loading?: boolean;
}) {
  const t = METRIC_TONES[tone];
  const body = (
    <Card className={`group relative overflow-hidden border-white/90 bg-white/85 shadow-[0_20px_60px_-38px_rgba(79,70,229,.35)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 ${t.ring}`}>
      <span className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${t.bar}`} aria-hidden="true" />
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between gap-4">
          <span className={`flex size-11 items-center justify-center rounded-[15px] bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${t.tile}`}>
            <Icon className="size-5" aria-hidden="true" />
          </span>
          {trend ? <Badge variant="secondary" className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-bold ring-1 ring-stone-200/60">{trend}</Badge> : null}
        </div>
        <div className="mt-5">
          <p className="text-[10px] font-black uppercase tracking-[.18em] text-stone-500">{label}</p>
          {loading ? <Skeleton className="mt-2 h-9 w-32 rounded-xl" /> : <p className="mt-1 text-3xl font-black tracking-tight text-stone-950 tabular-nums">{value}</p>}
          {detail ? <p className="mt-1 text-xs font-medium text-stone-600">{detail}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href} className="block min-h-11 rounded-[22px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">{body}</Link> : body;
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-stone-950">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function RevenueChart({ data }: { data: RevenueTrendMonth[] | undefined }) {
  if (!data?.length) return <div className="flex h-56 items-center justify-center rounded-[20px] border border-dashed border-stone-200 bg-stone-50/60 p-6 text-center text-sm font-medium text-stone-600">No revenue data available</div>;
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
                <div className="absolute bottom-0 h-full w-px bg-stone-100" aria-hidden="true" />
                <div className="relative w-full max-w-10 rounded-t-2xl bg-gradient-to-t from-violet-600 via-indigo-500 to-cyan-400 shadow-[0_14px_30px_-18px_rgba(79,70,229,0.9)] transition-all duration-500 group-hover:from-violet-500 group-hover:to-cyan-300" style={{ height: `${height}%` }}>
                  <span className="absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-stone-950 px-2 py-1 font-mono text-[9px] text-white group-hover:block">{formatMoney(value)}</span>
                </div>
              </div>
              <span className="font-mono text-[10px] font-semibold uppercase text-stone-500">{label}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between border-t border-stone-100 pt-3">
        <span className="text-xs font-medium text-stone-600">Net revenue</span>
        <span className="font-mono text-xs font-bold text-stone-900">{formatMoney(values.reduce((a, b) => a + b, 0))}</span>
      </div>
    </div>
  );
}

function StatusBreakdown({ data }: { data: { status: string; count: number }[] | undefined }) {
  if (!data?.length) return <div className="py-12 text-center text-sm font-medium text-stone-600">No member data available</div>;
  const total = data.reduce((sum, item) => sum + item.count, 0) || 1;
  const colors: Record<string, string> = { ACTIVE: "bg-emerald-500", INACTIVE: "bg-amber-400", FROZEN: "bg-sky-500", EXPIRED: "bg-rose-500", CANCELLED: "bg-stone-400" };
  return (
    <div className="space-y-5">
      <div className="flex h-5 overflow-hidden rounded-full bg-stone-100 p-0.5">
        {data.map((item) => <div key={item.status} className={`${colors[item.status] ?? "bg-stone-400"} first:rounded-l-full last:rounded-r-full transition-all`} style={{ width: `${(item.count / total) * 100}%` }} title={`${item.status}: ${item.count}`} />)}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {data.map((item) => (
          <div key={item.status} className="rounded-2xl border border-stone-100 bg-stone-50/70 p-3">
            <div className="flex items-center gap-2"><span className={`size-2 rounded-full ${colors[item.status] ?? "bg-stone-400"}`} aria-hidden="true" /><span className="text-[10px] font-bold uppercase tracking-wider text-stone-600">{item.status}</span></div>
            <p className="mt-1 text-xl font-black tracking-tight text-stone-900">{item.count}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AtRiskList({ members }: { members: AtRiskMember[] | undefined }) {
  if (!members?.length) return <div className="flex flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 py-12 text-center"><CheckCircle2 className="size-9 text-emerald-600" aria-hidden="true" /><p className="text-sm font-extrabold text-stone-900">No immediate inactivity signals</p></div>;
  return <div className="flex flex-col gap-2">{members.slice(0, 6).map((member) => <Link key={member.id} href={`/members/${member.id}`} className="group flex min-h-11 items-center justify-between gap-3 rounded-[20px] border border-stone-100 bg-white/80 p-3 transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"><div className="flex min-w-0 items-center gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md"><AlertTriangle className="size-4" aria-hidden="true" /></div><div className="min-w-0"><p className="truncate text-sm font-bold text-stone-900">{member.firstName} {member.lastName}</p><p className="text-xs font-medium text-stone-600">{member.neverCheckedIn ? "Never checked in" : `${member.daysSinceLastVisit} days since last visit`}</p></div></div><ChevronRight className="size-4 shrink-0 text-stone-300 transition group-hover:translate-x-0.5 group-hover:text-stone-700" aria-hidden="true" /></Link>)}{members.length > 6 ? <Link href="/members?filter=at-risk" className="flex min-h-11 items-center justify-center gap-1 pt-2 text-xs font-extrabold text-violet-700 hover:text-violet-900">View all {members.length} at-risk members <ArrowRight className="size-3.5" aria-hidden="true" /></Link> : null}</div>;
}

function TrainerList({ trainers }: { trainers: TrainerWorkload[] | undefined }) {
  if (!trainers?.length) return <div className="py-12 text-center text-sm font-medium text-stone-600">No trainers assigned</div>;
  return <div className="flex flex-col gap-2">{trainers.map((trainer) => <div key={trainer.trainerId} className="flex items-center justify-between gap-3 rounded-[20px] border border-stone-100 bg-white/80 p-3"><div className="flex min-w-0 items-center gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-md"><Dumbbell className="size-4" aria-hidden="true" /></div><div className="min-w-0"><p className="truncate text-sm font-bold text-stone-900">{trainer.trainerName}</p><p className="text-xs font-medium text-stone-600">{trainer.activeMembers} active members · {trainer.pendingPtSessions} pending</p></div></div><div className="text-right"><p className="font-mono text-sm font-bold text-stone-900">{trainer.completedPtSessions}</p><p className="text-[10px] uppercase tracking-wider text-stone-500">completed</p></div></div>)}</div>;
}

function SalesFunnel({ data }: { data: SalesFunnel | undefined }) {
  if (!data) return <Skeleton className="h-48 w-full rounded-[20px]" />;
  const won = data.wonLeads;
  const lost = data.lostLeads ?? Math.max(data.totalLeads - won, 0);
  const conversion = Math.min(Math.max(Number(data.conversionRatePct) || 0, 0), 100);
  const follow = Math.min(Math.max(Number(data.followUps.completionRatePct) || 0, 0), 100);
  return <div className="space-y-5"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-stone-500">Conversion</p><p className="mt-1 text-3xl font-black tracking-tight text-stone-950">{conversion}%</p></div><div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25"><Target className="size-6" aria-hidden="true" /></div></div><div className="h-3 overflow-hidden rounded-full bg-stone-100"><div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400" style={{ width: `${conversion}%` }} /></div><div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-2xl bg-emerald-50 p-3 ring-1 ring-emerald-100"><p className="text-lg font-black text-emerald-700">{won}</p><p className="text-[10px] uppercase tracking-wider text-stone-600">Won</p></div><div className="rounded-2xl bg-rose-50 p-3 ring-1 ring-rose-100"><p className="text-lg font-black text-rose-700">{lost}</p><p className="text-[10px] uppercase tracking-wider text-stone-600">Lost</p></div><div className="rounded-2xl bg-sky-50 p-3 ring-1 ring-sky-100"><p className="text-lg font-black text-sky-700">{data.totalLeads}</p><p className="text-[10px] uppercase tracking-wider text-stone-600">Total</p></div></div><div className="border-t border-stone-100 pt-4"><div className="flex items-center justify-between text-xs"><span className="font-medium text-stone-600">Follow-up completion</span><span className="font-mono font-bold text-stone-900">{follow}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100"><div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500" style={{ width: `${follow}%` }} /></div><p className="mt-2 text-[11px] font-medium text-stone-600">{data.followUps.completed} of {data.followUps.total} follow-ups completed</p></div></div>;
}

function SourcePerformance({ data }: { data: SalesSourcePerformance[] | undefined }) {
  if (!data?.length) return <div className="py-10 text-center text-sm font-medium text-stone-600">No source performance data available</div>;
  return <div className="flex flex-col gap-2">{data.slice(0, 6).map((item) => <div key={item.source} className="rounded-[20px] border border-stone-100 bg-white/70 p-3"><div className="flex items-center justify-between gap-3"><p className="truncate text-sm font-bold text-stone-900">{item.source || "Unknown"}</p><Badge variant="secondary" className="shrink-0 rounded-full">{Number(item.conversionRatePct).toFixed(1)}%</Badge></div><div className="mt-2 flex items-center gap-2 text-[10px] font-medium text-stone-600"><span>{item.totalLeads} leads</span><span aria-hidden="true">·</span><span>{item.wonLeads} won</span><span aria-hidden="true">·</span><span>{item.lostLeads} lost</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${Math.min(Math.max(Number(item.conversionRatePct), 0), 100)}%` }} /></div></div>)}</div>;
}

function MembershipLifecycleCard({ data, loading }: { data: MembershipLifecycleAnalytics | undefined; loading: boolean }) {
  if (loading) return <Skeleton className="h-48 w-full rounded-[20px]" />;
  if (!data) return <div className="py-12 text-center text-sm font-medium text-stone-600">No membership lifecycle data available</div>;
  const totalStatus = data.statusCounts.reduce((sum, item) => sum + item.count, 0) || 1;
  const statusColors: Record<string, string> = { ACTIVE: "bg-emerald-500", FROZEN: "bg-sky-500", PAUSED: "bg-amber-400", PENDING: "bg-violet-400", EXPIRED: "bg-rose-500", CANCELLED: "bg-stone-400" };
  const topPlans = data.activePlanDistribution.slice(0, 5);
  const maxPlanCount = Math.max(...topPlans.map((p) => p.count), 1);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {data.statusCounts.map((item) => (
          <Badge key={item.status} variant="secondary" className="rounded-full">
            <span className={`mr-1.5 size-2 rounded-full ${statusColors[item.status] ?? "bg-stone-400"}`} aria-hidden="true" />
            {item.status}: {item.count}
          </Badge>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl bg-emerald-50/80 p-3 ring-1 ring-emerald-100">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Renewal rate</p>
          <p className="mt-1 text-xl font-black text-emerald-700">{Number(data.renewalRatePct).toFixed(1)}%</p>
        </div>
        <div className="rounded-2xl bg-sky-50/80 p-3 ring-1 ring-sky-100">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Freeze utilization</p>
          <p className="mt-1 text-xl font-black text-sky-700">{Number(data.freezeUtilizationRatePct).toFixed(1)}%</p>
        </div>
        <div className="rounded-2xl bg-amber-50/80 p-3 ring-1 ring-amber-100">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Expiring ≤ 30d</p>
          <p className="mt-1 text-xl font-black text-amber-700">{data.expiringWithin30Days}</p>
        </div>
        <div className="rounded-2xl bg-violet-50/80 p-3 ring-1 ring-violet-100">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">New (90d)</p>
          <p className="mt-1 text-xl font-black text-violet-700">{data.newLast90Days}</p>
          <p className="text-[10px] font-medium text-stone-600">{data.renewedLast90Days} renewed</p>
        </div>
      </div>
      {topPlans.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Active plan distribution</p>
          {topPlans.map((plan) => (
            <div key={plan.planId} className="flex items-center gap-3">
              <span className="w-32 truncate text-xs font-semibold text-stone-700">{plan.planName}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${(plan.count / maxPlanCount) * 100}%` }} />
              </div>
              <span className="font-mono text-xs font-bold text-stone-700">{plan.count}</span>
            </div>
          ))}
        </div>
      )}
      {data.outstandingByCurrency.length > 0 && (
        <div className="border-t border-stone-100 pt-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Outstanding balance</p>
          {data.outstandingByCurrency.map((item) => (
            <div key={item.currency} className="mt-1 flex items-center justify-between text-sm">
              <span className="font-medium text-stone-600">{item.membershipsWithBalance} memberships</span>
              <span className="font-mono font-bold text-rose-600">{formatMoney(item.outstandingBalance, item.currency)}</span>
            </div>
          ))}
        </div>
      )}
      <p className="text-[11px] font-medium text-stone-500">{totalStatus} total membership records analyzed</p>
    </div>
  );
}

function InventoryList({ items }: { items: InventoryForecast[] | undefined }) {
  if (!items?.length) return <div className="py-12 text-center text-sm font-medium text-stone-600">No inventory forecast available</div>;
  return <div className="flex flex-col gap-2">{items.slice(0, 6).map((item) => <div key={item.productId} className="flex items-center justify-between gap-3 rounded-[20px] border border-stone-100 bg-white/80 p-3"><div className="flex min-w-0 items-center gap-3"><div className={`flex size-10 shrink-0 items-center justify-center rounded-[15px] text-white shadow-md ${item.lowStock ? "bg-gradient-to-br from-rose-500 to-orange-500" : "bg-gradient-to-br from-cyan-500 to-blue-600"}`}><Package className="size-4" aria-hidden="true" /></div><div className="min-w-0"><p className="truncate text-sm font-bold text-stone-900">{item.productName}</p><p className="text-xs font-medium text-stone-600">{item.currentStock} units · {item.lowStock ? "Low stock" : "Healthy stock"}</p></div></div><div className="text-right"><p className={`font-mono text-sm font-bold ${item.daysUntilStockout !== null && item.daysUntilStockout <= 7 ? "text-rose-600" : "text-stone-900"}`}>{item.daysUntilStockout === null ? "—" : `${item.daysUntilStockout}d`}</p><p className="text-[10px] uppercase tracking-wider text-stone-500">stockout</p></div></div>)}</div>;
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
  const lifecycle = useMembershipLifecycle(branch);

  const revenueRow = revenue.data?.revenue?.[0];
  const outstanding = revenue.data?.outstanding?.[0];
  const totalMembers = status.data?.reduce((sum, item) => sum + item.count, 0) ?? 0;
  const activeMembers = status.data?.find((item) => item.status === "ACTIVE")?.count ?? 0;
  const riskCount = atRisk.data?.length ?? 0;
  const lowStockCount = inventory.data?.filter((item) => item.lowStock).length ?? 0;
  const refresh = () => {
    void Promise.all([revenue.refetch(), trend.refetch(), atRisk.refetch(), status.refetch(), sales.refetch(), sources.refetch(), trainers.refetch(), inventory.refetch(), lifecycle.refetch()]);
    toast.success("Intelligence refreshed");
  };

  return (
    <div className="relative -mx-2 min-h-full overflow-hidden pb-12 sm:-mx-3 lg:-mx-5">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_5%_2%,rgba(6,182,212,.13),transparent_19%),radial-gradient(circle_at_96%_4%,rgba(99,102,241,.15),transparent_22%),radial-gradient(circle_at_70%_38%,rgba(217,70,239,.10),transparent_25%),radial-gradient(circle_at_12%_72%,rgba(16,185,129,.08),transparent_24%)]"
        aria-hidden="true"
      />
      <div className="mx-auto flex max-w-[1680px] flex-col gap-8 px-2 sm:px-4 lg:px-6">
        <PageHero
          id="intel-title"
          variant="dark"
          accent="violet"
          icon={Sparkles}
          title="Gym intelligence"
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1.5 backdrop-blur-xl"><Filter className="ml-2 size-4 shrink-0 text-cyan-200" aria-hidden="true" /><Select value={branchId} onValueChange={setBranchId}><SelectTrigger aria-label="Filter by branch" className="h-9 border-0 bg-transparent text-white shadow-none focus:ring-0"><SelectValue placeholder="All branches" /></SelectTrigger><SelectContent>{<SelectItem value="all">All branches</SelectItem>}{branches?.items?.map((item: { id: string; name: string }) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1.5 backdrop-blur-xl"><BarChart3 className="ml-2 size-4 shrink-0 text-violet-200" aria-hidden="true" /><Select value={months} onValueChange={setMonths}><SelectTrigger aria-label="Select month range" className="h-9 border-0 bg-transparent text-white shadow-none focus:ring-0"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="3">Last 3 months</SelectItem><SelectItem value="6">Last 6 months</SelectItem><SelectItem value="12">Last 12 months</SelectItem></SelectContent></Select><Button size="icon" variant="ghost" onClick={refresh} className="min-h-10 min-w-10 text-white hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" title="Refresh intelligence" aria-label="Refresh intelligence"><RefreshCw className="size-4" aria-hidden="true" /></Button></div>
          </div>
        </PageHero>

        <section aria-labelledby="intel-pulse">
          <SectionHeader title="Executive signal layer" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <MetricCard label="Net revenue" value={formatMoney(revenueRow?.netRevenue)} detail={`${revenueRow?.paymentCount ?? 0} recorded payments`} icon={DollarSign} tone="violet" loading={revenue.isLoading} />
            <MetricCard label="Outstanding" value={formatMoney(outstanding?.outstandingBalance)} detail={`${outstanding?.membershipsWithBalance ?? 0} memberships with balance`} icon={WalletCards} tone="rose" loading={revenue.isLoading} href="/billing" />
            <MetricCard label="Members" value={totalMembers} detail={`${activeMembers} currently active`} icon={Users} tone="cyan" loading={status.isLoading} href="/members" />
            <MetricCard label="At risk" value={riskCount} icon={AlertTriangle} tone="amber" loading={atRisk.isLoading} href="/members?filter=at-risk" />
            <MetricCard label="Conversion" value={`${Number(sales.data?.conversionRatePct ?? 0)}%`} detail={`${sales.data?.wonLeads ?? 0} won leads`} icon={TrendingUp} tone="emerald" loading={sales.isLoading} href="/crm" />
            <MetricCard label="Low stock" value={lowStockCount} icon={Boxes} tone="blue" loading={inventory.isLoading} href="/inventory" />
          </div>
        </section>

        <section aria-label="Finance and member health" className="grid gap-5 xl:grid-cols-[1.55fr_0.9fr]">
          <Card className="overflow-hidden border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl"><CardHeader className="border-b border-stone-100/80 bg-gradient-to-r from-violet-50/80 via-white to-cyan-50/60 pb-4"><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-[15px] bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg"><BarChart3 className="size-5" aria-hidden="true" /></span><div><CardTitle className="mt-1 font-serif text-xl tracking-tight text-stone-950">Revenue trajectory</CardTitle></div></div><Badge variant="secondary" className="rounded-full bg-violet-50 text-violet-700 ring-1 ring-violet-100">{months}M view</Badge></div></CardHeader><CardContent className="p-5"><RevenueChart data={trend.data} /></CardContent></Card>
          <Card className="overflow-hidden border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl"><CardHeader className="border-b border-stone-100/80 bg-gradient-to-r from-cyan-50/80 via-white to-blue-50/60 pb-4"><div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-[15px] bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg"><Users className="size-5" aria-hidden="true" /></span><div><CardTitle className="mt-1 font-serif text-xl tracking-tight text-stone-950">Member status mix</CardTitle></div></div></CardHeader><CardContent className="p-5"><StatusBreakdown data={status.data} /></CardContent></Card>
        </section>

        <section aria-labelledby="intel-lifecycle">
          <SectionHeader title="Membership lifecycle" />
          <div className="grid gap-5 xl:grid-cols-[1.55fr_0.9fr]">
            <Card className="overflow-hidden border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl"><CardHeader className="border-b border-stone-100/80 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/60 pb-4"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-[15px] bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg"><Activity className="size-5" aria-hidden="true" /></span><div><CardTitle className="mt-1 font-serif text-xl tracking-tight text-stone-950">Status &amp; renewal health</CardTitle></div></div><RefreshCw className="size-5 text-emerald-600" aria-hidden="true" /></div></CardHeader><CardContent className="p-5"><MembershipLifecycleCard data={lifecycle.data} loading={lifecycle.isLoading} /></CardContent></Card>
            <Card className="overflow-hidden border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl"><CardHeader className="pb-2"><div className="flex items-center justify-between gap-3"><div><CardTitle className="font-serif text-lg tracking-tight text-stone-950">Expiring soon</CardTitle></div><div className="flex size-11 items-center justify-center rounded-[15px] bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg"><Calendar className="size-5" aria-hidden="true" /></div></div></CardHeader><CardContent className="pt-0"><div className="flex h-40 flex-col items-center justify-center rounded-[20px] bg-gradient-to-br from-amber-50/80 to-orange-50/50 text-center ring-1 ring-amber-100"><p className="font-mono text-4xl font-black text-amber-700 tabular-nums">{lifecycle.data?.expiringWithin30Days ?? "—"}</p><p className="mt-1 text-xs font-medium text-stone-600">memberships expire within 30 days</p></div></CardContent></Card>
          </div>
        </section>

        <section aria-labelledby="intel-queue">
          <SectionHeader title="Signals that need a decision" action={<Link href="/members"><Button variant="outline" className="min-h-11 rounded-full border-stone-200 bg-white/80">Members <ArrowRight className="ml-2 size-4" aria-hidden="true" /></Button></Link>} />
          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="overflow-hidden border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl"><CardHeader className="border-b border-stone-100/80 bg-gradient-to-r from-amber-50/80 via-white to-orange-50/60"><div className="flex items-center justify-between gap-3"><div><CardTitle className="font-serif text-lg tracking-tight text-stone-950">At-risk members</CardTitle></div><div className="flex size-11 items-center justify-center rounded-[15px] bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg"><AlertTriangle className="size-5" aria-hidden="true" /></div></div></CardHeader><CardContent className="pt-4"><AtRiskList members={atRisk.data} /></CardContent></Card>
            <Card className="overflow-hidden border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl"><CardHeader className="border-b border-stone-100/80 bg-gradient-to-r from-violet-50/80 via-white to-fuchsia-50/60"><div className="flex items-center justify-between gap-3"><div><CardTitle className="font-serif text-lg tracking-tight text-stone-950">Trainer workload</CardTitle></div><div className="flex size-11 items-center justify-center rounded-[15px] bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg"><Dumbbell className="size-5" aria-hidden="true" /></div></div></CardHeader><CardContent className="pt-4"><TrainerList trainers={trainers.data} /></CardContent></Card>
          </div>
        </section>

        <section aria-label="Sales and acquisition" className="grid gap-5 xl:grid-cols-2">
          <Card className="overflow-hidden border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl"><CardHeader className="border-b border-stone-100/80 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/60"><div className="flex items-center justify-between gap-3"><div><CardTitle className="mt-1 font-serif text-xl tracking-tight text-stone-950">Sales funnel</CardTitle></div><span className="flex size-11 items-center justify-center rounded-[15px] bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg"><CreditCard className="size-5" aria-hidden="true" /></span></div></CardHeader><CardContent className="p-5"><SalesFunnel data={sales.data} /></CardContent></Card>
          <Card className="overflow-hidden border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl"><CardHeader className="border-b border-stone-100/80 bg-gradient-to-r from-violet-50/80 via-white to-fuchsia-50/60"><div className="flex items-center justify-between gap-3"><div><CardTitle className="mt-1 font-serif text-xl tracking-tight text-stone-950">Source performance</CardTitle></div><span className="flex size-11 items-center justify-center rounded-[15px] bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg"><Zap className="size-5" aria-hidden="true" /></span></div></CardHeader><CardContent className="p-5"><SourcePerformance data={sources.data} /></CardContent></Card>
        </section>

        <section aria-label="Inventory and revenue quality" className="grid gap-5 lg:grid-cols-2">
          <Card className="overflow-hidden border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl"><CardHeader className="border-b border-stone-100/80 bg-gradient-to-r from-cyan-50/80 via-white to-blue-50/60"><div className="flex items-center justify-between gap-3"><div><CardTitle className="mt-1 font-serif text-xl tracking-tight text-stone-950">Inventory forecast</CardTitle></div><span className="flex size-11 items-center justify-center rounded-[15px] bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg"><Package className="size-5" aria-hidden="true" /></span></div></CardHeader><CardContent className="p-5"><InventoryList items={inventory.data} /></CardContent></Card>
          <Card className="overflow-hidden border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl"><CardHeader className="border-b border-stone-100/80 bg-gradient-to-r from-rose-50/80 via-white to-orange-50/60"><div className="flex items-center justify-between gap-3"><div><CardTitle className="mt-1 font-serif text-xl tracking-tight text-stone-950">Revenue quality</CardTitle></div><span className="flex size-11 items-center justify-center rounded-[15px] bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-lg"><WalletCards className="size-5" aria-hidden="true" /></span></div></CardHeader><CardContent className="p-5"><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-stone-50 p-4 ring-1 ring-stone-100"><p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Gross revenue</p><p className="mt-1 text-xl font-black text-stone-950">{formatMoney(revenueRow?.grossRevenue)}</p></div><div className="rounded-2xl bg-rose-50/70 p-4 ring-1 ring-rose-100"><p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Refunded</p><p className="mt-1 text-xl font-black text-rose-600">{formatMoney(revenueRow?.refunded)}</p></div><div className="rounded-2xl bg-violet-50/70 p-4 ring-1 ring-violet-100"><p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Membership revenue</p><p className="mt-1 text-xl font-black text-stone-950">{formatMoney(revenueRow?.membershipRevenue)}</p></div><div className="rounded-2xl bg-cyan-50/70 p-4 ring-1 ring-cyan-100"><p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Other revenue</p><p className="mt-1 text-xl font-black text-stone-950">{formatMoney(revenueRow?.otherRevenue)}</p></div></div>{revenue.data?.notComputable?.length ? <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-center gap-2"><AlertTriangle className="size-4 text-amber-600" aria-hidden="true" /><p className="text-xs font-bold text-amber-800">Data quality notes</p></div><div className="mt-2 space-y-1">{revenue.data.notComputable.map((item) => <p key={item.key} className="text-xs font-medium text-amber-700"><span className="font-bold">{item.key}:</span> {item.reason}</p>)}</div></div> : null}</CardContent></Card>
        </section>
      </div>
    </div>
  );
}

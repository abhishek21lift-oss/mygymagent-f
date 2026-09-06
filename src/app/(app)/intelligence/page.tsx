"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Users,
  CreditCard,
  Package,
  Dumbbell,
  Sparkles,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

function KpiCard({
  title,
  value,
  subtext,
  trend,
  trendValue,
  icon: Icon,
  accentColor = "primary",
  loading,
  href,
}: {
  title: string;
  value: string | number | undefined;
  subtext?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  icon: typeof Activity;
  accentColor?: string;
  loading?: boolean;
  href?: string;
}) {
  const accentClasses: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    cyan: "bg-cyan-500/10 text-cyan-600",
    green: "bg-emerald-500/10 text-emerald-600",
    amber: "bg-amber-500/10 text-amber-600",
    violet: "bg-violet-500/10 text-violet-600",
    red: "bg-red-500/10 text-red-600",
  };

  const trendIcon =
    trend === "up" ? (
      <TrendingUp className="size-3.5 text-emerald-500" />
    ) : trend === "down" ? (
      <TrendingDown className="size-3.5 text-red-500" />
    ) : (
      <Minus className="size-3.5 text-muted-foreground" />
    );

  const content = (
    <Card
      className={`overflow-hidden border-0 shadow-sm transition-all hover:shadow-md ${
        href ? "cursor-pointer hover:-translate-y-0.5" : ""
      }`}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5">
            <Icon className={`size-6 ${accentClasses[accentColor].split(" ")[1]}`} />
          </div>
          {trend && (
            <div className="flex items-center gap-1 rounded-full bg-muted/50 px-2 py-1">
              {trendIcon}
              {trendValue && (
                <span className="text-xs font-medium">{trendValue}</span>
              )}
            </div>
          )}
        </div>
        <div className="mt-4">
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className="text-2xl font-bold tabular-nums">{value ?? "—"}</p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">{title}</p>
          {subtext && (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtext}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

function InsightCard({
  title,
  description,
  icon: Icon,
  severity,
  actionLabel,
  actionHref,
  children,
}: {
  title: string;
  description?: string;
  icon: typeof AlertTriangle;
  severity: "danger" | "warning" | "info" | "success";
  actionLabel?: string;
  actionHref?: string;
  children?: React.ReactNode;
}) {
  const severityClasses = {
    danger: "border-red-200 bg-red-50/50",
    warning: "border-amber-200 bg-amber-50/50",
    info: "border-blue-200 bg-blue-50/50",
    success: "border-emerald-200 bg-emerald-50/50",
  };

  const iconClasses = {
    danger: "text-red-500 bg-red-100",
    warning: "text-amber-500 bg-amber-100",
    info: "text-blue-500 bg-blue-100",
    success: "text-emerald-500 bg-emerald-100",
  };

  return (
    <Card className={`border ${severityClasses[severity]}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex size-10 items-center justify-center rounded-xl ${iconClasses[severity]}`}>
              <Icon className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              {description && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
          </div>
          {actionLabel && actionHref && (
            <Link href={actionHref}>
              <Button variant="ghost" size="sm" className="gap-1 text-primary">
                {actionLabel}
                <ChevronRight className="size-4" />
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
    </Card>
  );
}

function RevenueChart({ data }: { data: RevenueTrendMonth[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-muted-foreground">
        No revenue data available
      </div>
    );
  }

  const maxValue = Math.max(
    ...data.map((d) =>
      Math.max(
        ...d.revenue.map((r) => Number(r.netRevenue)),
      ),
    ),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-2">
        {data.map((month) => {
          const monthRevenue = month.revenue[0];
          const value = monthRevenue ? Number(monthRevenue.netRevenue) : 0;
          const heightPercent = maxValue > 0 ? (value / maxValue) * 100 : 0;
          const monthLabel = new Date(month.month + "-01").toLocaleDateString(undefined, {
            month: "short",
          });

          return (
            <div key={month.month} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-32 w-full items-end justify-center">
                <div
                  className="w-full max-w-8 rounded-t-md bg-gradient-to-t from-primary to-primary/60 transition-all hover:from-primary/90"
                  style={{ height: `${Math.max(heightPercent, 4)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{monthLabel}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-4 border-t pt-3">
        <div className="flex items-center gap-1.5">
          <div className="size-2 rounded-full bg-primary" />
          <span className="text-xs text-muted-foreground">Net Revenue</span>
        </div>
      </div>
    </div>
  );
}

function AtRiskMembersList({ members }: { members: AtRiskMember[] }) {
  if (!members || members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <CheckCircle2 className="size-8 text-emerald-500" />
        <p className="mt-2 text-sm font-medium">All members are active</p>
        <p className="text-xs text-muted-foreground">
          No members have been inactive for 14+ days
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {members.slice(0, 5).map((member) => (
        <Link
          key={member.id}
          href={`/members/${member.id}`}
          className="group flex items-center justify-between rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <AlertTriangle className="size-4" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {member.firstName} {member.lastName}
              </p>
              <p className="text-xs text-muted-foreground">
                {member.neverCheckedIn
                  ? "Never checked in"
                  : `${member.daysSinceLastVisit} days since last visit`}
              </p>
            </div>
          </div>
          <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
      ))}
      {members.length > 5 && (
        <Link
          href="/members?filter=at-risk"
          className="flex items-center justify-center gap-1 py-2 text-sm text-primary hover:underline"
        >
          View all {members.length} at-risk members
          <ArrowRight className="size-3.5" />
        </Link>
      )}
    </div>
  );
}

function TrainerWorkloadList({ trainers }: { trainers: TrainerWorkload[] }) {
  if (!trainers || trainers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Users className="size-8 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium">No trainers assigned</p>
        <p className="text-xs text-muted-foreground">
          Assign trainers to members to see workload
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {trainers.map((trainer) => (
        <div
          key={trainer.trainerId}
          className="flex items-center justify-between rounded-lg border bg-card p-3"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Dumbbell className="size-4" />
            </div>
            <div>
              <p className="text-sm font-medium">{trainer.trainerName}</p>
              <p className="text-xs text-muted-foreground">
                {trainer.activeMembers} active members
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">{trainer.completedPtSessions}</p>
            <p className="text-xs text-muted-foreground">sessions</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBreakdownChart({ data }: { data: { status: string; count: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-muted-foreground">
        No member data available
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.count, 0);
  const statusColors: Record<string, string> = {
    ACTIVE: "bg-emerald-500",
    INACTIVE: "bg-amber-500",
    FROZEN: "bg-blue-500",
    EXPIRED: "bg-red-500",
    CANCELLED: "bg-gray-500",
  };

  return (
    <div className="space-y-3">
      <div className="flex h-4 overflow-hidden rounded-full bg-muted">
        {data.map((item) => {
          const percent = total > 0 ? (item.count / total) * 100 : 0;
          return (
            <div
              key={item.status}
              className={`${statusColors[item.status] || "bg-gray-500"} transition-all`}
              style={{ width: `${percent}%` }}
              title={`${item.status}: ${item.count} (${percent.toFixed(1)}%)`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3">
        {data.map((item) => (
          <div key={item.status} className="flex items-center gap-1.5">
            <div
              className={`size-2 rounded-full ${statusColors[item.status] || "bg-gray-500"}`}
            />
            <span className="text-xs text-muted-foreground">
              {item.status} ({item.count})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SalesFunnelDisplay({ data }: { data: { totalLeads: number; wonLeads: number; conversionRatePct: number; followUps: { total: number; completed: number; completionRatePct: number } } | undefined }) {
  if (!data) {
    return <Skeleton className="h-32 w-full" />;
  }

  const wonPercent = data.totalLeads > 0 ? (data.wonLeads / data.totalLeads) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Conversion Rate</span>
        <Badge
          variant={data.conversionRatePct >= 30 ? "default" : "secondary"}
          className="text-lg font-bold"
        >
          {data.conversionRatePct}%
        </Badge>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
          style={{ width: `${wonPercent}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-emerald-50 p-2">
          <p className="text-lg font-bold text-emerald-600">{data.wonLeads}</p>
          <p className="text-xs text-muted-foreground">Won</p>
        </div>
        <div className="rounded-lg bg-red-50 p-2">
          <p className="text-lg font-bold text-red-600">
            {data.totalLeads - data.wonLeads}
          </p>
          <p className="text-xs text-muted-foreground">Lost</p>
        </div>
        <div className="rounded-lg bg-blue-50 p-2">
          <p className="text-lg font-bold text-blue-600">{data.totalLeads}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
      </div>

      <div className="border-t pt-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Follow-ups</span>
          <span className="text-sm font-medium">
            {data.followUps.completed}/{data.followUps.total}
          </span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all"
            style={{ width: `${data.followUps.completionRatePct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function RevenueSummaryCard({ data }: { data: RevenueSummary | undefined }) {
  if (!data) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (data.revenue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <DollarSign className="size-8 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium">No revenue this period</p>
        <p className="text-xs text-muted-foreground">
          Revenue will appear once payments are recorded
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.revenue.map((rev) => (
        <div
          key={rev.currency}
          className="flex items-center justify-between rounded-lg border bg-card p-3"
        >
          <div>
            <p className="text-sm font-medium">
              {rev.currency} Revenue
            </p>
            <p className="text-xs text-muted-foreground">
              {rev.paymentCount} payment{rev.paymentCount !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-emerald-600">
              {rev.currency} {Number(rev.netRevenue).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              Net ({rev.currency} {Number(rev.grossRevenue).toLocaleString()} gross)
            </p>
          </div>
        </div>
      ))}

      {data.outstanding.length > 0 && (
        <div className="border-t pt-3">
          <p className="mb-2 text-sm font-medium text-amber-600">
            Outstanding Balances
          </p>
          {data.outstanding.map((out) => (
            <div
              key={out.currency}
              className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3"
            >
              <span className="text-sm text-amber-700">
                {out.membershipsWithBalance} membership
                {out.membershipsWithBalance !== 1 ? "s" : ""} with balance
              </span>
              <span className="font-semibold text-amber-700">
                {out.currency} {Number(out.outstandingBalance).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {data.notComputable.length > 0 && (
        <div className="border-t pt-3">
          <p className="mb-2 text-xs text-muted-foreground">
            Not tracked:{" "}
            {data.notComputable.map((n) => n.key).join(", ")}
          </p>
        </div>
      )}
    </div>
  );
}

export default function IntelligencePage() {
  const [branchFilter, setBranchFilter] = React.useState<string>("all");
  const branchesQuery = useBranches();
  const branches = branchesQuery.data?.items ?? [];

  const revenueQuery = useRevenueSummary(
    branchFilter !== "all" ? { branchId: branchFilter } : {},
  );
  const revenueTrendQuery = useRevenueTrend(
    6,
    branchFilter !== "all" ? branchFilter : undefined,
  );
  const atRiskQuery = useAtRiskMembers(
    branchFilter !== "all" ? branchFilter : undefined,
  );
  const statusQuery = useMemberStatusBreakdown(
    branchFilter !== "all" ? branchFilter : undefined,
  );
  const salesQuery = useSalesFunnel(
    branchFilter !== "all" ? branchFilter : undefined,
  );
  const trainerQuery = useTrainerWorkload(
    branchFilter !== "all" ? branchFilter : undefined,
  );
  const inventoryQuery = useInventoryForecast();

  const totalMembers = statusQuery.data
    ? statusQuery.data.reduce((sum, item) => sum + item.count, 0)
    : 0;

  const activeMembers =
    statusQuery.data?.find((item) => item.status === "ACTIVE")?.count ?? 0;

  const atRiskCount = atRiskQuery.data?.length ?? 0;

  const currency = revenueQuery.data?.revenue[0]?.currency ?? "INR";
  const netRevenue = revenueQuery.data?.revenue[0]?.netRevenue ?? "0";

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Intelligence
          </h1>
          <p className="text-muted-foreground">
            Business insights powered by real data
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              revenueQuery.refetch();
              atRiskQuery.refetch();
              statusQuery.refetch();
              salesQuery.refetch();
              trainerQuery.refetch();
              toast.success("Intelligence refreshed");
            }}
          >
            <RefreshCw
              className={`size-4 ${revenueQuery.isFetching ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Net Revenue"
          value={revenueQuery.data ? `${currency} ${Number(netRevenue).toLocaleString()}` : "—"}
          subtext="This period"
          trend="up"
          trendValue="+12%"
          icon={DollarSign}
          accentColor="green"
          loading={revenueQuery.isLoading}
          href="/billing"
        />
        <KpiCard
          title="Active Members"
          value={activeMembers}
          subtext={`of ${totalMembers} total`}
          icon={Users}
          accentColor="primary"
          loading={statusQuery.isLoading}
          href="/members"
        />
        <KpiCard
          title="At-Risk Members"
          value={atRiskCount}
          subtext="14+ days inactive"
          trend={atRiskCount > 0 ? "down" : "neutral"}
          icon={AlertTriangle}
          accentColor={atRiskCount > 0 ? "amber" : "green"}
          loading={atRiskQuery.isLoading}
          href="/members?filter=at-risk"
        />
        <KpiCard
          title="Conversion Rate"
          value={salesQuery.data ? `${salesQuery.data.conversionRatePct}%` : "—"}
          subtext="Lead to customer"
          trend={salesQuery.data && salesQuery.data.conversionRatePct >= 30 ? "up" : "down"}
          icon={TrendingUp}
          accentColor="violet"
          loading={salesQuery.isLoading}
          href="/crm"
        />
      </div>

      {/* At-Risk Alert */}
      {atRiskCount > 0 && (
        <InsightCard
          title={`${atRiskCount} member${atRiskCount > 1 ? "s" : ""} need${atRiskCount === 1 ? "s" : ""} attention`}
          description="These members haven't visited in 14+ days and may be at risk of churning."
          icon={AlertTriangle}
          severity="warning"
          actionLabel="View all"
          actionHref="/members?filter=at-risk"
        >
          <AtRiskMembersList members={atRiskQuery.data ?? []} />
        </InsightCard>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Trend */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="size-4 text-emerald-500" />
              Revenue Trend
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Monthly net revenue for the last 6 months
            </p>
          </CardHeader>
          <CardContent>
            {revenueTrendQuery.isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <RevenueChart data={revenueTrendQuery.data ?? []} />
            )}
          </CardContent>
        </Card>

        {/* Member Status */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4 text-primary" />
              Member Status
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Distribution of all members by their current status
            </p>
          </CardHeader>
          <CardContent>
            {statusQuery.isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <StatusBreakdownChart data={statusQuery.data ?? []} />
            )}
          </CardContent>
        </Card>

        {/* Revenue Summary */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="size-4 text-emerald-500" />
              Revenue Breakdown
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Gross, net, and outstanding revenue this period
            </p>
          </CardHeader>
          <CardContent>
            <RevenueSummaryCard data={revenueQuery.data} />
          </CardContent>
        </Card>

        {/* Sales Funnel */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4 text-blue-500" />
              Sales Pipeline
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Lead conversion and follow-up tracking
            </p>
          </CardHeader>
          <CardContent>
            <SalesFunnelDisplay data={salesQuery.data} />
          </CardContent>
        </Card>

        {/* Trainer Workload */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Dumbbell className="size-4 text-violet-500" />
              Trainer Workload
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Active members and PT sessions per trainer
            </p>
          </CardHeader>
          <CardContent>
            <TrainerWorkloadList trainers={trainerQuery.data ?? []} />
          </CardContent>
        </Card>

        {/* Inventory Alerts */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="size-4 text-amber-500" />
              Inventory Status
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Low stock and forecast alerts
            </p>
          </CardHeader>
          <CardContent>
            {inventoryQuery.isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : inventoryQuery.data && inventoryQuery.data.length > 0 ? (
              <div className="space-y-2">
                {inventoryQuery.data.slice(0, 5).map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between rounded-lg border bg-card p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex size-9 items-center justify-center rounded-full ${
                          item.lowStock ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                        }`}
                      >
                        <Package className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.currentStock} in stock
                        </p>
                      </div>
                    </div>
                    {item.lowStock && (
                      <Badge variant="warning" className="rounded-full">
                        Low stock
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Package className="size-8 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">No inventory alerts</p>
                <p className="text-xs text-muted-foreground">
                  All products are adequately stocked
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Section */}
      <Card className="border-0 bg-gradient-to-br from-primary/[0.08] via-card to-card shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-primary" />
            AI Insights
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Data-powered recommendations based on your gym&apos;s performance
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <InsightCard
              title="Retention opportunity"
              description={`${atRiskCount} at-risk members represent potential revenue loss if they churn.`}
              icon={Users}
              severity={atRiskCount > 5 ? "danger" : "warning"}
            >
              <div className="mt-2 flex gap-2">
                <Link href="/ai" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full gap-1">
                    <Sparkles className="size-3.5" />
                    Ask AI for recommendations
                  </Button>
                </Link>
                <Link href="/members?filter=at-risk" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full gap-1">
                    <Users className="size-3.5" />
                    Review members
                  </Button>
                </Link>
              </div>
            </InsightCard>

            <InsightCard
              title="Revenue potential"
              description={
                salesQuery.data?.conversionRatePct
                  ? `Your ${salesQuery.data.conversionRatePct}% conversion rate ${
                      salesQuery.data.conversionRatePct >= 30 ? "is healthy" : "could be improved"
                    }`
                  : "Track your sales performance"
              }
              icon={DollarSign}
              severity={
                salesQuery.data?.conversionRatePct && salesQuery.data.conversionRatePct >= 30
                  ? "success"
                  : "info"
              }
            >
              <div className="mt-2 flex gap-2">
                <Link href="/ai-actions" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full gap-1">
                    <TrendingUp className="size-3.5" />
                    View AI proposals
                  </Button>
                </Link>
                <Link href="/crm" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full gap-1">
                    <Users className="size-3.5" />
                    Open CRM
                  </Button>
                </Link>
              </div>
            </InsightCard>
          </div>

          <div className="flex items-center justify-center border-t pt-4">
            <Link href="/ai">
              <Button className="gap-2">
                <Sparkles className="size-4" />
                Ask MyGymAgent AI
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

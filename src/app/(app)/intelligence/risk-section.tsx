"use client";

import * as React from "react";
import { toast } from "sonner";
import { Activity, Loader2, RefreshCw, ShieldAlert } from "lucide-react";

import { DataState } from "@/components/shared/data-state";
import { MetricStrip, Panel } from "@/components/shared/panel";
import { StatCard, toStatTone } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import {
  useBatchComputeIntelligence,
  useRevenueAtRisk,
  useRiskByBranch,
  useRiskOverview,
  useRiskTrend,
  type RiskLevel,
} from "@/lib/hooks/use-member-intelligence";
import { displayCurrencyAmount } from "@/lib/utils";

const LEVEL_TONE: Record<string, string> = {
  CRITICAL: "destructive",
  HIGH: "warning",
  MEDIUM: "primary",
  LOW: "success",
};

function levelBadge(level: RiskLevel) {
  const tone = LEVEL_TONE[String(level)] ?? "secondary";
  return (
    <Badge variant={tone === "destructive" ? "destructive" : tone === "warning" ? "warning" : tone === "success" ? "success" : "secondary"}>
      {level}
    </Badge>
  );
}

/**
 * Churn risk, rolled up.
 *
 * Four endpoints computed all of this -- the distribution, the trend, the
 * money attached to it and the split by branch -- and none of them had a
 * caller, so the app could list who was at risk without ever saying how
 * much of it there was or whether it was getting worse.
 *
 * The recompute is here rather than on a schedule button elsewhere
 * because this is the screen where you notice the numbers are stale.
 */
export function RiskSection() {
  const { hasPermission } = useAuth();
  const canView = hasPermission("reports.view");
  const overview = useRiskOverview(canView);
  const trend = useRiskTrend(30, canView);
  const revenue = useRevenueAtRisk(canView);
  const byBranch = useRiskByBranch(canView);
  const batch = useBatchComputeIntelligence();

  if (!canView) return null;

  const latest = (trend.data ?? []).at(-1);
  const first = (trend.data ?? [])[0];
  const movement =
    latest && first ? Math.round((latest.avgScore - first.avgScore) * 100) / 100 : null;

  return (
    <div className="flex flex-col gap-4">
      <MetricStrip columns={4} label="Churn risk">
        <StatCard
          title="Members at risk"
          value={(overview.data?.highRiskCount ?? 0) + (overview.data?.criticalRiskCount ?? 0)}
          isLoading={overview.isPending}
          isError={overview.isError}
          hint={`of ${overview.data?.totalMembers ?? 0} scored`}
          tone={toStatTone("risk")}
        />
        <StatCard
          title="Critical"
          value={overview.data?.criticalRiskCount ?? 0}
          isLoading={overview.isPending}
          isError={overview.isError}
          tone={toStatTone("critical")}
        />
        <StatCard
          title="Revenue at risk"
          value={displayCurrencyAmount(revenue.data?.atRiskMRR ?? 0)}
          isLoading={revenue.isPending}
          isError={revenue.isError}
          hint={
            revenue.data
              ? `${Math.round(revenue.data.atRiskPercentage)}% of ${displayCurrencyAmount(revenue.data.totalMRR)} MRR`
              : undefined
          }
          tone={toStatTone("warning")}
        />
        <StatCard
          title="30-day movement"
          value={movement === null ? "—" : `${movement > 0 ? "+" : ""}${movement}`}
          isLoading={trend.isPending}
          isError={trend.isError}
          hint="Average risk score"
          // A rising average score is the bad direction.
          tone={toStatTone(movement !== null && movement > 0 ? "warning" : "good")}
        />
      </MetricStrip>

      <Panel
        title="Risk by branch"
        titleId="risk-by-branch"
        description="Where the risk is concentrated."
        actions={
          <Button
            variant="outline"
            size="sm"
            disabled={batch.isPending}
            onClick={() =>
              void batch
                .mutateAsync()
                .then((r) =>
                  toast.success(
                    r?.processed != null
                      ? `Recomputed ${r.processed} members`
                      : "Risk scores recomputed",
                  ),
                )
                .catch((error) =>
                  toast.error(
                    error instanceof ApiError ? error.message : "Could not recompute scores",
                  ),
                )
            }
          >
            {batch.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="size-4" aria-hidden="true" />
            )}
            Recompute all
          </Button>
        }
        flush
      >
        <DataState
          isLoading={byBranch.isPending}
          isError={byBranch.isError}
          onRetry={() => void byBranch.refetch()}
          errorMessage="Could not load risk by branch."
          isEmpty={(byBranch.data ?? []).length === 0}
          emptyIcon={ShieldAlert}
          emptyTitle="Nothing scored yet"
          emptyDescription="Recompute to score the current roll."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Branch</TableHead>
                <TableHead className="text-right">Members</TableHead>
                <TableHead className="text-right">Average score</TableHead>
                <TableHead>Distribution</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(byBranch.data ?? []).map((branch) => (
                <TableRow key={branch.branchId}>
                  <TableCell className="font-medium">{branch.branchName}</TableCell>
                  <TableCell className="text-right tabular-nums">{branch.totalMembers}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {Math.round(branch.avgRiskScore * 100) / 100}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {branch.riskDistribution
                        .filter((d) => d.count > 0)
                        .map((d) => (
                          <span key={d.riskLevel} className="inline-flex items-center gap-1">
                            {levelBadge(d.riskLevel)}
                            <span className="text-xs tabular-nums text-muted-foreground">
                              {d.count}
                            </span>
                          </span>
                        ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataState>
      </Panel>

      <Panel
        title="Revenue at risk by level"
        titleId="revenue-at-risk"
        description="Monthly recurring revenue attached to each risk band."
        flush
      >
        <DataState
          isLoading={revenue.isPending}
          isError={revenue.isError}
          onRetry={() => void revenue.refetch()}
          errorMessage="Could not load revenue at risk."
          isEmpty={(revenue.data?.bySegment ?? []).length === 0}
          emptyIcon={Activity}
          emptyTitle="No revenue scored"
          emptyDescription="Members need an active membership and a risk score to appear."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Risk level</TableHead>
                <TableHead className="text-right">Members</TableHead>
                <TableHead className="text-right">MRR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(revenue.data?.bySegment ?? []).map((segment) => (
                <TableRow key={String(segment.riskLevel)}>
                  <TableCell>{levelBadge(segment.riskLevel)}</TableCell>
                  <TableCell className="text-right tabular-nums">{segment.memberCount}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {displayCurrencyAmount(segment.mrr)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataState>
      </Panel>
    </div>
  );
}

"use client";

import Link from "next/link";
import { HeartHandshake } from "lucide-react";

import { DataState } from "@/components/shared/data-state";
import { MetricStrip, Panel } from "@/components/shared/panel";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useWinBack, type WinBackTier } from "@/lib/hooks/use-analytics";
import { displayCurrencyAmount } from "@/lib/utils";

const TIER_VARIANT: Record<WinBackTier, "warning" | "secondary" | "success"> = {
  HIGH: "warning",
  MEDIUM: "secondary",
  LOW: "success",
};

/**
 * Win-back: lapsed members ranked by proven value, each with evidence.
 * Lapsed means the last term ended over 30 days ago — recent churn
 * belongs to renewals, and never-members belong to sales. Tiers are
 * relative (top 20% of this gym's lapsed base by lifetime payments),
 * so no currency-amount magic numbers.
 */
export function WinbackSection({ branchId }: { branchId?: string }) {
  const winback = useWinBack(branchId);
  const data = winback.data;
  const empty = !data || data.items.length === 0;

  return (
    <section aria-labelledby="intel-winback">
      <Panel
        title="Win-back"
        titleId="intel-winback"
        description="Former members worth re-engaging, ranked by lifetime value with reasons."
        actions={
          <Link
            href="/members"
            className="text-xs font-semibold text-primary hover:underline"
          >
            All members
          </Link>
        }
      >
        <DataState
          isLoading={winback.isLoading}
          isError={winback.isError}
          onRetry={() => void winback.refetch()}
          isEmpty={empty}
          emptyTitle="Nobody to win back"
          emptyDescription="No lapsed members with enough history right now."
        >
          {data && (
            <div className="flex flex-col gap-5">
              <MetricStrip columns={3} label="Win-back value tiers">
                <StatCard
                  icon={HeartHandshake}
                  title="High value"
                  value={data.counts.high}
                  hint="Top 20% by lifetime payments"
                  isLoading={false}
                  tone="primary"
                  accent="amber"
                />
                <StatCard
                  icon={HeartHandshake}
                  title="Medium value"
                  value={data.counts.medium}
                  isLoading={false}
                  tone="primary"
                  accent="cyan"
                />
                <StatCard
                  icon={HeartHandshake}
                  title="Low value"
                  value={data.counts.low}
                  isLoading={false}
                  tone="primary"
                  accent="emerald"
                />
              </MetricStrip>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Lapsed</TableHead>
                    <TableHead>Why win back</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.slice(0, 15).map((item) => (
                    <TableRow key={item.memberId}>
                      <TableCell>
                        <span className="font-semibold">
                          {item.firstName} {item.lastName}
                        </span>{" "}
                        <Badge variant={TIER_VARIANT[item.tier]}>
                          {item.tier}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {item.currency
                          ? displayCurrencyAmount(
                              item.lifetimePaid,
                              item.currency,
                            )
                          : item.lifetimePaid}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {item.daysSinceExpiry}d
                      </TableCell>
                      <TableCell className="max-w-64 text-xs text-muted-foreground">
                        {item.reasons.join(" · ")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/members/${item.memberId}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          Contact
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DataState>
      </Panel>
    </section>
  );
}

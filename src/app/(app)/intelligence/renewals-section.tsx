"use client";

import Link from "next/link";
import { CalendarClock } from "lucide-react";

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
import { useRenewalPipeline } from "@/lib/hooks/use-analytics";
import { displayCurrencyAmount } from "@/lib/utils";

/**
 * Renewal pipeline: upcoming, overdue and high-value renewals from live
 * membership rows. Upcoming without a successor is a call to make;
 * overdue without one is already lost revenue until someone acts.
 */
export function RenewalsSection({ branchId }: { branchId?: string }) {
  const renewals = useRenewalPipeline(branchId);
  const data = renewals.data;
  const empty =
    !data || (data.upcoming.length === 0 && data.overdue.length === 0);

  return (
    <section aria-labelledby="intel-renewals">
      <Panel
        title="Renewals"
        titleId="intel-renewals"
        description="Terms ending soon, overdue renewals and the highest-value opportunities."
        actions={
          <Link
            href="/memberships"
            className="inline-flex items-center text-xs font-semibold text-primary hover:underline pointer-coarse:min-h-10"
          >
            All memberships
          </Link>
        }
      >
        <DataState
          isLoading={renewals.isLoading}
          isError={renewals.isError}
          onRetry={() => void renewals.refetch()}
          isEmpty={empty}
          emptyTitle="No renewals on the horizon"
          emptyDescription="No terms end in the next 30 days and none recently expired without a successor."
        >
          {data && (
            <div className="flex flex-col gap-5">
              <MetricStrip columns={3} label="Renewal counts">
                <StatCard
                  icon={CalendarClock}
                  title="Expiring ≤ 30 days"
                  value={data.counts.upcoming}
                  isLoading={false}
                  tone="primary"
                  accent="amber"
                />
                <StatCard
                  icon={CalendarClock}
                  title="Overdue"
                  value={data.counts.overdue}
                  hint="Expired, no active term since"
                  isLoading={false}
                  tone={data.counts.overdue > 0 ? "destructive" : "primary"}
                  accent="rose"
                />
                <StatCard
                  icon={CalendarClock}
                  title="High-value"
                  value={data.highValue.length}
                  hint="Top upcoming by price"
                  isLoading={false}
                  tone="primary"
                  accent="violet"
                />
              </MetricStrip>
              {data.overdue.length > 0 && (
                <div>
                  <h3 className="section-title mb-2">Overdue</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.overdue.map((item) => (
                        <TableRow key={item.membershipId}>
                          <TableCell className="font-semibold">
                            {item.firstName} {item.lastName}
                          </TableCell>
                          <TableCell>{item.planName}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {displayCurrencyAmount(item.price, item.currency)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link
                              href={`/members/${item.memberId}`}
                              className="font-semibold text-primary hover:underline"
                            >
                              Win back
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <div>
                <h3 className="section-title mb-2">Upcoming</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Ends in</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.upcoming.slice(0, 10).map((item) => (
                      <TableRow key={item.membershipId}>
                        <TableCell className="font-semibold">
                          {item.firstName} {item.lastName}
                        </TableCell>
                        <TableCell>{item.planName}</TableCell>
                        <TableCell className="tabular-nums">
                          {item.daysUntilExpiry}d
                          {data.highValue.some(
                            (h) => h.membershipId === item.membershipId,
                          ) && (
                            <Badge variant="warning" className="ml-2">
                              High value
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {displayCurrencyAmount(item.price, item.currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/members/${item.memberId}`}
                            className="font-semibold text-primary hover:underline"
                          >
                            Renew
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DataState>
      </Panel>
    </section>
  );
}

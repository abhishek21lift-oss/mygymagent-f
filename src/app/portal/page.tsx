"use client";

import Link from "next/link";
import { CalendarCheck, Dumbbell, Salad } from "lucide-react";

import { DataState } from "@/components/shared/data-state";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/shared/panel";
import { usePortalMe, usePortalVisits } from "@/lib/hooks/use-portal";

function daysLeft(endDate: string) {
  const ms = new Date(endDate).getTime() - Date.now();
  return Math.ceil(ms / 86_400_000);
}

export default function PortalHome() {
  const me = usePortalMe();
  const visits = usePortalVisits(5);

  const membership = me.data?.activeMembership;
  const remaining = membership ? daysLeft(membership.endDate) : null;

  return (
    <div className="flex flex-col gap-4">
      {/* The one thing a member opens this to check: am I still a member,
          and for how long. Everything else is secondary to that. */}
      <Panel title="Membership" titleId="portal-membership">
        {membership ? (
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">
                {membership.membershipPlan?.name ?? "Membership"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Until {new Date(membership.endDate).toLocaleDateString()}
              </p>
            </div>
            <Badge
              variant={
                remaining !== null && remaining <= 7 ? "destructive" : "secondary"
              }
              className="rounded-full"
            >
              {remaining !== null && remaining >= 0
                ? `${remaining} day${remaining === 1 ? "" : "s"} left`
                : "Expired"}
            </Badge>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No active membership. Speak to the front desk to renew.
          </p>
        )}
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/portal/plan"
          className="flex min-h-11 items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/50"
        >
          <Dumbbell className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm font-medium">My training plan</span>
        </Link>
        <Link
          href="/portal/nutrition"
          className="flex min-h-11 items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/50"
        >
          <Salad className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm font-medium">My nutrition plan</span>
        </Link>
      </div>

      <Panel
        title="Recent visits"
        titleId="portal-recent-visits"
        actions={
          <Link
            href="/portal/visits"
            className="text-xs font-medium text-primary underline-offset-2 hover:underline"
          >
            See all
          </Link>
        }
        flush
      >
        <div className="p-4 sm:p-5">
          <DataState
            isLoading={visits.isPending}
            isError={visits.isError}
            onRetry={() => void visits.refetch()}
            errorMessage="Your visits could not be loaded."
            isEmpty={(visits.data?.items ?? []).length === 0}
            emptyIcon={CalendarCheck}
            emptyTitle="No visits yet"
            emptyDescription="Your check-ins will show up here."
            skeletonRows={3}
          >
            <ul className="divide-y divide-border">
              {(visits.data?.items ?? []).map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-sm">
                    {new Date(v.checkInAt).toLocaleString()}
                  </span>
                  {v.deniedReason ? (
                    <Badge variant="destructive" className="rounded-full">Denied</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {v.branch?.name ?? ""}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </DataState>
        </div>
      </Panel>

      {me.data?.member.assignedTrainer && (
        <p className="px-1 text-xs text-muted-foreground">
          Your trainer is {me.data.member.assignedTrainer.firstName}{" "}
          {me.data.member.assignedTrainer.lastName ?? ""}.
        </p>
      )}
    </div>
  );
}

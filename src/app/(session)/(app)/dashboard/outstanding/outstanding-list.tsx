"use client";

import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";

import { DataState } from "@/components/shared/data-state";
import { PageHero } from "@/components/shared/page-hero";
import { useAuth } from "@/lib/auth/auth-context";
import { useOutstandingMemberships } from "@/lib/hooks/use-analytics";
import { useBranches } from "@/lib/hooks/use-branches";
import { displayCurrencyAmount } from "@/lib/utils";

import { shortDay } from "../gym-day";

/** The dashboard's "Outstanding amount", opened: same branch, same rows. */
export function outstandingHref(branchId?: string) {
  return branchId ? `/dashboard/outstanding?branch=${encodeURIComponent(branchId)}` : "/dashboard/outstanding";
}

/**
 * Every membership with money still owed on it, largest first. The list
 * and the dashboard's total come from one calculation on the server
 * (plan price minus payments, net of refunds), so they always agree.
 */
export function OutstandingList({ branchId }: { branchId?: string }) {
  const { hasPermission } = useAuth();
  const canView = hasPermission("reports.view");
  const query = useOutstandingMemberships(branchId, { enabled: canView });
  const branches = useBranches({ pageSize: 100 }, { enabled: Boolean(branchId) && hasPermission("branches.read") });
  const branchName = branchId ? branches.data?.items.find((b) => b.id === branchId)?.name : undefined;

  const rows = query.data ?? [];
  const totals = new Map<string, number>();
  for (const row of rows) totals.set(row.currency, (totals.get(row.currency) ?? 0) + Number(row.outstanding));
  const totalText = [...totals.entries()].map(([code, sum]) => displayCurrencyAmount(sum, code)).join(" + ");

  return (
    <div className="flex flex-col gap-5 pb-10 sm:gap-6">
      <Link
        href="/dashboard"
        aria-label="Back to dashboard"
        className="inline-flex min-h-11 w-fit items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Dashboard
      </Link>

      <PageHero
        icon={Scale}
        accent="amber"
        eyebrow="Finance"
        title="Outstanding dues"
        description={`Members who still owe on a membership · ${branchId ? (branchName ?? "One branch") : "All branches"}`}
      />

      {!canView ? (
        <div className="rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">
            Your role can&apos;t see this list.
          </p>
        </div>
      ) : (
        <section aria-label="Outstanding balances" className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
          <DataState
            isLoading={query.isPending}
            isError={query.isError}
            onRetry={() => void query.refetch()}
            errorMessage="The outstanding balances could not be loaded."
            isEmpty={rows.length === 0}
            emptyTitle="Nothing owed"
            emptyDescription="Every current membership is paid up."
            skeletonRows={5}
          >
            <div className="border-b border-amber-200/60 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-4 sm:px-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700">
                Total still owed
              </p>
              <p className="mt-1 text-2xl font-extrabold tracking-tight tabular-nums text-foreground">
                {totalText || "—"}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-muted-foreground">
                outstanding on {rows.length} membership{rows.length === 1 ? "" : "s"} · largest first
              </p>
            </div>
            <ul className="flex flex-col gap-2 p-4 sm:p-6">
              {rows.map((row) => (
                <li key={row.membershipId} className="flex min-h-11 items-center gap-3 rounded-2xl border border-border/70 bg-card p-3 transition hover:-translate-y-0.5 hover:shadow-md">
                  <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-extrabold text-white shadow-sm">
                    {(row.member.firstName?.[0] ?? "?").toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/members/${row.member.id}`}
                      className="font-semibold text-foreground [overflow-wrap:anywhere] hover:underline"
                    >
                      {`${row.member.firstName} ${row.member.lastName}`.trim()}
                    </Link>
                    <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">
                      {[
                        row.planName,
                        row.member.phone,
                        `ends ${shortDay(row.endDate.slice(0, 10))}`,
                        branchId ? null : row.branch?.name,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-sm">
                    <p className="inline-flex rounded-full bg-rose-500/10 px-2.5 py-1 font-bold tabular-nums text-rose-600 ring-1 ring-rose-500/20">
                      {displayCurrencyAmount(row.outstanding, row.currency)}
                    </p>
                    <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                      paid {displayCurrencyAmount(row.paid, row.currency)} of {displayCurrencyAmount(row.price, row.currency)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </DataState>
        </section>
      )}
    </div>
  );
}

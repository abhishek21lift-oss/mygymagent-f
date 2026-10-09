"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressRing } from "@/components/shared/progress-ring";
import { usePtPackages, usePtWallet } from "@/lib/hooks/use-pt-packages";
import { usePtAdherence } from "@/lib/hooks/use-analytics";

/**
 * Session wallet for the member's current package: totals, remaining and
 * the deduction ledger. Renders nothing when there is no package — the
 * sessions list below is the source of truth, this is the summary.
 */
export function PtWalletCard({ memberId }: { memberId: string }) {
 const packages = usePtPackages(memberId);
 const active =
 (packages.data ?? []).find((p) => p.status === "ACTIVE") ??
 (packages.data ?? [])[0];
 const wallet = usePtWallet(active?.id ?? null, { enabled: Boolean(active) });
 const endDate = active?.endDate;
 const daysLeft = React.useMemo(
  () =>
   !endDate
    ? 0
    : Math.max(
       0,
       Math.ceil(
        (new Date(endDate).getTime() - new Date().getTime()) / 86400000,
       ),
      ),
  // The wall clock is read once per package, not per render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [active?.id],
 );

 if (packages.isLoading) return <Skeleton className="h-28 w-full rounded-2xl" />;
 if (packages.isError || !active) return null;
 if (wallet.isLoading) return <Skeleton className="h-28 w-full rounded-2xl" />;
 if (wallet.isError || !wallet.data) return null;

 const totals = wallet.data.totals;
 const pct = totals.total > 0 ? Math.round((totals.used / totals.total) * 100) : 0;
 return (
 <div
 aria-label="Session wallet"
 className="rounded-2xl border border-border bg-card p-4 shadow-sm"
 >
 <div className="flex items-baseline justify-between gap-2">
 <p className="min-w-0 truncate text-sm font-semibold tracking-tight">
 {active.name}
 </p>
 <p className="shrink-0 text-sm font-extrabold tabular-nums">
 {totals.remaining}
 <span className="font-medium text-muted-foreground"> / {totals.total} left</span>
 </p>
 </div>
 <div
 className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
 role="presentation"
 >
 <div
 className="h-full rounded-full"
 style={{
 width: `${pct}%`,
 background: "linear-gradient(135deg, var(--a-violet-grad-1), var(--a-violet-grad-2))",
 }}
 />
 </div>
 <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
 <span><strong className="tabular-nums text-foreground">{totals.completed}</strong> completed</span>
 <span><strong className="tabular-nums text-foreground">{totals.scheduled}</strong> scheduled</span>
 {(totals.cancelled > 0 || totals.noShow > 0) && (
 <span><strong className="tabular-nums text-foreground">{totals.cancelled + totals.noShow}</strong> missed</span>
 )}
 <span className="ml-auto">Expires in <strong className="tabular-nums text-foreground">{daysLeft}d</strong></span>
 </div>
 </div>
 );
}

/**
 * Adherence strip: PT completion rate, recent training volume and visit
 * streak. Shows "insufficient data" instead of a percentage off noise.
 */
export function PtAdherenceStrip({ memberId }: { memberId: string }) {
 const adherence = usePtAdherence(memberId);
 if (adherence.isLoading) return <Skeleton className="h-16 w-full rounded-2xl" />;
 if (adherence.isError || !adherence.data) return null;
 const data = adherence.data;
 if (data.insufficientData) {
 return (
 <p className="rounded-2xl border border-dashed border-border px-4 py-3 text-center text-xs text-muted-foreground">
 Not enough training history yet to measure adherence.
 </p>
 );
 }
 return (
 <div
 aria-label="Program adherence"
 className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm"
 >
 <ProgressRing
 value={data.ptAdherencePct ?? 0}
 size={56}
 strokeWidth={7}
 label={data.ptAdherencePct === null ? "Adherence unavailable" : `Program adherence ${data.ptAdherencePct} percent`}
 />
 <div className="min-w-0 text-xs">
 <p className="text-sm font-extrabold tracking-tight">
 {data.ptAdherencePct === null ? "—" : `${data.ptAdherencePct}%`}
 <span className="ml-1.5 font-semibold text-muted-foreground">adherence</span>
 </p>
 <p className="mt-0.5 text-muted-foreground">
 {data.workoutsCompleted30d} workouts · {data.visits30d} visits · {data.weeklyStreak}-week streak
 </p>
 </div>
 </div>
 );
}

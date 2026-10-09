"use client";

import { CheckCircle2, Circle, Ruler, Target, TrendingUp } from "lucide-react";

import { PageHero } from "@/components/shared/page-hero";
import { DataState } from "@/components/shared/data-state";
import { Panel } from "@/components/shared/panel";
import { Badge } from "@/components/ui/badge";
import {
  usePortalProgress,
  type PortalGoal,
  type PortalMeasurement,
} from "@/lib/hooks/use-portal";

type MetricKey =
  | "weightKg"
  | "bodyFatPercent"
  | "muscleMassKg"
  | "waistCm"
  | "chestCm"
  | "hipCm";

const METRICS: ReadonlyArray<{ key: MetricKey; label: string; unit: string }> = [
  { key: "weightKg", label: "Weight", unit: "kg" },
  { key: "bodyFatPercent", label: "Body fat", unit: "%" },
  { key: "muscleMassKg", label: "Muscle mass", unit: "kg" },
  { key: "waistCm", label: "Waist", unit: "cm" },
  { key: "chestCm", label: "Chest", unit: "cm" },
  { key: "hipCm", label: "Hip", unit: "cm" },
];

const num = (v: string | null) => (v === null ? null : Number(v));

function fmt(value: number, unit: string) {
  return `${Number.isInteger(value) ? value : value.toFixed(1)} ${unit}`;
}

/**
 * The latest reading for each metric and how far it has moved since the
 * first one. Deliberately uncoloured: whether a falling weight is good
 * news depends on the member's goal, and a green arrow on a lifter's
 * bulk would be telling them the opposite of the truth.
 */
function Latest({ measurements }: { measurements: PortalMeasurement[] }) {
  const tiles = METRICS.flatMap(({ key, label, unit }) => {
    const series = measurements
      .map((m) => num(m[key]))
      .filter((v): v is number => v !== null && Number.isFinite(v));
    if (series.length === 0) return [];
    // Newest first, so the latest is [0] and the first reading is last.
    const latest = series[0];
    const first = series[series.length - 1];
    const change = series.length > 1 ? latest - first : null;
    return [{ key, label, unit, latest, change }];
  });

  if (tiles.length === 0) return null;
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {tiles.map((t) => (
        <div key={t.key} className="rounded-lg border border-border bg-card px-4 py-3">
          <dt className="text-xs text-muted-foreground">{t.label}</dt>
          <dd className="mt-1 text-xl font-semibold tabular-nums">
            {fmt(t.latest, t.unit)}
          </dd>
          {t.change !== null && (
            <dd className="mt-0.5 text-xs text-muted-foreground tabular-nums">
              {t.change === 0
                ? "No change since first"
                : `${t.change > 0 ? "+" : "−"}${fmt(Math.abs(t.change), t.unit)} since first`}
            </dd>
          )}
        </div>
      ))}
    </dl>
  );
}

const GOAL_STATUS: Record<PortalGoal["status"], { label: string; variant: "secondary" | "outline" | "default" }> = {
  ACTIVE: { label: "In progress", variant: "secondary" },
  ACHIEVED: { label: "Achieved", variant: "default" },
  PAUSED: { label: "Paused", variant: "outline" },
  ABANDONED: { label: "Stopped", variant: "outline" },
};

function GoalCard({ goal }: { goal: PortalGoal }) {
  const target = num(goal.targetValue);
  const baseline = num(goal.baselineValue);
  const status = GOAL_STATUS[goal.status];
  return (
    <li className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{goal.title}</p>
          {goal.description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{goal.description}</p>
          )}
        </div>
        <Badge variant={status.variant} className="shrink-0 rounded-full">
          {status.label}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        {target !== null && (
          <>
            Target {fmt(target, goal.targetUnit ?? "")}
            {baseline !== null && <> · from {fmt(baseline, goal.targetUnit ?? "")}</>}
          </>
        )}
        {goal.targetDate && (
          <>
            {target !== null ? " · " : ""}by {new Date(goal.targetDate).toLocaleDateString()}
          </>
        )}
        {goal.achievedAt && <> · achieved {new Date(goal.achievedAt).toLocaleDateString()}</>}
      </p>
      {goal.milestones.length > 0 && (
        <ul className="flex flex-col gap-1.5 pl-0.5">
          {goal.milestones.map((m) => (
            <li key={m.id} className="flex items-center gap-2 text-xs">
              {m.achievedAt ? (
                <CheckCircle2 className="size-4 shrink-0 text-primary" aria-label="Reached" />
              ) : (
                <Circle className="size-4 shrink-0 text-muted-foreground" aria-label="Not reached yet" />
              )}
              <span className={m.achievedAt ? "" : "text-muted-foreground"}>{m.title}</span>
              {m.targetDate && !m.achievedAt && (
                <span className="text-muted-foreground">
                  · by {new Date(m.targetDate).toLocaleDateString()}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function History({ measurements }: { measurements: PortalMeasurement[] }) {
  // Only the columns this member actually has readings for: a table of
  // dashes for metrics the gym never measures is noise.
  const columns = METRICS.filter(({ key }) => measurements.some((m) => m[key] !== null));
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="sr-only">Every measurement recorded, newest first</caption>
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th scope="col" className="px-4 py-2 font-medium sm:px-5">Date</th>
            {columns.map((c) => (
              <th key={c.key} scope="col" className="px-3 py-2 text-right font-medium">
                {c.label} <span className="font-normal">({c.unit})</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {measurements.map((m) => (
            <tr key={m.id}>
              <th scope="row" className="whitespace-nowrap px-4 py-2 text-left font-normal sm:px-5">
                {new Date(m.recordedAt).toLocaleDateString()}
              </th>
              {columns.map((c) => {
                const v = num(m[c.key]);
                return (
                  <td key={c.key} className="px-3 py-2 text-right tabular-nums">
                    {v === null ? <span className="text-muted-foreground">—</span> : v}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PortalProgress() {
  const progress = usePortalProgress();
  const measurements = progress.data?.measurements ?? [];
  const goals = progress.data?.goals ?? [];

  return (
    <div className="flex flex-col gap-4">
      <PageHero icon={TrendingUp} title="Progress" />
      <DataState
        isLoading={progress.isPending}
        isError={progress.isError}
        onRetry={() => void progress.refetch()}
        errorMessage="Your progress could not be loaded."
        isEmpty={measurements.length === 0 && goals.length === 0}
        emptyIcon={Target}
        emptyTitle="Nothing recorded yet"
        emptyDescription="Once your trainer sets goals or takes measurements with you, they will show up here."
        skeletonRows={4}
      >
        <div className="flex flex-col gap-4">
          <Panel title="Goals" titleId="portal-goals">
            {goals.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No goals set yet. Ask your trainer to set one with you.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {goals.map((g) => (
                  <GoalCard key={g.id} goal={g} />
                ))}
              </ul>
            )}
          </Panel>

          {measurements.length > 0 && (
            <>
              <Latest measurements={measurements} />
              <Panel
                title="Measurement history"
                titleId="portal-measurements"
                description={`${measurements.length} recorded`}
                actions={<Ruler className="size-4 text-muted-foreground" aria-hidden="true" />}
                flush
              >
                <History measurements={measurements} />
              </Panel>
            </>
          )}
        </div>
      </DataState>
    </div>
  );
}

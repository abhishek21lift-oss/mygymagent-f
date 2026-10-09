"use client";

import Link from "next/link";
import { CalendarDays, UserCheck } from "lucide-react";

import { BentoCard, BentoGrid, SectionHeader } from "@/components/shared/bento";
import { ProgressRing } from "@/components/shared/progress-ring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type {
  ClassCapacity,
  OperationsHealth,
  SchedulingConflict,
} from "@/lib/hooks/use-analytics";

const STATUS_META: Record<string, { label: string; fill: string; line: string }> = {
  healthy: { label: "Healthy", fill: "var(--success)", line: "Operations are running clean." },
  stable: { label: "Stable", fill: "var(--info)", line: "Steady, with a few things to watch." },
  "needs-attention": { label: "Needs attention", fill: "var(--warning)", line: "Operational issues need action." },
  critical: { label: "Critical", fill: "var(--destructive)", line: "Critical issues need action now." },
  unknown: { label: "Unknown", fill: "var(--muted-foreground)", line: "Not enough operational data yet." },
};

function bandFill(score: number): string {
  if (score >= 80) return "var(--success)";
  if (score >= 60) return "var(--info)";
  if (score >= 40) return "var(--warning)";
  return "var(--destructive)";
}

const BAND_BADGE: Record<string, "warning" | "secondary" | "success" | "destructive"> = {
  UNDERUTILIZED: "secondary",
  HEALTHY: "success",
  HIGH_DEMAND: "warning",
  OVERBOOKED_RISK: "destructive",
  UNKNOWN: "secondary",
};

export function OperationsHero({
  health,
  isLoading,
  isError,
  onRetry,
}: {
  health: OperationsHealth | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const meta = STATUS_META[health?.status ?? "unknown"];
  const topIssue = health?.components.find(
    (c) => c.score !== null && c.score < 60,
  );
  const summary =
    health?.status === "unknown" || !topIssue
      ? meta.line
      : `${meta.line} ${topIssue.label}: ${topIssue.value}.`;

  return (
    <section
      aria-labelledby="operations-title"
      className="hero-banner mb-4"
    >

      <div className="relative flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <div className="min-w-0 flex-1 [--foreground:#fff] [--muted-foreground:rgb(255_255_255/0.82)]">

          <h1
            id="operations-title"
            className="mt-2 text-xl font-black tracking-tight text-foreground sm:text-2xl"
          >
            Operations
          </h1>
          {!isLoading && !isError && (
            <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">{summary}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            <Button asChild size="sm" className="rounded-xl shadow-xs">
              <Link href="/calendar">
                <CalendarDays className="mr-1.5 size-4" aria-hidden="true" />
                View schedule
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-2">
          {isLoading ? (
            <div
              className="size-20 animate-pulse rounded-full bg-muted/60"
              aria-label="Loading operations health"
            />
          ) : isError ? (
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs font-semibold text-muted-foreground">
                Could not load operations health
              </p>
              <Button size="sm" variant="outline" onClick={onRetry}>
                Retry
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-3xl border border-white/60 bg-white/90 p-3 shadow-2xs dark:border-white/10 dark:bg-card/80">
              <ProgressRing
                value={health?.score ?? 0}
                size={72}
                strokeWidth={10}
                tone="auto"
                label={
                  health?.score === null || health?.score === undefined
                    ? "Operations health unavailable"
                    : `Operations health ${health.score} out of 100, ${meta.label}`
                }
              />
              <span
                className="rounded-full px-3 py-1 font-mono text-xs font-bold text-white shadow-2xs"
                style={{ background: meta.fill }}
              >
                {health?.score ?? "—"} · {meta.label}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function OperationsHealthPanels({
  health,
  isLoading,
  isError,
  onRetry,
}: {
  health: OperationsHealth | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  if (isLoading) {
    return (
      <section aria-label="Operations health breakdown">
        <SectionHeader title="Why this score" />
        <BentoCard>
          <Skeleton className="h-5 w-2/3 rounded-lg" aria-label="Loading breakdown" />
          <div className="mt-3 space-y-3" aria-hidden="true">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </BentoCard>
      </section>
    );
  }
  if (isError || !health) {
    return (
      <section aria-label="Operations health breakdown">
        <SectionHeader title="Why this score" />
        <BentoCard>
          <p className="text-sm font-semibold">Could not load the breakdown.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 min-h-11"
            onClick={onRetry}
          >
            Retry
          </Button>
        </BentoCard>
      </section>
    );
  }
  return (
    <>
      <section aria-label="Why this score">
        <SectionHeader
          title="Why this score"
          action={
            health.opportunity ? (
              <span className="kpi-trend kpi-trend-neutral">
                Biggest opportunity:{" "}
                {health.components.find((c) => c.key === health.opportunity)?.label}
              </span>
            ) : undefined
          }
        />
        <BentoCard>
          <ul className="divide-y divide-border">
            {health.components.map((component) => (
              <li key={component.key} className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold tracking-tight text-foreground">
                    {component.label}
                    <span className="ml-2 font-normal text-muted-foreground">
                      · {component.value}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums",
                      component.score === null ? "bg-muted text-muted-foreground" : "text-white",
                    )}
                    style={component.score === null ? undefined : { background: bandFill(component.score) }}
                  >
                    {component.score ?? "—"}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="presentation">
                  {component.score !== null && (
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${component.score}%`, background: bandFill(component.score) }}
                    />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {component.explanation} <span className="font-mono">[{component.source}]</span>
                </p>
              </li>
            ))}
          </ul>
        </BentoCard>
      </section>

      {health.staffAway.length > 0 && (
        <section aria-label="Staff away today">
          <SectionHeader title="Away today" />
          <BentoCard>
            <ul className="flex flex-wrap gap-2">
              {health.staffAway.map((person) => (
                <li
                  key={`${person.name}-${person.type}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold"
                >
                  <UserCheck className="size-3.5 text-muted-foreground" aria-hidden="true" />
                  {person.name}
                  <span className="font-normal text-muted-foreground">· {person.type}</span>
                </li>
              ))}
            </ul>
          </BentoCard>
        </section>
      )}
    </>
  );
}

export function CapacityBoard({
  capacity,
  isLoading,
  isError,
  onRetry,
}: {
  capacity: ClassCapacity | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  if (isLoading) {
    return (
      <section aria-label="Class capacity">
        <SectionHeader title="Class capacity" />
        <BentoCard>
          <Skeleton className="h-24 w-full rounded-xl" aria-label="Loading capacity" />
        </BentoCard>
      </section>
    );
  }
  if (isError || !capacity) {
    return (
      <section aria-label="Class capacity">
        <SectionHeader title="Class capacity" />
        <BentoCard>
          <p className="text-sm font-semibold">Could not load capacity.</p>
          <Button type="button" variant="outline" size="sm" className="mt-3 min-h-11" onClick={onRetry}>
            Retry
          </Button>
        </BentoCard>
      </section>
    );
  }
  if (capacity.upcoming.length === 0) {
    return (
      <section aria-label="Class capacity">
        <SectionHeader title="Class capacity" />
        <BentoCard>
          <p className="text-sm text-muted-foreground">No sessions scheduled in the next 7 days.</p>
        </BentoCard>
      </section>
    );
  }
  return (
    <section aria-label="Class capacity">
      <SectionHeader title="Class capacity" action={<span className="kpi-trend kpi-trend-neutral">Next 7 days</span>} />
      <BentoGrid columns={2} label="Upcoming class sessions">
        {capacity.upcoming.slice(0, 6).map((session) => (
          <BentoCard key={session.sessionId} accent="cyan">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold tracking-tight">{session.programName}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(session.startTime).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
                  {" · "}
                  {new Date(session.startTime).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                </p>
              </div>
              <Badge variant={BAND_BADGE[session.band]}>{session.band.replace("_", " ")}</Badge>
            </div>
            <div className="mt-3 flex items-baseline justify-between text-xs">
              <span className="font-bold tabular-nums">
                {session.capacity === null ? `${session.booked} booked` : `${session.booked} / ${session.capacity}`}
              </span>
              <span className="tabular-nums text-muted-foreground">
                {session.utilizationPct === null ? "No capacity set" : `${session.utilizationPct}% full`}
                {session.waitlisted > 0 && ` · ${session.waitlisted} waiting`}
              </span>
            </div>
            {session.utilizationPct !== null && (
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted" role="presentation">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, session.utilizationPct)}%`,
                    background: "linear-gradient(135deg, var(--a-cyan-grad-1), var(--a-cyan-grad-2))",
                  }}
                />
              </div>
            )}
          </BentoCard>
        ))}
      </BentoGrid>
      {capacity.demand.some((d) => d.avgUtilizationPct !== null) && (
        <BentoCard className="mt-3">
          <h3 className="section-title mb-2">8-week demand</h3>
          <ul className="flex flex-col gap-2">
            {capacity.demand
              .filter((d) => d.avgUtilizationPct !== null)
              .slice(0, 5)
              .map((d) => (
                <li key={d.programId} className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-semibold">{d.programName}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {d.avgUtilizationPct}% avg · {d.sessionsCount} sessions
                  </span>
                </li>
              ))}
          </ul>
        </BentoCard>
      )}
    </section>
  );
}

export function ConflictsList({
  conflicts,
  isLoading,
  isError,
  onRetry,
}: {
  conflicts: SchedulingConflict[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  if (isLoading) {
    return (
      <section aria-label="Scheduling conflicts">
        <SectionHeader title="Scheduling conflicts" />
        <BentoCard>
          <Skeleton className="h-16 w-full rounded-xl" aria-label="Loading conflicts" />
        </BentoCard>
      </section>
    );
  }
  if (isError) {
    return (
      <section aria-label="Scheduling conflicts">
        <SectionHeader title="Scheduling conflicts" />
        <BentoCard>
          <p className="text-sm font-semibold">Could not load conflicts.</p>
          <Button type="button" variant="outline" size="sm" className="mt-3 min-h-11" onClick={onRetry}>
            Retry
          </Button>
        </BentoCard>
      </section>
    );
  }
  if (!conflicts || conflicts.length === 0) {
    return (
      <section aria-label="Scheduling conflicts">
        <SectionHeader title="Scheduling conflicts" />
        <BentoCard>
          <p className="text-sm text-muted-foreground">No double-bookings in the next 7 days.</p>
        </BentoCard>
      </section>
    );
  }
  return (
    <section aria-label="Scheduling conflicts">
      <SectionHeader
        title="Scheduling conflicts"
        action={<span className="kpi-trend kpi-trend-neutral">{conflicts.length} found</span>}
      />
      <div className="flex flex-col gap-3">
        {conflicts.map((conflict) => (
          <BentoCard key={conflict.userId} accent="rose">
            <p className="text-sm font-extrabold tracking-tight">
              {conflict.name} is double-booked
            </p>
            <ul className="mt-2 flex flex-col gap-1.5">
              {conflict.items.map((item) => (
                <li key={`${item.kind}-${item.id}`} className="flex flex-wrap items-baseline gap-x-2 text-xs">
                  <Badge variant="outline">{item.kind}</Badge>
                  <span className="font-semibold">{item.title}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {new Date(item.startTime).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
                    {" · "}
                    {new Date(item.startTime).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3">
              <Button asChild variant="outline" size="sm" className="min-h-11 rounded-xl">
                <Link href="/calendar">Open schedule</Link>
              </Button>
            </div>
          </BentoCard>
        ))}
      </div>
    </section>
  );
}

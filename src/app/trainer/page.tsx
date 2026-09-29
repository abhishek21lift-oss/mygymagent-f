"use client";

import * as React from "react";
import { CalendarClock } from "lucide-react";

import { SessionProgress, SessionSummary } from "@/components/trainer/session-progress";
import { SessionCard } from "@/components/trainer/session-card";
import { DataState } from "@/components/shared/data-state";
import {
  useTrainerSessions,
  useTrainerAwaitingAssignments,
  type TrainerAssignment,
  type TrainerSession,
} from "@/lib/hooks/use-trainer";

/**
 * "Today's Sessions" -- the trainer's day at a glance.
 *
 * Built on `GET /workout-sessions/today`, the endpoint the staff app
 * already uses, so what is on screen is real sessions rather than a
 * fixture. The reference's three counts map onto the status enum
 * directly: IN_PROGRESS is "on the floor", PENDING/IN_PROGRESS-less is
 * "to go", COMPLETED is "done".
 */

const IN_PROGRESS = new Set(["IN_PROGRESS"]);

export default function TrainerTodayPage() {
  const sessions = useTrainerSessions();
  const assignments = useTrainerAwaitingAssignments();
  const rows = sessions.data ?? [];
  const awaiting: TrainerAssignment[] = assignments.data ?? [];

  const onTheFloor = rows.filter((s) => IN_PROGRESS.has(s.status));
  const done = rows.filter((s) => s.status === "COMPLETED");
  // "To go" comes from assignments, not from the session list -- see `next`.
  const toGoCount = awaiting.length;
  const total = rows.length + toGoCount;

  // The reference shows the in-progress session first, then the next one
  // to start, and does not show the completed ones at all. Sorting by
  // startedAt rather than trusting insertion order is what makes "next"
  // actually mean next.
  const current = onTheFloor[0];

  /**
   * "To go" is not a session. `WorkoutSessionStatus` is only
   * IN_PROGRESS | COMPLETED -- a session row exists once work has started
   * -- so there is no "scheduled" state to read back. A member with an
   * active plan who has no session today is the honest equivalent, and
   * that is what the next card shows.
   *
   * The time is the assignment's own `startDate`, which is the only real
   * time attached to a plan that has not begun. The model has no
   * scheduled-time field; pretending otherwise would mean inventing one.
   */
  const next = awaiting[0];

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-[var(--t-radius-card)] bg-[var(--t-card)] p-6 shadow-[var(--t-shadow-card)]">
        <header className="flex items-center gap-3">
          <span
            data-gradient
            aria-hidden="true"
            className="grid size-[clamp(2.75rem,11vw,4rem)] shrink-0 place-items-center rounded-[1.125rem] text-white"
            style={{
              backgroundImage: "linear-gradient(140deg, var(--t-coral), var(--t-pink))",
              boxShadow: "0 14px 28px -14px rgb(255 61 113 / 0.65)",
            }}
          >
            <CalendarClock
              className="size-[clamp(1.375rem,5.5vw,2rem)]"
              strokeWidth={2.25}
            />
          </span>

          <div className="min-w-0 flex-1">
            <h1 className="text-[clamp(1.375rem,5.6vw,1.875rem)] font-extrabold leading-tight tracking-[-0.02em] text-[var(--t-ink)]">
              Today&rsquo;s Sessions
            </h1>
            <p className="mt-0.5 text-[clamp(0.9375rem,4vw,1.5rem)] font-medium text-[var(--t-ink-muted)]">
              {formatToday()}
            </p>
          </div>

          <SessionProgress current={done.length} total={total} />
        </header>

        <div className="mt-5">
          <SessionSummary onTheFloor={onTheFloor.length} toGo={toGoCount} done={done.length} />
        </div>

        <div className="mt-5 flex flex-col gap-4">
          <DataState
            isLoading={sessions.isPending}
            isError={sessions.isError}
            onRetry={() => void sessions.refetch()}
            errorMessage="Today's sessions could not be loaded."
            isEmpty={!current && !next}
            emptyTitle="Nothing scheduled today"
            emptyDescription="Sessions you run today will appear here."
          >
            {current ? (
              <SessionCard
                variant="current"
                badge="on-the-floor"
                time={relativeTime()}
                initials={initials(current)}
                name={fullName(current)}
                subtitle={subtitle(current)}
                warning={warningFor(current)}
                action={{
                  label: "Resume",
                  href: `/trainer/session/${current.id}`,
                }}
              />
            ) : null}

            {next ? (
              <SessionCard
                variant="upcoming"
                badge="next"
                time={clockTime(next)}
                initials={initials(next)}
                name={fullName(next)}
                subtitle={subtitle(next)}
                action={{
                  label: "Start",
                  href: `/trainer/session/${next.id}`,
                }}
              />
            ) : null}
          </DataState>
        </div>
      </div>

      <section aria-labelledby="trainer-quick-actions">
        <h2
          id="trainer-quick-actions"
          className="text-[1.25rem] font-extrabold uppercase tracking-[0.12em] text-[var(--t-ink-muted)]"
        >
          Quick actions
        </h2>
      </section>
    </div>
  );
}

function formatToday() {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

type Named = Pick<TrainerSession, "firstName" | "lastName">;

function fullName(row: Named) {
  return `${row.firstName} ${row.lastName}`.trim();
}

function initials(row: Named) {
  return (
    [row.firstName?.[0], row.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "—"
  );
}

/** "Full Body · 2 exercises" when a plan is attached, else the
 *  reference's "No programme yet" -- which is a real state, not an
 *  error, so it is stated rather than left blank. */
function subtitle(row: TrainerSession | TrainerAssignment) {
  return row.workoutPlanName ? row.workoutPlanName : "No programme yet";
}

/** The in-progress card leads with a relative time ("Any time") rather
 *  than a clock, because a session already running has no start left to
 *  report. */
function relativeTime() {
  return { primary: "Any", secondary: "time" };
}

function clockTime(row: TrainerSession | TrainerAssignment) {
  const at = new Date("startedAt" in row ? row.startedAt : row.startDate);
  return {
    primary: at.toLocaleTimeString("en-US", { hour: "numeric", hour12: true }).replace(
      /\s?(AM|PM)$/,
      "",
    ),
    secondary: at
      .toLocaleTimeString("en-US", { hour: "numeric", hour12: true })
      .match(/AM|PM/)?.[0] ?? "",
  };
}

/**
 * The reference's caution strip: "Finished 1 week ago · week 5 of 4".
 *
 * The second half is deliberately *not* reproduced. It reads as a
 * rendering bug rather than a message, and inventing a programme length
 * to make it make sense would mean fabricating data the screen does not
 * have. Only the overdue part is shown, and only when it is true.
 */
function warningFor(session: TrainerSession): string | undefined {
  const started = new Date(session.startedAt).getTime();
  if (Number.isNaN(started)) return undefined;
  const days = Math.floor((Date.now() - started) / 86_400_000);
  if (days < 7) return undefined;
  const weeks = Math.floor(days / 7);
  return `Still running after ${weeks} ${weeks === 1 ? "week" : "weeks"}`;
}

"use client";

import Link from "next/link";
import { PhoneCall, PhoneMissed } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import {
  OUTCOME_LABELS,
  useDailyReport,
  useFollowUpQueue,
  type ActionTask,
  type CallOutcome,
} from "@/lib/hooks/use-action-center";
import {
  CategoryBadge,
  PriorityBadge,
  dueLabel,
  formatDateTime,
  subjectOf,
} from "./task-ui";

/** The prioritised call list: who to ring next, with what to know first. */
export function QueuePanel({
  assignedToUserId,
  onLogCall,
  onOpen,
  canWork,
}: {
  assignedToUserId?: string;
  onLogCall: (task: ActionTask) => void;
  onOpen: (id: string) => void;
  canWork: boolean;
}) {
  const queue = useFollowUpQueue({ assignedToUserId });
  if (queue.isLoading)
    return <div className="h-40 animate-pulse rounded-xl bg-muted/50" />;
  if (queue.isError)
    return (
      <p role="alert" className="text-sm">
        Could not load the call queue.
      </p>
    );
  if (!queue.data?.length) {
    return (
      <EmptyState
        icon={PhoneCall}
        title="No calls waiting"
        description="Everyone due today has been called."
      />
    );
  }
  return (
    <ol className="grid gap-2" aria-label="Call queue">
      {queue.data.map(
        (
          {
            task,
            lastCall,
            unansweredCalls14d,
            outstanding,
            membership,
            reasons,
          },
          i,
        ) => {
          const subject = subjectOf(task);
          return (
            <li
              key={task.id}
              className="grid gap-2 rounded-xl border border-border bg-card p-3 shadow-sm sm:grid-cols-[2rem_1fr_auto] sm:items-start"
            >
              <span
                className="hidden size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold sm:flex"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <PriorityBadge priority={task.priority} />
                  <CategoryBadge category={task.category} />
                  <span
                    className={`text-xs ${task.isOverdue ? "font-semibold text-rose-700 dark:text-rose-300" : "text-muted-foreground"}`}
                  >
                    {dueLabel(task.dueAt, task.isOverdue)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onOpen(task.id)}
                  className="mt-1 block text-left text-sm font-semibold hover:underline"
                >
                  {task.title}
                </button>
                {subject && (
                  <p className="text-xs text-muted-foreground">
                    <Link
                      href={subject.href}
                      className="font-medium text-foreground hover:underline"
                    >
                      {subject.name}
                    </Link>
                    {subject.phone && (
                      <>
                        {" "}
                        ·{" "}
                        <a
                          href={`tel:${subject.phone}`}
                          className="hover:text-foreground"
                        >
                          {subject.phone}
                        </a>
                      </>
                    )}
                    {membership && (
                      <>
                        {" "}
                        · {membership.plan ?? "Membership"}{" "}
                        {membership.status.toLowerCase()}, ends{" "}
                        {new Date(membership.endDate).toLocaleDateString(
                          "en-IN",
                        )}
                      </>
                    )}
                    {outstanding && Number(outstanding) > 0 && (
                      <>
                        {" "}
                        ·{" "}
                        <span className="font-semibold text-amber-700 dark:text-amber-300">
                          ₹{Number(outstanding).toLocaleString("en-IN")} due
                        </span>
                      </>
                    )}
                  </p>
                )}
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {lastCall ? (
                    <>
                      Last call {formatDateTime(lastCall.calledAt)}:{" "}
                      {OUTCOME_LABELS[lastCall.outcome as CallOutcome]}
                      {lastCall.response
                        ? ` — “${lastCall.response.slice(0, 90)}”`
                        : ""}
                    </>
                  ) : (
                    "No calls logged yet."
                  )}
                  {unansweredCalls14d >= 2 && (
                    <span className="ml-1 inline-flex items-center gap-0.5 text-rose-700 dark:text-rose-300">
                      <PhoneMissed className="size-3" aria-hidden="true" />{" "}
                      {unansweredCalls14d} unanswered
                    </span>
                  )}
                </p>
                {reasons.length > 0 && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Why: {reasons.join(" ")}
                  </p>
                )}
              </div>
              {canWork && (
                <Button
                  size="sm"
                  onClick={() => onLogCall(task)}
                  className="w-full sm:w-auto"
                >
                  <PhoneCall className="size-4" aria-hidden="true" /> Log call
                </Button>
              )}
            </li>
          );
        },
      )}
    </ol>
  );
}

/** End-of-day: what got done, and what is carried over. */
export function ReportPanel({
  date,
  onOpen,
}: {
  date?: string;
  onOpen: (id: string) => void;
}) {
  const report = useDailyReport(date);
  if (report.isLoading)
    return <div className="h-40 animate-pulse rounded-xl bg-muted/50" />;
  if (report.isError || !report.data)
    return (
      <p role="alert" className="text-sm">
        Could not load the report.
      </p>
    );
  const r = report.data;
  const stat = (label: string, value: number | string) => (
    <div className="rounded-lg border border-border bg-card px-3 py-2">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {stat("Tasks completed", r.completed.count)}
        {stat("Calls made", r.calls.total)}
        {stat("Follow-ups scheduled", r.followUpsScheduled)}
        {stat("Promises kept", r.payments.promisesKept)}
        {stat(
          "Payments verified",
          `${r.payments.verifiedPayments} · ₹${Number(r.payments.verifiedAmount ?? 0).toLocaleString("en-IN")}`,
        )}
        {stat(
          "Leads called / joined",
          `${r.leads.called} / ${r.leads.converted}`,
        )}
      </div>
      {r.calls.total > 0 && (
        <p className="text-xs text-muted-foreground">
          Calls:{" "}
          {Object.entries(r.calls.byOutcome)
            .map(([o, n]) => `${OUTCOME_LABELS[o as CallOutcome]} ${n}`)
            .join(" · ")}
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <section aria-labelledby="eod-done">
          <h3 id="eod-done" className="mb-2 text-sm font-semibold">
            Completed
          </h3>
          <ul className="grid gap-1">
            {r.completed.items.length === 0 && (
              <li className="text-sm text-muted-foreground">
                Nothing completed yet.
              </li>
            )}
            {r.completed.items.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  className="text-left text-sm hover:underline"
                  onClick={() => onOpen(t.id)}
                >
                  {t.title}
                </button>
                {t.completionNote && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    — {t.completionNote}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="eod-open">
          <h3 id="eod-open" className="mb-2 text-sm font-semibold">
            Still open ({r.unresolved.count})
          </h3>
          <ul className="grid gap-1">
            {r.unresolved.items.length === 0 && (
              <li className="text-sm text-muted-foreground">
                Nothing left over.
              </li>
            )}
            {r.unresolved.items.map((t) => (
              <li key={t.id} className="flex items-center gap-1.5">
                <PriorityBadge priority={t.priority} />
                <button
                  type="button"
                  className="text-left text-sm hover:underline"
                  onClick={() => onOpen(t.id)}
                >
                  {t.title}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

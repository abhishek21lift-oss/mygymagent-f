"use client";

import * as React from "react";
import { PhoneCall, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import {
  OUTCOME_LABELS,
  useCallLogs,
  useRetryAnalysis,
  type CallLog,
} from "@/lib/hooks/use-action-center";
import { LogCallDialog } from "./log-call-dialog";
import { formatDateTime, personName } from "./task-ui";

function AnalysisLine({ call }: { call: CallLog }) {
  const retry = useRetryAnalysis();
  const { hasPermission } = useAuth();
  async function again() {
    try {
      await retry.mutateAsync(call.id);
      toast.success("Analysing the note again");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Could not retry.",
      );
    }
  }
  if (call.analysisStatus === "NOT_REQUESTED") return null;
  if (call.analysisStatus === "PENDING") {
    return (
      <p className="text-xs text-muted-foreground">
        <Sparkles className="mr-1 inline size-3" aria-hidden="true" />
        AI is reading the note…
      </p>
    );
  }
  if (call.analysisStatus === "FAILED") {
    return (
      <p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        AI analysis unavailable
        {call.analysisError ? `: ${call.analysisError}` : ""}.
        {hasPermission("tasks.work") && (
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs"
            onClick={again}
            disabled={retry.isPending}
          >
            <RefreshCw className="size-3" aria-hidden="true" /> Retry
          </Button>
        )}
      </p>
    );
  }
  const a = call.analysis;
  return (
    <div className="rounded-md bg-violet-50/60 px-2 py-1.5 text-xs text-violet-900 dark:bg-violet-500/10 dark:text-violet-100">
      <p>
        <Sparkles className="mr-1 inline size-3" aria-hidden="true" />
        {a?.summary}
      </p>
      {a?.objections && a.objections.length > 0 && (
        <p className="mt-0.5">Objections: {a.objections.join("; ")}</p>
      )}
      {call.proposals.length > 0 && (
        <p className="mt-0.5">
          Suggestions:{" "}
          {call.proposals
            .map((p) => `${p.title} (${p.status.toLowerCase()})`)
            .join(" · ")}
        </p>
      )}
    </div>
  );
}

/** A member's or lead's call history, with a button to log the next one. */
export function CallsPanel({
  memberId,
  leadId,
  label,
}: {
  memberId?: string;
  leadId?: string;
  label: string;
}) {
  const { hasPermission } = useAuth();
  const canRead = hasPermission("tasks.read");
  const canWork = hasPermission("tasks.work");
  const calls = useCallLogs({ memberId, leadId }, { enabled: canRead });
  const [open, setOpen] = React.useState(false);
  const subject = memberId
    ? { kind: "member" as const, id: memberId, label }
    : leadId
      ? { kind: "lead" as const, id: leadId, label }
      : null;

  if (!canRead) {
    return (
      <EmptyState
        icon={PhoneCall}
        title="Call history needs task access"
        description="Ask a manager for Action Center access to see and log calls."
      />
    );
  }

  return (
    <section aria-label="Calls" className="grid gap-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="section-title">Calls</h3>
        {canWork && subject && (
          <Button size="sm" onClick={() => setOpen(true)}>
            <PhoneCall className="size-4" aria-hidden="true" /> Log a call
          </Button>
        )}
      </div>
      {calls.isLoading && (
        <div className="h-24 animate-pulse rounded-lg bg-muted/50" />
      )}
      {calls.isError && (
        <p role="alert" className="text-sm">
          Could not load calls.
        </p>
      )}
      {calls.data && calls.data.items.length === 0 && (
        <EmptyState
          icon={PhoneCall}
          title="No calls logged yet"
          description="Calls logged from here or the Action Center appear in this list."
        />
      )}
      {calls.data && calls.data.items.length > 0 && (
        <ol className="grid gap-2">
          {calls.data.items.map((c) => (
            <li
              key={c.id}
              className="grid gap-1 rounded-lg border border-border bg-card px-3 py-2"
            >
              <div className="flex flex-wrap items-center gap-x-2 text-sm">
                <span className="font-semibold">
                  {OUTCOME_LABELS[c.outcome]}
                </span>
                <span className="text-xs text-muted-foreground">
                  {c.direction === "INBOUND" ? "Incoming" : "Outgoing"} ·{" "}
                  {formatDateTime(c.calledAt)} ·{" "}
                  {personName(c.recordedByUser) || "—"}
                  {c.editedAt ? " · edited" : ""}
                </span>
              </div>
              {c.reason && (
                <p className="text-xs text-muted-foreground">
                  Reason: {c.reason}
                </p>
              )}
              {c.response && <p className="text-sm">“{c.response}”</p>}
              {c.internalNotes && (
                <p className="text-xs text-muted-foreground">
                  Note: {c.internalNotes}
                </p>
              )}
              {(c.amountDiscussed ||
                c.promisedPaymentDate ||
                c.nextFollowUpAt) && (
                <p className="text-xs text-muted-foreground">
                  {c.amountDiscussed &&
                    `₹${Number(c.amountDiscussed).toLocaleString("en-IN")} discussed`}
                  {c.promisedPaymentDate &&
                    ` · promised for ${new Date(c.promisedPaymentDate).toLocaleDateString("en-IN")}`}
                  {c.nextFollowUpAt &&
                    ` · next follow-up ${formatDateTime(c.nextFollowUpAt)}`}
                </p>
              )}
              <AnalysisLine call={c} />
            </li>
          ))}
        </ol>
      )}
      <LogCallDialog open={open} onOpenChange={setOpen} subject={subject} />
    </section>
  );
}

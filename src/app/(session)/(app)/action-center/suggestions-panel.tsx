"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, Quote, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { ApiError } from "@/lib/api/client";
import {
  OUTCOME_LABELS,
  PRIORITY_LABELS,
  useApproveProposal,
  useProposals,
  useRejectProposal,
  type Proposal,
  type TaskPriority,
} from "@/lib/hooks/use-action-center";
import {
  Field,
  StaffSelect,
  formatDateTime,
  fromLocalInput,
  personName,
  toLocalInput,
} from "./task-ui";

const KIND_LABEL: Record<Proposal["kind"], string> = {
  FOLLOW_UP_CALL: "Follow-up call",
  PAYMENT_PROMISE: "Payment promise",
  RENEWAL_FOLLOW_UP: "Renewal follow-up",
  TRIAL_VISIT: "Trial visit",
  MANAGER_ESCALATION: "Manager escalation",
  OTHER: "Follow-up",
};

function ProposalCard({
  proposal,
  canAct,
}: {
  proposal: Proposal;
  canAct: boolean;
}) {
  const approve = useApproveProposal();
  const reject = useRejectProposal();
  const [title, setTitle] = React.useState(proposal.title);
  const [due, setDue] = React.useState(
    proposal.suggestedDueAt && !proposal.dueAtNeedsConfirmation
      ? toLocalInput(new Date(proposal.suggestedDueAt))
      : "",
  );
  const [priority, setPriority] = React.useState<TaskPriority>(
    proposal.suggestedPriority,
  );
  const [assignee, setAssignee] = React.useState<string | null>(null);
  const [amount, setAmount] = React.useState(proposal.amount ?? "");
  const isPromise = proposal.kind === "PAYMENT_PROMISE";
  const subject = proposal.callLog.member ?? proposal.callLog.lead;
  const href = proposal.callLog.member
    ? `/members/${proposal.callLog.member.id}`
    : proposal.callLog.lead
      ? `/crm/leads/${proposal.callLog.lead.id}`
      : null;

  async function doApprove() {
    const dueAt = fromLocalInput(due);
    if (!dueAt) {
      toast.error("Pick a date first — the note did not give a clear one.");
      return;
    }
    try {
      await approve.mutateAsync({
        id: proposal.id,
        title: title.trim() !== proposal.title ? title.trim() : undefined,
        dueAt,
        priority,
        assignedToUserId: assignee ?? undefined,
        amount: isPromise && amount ? Number(amount) : undefined,
      });
      toast.success("Added to the task list");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Could not approve.",
      );
    }
  }

  async function doReject() {
    try {
      await reject.mutateAsync({ id: proposal.id });
      toast.success("Suggestion dismissed");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Could not dismiss.",
      );
    }
  }

  return (
    <article className="grid gap-3 rounded-xl border border-border bg-card p-3.5 shadow-sm">
      <header className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {KIND_LABEL[proposal.kind]}
        </span>
        <span
          className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${proposal.explicit ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200" : "bg-violet-50 text-violet-800 dark:bg-violet-500/15 dark:text-violet-200"}`}
        >
          {proposal.explicit ? "Member said this" : "AI recommendation"}
        </span>
        <span className="ml-auto text-xs text-muted-foreground">
          {href ? (
            <Link
              href={href}
              className="font-medium text-foreground hover:underline"
            >
              {personName(subject)}
            </Link>
          ) : (
            "—"
          )}{" "}
          · {OUTCOME_LABELS[proposal.callLog.outcome]} ·{" "}
          {formatDateTime(proposal.callLog.calledAt)}
        </span>
      </header>

      {proposal.evidence && (
        <p className="flex gap-1.5 text-sm text-muted-foreground">
          <Quote className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>“{proposal.evidence}”</span>
        </p>
      )}
      {proposal.details && (
        <p className="text-xs text-muted-foreground">{proposal.details}</p>
      )}

      <div className="grid gap-2.5 sm:grid-cols-2">
        <Field label="Task" htmlFor={`p-title-${proposal.id}`}>
          <Input
            id={`p-title-${proposal.id}`}
            value={title}
            maxLength={160}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!canAct}
          />
        </Field>
        <Field label="Due" htmlFor={`p-due-${proposal.id}`}>
          <Input
            id={`p-due-${proposal.id}`}
            type="datetime-local"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            disabled={!canAct}
            aria-invalid={!due}
          />
          {proposal.dueAtNeedsConfirmation && (
            <span className="flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-300">
              <AlertCircle className="size-3" aria-hidden="true" /> The
              note&apos;s date was unclear — confirm it with the member.
            </span>
          )}
        </Field>
        <Field label="Priority" htmlFor={`p-priority-${proposal.id}`}>
          <Select
            value={priority}
            onValueChange={(v) => setPriority(v as TaskPriority)}
            disabled={!canAct}
          >
            <SelectTrigger id={`p-priority-${proposal.id}`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((p) => (
                <SelectItem key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Assign to" htmlFor={`p-assignee-${proposal.id}`}>
          <StaffSelect
            id={`p-assignee-${proposal.id}`}
            value={assignee}
            onChange={setAssignee}
            placeholder="Whoever logged the call"
          />
        </Field>
        {isPromise && (
          <Field
            label="Promised amount (₹)"
            htmlFor={`p-amount-${proposal.id}`}
            hint="Recorded as a promise. Nothing is marked paid until a payment is recorded."
          >
            <Input
              id={`p-amount-${proposal.id}`}
              type="number"
              min={1}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={!canAct}
            />
          </Field>
        )}
      </div>

      {canAct && (
        <footer className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={doApprove}
            disabled={approve.isPending || reject.isPending}
          >
            {approve.isPending ? "Adding…" : "Approve as task"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={doReject}
            disabled={approve.isPending || reject.isPending}
          >
            Reject
          </Button>
        </footer>
      )}
    </article>
  );
}

export function SuggestionsPanel({ canAct }: { canAct: boolean }) {
  const proposals = useProposals("PENDING");
  if (proposals.isLoading)
    return <div className="h-32 animate-pulse rounded-xl bg-muted/50" />;
  if (proposals.isError) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-border p-6 text-center text-sm"
      >
        Could not load AI suggestions.{" "}
        <Button variant="link" onClick={() => proposals.refetch()}>
          Retry
        </Button>
      </div>
    );
  }
  if (!proposals.data?.length) {
    return (
      <EmptyState
        icon={Sparkles}
        title="No suggestions waiting"
        description="When a call note mentions a promise or a callback, the AI suggests a task here for you to approve."
      />
    );
  }
  return (
    <div className="grid gap-3">
      <p className="text-xs text-muted-foreground">
        Suggestions are drafts from call notes. Nothing happens until you
        approve one, and approving only adds a task.
      </p>
      {proposals.data.map((p) => (
        <ProposalCard key={p.id} proposal={p} canAct={canAct} />
      ))}
    </div>
  );
}

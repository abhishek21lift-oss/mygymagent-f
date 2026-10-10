"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { PhoneCall } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MemberPicker } from "@/components/shared/member-picker";
import { LeadPicker } from "@/app/(session)/(app)/members/new/lead-picker";
import { ApiError, api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import {
  OUTCOME_LABELS,
  PRIORITY_LABELS,
  useLogCall,
  type ActionTask,
  type CallOutcome,
  type TaskPriority,
} from "@/lib/hooks/use-action-center";
import type { Lead } from "@/lib/types/gym";
import {
  Field,
  StaffSelect,
  fromLocalInput,
  inHours,
  subjectOf,
  todayInput,
  toLocalInput,
} from "./task-ui";

type Subject = { kind: "member" | "lead"; id: string; label: string };

const OUTCOMES = Object.keys(OUTCOME_LABELS) as CallOutcome[];

interface RecentPayment {
  id: string;
  amount: string;
  createdAt: string;
  status: string;
}

/**
 * The receptionist's call form. What the member said goes in their own
 * words; the structured fields (promise, next follow-up) are what staff
 * decide, and the AI only ever suggests -- in the background, after save.
 */
function LogCallForm({
  open,
  onOpenChange,
  task,
  subject: fixedSubject,
  onLogged,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Logging a call for this worklist task. */
  task?: ActionTask | null;
  /** Or for this member/lead (from their profile). */
  subject?: Subject | null;
  onLogged?: () => void;
}) {
  const { hasPermission } = useAuth();
  const logCall = useLogCall();
  const taskSubject = task ? subjectOf(task) : null;
  const preset: Subject | null =
    fixedSubject ??
    (taskSubject
      ? { kind: taskSubject.kind, id: taskSubject.id, label: taskSubject.name }
      : null);

  const [kind, setKind] = React.useState<"member" | "lead">(
    preset?.kind ?? "member",
  );
  const [member, setMember] = React.useState<{
    id: string;
    label: string;
  } | null>(null);
  const [lead, setLead] = React.useState<Lead | null>(null);
  const [outcome, setOutcome] = React.useState<CallOutcome>("CONNECTED");
  const [direction, setDirection] = React.useState<"OUTBOUND" | "INBOUND">(
    "OUTBOUND",
  );
  const [calledAt, setCalledAt] = React.useState(toLocalInput(new Date()));
  const [reason, setReason] = React.useState(task ? task.title : "");
  const [response, setResponse] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [promisedDate, setPromisedDate] = React.useState("");
  const [followUp, setFollowUp] = React.useState("");
  const [priority, setPriority] = React.useState<TaskPriority>("MEDIUM");
  const [assignee, setAssignee] = React.useState<string | null>(null);
  const [paymentId, setPaymentId] = React.useState("");
  const [completeTask, setCompleteTask] = React.useState(true);

  const subject: Subject | null =
    preset ??
    (kind === "member" && member
      ? { kind: "member", id: member.id, label: member.label }
      : kind === "lead" && lead
        ? {
            kind: "lead",
            id: lead.id,
            label: `${lead.firstName} ${lead.lastName}`,
          }
        : null);

  const canSeePayments = hasPermission("payments.read");
  const payments = useQuery({
    queryKey: ["action-center", "payments-for-call", subject?.id],
    queryFn: () =>
      api.get<{ items: RecentPayment[] }>("/payments", {
        query: { memberId: subject!.id, pageSize: 10 },
      }),
    enabled:
      open &&
      outcome === "PAYMENT_COMPLETED" &&
      subject?.kind === "member" &&
      canSeePayments,
  });

  const needsPromise = outcome === "PAYMENT_PROMISED";
  const needsFollowUp =
    outcome === "CALL_BACK_REQUESTED" ||
    outcome === "NO_ANSWER" ||
    outcome === "BUSY";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!subject) {
      toast.error("Pick the member or lead you called.");
      return;
    }
    if (outcome === "PAYMENT_COMPLETED" && !paymentId) {
      toast.error(
        "Pick the recorded payment. A call cannot mark a payment as received.",
      );
      return;
    }
    if (needsPromise && promisedDate && !(Number(amount) > 0)) {
      toast.error("Enter the amount the member promised.");
      return;
    }
    try {
      await logCall.mutateAsync({
        memberId: subject.kind === "member" ? subject.id : undefined,
        leadId: subject.kind === "lead" ? subject.id : undefined,
        direction,
        calledAt: fromLocalInput(calledAt),
        outcome,
        reason: reason.trim() || undefined,
        response: response.trim() || undefined,
        internalNotes: notes.trim() || undefined,
        amountDiscussed: amount ? Number(amount) : undefined,
        promisedPaymentDate:
          needsPromise && promisedDate ? promisedDate : undefined,
        nextFollowUpAt: fromLocalInput(followUp),
        priority: followUp ? priority : undefined,
        assignedToUserId: assignee ?? undefined,
        paymentId: outcome === "PAYMENT_COMPLETED" ? paymentId : undefined,
        taskId: task?.id,
        completeTask: task ? completeTask : undefined,
      });
      toast.success(
        response.trim()
          ? "Call saved. AI suggestions will appear shortly."
          : "Call saved.",
      );
      onOpenChange(false);
      onLogged?.();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Could not save the call.",
      );
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <PhoneCall className="size-4" aria-hidden="true" /> Log a call
        </DialogTitle>
        <DialogDescription>
          {preset
            ? preset.label
            : "Record what happened. Write the member's reply in their own words."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={submit} className="grid gap-3.5">
        {!preset && (
          <div className="grid gap-2">
            <div
              role="radiogroup"
              aria-label="Who did you call?"
              className="inline-flex w-fit rounded-lg border border-border p-0.5"
            >
              {(["member", "lead"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={kind === k}
                  onClick={() => setKind(k)}
                  className={`min-h-9 rounded-md px-3 text-sm font-medium ${kind === k ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {k === "member" ? "Member" : "Lead / enquiry"}
                </button>
              ))}
            </div>
            {kind === "member" ? (
              <MemberPicker value={member} onChange={setMember} />
            ) : (
              <LeadPicker lead={lead} onChange={setLead} />
            )}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Outcome" htmlFor="call-outcome">
            <Select
              value={outcome}
              onValueChange={(v) => setOutcome(v as CallOutcome)}
            >
              <SelectTrigger id="call-outcome" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OUTCOMES.map((o) => (
                  <SelectItem key={o} value={o}>
                    {OUTCOME_LABELS[o]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="When" htmlFor="call-at">
              <Input
                id="call-at"
                type="datetime-local"
                value={calledAt}
                max={toLocalInput(new Date())}
                onChange={(e) => setCalledAt(e.target.value)}
              />
            </Field>
            <Field label="Direction" htmlFor="call-direction">
              <Select
                value={direction}
                onValueChange={(v) => setDirection(v as typeof direction)}
              >
                <SelectTrigger id="call-direction" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OUTBOUND">Outgoing</SelectItem>
                  <SelectItem value="INBOUND">Incoming</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </div>

        <Field label="Reason for the call" htmlFor="call-reason">
          <Input
            id="call-reason"
            value={reason}
            maxLength={200}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Renewal, dues, trial follow-up…"
          />
        </Field>

        <Field
          label="Member's response"
          htmlFor="call-response"
          hint="In their words, e.g. “Salary comes on 12 October, I'll pay ₹2,000.” No card or bank details."
        >
          <Textarea
            id="call-response"
            rows={3}
            value={response}
            maxLength={4000}
            onChange={(e) => setResponse(e.target.value)}
          />
        </Field>

        <Field label="Internal notes" htmlFor="call-notes">
          <Textarea
            id="call-notes"
            rows={2}
            value={notes}
            maxLength={4000}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>

        {(needsPromise || outcome === "RENEWAL_INTERESTED") && (
          <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-3 sm:grid-cols-2">
            <Field label="Amount discussed (₹)" htmlFor="call-amount">
              <Input
                id="call-amount"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Field>
            {needsPromise && (
              <Field
                label="Promised payment date"
                htmlFor="call-promised"
                hint="Creates a payment promise and a reminder on that day."
              >
                <Input
                  id="call-promised"
                  type="date"
                  min={todayInput()}
                  value={promisedDate}
                  onChange={(e) => setPromisedDate(e.target.value)}
                />
              </Field>
            )}
          </div>
        )}

        {outcome === "PAYMENT_COMPLETED" && (
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            {!canSeePayments ? (
              <p className="text-sm text-muted-foreground">
                Only a payment recorded under Billing can mark this as paid. Ask
                someone with billing access, or log the call as “Connected”.
              </p>
            ) : subject?.kind !== "member" ? (
              <p className="text-sm text-muted-foreground">
                Pick a member first.
              </p>
            ) : (
              <Field label="Recorded payment" htmlFor="call-payment">
                <Select value={paymentId} onValueChange={setPaymentId}>
                  <SelectTrigger id="call-payment" className="w-full">
                    <SelectValue
                      placeholder={
                        payments.isLoading
                          ? "Loading…"
                          : payments.data?.items.length
                            ? "Pick the payment"
                            : "No recent payments"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {payments.data?.items
                      .filter((p) => p.status !== "FAILED")
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          ₹{Number(p.amount).toLocaleString("en-IN")} ·{" "}
                          {new Date(p.createdAt).toLocaleDateString("en-IN")}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <Field
            label="Next follow-up"
            htmlFor="call-followup"
            hint={needsFollowUp ? "Suggested for this outcome." : undefined}
          >
            <div className="flex gap-1">
              <Input
                id="call-followup"
                type="datetime-local"
                value={followUp}
                min={toLocalInput(new Date())}
                onChange={(e) => setFollowUp(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {[
                ["+2h", 2],
                ["Tomorrow", 24],
                ["+3 days", 72],
              ].map(([label, hours]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setFollowUp(inHours(hours as number))}
                  className="rounded-md border border-border px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Priority" htmlFor="call-priority">
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as TaskPriority)}
            >
              <SelectTrigger id="call-priority" className="w-full">
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
          <Field label="Follow-up goes to" htmlFor="call-assignee">
            <StaffSelect
              id="call-assignee"
              value={assignee}
              onChange={setAssignee}
              placeholder="Me"
            />
          </Field>
        </div>

        {task && (
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={completeTask}
              onCheckedChange={(v) => setCompleteTask(v === true)}
            />
            Mark “{task.title}” as done
          </label>
        )}

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={logCall.isPending || !subject}>
            {logCall.isPending ? "Saving…" : "Save call"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function LogCallDialog(props: React.ComponentProps<typeof LogCallForm>) {
  const { open, onOpenChange, task, subject } = props;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-xl">
        {/* Remounted per opening (Radix unmounts closed content), so the
            form always starts empty. */}
        {open && (
          <LogCallForm
            key={`${task?.id ?? ""}:${subject?.id ?? ""}`}
            {...props}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

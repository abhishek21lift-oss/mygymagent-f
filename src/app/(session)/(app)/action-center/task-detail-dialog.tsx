"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  PhoneCall,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import {
  OUTCOME_LABELS,
  useEscalateTask,
  useTask,
  useTaskComment,
  useUpdateTask,
  type ActionTaskDetail,
  type UpdateTaskInput,
} from "@/lib/hooks/use-action-center";
import {
  CategoryBadge,
  Field,
  PriorityBadge,
  SourceBadge,
  StaffSelect,
  dueLabel,
  formatDateTime,
  fromLocalInput,
  inHours,
  personName,
  subjectOf,
  toLocalInput,
} from "./task-ui";

const EVENT_LABEL: Record<string, string> = {
  CREATED: "created the task",
  UPDATED: "updated it",
  STATUS_CHANGED: "changed the status",
  ASSIGNED: "changed who it is assigned to",
  RESCHEDULED: "rescheduled it",
  ESCALATED: "escalated it",
  COMMENT: "commented",
  CALL_LOGGED: "logged a call",
  AUTO_RESOLVED: "closed it automatically",
  SUPERSEDED: "replaced it with a newer reminder",
};

export function TaskDetailDialog({
  taskId,
  onOpenChange,
  onLogCall,
}: {
  taskId: string | null;
  onOpenChange: (open: boolean) => void;
  onLogCall: (task: ActionTaskDetail) => void;
}) {
  const task = useTask(taskId);
  const t = task.data;
  return (
    <Dialog open={Boolean(taskId)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-2xl">
        {task.isLoading || !t ? (
          <>
            <DialogHeader>
              <DialogTitle>Task</DialogTitle>
              <DialogDescription>
                {task.isError ? "This task could not be loaded." : "Loading…"}
              </DialogDescription>
            </DialogHeader>
            {!task.isError && (
              <div className="h-40 animate-pulse rounded-lg bg-muted/50" />
            )}
          </>
        ) : (
          // Keyed so a different task, or a reschedule, starts the form fresh.
          <TaskBody key={`${t.id}:${t.dueAt}`} t={t} onLogCall={onLogCall} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function TaskBody({
  t,
  onLogCall,
}: {
  t: ActionTaskDetail;
  onLogCall: (task: ActionTaskDetail) => void;
}) {
  const { user, hasPermission } = useAuth();
  const update = useUpdateTask();
  const comment = useTaskComment();
  const escalate = useEscalateTask();
  const [note, setNote] = React.useState("");
  const [due, setDue] = React.useState(() => toLocalInput(new Date(t.dueAt)));
  const [commentText, setCommentText] = React.useState("");
  const [escalating, setEscalating] = React.useState(false);
  const [escalationReason, setEscalationReason] = React.useState("");

  const isManager = hasPermission("tasks.manage");
  const canWork =
    hasPermission("tasks.work") &&
    (isManager || !t.assignedToUser || t.assignedToUser.id === user?.id);
  const open = ["PENDING", "IN_PROGRESS", "BLOCKED"].includes(t.status);
  const subject = subjectOf(t);

  async function change(input: UpdateTaskInput, success: string) {
    try {
      await update.mutateAsync({ id: t.id, ...input });
      toast.success(success);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Could not update the task.",
      );
    }
  }

  async function addComment() {
    if (!commentText.trim()) return;
    try {
      await comment.mutateAsync({ id: t.id, body: commentText.trim() });
      setCommentText("");
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Could not add the comment.",
      );
    }
  }

  async function sendEscalation() {
    if (escalationReason.trim().length < 3) return;
    try {
      await escalate.mutateAsync({ id: t.id, reason: escalationReason.trim() });
      toast.success("Escalated to the managers");
      setEscalating(false);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Could not escalate.",
      );
    }
  }

  return (
    <>
      <DialogHeader>
        <div className="flex flex-wrap items-center gap-1.5">
          <PriorityBadge priority={t.priority} />
          <CategoryBadge category={t.category} />
          <SourceBadge source={t.source} />
          {t.escalatedAt && (
            <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-1.5 py-0.5 text-[11px] font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-200">
              <AlertTriangle className="size-3" aria-hidden="true" /> Escalated
            </span>
          )}
        </div>
        <DialogTitle className="text-left text-lg">{t.title}</DialogTitle>
        <DialogDescription className="text-left">
          {t.status === "COMPLETED"
            ? `Completed ${formatDateTime(t.completedAt)}`
            : t.status === "CANCELLED"
              ? `Cancelled${t.cancelReason ? ` — ${t.cancelReason}` : ""}`
              : dueLabel(t.dueAt, t.isOverdue)}
          {" · "}
          {t.assignedToUser
            ? `Assigned to ${personName(t.assignedToUser)}`
            : "Unassigned"}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4">
        {subject && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
            <div className="min-w-0">
              <Link
                href={subject.href}
                className="font-semibold hover:underline"
              >
                {subject.name}
              </Link>
              <span className="ml-2 text-xs text-muted-foreground">
                {subject.kind === "lead" ? "Lead" : "Member"}
              </span>
              {subject.phone && (
                <a
                  href={`tel:${subject.phone}`}
                  className="ml-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  {subject.phone}
                </a>
              )}
            </div>
            {canWork && open && (
              <Button size="sm" onClick={() => onLogCall(t)}>
                <PhoneCall className="size-4" aria-hidden="true" /> Log call
              </Button>
            )}
          </div>
        )}

        {(t.description || t.reason || t.escalationReason) && (
          <div className="grid gap-1 text-sm">
            {t.description && (
              <p className="whitespace-pre-wrap">{t.description}</p>
            )}
            {t.reason && (
              <p className="text-muted-foreground">Why: {t.reason}</p>
            )}
            {t.escalationReason && (
              <p className="text-rose-700 dark:text-rose-300">
                Escalation: {t.escalationReason}
              </p>
            )}
          </div>
        )}

        {t.checklist && t.checklist.length > 0 && (
          <fieldset className="grid gap-1.5">
            <legend className="mb-1 text-xs font-semibold text-foreground/80">
              Checklist
            </legend>
            {t.checklist.map((item, i) => (
              <label key={i} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={item.done}
                  disabled={!canWork || update.isPending}
                  onCheckedChange={(v) =>
                    change(
                      {
                        checklist: t.checklist!.map((c, j) =>
                          j === i ? { ...c, done: v === true } : c,
                        ),
                      },
                      "Checklist updated",
                    )
                  }
                />
                <span
                  className={
                    item.done ? "text-muted-foreground line-through" : ""
                  }
                >
                  {item.text}
                </span>
              </label>
            ))}
          </fieldset>
        )}

        {canWork && open && (
          <div className="grid gap-3 rounded-lg border border-border p-3">
            <Field label="Completion note (optional)" htmlFor="task-note">
              <Input
                id="task-note"
                value={note}
                maxLength={2000}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What was the outcome?"
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() =>
                  change(
                    { status: "COMPLETED", completionNote: note || undefined },
                    "Task completed",
                  )
                }
                disabled={update.isPending}
              >
                <CheckCircle2 className="size-4" aria-hidden="true" /> Complete
              </Button>
              {t.status !== "IN_PROGRESS" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    change({ status: "IN_PROGRESS" }, "Marked in progress")
                  }
                  disabled={update.isPending}
                >
                  Start
                </Button>
              )}
              {t.status !== "BLOCKED" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    change({ status: "BLOCKED" }, "Marked blocked")
                  }
                  disabled={update.isPending}
                >
                  Blocked
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  change(
                    { status: "CANCELLED", cancelReason: note || undefined },
                    "Task cancelled",
                  )
                }
                disabled={update.isPending}
              >
                <XCircle className="size-4" aria-hidden="true" /> Cancel task
              </Button>
              {!t.assignedToUser && user && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    change({ assignedToUserId: user.id }, "Assigned to you")
                  }
                  disabled={update.isPending}
                >
                  Take it
                </Button>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
              <Field label="Reschedule / snooze" htmlFor="task-due-edit">
                <Input
                  id="task-due-edit"
                  type="datetime-local"
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                />
              </Field>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    change(
                      { dueAt: fromLocalInput(inHours(2)) },
                      "Snoozed 2 hours",
                    )
                  }
                >
                  <Clock className="size-4" aria-hidden="true" /> 2h
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    change(
                      { dueAt: fromLocalInput(inHours(24)) },
                      "Moved to tomorrow",
                    )
                  }
                >
                  Tomorrow
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    change({ dueAt: fromLocalInput(due) }, "Rescheduled")
                  }
                  disabled={!due}
                >
                  Save
                </Button>
              </div>
            </div>
            {isManager && (
              <Field label="Assigned to" htmlFor="task-assign">
                <StaffSelect
                  id="task-assign"
                  value={t.assignedToUser?.id ?? null}
                  onChange={(v) =>
                    change({ assignedToUserId: v }, "Reassigned")
                  }
                />
              </Field>
            )}
            {!t.escalatedAt &&
              (escalating ? (
                <div className="grid gap-2">
                  <Field
                    label="Why does a manager need to look at this?"
                    htmlFor="task-escalate"
                  >
                    <Textarea
                      id="task-escalate"
                      rows={2}
                      value={escalationReason}
                      maxLength={1000}
                      onChange={(e) => setEscalationReason(e.target.value)}
                    />
                  </Field>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={sendEscalation}
                      disabled={
                        escalationReason.trim().length < 3 || escalate.isPending
                      }
                    >
                      Escalate to manager
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEscalating(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-fit text-rose-700 dark:text-rose-300"
                  onClick={() => setEscalating(true)}
                >
                  <AlertTriangle className="size-4" aria-hidden="true" />{" "}
                  Escalate to a manager
                </Button>
              ))}
          </div>
        )}

        {canWork && !open && (
          <Button
            size="sm"
            variant="outline"
            className="w-fit"
            onClick={() => change({ status: "PENDING" }, "Task reopened")}
          >
            <RotateCcw className="size-4" aria-hidden="true" /> Reopen
          </Button>
        )}

        {t.callLogs.length > 0 && (
          <section aria-label="Calls for this task" className="grid gap-1.5">
            <h3 className="text-xs font-semibold text-foreground/80">Calls</h3>
            {t.callLogs.map((c) => (
              <div
                key={c.id}
                className="rounded-md border border-border px-3 py-2 text-sm"
              >
                <span className="font-medium">{OUTCOME_LABELS[c.outcome]}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {formatDateTime(c.calledAt)} ·{" "}
                  {personName(c.recordedByUser) || "—"}
                </span>
                {c.response && (
                  <p className="mt-0.5 text-muted-foreground">“{c.response}”</p>
                )}
              </div>
            ))}
          </section>
        )}

        <section aria-label="History" className="grid gap-2">
          <h3 className="text-xs font-semibold text-foreground/80">History</h3>
          {hasPermission("tasks.work") && (
            <div className="flex gap-2">
              <Input
                aria-label="Add a comment"
                value={commentText}
                maxLength={2000}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment"
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addComment())
                }
              />
              <Button
                size="sm"
                variant="outline"
                onClick={addComment}
                disabled={!commentText.trim() || comment.isPending}
              >
                Post
              </Button>
            </div>
          )}
          <ol className="grid gap-1.5">
            {t.events.map((e) => (
              <li key={e.id} className="text-sm">
                <span className="font-medium">{e.actorName}</span>{" "}
                <span className="text-muted-foreground">
                  {EVENT_LABEL[e.type] ?? e.type.toLowerCase()}
                </span>
                <span className="ml-1 text-xs text-muted-foreground">
                  · {formatDateTime(e.createdAt)}
                </span>
                {e.body && <p className="text-muted-foreground">{e.body}</p>}
              </li>
            ))}
            <li className="text-xs text-muted-foreground">
              Created {formatDateTime(t.createdAt)}
              {t.createdByUser
                ? ` by ${personName(t.createdByUser)}`
                : t.source === "SYSTEM"
                  ? " automatically"
                  : ""}
            </li>
          </ol>
        </section>
      </div>
    </>
  );
}

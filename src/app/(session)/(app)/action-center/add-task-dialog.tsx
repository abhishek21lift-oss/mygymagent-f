"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { ApiError } from "@/lib/api/client";
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  useCreateTask,
  type TaskCategory,
  type TaskPriority,
} from "@/lib/hooks/use-action-center";
import type { Lead } from "@/lib/types/gym";
import { Field, StaffSelect, fromLocalInput, inHours } from "./task-ui";

const MANUAL_CATEGORIES: TaskCategory[] = [
  "GENERAL",
  "CALL",
  "FOLLOW_UP",
  "PAYMENT_FOLLOW_UP",
  "RENEWAL",
  "LEAD_FOLLOW_UP",
  "TRIAL",
  "COMPLAINT",
];

function AddTaskForm({
  onOpenChange,
  presetCategory = "GENERAL",
  title: dialogTitle = "Add a task",
}: {
  onOpenChange: (open: boolean) => void;
  presetCategory?: TaskCategory;
  title?: string;
}) {
  const create = useCreateTask();
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState<TaskCategory>(presetCategory);
  const [priority, setPriority] = React.useState<TaskPriority>("MEDIUM");
  const [dueAt, setDueAt] = React.useState(
    inHours(presetCategory === "FOLLOW_UP" ? 24 : 1),
  );
  const [assignee, setAssignee] = React.useState<string | null>(null);
  const [kind, setKind] = React.useState<"none" | "member" | "lead">(
    presetCategory === "FOLLOW_UP" ? "member" : "none",
  );
  const [member, setMember] = React.useState<{
    id: string;
    label: string;
  } | null>(null);
  const [lead, setLead] = React.useState<Lead | null>(null);
  const [checklist, setChecklist] = React.useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const due = fromLocalInput(dueAt);
    if (!title.trim() || !due) {
      toast.error("Give the task a title and a due time.");
      return;
    }
    try {
      await create.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        priority,
        dueAt: due,
        assignedToUserId: assignee ?? undefined,
        memberId: kind === "member" ? member?.id : undefined,
        leadId: kind === "lead" ? lead?.id : undefined,
        checklist: checklist
          .split("\n")
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 20)
          .map((text) => ({ text, done: false })),
      });
      toast.success("Task added");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Could not add the task.",
      );
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogDescription>
          It goes on the worklist for the day it is due.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} className="grid gap-3.5">
        <Field label="Title" htmlFor="task-title">
          <Input
            id="task-title"
            value={title}
            maxLength={160}
            required
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Call Rahul about PT package"
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Category" htmlFor="task-category">
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as TaskCategory)}
            >
              <SelectTrigger id="task-category" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MANUAL_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Priority" htmlFor="task-priority">
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as TaskPriority)}
            >
              <SelectTrigger id="task-priority" className="w-full">
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
          <Field label="Due" htmlFor="task-due">
            <Input
              id="task-due"
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Assigned to" htmlFor="task-assignee">
          <StaffSelect
            id="task-assignee"
            value={assignee}
            onChange={setAssignee}
          />
        </Field>
        <div className="grid gap-2">
          <span className="text-xs font-semibold text-foreground/80">
            About
          </span>
          <div
            role="radiogroup"
            aria-label="Linked to"
            className="inline-flex w-fit rounded-lg border border-border p-0.5"
          >
            {(["none", "member", "lead"] as const).map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={kind === k}
                onClick={() => setKind(k)}
                className={`min-h-9 rounded-md px-3 text-sm font-medium ${kind === k ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
              >
                {k === "none" ? "Nobody" : k === "member" ? "Member" : "Lead"}
              </button>
            ))}
          </div>
          {kind === "member" && (
            <MemberPicker value={member} onChange={setMember} />
          )}
          {kind === "lead" && <LeadPicker lead={lead} onChange={setLead} />}
        </div>
        <Field label="Details" htmlFor="task-description">
          <Textarea
            id="task-description"
            rows={2}
            value={description}
            maxLength={4000}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <Field
          label="Checklist (one item per line, optional)"
          htmlFor="task-checklist"
        >
          <Textarea
            id="task-checklist"
            rows={2}
            value={checklist}
            onChange={(e) => setChecklist(e.target.value)}
          />
        </Field>
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? "Adding…" : "Add task"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

/** Add a TODO, or "schedule a follow-up" (same form, preset category). */
export function AddTaskDialog({
  open,
  ...props
}: { open: boolean } & React.ComponentProps<typeof AddTaskForm>) {
  return (
    <Dialog open={open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-lg">
        {open && <AddTaskForm {...props} />}
      </DialogContent>
    </Dialog>
  );
}

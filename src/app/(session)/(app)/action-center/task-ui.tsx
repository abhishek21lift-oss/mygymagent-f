"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  useAssignableStaff,
  type ActionTask,
  type Person,
  type TaskCategory,
  type TaskPriority,
} from "@/lib/hooks/use-action-center";

export function personName(p: Person | null | undefined): string {
  return p ? `${p.firstName} ${p.lastName ?? ""}`.trim() : "";
}

export function subjectOf(task: Pick<ActionTask, "member" | "lead">) {
  if (task.member)
    return {
      kind: "member" as const,
      id: task.member.id,
      name: personName(task.member),
      phone: task.member.phone,
      href: `/members/${task.member.id}`,
    };
  if (task.lead)
    return {
      kind: "lead" as const,
      id: task.lead.id,
      name: personName(task.lead),
      phone: task.lead.phone,
      href: `/crm/leads/${task.lead.id}`,
    };
  return null;
}

const PRIORITY_STYLE: Record<TaskPriority, string> = {
  URGENT: "bg-rose-600 text-white",
  HIGH: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200",
  MEDIUM: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200",
  LOW: "bg-muted text-muted-foreground",
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
        PRIORITY_STYLE[priority],
      )}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

export function CategoryBadge({ category }: { category: TaskCategory }) {
  return (
    <Badge variant="outline" className="text-[11px] font-medium">
      {CATEGORY_LABELS[category]}
    </Badge>
  );
}

export function SourceBadge({ source }: { source: ActionTask["source"] }) {
  if (source === "MANUAL") return null;
  return (
    <Badge
      variant={source === "AI_SUGGESTION" ? "secondary" : "outline"}
      className="text-[11px] font-medium"
    >
      {source === "AI_SUGGESTION" ? "AI suggested" : "Auto"}
    </Badge>
  );
}

const dateTime = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});
const timeOnly = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  minute: "2-digit",
});

/** "Today 10:00", "Overdue · 8 Oct", "12 Oct 5:00 pm". */
export function dueLabel(dueAt: string, isOverdue?: boolean): string {
  const due = new Date(dueAt);
  const now = new Date();
  const sameDay = due.toDateString() === now.toDateString();
  if (isOverdue) return `Overdue · ${dateTime.format(due)}`;
  if (sameDay) return `Today ${timeOnly.format(due)}`;
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (due.toDateString() === tomorrow.toDateString())
    return `Tomorrow ${timeOnly.format(due)}`;
  return dateTime.format(due);
}

export function formatDateTime(value: string | null | undefined): string {
  return value ? dateTime.format(new Date(value)) : "—";
}

/** `<input type="datetime-local">` speaks local time without a zone. */
export function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromLocalInput(value: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/** Today's date (YYYY-MM-DD) in the browser's zone, for `<input type="date">`. */
export function todayInput(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return toLocalInput(d).slice(0, 10);
}

export function inHours(hours: number): string {
  const d = new Date(Date.now() + hours * 3_600_000);
  d.setMinutes(0, 0, 0);
  return toLocalInput(d);
}

export function StaffSelect({
  value,
  onChange,
  placeholder = "Unassigned",
  allowNone = true,
  id,
}: {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  placeholder?: string;
  allowNone?: boolean;
  id?: string;
}) {
  const staff = useAssignableStaff();
  return (
    <Select
      value={value ?? "none"}
      onValueChange={(v) => onChange(v === "none" ? null : v)}
      disabled={staff.isLoading}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={staff.isLoading ? "Loading…" : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowNone && <SelectItem value="none">{placeholder}</SelectItem>}
        {staff.data?.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-xs font-semibold text-foreground/80"
      >
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

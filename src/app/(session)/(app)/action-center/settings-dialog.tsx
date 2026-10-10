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
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/client";
import {
  useActionCenterSettings,
  useUpdateActionCenterSettings,
  type ActionCenterSettings,
} from "@/lib/hooks/use-action-center";

/** key, label, min, max — the same windows the DTO enforces server-side. */
const INT_FIELDS: ReadonlyArray<{
  key: Exclude<
    keyof ActionCenterSettings,
    "renewalReminderDays" | "quietHoursStart" | "quietHoursEnd"
  >;
  label: string;
  hint: string;
  min: number;
  max: number;
}> = [
  { key: "expiredLookbackDays", label: "Expired lookback (days)", hint: "How far back an expired, unrenewed membership still gets a call", min: 0, max: 90 },
  { key: "duesFollowUpIntervalDays", label: "Dues follow-up (days)", hint: "How often an unpaid balance comes back as a task", min: 1, max: 60 },
  { key: "inactiveDays", label: "Inactive after (days)", hint: "Days without a check-in before an active member counts as inactive", min: 3, max: 180 },
  { key: "promiseGraceDays", label: "Promise grace (days)", hint: "Days after a promised date before the promise counts as missed", min: 0, max: 14 },
  { key: "newLeadContactHours", label: "First contact (hours)", hint: "Hours a new enquiry may wait before first contact is due", min: 0, max: 72 },
  { key: "reminderLeadMinutes", label: "Reminder lead (minutes)", hint: "Minutes before a task is due to remind the assignee", min: 0, max: 1440 },
  { key: "overdueEscalationHours", label: "Escalation (hours)", hint: "Hours a HIGH/URGENT task may sit overdue before managers hear of it", min: 1, max: 336 },
  { key: "maxNewTasksPerSource", label: "New tasks per source", hint: "Cap per generator run, so a backlog trickles in", min: 1, max: 1000 },
  { key: "maxOpenInactiveTasks", label: "Open inactive calls", hint: "Longest-absent first; a workable list, not a wall", min: 0, max: 500 },
];

function parseIntIn(raw: string, min: number, max: number): number | null {
  if (!/^\d+$/.test(raw.trim())) return null;
  const value = Number(raw.trim());
  return value >= min && value <= max ? value : null;
}

export function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const settings = useActionCenterSettings({ enabled: open });
  const update = useUpdateActionCenterSettings();
  const [form, setForm] = React.useState<Record<string, string> | null>(null);

  const loaded = settings.data;
  React.useEffect(() => {
    if (loaded && form === null) {
      setForm({
        renewalReminderDays: loaded.renewalReminderDays.join(", "),
        ...Object.fromEntries(
          INT_FIELDS.map((f) => [f.key, String(loaded[f.key])]),
        ),
        quietHoursStart: loaded.quietHoursStart === null ? "" : String(loaded.quietHoursStart),
        quietHoursEnd: loaded.quietHoursEnd === null ? "" : String(loaded.quietHoursEnd),
      });
    }
  }, [loaded, form]);

  React.useEffect(() => {
    if (!open) setForm(null);
  }, [open ]);

  const set = (key: string, value: string) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const parsed = (form && loaded
    ? (() => {
        const days = form.renewalReminderDays
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (days.length === 0 || days.length > 6) return null;
        const renewalReminderDays = days.map((s) => parseIntIn(s, 0, 60));
        if (renewalReminderDays.some((d) => d === null)) return null;
        const ints = Object.fromEntries(
          INT_FIELDS.map((f) => [f.key, parseIntIn(form[f.key] ?? "", f.min, f.max)]),
        );
        if (Object.values(ints).some((v) => v === null)) return null;
        const quiet = (raw: string) =>
          raw.trim() === "" ? null : parseIntIn(raw, 0, 23);
        const quietHoursStart = quiet(form.quietHoursStart);
        const quietHoursEnd = quiet(form.quietHoursEnd);
        if (
          (form.quietHoursStart.trim() !== "" && quietHoursStart === null) ||
          (form.quietHoursEnd.trim() !== "" && quietHoursEnd === null)
        )
          return null;
        return {
          renewalReminderDays: renewalReminderDays as number[],
          ...ints,
          quietHoursStart,
          quietHoursEnd,
        };
      })()
    : null);

  async function onSave() {
    if (!parsed) return;
    try {
      await update.mutateAsync(parsed);
      toast.success("Action Center rules updated");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Could not save these rules",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Action Center rules</DialogTitle>
          <DialogDescription>
            When the generator raises calls and reminders come. Saving applies
            to future runs; open tasks keep their own due dates.
          </DialogDescription>
        </DialogHeader>
        {settings.isPending || !form ? (
          <p className="py-6 text-sm text-muted-foreground">Loading current rules…</p>
        ) : settings.isError ? (
          <div className="grid gap-2 py-4">
            <p role="alert" className="text-sm font-semibold text-destructive">
              Could not load the current rules.
            </p>
            <Button type="button" variant="outline" onClick={() => void settings.refetch()}>
              Try again
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="ac-renewal">Renewal reminders (days before end, comma-separated)</Label>
              <Input
                id="ac-renewal"
                inputMode="numeric"
                value={form.renewalReminderDays}
                onChange={(e) => set("renewalReminderDays", e.target.value)}
              />
            </div>
            {INT_FIELDS.map((f) => (
              <div key={f.key} className="grid gap-1.5">
                <Label htmlFor={`ac-${f.key}`}>{f.label}</Label>
                <Input
                  id={`ac-${f.key}`}
                  inputMode="numeric"
                  value={form[f.key] ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{f.hint}</p>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="ac-quiet-start">Quiet from (hour, empty = none)</Label>
                <Input
                  id="ac-quiet-start"
                  inputMode="numeric"
                  placeholder="22"
                  value={form.quietHoursStart}
                  onChange={(e) => set("quietHoursStart", e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ac-quiet-end">Quiet until (hour)</Label>
                <Input
                  id="ac-quiet-end"
                  inputMode="numeric"
                  placeholder="7"
                  value={form.quietHoursEnd}
                  onChange={(e) => set("quietHoursEnd", e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button
            type="button"
            disabled={!parsed || update.isPending}
            onClick={() => void onSave()}
          >
            {update.isPending ? "Saving…" : "Save rules"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

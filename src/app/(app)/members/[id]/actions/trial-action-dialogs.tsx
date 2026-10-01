"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
 useCancelAppointment,
 useCompleteAppointment,
 useCreateAppointment,
 useNoShowAppointment,
 type Appointment,
} from "@/lib/hooks/use-appointments";
import { useAssignableTrainers } from "@/lib/hooks/use-members";

import { ActionDialog, Field, formatDay } from "./action-dialog";

const ANY_COACH = "__any";

/** `datetime-local` wants local wall time, not UTC. */
function localInputValue(date: Date): string {
 const pad = (n: number) => String(n).padStart(2, "0");
 return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** The next whole hour, an hour or more away. */
function nextSlot(now: Date): Date {
 const slot = new Date(now);
 slot.setMinutes(0, 0, 0);
 slot.setHours(slot.getHours() + 2);
 return slot;
}

export function BookTrialDialog({
 memberId,
 memberName,
 branchId,
 onDone,
 onOpenChange,
}: {
 memberId: string;
 memberName: string;
 branchId: string;
 onDone: () => Promise<unknown>;
 onOpenChange: (open: boolean) => void;
}) {
 const create = useCreateAppointment();
 const trainers = useAssignableTrainers(branchId);
 const [when, setWhen] = React.useState(() => localInputValue(nextSlot(new Date())));
 const [minutes, setMinutes] = React.useState("60");
 const [coach, setCoach] = React.useState(ANY_COACH);
 const [notes, setNotes] = React.useState("");
 const start = when ? new Date(when) : null;
 const valid = start !== null && !Number.isNaN(start.getTime());

 return (
 <ActionDialog
 open
 onOpenChange={onOpenChange}
 title="Book free trial"
 description="Goes on the calendar as a trial, with the coach if you pick one. A coach who is already booked then is refused."
 confirmLabel="Book trial"
 canConfirm={valid}
 onConfirm={async () => {
 const end = new Date(start!.getTime() + Number(minutes) * 60_000);
 await create.mutateAsync({
 branchId,
 memberId,
 type: "TRIAL",
 title: `Free trial — ${memberName}`,
 startTime: start!.toISOString(),
 endTime: end.toISOString(),
 ...(coach !== ANY_COACH ? { staffId: coach } : {}),
 ...(notes.trim() ? { notes: notes.trim() } : {}),
 });
 await onDone();
 return `Trial booked for ${formatDay(start!)}`;
 }}
 >
 <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-3">
 <Field id="trial-when" label="When" error={valid ? null : "Pick a date and time"}>
 <Input id="trial-when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="min-h-11" />
 </Field>
 <Field id="trial-length" label="Length">
 <Select value={minutes} onValueChange={setMinutes}>
 <SelectTrigger id="trial-length" className="min-h-11 w-full">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {["30", "45", "60", "90"].map((m) => (
 <SelectItem key={m} value={m}>
 {m} min
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </Field>
 </div>
 <Field id="trial-coach" label="Coach" help="Optional">
 <Select value={coach} onValueChange={setCoach} disabled={trainers.isLoading}>
 <SelectTrigger id="trial-coach" className="min-h-11 w-full">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value={ANY_COACH}>Whoever is free</SelectItem>
 {(trainers.data ?? []).map((t) => (
 <SelectItem key={t.id} value={t.id}>
 {t.firstName} {t.lastName}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </Field>
 <Field id="trial-notes" label="Notes" help="Goals, injuries, what they want to try">
 <Textarea id="trial-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
 </Field>
 </ActionDialog>
 );
}

export function TrialOutcomeDialog({
 trial,
 outcome,
 onDone,
 onOpenChange,
}: {
 trial: Appointment;
 outcome: "attended" | "no-show";
 onDone: () => Promise<unknown>;
 onOpenChange: (open: boolean) => void;
}) {
 const complete = useCompleteAppointment();
 const noShow = useNoShowAppointment();
 const attended = outcome === "attended";
 return (
 <ActionDialog
 open
 onOpenChange={onOpenChange}
 title={attended ? "Trial attended" : "Trial no-show"}
 description={`The trial on ${formatDay(trial.startTime)}${trial.staff ? ` with ${trial.staff.firstName}` : ""} is marked ${attended ? "done" : "as a no-show"}.`}
 confirmLabel={attended ? "Mark attended" : "Mark no-show"}
 destructive={!attended}
 onConfirm={async () => {
 if (attended) await complete.mutateAsync(trial.id);
 else await noShow.mutateAsync(trial.id);
 await onDone();
 return attended ? "Trial marked attended" : "Trial marked no-show";
 }}
 />
 );
}

/**
 * After a trial converts: a trial that has happened is marked done; one
 * still ahead is called off, since they joined without it.
 */
export function useCloseConvertedTrial() {
 const complete = useCompleteAppointment();
 const cancel = useCancelAppointment();
 return React.useCallback(
 async (trial: Appointment | null) => {
 if (!trial || trial.status !== "BOOKED") return;
 if (new Date(trial.startTime).getTime() <= Date.now()) await complete.mutateAsync(trial.id);
 else await cancel.mutateAsync({ id: trial.id, reason: "Joined before the trial" });
 },
 [complete, cancel],
 );
}

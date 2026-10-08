"use client";

import * as React from "react";
import { toast } from "sonner";

import { ApiError, api } from "@/lib/api/client";
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
import { Switch } from "@/components/ui/switch";

/**
 * Leave was reviewable but never creatable: the page listed leave types and
 * requests and could approve them, yet nothing could add a type or record a
 * request, so the list stayed empty. Both endpoints take `hr.manage` and a
 * staff profile, so leave is recorded by a manager on a staff member's
 * behalf -- that is what these dialogs do, nothing broader.
 */

const SELECT_CLASS =
  "h-11 w-full rounded-xl border border-input bg-transparent px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export type LeaveTypeOption = { id: string; name: string; code: string; paid: boolean };

type StaffOption = {
  id: string;
  branchId: string | null;
  user: { firstName: string; lastName: string };
};

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

/** A short code from a name: "Casual leave" -> "CASUAL_LEAVE". */
export function leaveCode(name: string) {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30);
}

function LeaveTypeForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [codeEdited, setCodeEdited] = React.useState(false);
  const [paid, setPaid] = React.useState(true);
  const [quota, setQuota] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const finalCode = (codeEdited ? code : leaveCode(name)).trim();
    if (!name.trim() || !finalCode) return;
    setSaving(true);
    try {
      await api.post("/hr-payroll/leave-types", {
        name: name.trim(),
        code: finalCode,
        paid,
        ...(quota.trim() ? { annualQuota: Number(quota) } : {}),
      });
      toast.success(`${name.trim()} added`);
      onDone();
    } catch (error) {
      toast.error(errorMessage(error, "The leave type could not be added."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="leave-type-name">Name</Label>
        <Input
          id="leave-type-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Casual leave"
          maxLength={80}
          required
          autoFocus
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="leave-type-code">Code</Label>
        <Input
          id="leave-type-code"
          value={codeEdited ? code : leaveCode(name)}
          onChange={(e) => {
            setCodeEdited(true);
            setCode(e.target.value.toUpperCase());
          }}
          placeholder="CASUAL_LEAVE"
          maxLength={30}
          required
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="leave-type-quota">Days a year (optional)</Label>
        <Input
          id="leave-type-quota"
          value={quota}
          onChange={(e) => setQuota(e.target.value.replace(/[^\d.]/g, ""))}
          inputMode="decimal"
          placeholder="12"
        />
      </div>
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5">
        <div>
          <Label htmlFor="leave-type-paid">Paid leave</Label>
          <p className="text-xs text-muted-foreground">Unpaid leave is deducted in the payroll run.</p>
        </div>
        <Switch id="leave-type-paid" checked={paid} onCheckedChange={setPaid} />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={saving || !name.trim()}>
          {saving ? "Adding…" : "Add leave type"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function AddLeaveTypeDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add leave type</DialogTitle>
          <DialogDescription>A kind of leave staff can take, such as casual, sick or earned leave.</DialogDescription>
        </DialogHeader>
        {open ? (
          <LeaveTypeForm
            onDone={() => {
              onOpenChange(false);
              onSaved();
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function toInputDate(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function LeaveRequestForm({ leaveTypes, onDone }: { leaveTypes: LeaveTypeOption[]; onDone: () => void }) {
  const [staff, setStaff] = React.useState<StaffOption[] | null>(null);
  const [staffError, setStaffError] = React.useState(false);
  const [staffProfileId, setStaffProfileId] = React.useState("");
  const [leaveTypeId, setLeaveTypeId] = React.useState(leaveTypes[0]?.id ?? "");
  const [startDate, setStartDate] = React.useState(toInputDate(new Date()));
  const [endDate, setEndDate] = React.useState(toInputDate(new Date()));
  const [unit, setUnit] = React.useState<"DAY" | "HALF_DAY">("DAY");
  const [reason, setReason] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    api
      .get<{ items: StaffOption[] }>("/hr-payroll/staff")
      .then((res) => {
        if (!cancelled) setStaff(res.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setStaffError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const person = staff?.find((s) => s.id === staffProfileId);
  const branchId = person?.branchId ?? null;
  const datesValid = startDate !== "" && endDate !== "" && endDate >= startDate;
  const ready = Boolean(staffProfileId && leaveTypeId && branchId && datesValid);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!ready || !branchId) return;
    setSaving(true);
    try {
      await api.post("/hr-payroll/leave-requests", {
        staffProfileId,
        leaveTypeId,
        branchId,
        startDate,
        endDate,
        unit,
        ...(reason.trim() ? { reason: reason.trim() } : {}),
      });
      toast.success(`Leave recorded for ${person?.user.firstName ?? "staff member"}`);
      onDone();
    } catch (error) {
      toast.error(errorMessage(error, "The leave could not be recorded."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="leave-staff">Staff member</Label>
        <select
          id="leave-staff"
          className={SELECT_CLASS}
          value={staffProfileId}
          onChange={(e) => setStaffProfileId(e.target.value)}
          disabled={!staff}
          required
        >
          <option value="">{staff ? "Choose a staff member" : staffError ? "Staff could not be loaded" : "Loading staff…"}</option>
          {(staff ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {`${s.user.firstName} ${s.user.lastName}`.trim()}
            </option>
          ))}
        </select>
        {person && !branchId ? (
          <p role="alert" className="text-xs text-destructive">
            {person.user.firstName} has no home branch. Set one on the Staff page first.
          </p>
        ) : null}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="leave-type">Leave type</Label>
        <select
          id="leave-type"
          className={SELECT_CLASS}
          value={leaveTypeId}
          onChange={(e) => setLeaveTypeId(e.target.value)}
          required
        >
          {leaveTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
              {t.paid ? "" : " (unpaid)"}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="leave-start">From</Label>
          <Input id="leave-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="leave-end">To</Label>
          <Input id="leave-end" type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} required />
        </div>
      </div>
      {!datesValid && startDate && endDate ? (
        <p role="alert" className="-mt-2 text-xs text-destructive">
          The end date is before the start date.
        </p>
      ) : null}
      <div className="grid gap-1.5">
        <Label htmlFor="leave-unit">Length</Label>
        <select id="leave-unit" className={SELECT_CLASS} value={unit} onChange={(e) => setUnit(e.target.value as "DAY" | "HALF_DAY")}>
          <option value="DAY">Full days</option>
          <option value="HALF_DAY">Half day</option>
        </select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="leave-reason">Reason (optional)</Label>
        <Input id="leave-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={saving || !ready}>
          {saving ? "Saving…" : "Record leave"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function RecordLeaveDialog({
  open,
  onOpenChange,
  leaveTypes,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaveTypes: LeaveTypeOption[];
  onSaved: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record leave</DialogTitle>
          <DialogDescription>Recorded as pending; approve it from the list.</DialogDescription>
        </DialogHeader>
        {open ? (
          <LeaveRequestForm
            leaveTypes={leaveTypes}
            onDone={() => {
              onOpenChange(false);
              onSaved();
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

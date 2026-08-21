"use client";

import * as React from "react";
import {
  MapPin,
  Phone,
  StickyNote,
  ShieldCheck,
  History,
  Plus,
  Trash2,
  Pin,
  Activity,
  Target,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiError } from "@/lib/api/client";
import type {
  MemberAddressType,
  MemberConsentType,
  MemberGoalCategory,
  MemberGoalMilestone,
} from "@/lib/types/gym";
import {
  useMemberMeasurements,
  useCreateMemberMeasurement,
  useMemberFitnessResults,
  useCreateMemberFitnessResult,
} from "@/lib/hooks/use-member-assessments";
import {
  useMemberGoals,
  useCreateMemberGoal,
  useUpdateMemberGoal,
  useCreateMemberGoalMilestone,
  useAchieveMemberGoalMilestone,
} from "@/lib/hooks/use-member-goals";
import {
  useMemberAddresses,
  useCreateMemberAddress,
  useDeleteMemberAddress,
  useMemberEmergencyContacts,
  useCreateMemberEmergencyContact,
  useDeleteMemberEmergencyContact,
  useMemberNotes,
  useCreateMemberNote,
  useDeleteMemberNote,
  useMemberConsents,
  useRecordMemberConsent,
  useMemberStatusHistory,
  useMemberBranchHistory,
  useMemberTrainerHistory,
} from "@/lib/hooks/use-member-details";

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

// -- Addresses ----------------------------------------------------------------

function AddressesPanel({ memberId }: { memberId: string }) {
  const query = useMemberAddresses(memberId);
  const create = useCreateMemberAddress(memberId);
  const remove = useDeleteMemberAddress(memberId);
  const [open, setOpen] = React.useState(false);
  const [type, setType] = React.useState<MemberAddressType>("HOME");
  const [isPrimary, setIsPrimary] = React.useState(false);
  const [line1, setLine1] = React.useState("");
  const [city, setCity] = React.useState("");

  async function handleAdd() {
    if (!line1.trim()) return;
    try {
      await create.mutateAsync({ type, isPrimary, addressLine1: line1, city: city || undefined });
      toast.success("Address added");
      setOpen(false);
      setLine1("");
      setCity("");
      setIsPrimary(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to add address");
    }
  }

  if (query.isLoading) return <Skeleton className="h-24 w-full" />;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="size-3.5" />
              Add address
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add an address</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <Select value={type} onValueChange={(v) => setType(v as MemberAddressType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HOME">Home</SelectItem>
                  <SelectItem value="WORK">Work</SelectItem>
                  <SelectItem value="BILLING">Billing</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Address line 1" value={line1} onChange={(e) => setLine1(e.target.value)} />
              <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
              <div className="flex items-center gap-2">
                <Switch id="primary-addr" checked={isPrimary} onCheckedChange={setIsPrimary} />
                <Label htmlFor="primary-addr">Set as primary</Label>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAdd} disabled={!line1.trim() || create.isPending}>
                {create.isPending ? "Adding..." : "Add address"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!query.data || query.data.length === 0 ? (
        <EmptyState icon={MapPin} title="No addresses on file" description="Add this member's home, work, or billing address." />
      ) : (
        <div className="flex flex-col gap-2">
          {query.data.map((addr) => (
            <div key={addr.id} className="flex items-start justify-between rounded-md border p-3">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{addr.type}</Badge>
                  {addr.isPrimary && <Badge>Primary</Badge>}
                </div>
                <p className="mt-1 text-sm">
                  {addr.addressLine1}
                  {addr.city ? `, ${addr.city}` : ""}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                disabled={remove.isPending}
                onClick={() =>
                  remove
                    .mutateAsync(addr.id)
                    .then(() => toast.success("Address removed"))
                    .catch((e) => toast.error(e instanceof ApiError ? e.message : "Failed to remove"))
                }
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// -- Emergency contacts ---------------------------------------------------------

function EmergencyContactsPanel({ memberId }: { memberId: string }) {
  const query = useMemberEmergencyContacts(memberId);
  const create = useCreateMemberEmergencyContact(memberId);
  const remove = useDeleteMemberEmergencyContact(memberId);
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [relationship, setRelationship] = React.useState("");

  async function handleAdd() {
    if (!name.trim() || !phone.trim()) return;
    try {
      await create.mutateAsync({ name, phone, relationship: relationship || undefined });
      toast.success("Emergency contact added");
      setOpen(false);
      setName("");
      setPhone("");
      setRelationship("");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to add contact");
    }
  }

  if (query.isLoading) return <Skeleton className="h-24 w-full" />;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="size-3.5" />
              Add contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add an emergency contact</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Input
                placeholder="Relationship (e.g. Spouse)"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button onClick={handleAdd} disabled={!name.trim() || !phone.trim() || create.isPending}>
                {create.isPending ? "Adding..." : "Add contact"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!query.data || query.data.length === 0 ? (
        <EmptyState icon={Phone} title="No emergency contacts on file" description="Add someone to contact in case of emergency." />
      ) : (
        <div className="flex flex-col gap-2">
          {query.data.map((contact) => (
            <div key={contact.id} className="flex items-start justify-between rounded-md border p-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{contact.name}</p>
                  {contact.isPrimary && <Badge>Primary</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {contact.phone}
                  {contact.relationship ? ` · ${contact.relationship}` : ""}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                disabled={remove.isPending}
                onClick={() =>
                  remove
                    .mutateAsync(contact.id)
                    .then(() => toast.success("Contact removed"))
                    .catch((e) => toast.error(e instanceof ApiError ? e.message : "Failed to remove"))
                }
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// -- Notes ----------------------------------------------------------------------

function NotesPanel({ memberId }: { memberId: string }) {
  const { user } = useAuth();
  const query = useMemberNotes(memberId);
  const create = useCreateMemberNote(memberId);
  const remove = useDeleteMemberNote(memberId);
  const [body, setBody] = React.useState("");

  async function handleAdd() {
    if (!body.trim()) return;
    try {
      await create.mutateAsync({ body });
      setBody("");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to add note");
    }
  }

  if (query.isLoading) return <Skeleton className="h-24 w-full" />;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Textarea
          placeholder="Add a note about this member..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="min-h-16"
        />
        <Button onClick={handleAdd} disabled={!body.trim() || create.isPending} className="self-end">
          Add
        </Button>
      </div>

      {!query.data || query.data.length === 0 ? (
        <EmptyState icon={StickyNote} title="No notes yet" description="Notes are timestamped and keep full history." />
      ) : (
        <div className="flex flex-col gap-2">
          {query.data.map((note) => (
            <div key={note.id} className="flex items-start justify-between rounded-md border p-3">
              <div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {note.pinned && <Pin className="size-3" />}
                  <span>
                    {note.authorUser ? `${note.authorUser.firstName} ${note.authorUser.lastName}` : "Unknown"}
                  </span>
                  <span>· {fmtDateTime(note.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm whitespace-pre-wrap">{note.body}</p>
              </div>
              {note.authorUserId === user?.id && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  disabled={remove.isPending}
                  onClick={() =>
                    remove
                      .mutateAsync(note.id)
                      .then(() => toast.success("Note deleted"))
                      .catch((e) => toast.error(e instanceof ApiError ? e.message : "Failed to delete"))
                  }
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// -- Consents ---------------------------------------------------------------------

const CONSENT_LABELS: Record<MemberConsentType, string> = {
  WAIVER: "Liability waiver",
  MARKETING: "Marketing communications",
  PHOTO_RELEASE: "Photo release",
  DATA_PROCESSING: "Data processing",
  OTHER: "Other",
};

function ConsentsPanel({ memberId }: { memberId: string }) {
  const query = useMemberConsents(memberId);
  const record = useRecordMemberConsent(memberId);
  const [open, setOpen] = React.useState(false);
  const [type, setType] = React.useState<MemberConsentType>("WAIVER");
  const [granted, setGranted] = React.useState(true);
  const [note, setNote] = React.useState("");

  async function handleRecord() {
    try {
      await record.mutateAsync({ type, granted, note: note || undefined });
      toast.success("Consent recorded");
      setOpen(false);
      setNote("");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to record consent");
    }
  }

  if (query.isLoading) return <Skeleton className="h-24 w-full" />;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="size-3.5" />
              Record consent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record a consent decision</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <Select value={type} onValueChange={(v) => setType(v as MemberConsentType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CONSENT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Switch id="consent-granted" checked={granted} onCheckedChange={setGranted} />
                <Label htmlFor="consent-granted">{granted ? "Granted" : "Revoked / declined"}</Label>
              </div>
              <Textarea placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <DialogFooter>
              <Button onClick={handleRecord} disabled={record.isPending}>
                {record.isPending ? "Recording..." : "Record"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!query.data || query.data.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No consents on file" description="Record waivers and communication consents here." />
      ) : (
        <div className="flex flex-col gap-2">
          {query.data.map((consent) => (
            <div key={consent.id} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">{CONSENT_LABELS[consent.type]}</p>
                {consent.note && <p className="text-sm text-muted-foreground">{consent.note}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={consent.granted ? "default" : "destructive"}>
                  {consent.granted ? "Granted" : "Revoked"}
                </Badge>
                <span className="text-xs text-muted-foreground">{fmtDateTime(consent.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// -- History ----------------------------------------------------------------------

function HistoryPanel({ memberId }: { memberId: string }) {
  const statusQuery = useMemberStatusHistory(memberId);
  const branchQuery = useMemberBranchHistory(memberId);
  const trainerQuery = useMemberTrainerHistory(memberId);

  if (statusQuery.isLoading || branchQuery.isLoading || trainerQuery.isLoading) {
    return <Skeleton className="h-24 w-full" />;
  }

  type Row = { id: string; createdAt: string; label: string };
  const rows: Row[] = [
    ...(statusQuery.data ?? []).map((h) => ({
      id: `status-${h.id}`,
      createdAt: h.createdAt,
      label: h.fromStatus ? `Status: ${h.fromStatus} → ${h.toStatus}` : `Status set to ${h.toStatus}`,
    })),
    ...(branchQuery.data ?? []).map((h) => ({
      id: `branch-${h.id}`,
      createdAt: h.createdAt,
      label: h.fromBranch
        ? `Branch: ${h.fromBranch.name} → ${h.toBranch.name}`
        : `Assigned to branch ${h.toBranch.name}`,
    })),
    ...(trainerQuery.data ?? []).map((h) => ({
      id: `trainer-${h.id}`,
      createdAt: h.createdAt,
      label:
        h.toTrainer && h.fromTrainer
          ? `Trainer: ${h.fromTrainer.firstName} ${h.fromTrainer.lastName} → ${h.toTrainer.firstName} ${h.toTrainer.lastName}`
          : h.toTrainer
            ? `Assigned trainer ${h.toTrainer.firstName} ${h.toTrainer.lastName}`
            : "Trainer unassigned",
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (rows.length === 0) {
    return <EmptyState icon={History} title="No history yet" description="Status, branch, and trainer changes will appear here." />;
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) => (
        <div key={row.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
          <span>{row.label}</span>
          <span className="text-xs text-muted-foreground">{fmtDateTime(row.createdAt)}</span>
        </div>
      ))}
    </div>
  );
}

// -- Assessments (measurements + fitness tests) -----------------------------------

function AssessmentsPanel({ memberId }: { memberId: string }) {
  const measurementsQuery = useMemberMeasurements(memberId);
  const fitnessQuery = useMemberFitnessResults(memberId);
  const createMeasurement = useCreateMemberMeasurement(memberId);
  const createFitness = useCreateMemberFitnessResult(memberId);

  const [measurementOpen, setMeasurementOpen] = React.useState(false);
  const [weightKg, setWeightKg] = React.useState("");
  const [bodyFatPercent, setBodyFatPercent] = React.useState("");

  const [fitnessOpen, setFitnessOpen] = React.useState(false);
  const [testName, setTestName] = React.useState("");
  const [testValue, setTestValue] = React.useState("");
  const [testUnit, setTestUnit] = React.useState("");

  async function handleLogMeasurement() {
    try {
      await createMeasurement.mutateAsync({
        weightKg: weightKg ? Number(weightKg) : undefined,
        bodyFatPercent: bodyFatPercent ? Number(bodyFatPercent) : undefined,
      });
      toast.success("Measurement logged");
      setMeasurementOpen(false);
      setWeightKg("");
      setBodyFatPercent("");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to log measurement");
    }
  }

  async function handleLogFitnessTest() {
    if (!testName.trim() || !testValue || !testUnit.trim()) return;
    try {
      await createFitness.mutateAsync({ testName, value: Number(testValue), unit: testUnit });
      toast.success("Fitness test logged");
      setFitnessOpen(false);
      setTestName("");
      setTestValue("");
      setTestUnit("");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to log fitness test");
    }
  }

  if (measurementsQuery.isLoading || fitnessQuery.isLoading) return <Skeleton className="h-24 w-full" />;

  type Row = { id: string; date: string; label: string; detail: string };
  const rows: Row[] = [
    ...(measurementsQuery.data ?? []).map((m) => {
      const parts: string[] = [];
      if (m.weightKg) parts.push(`${m.weightKg} kg`);
      if (m.bodyFatPercent) parts.push(`${m.bodyFatPercent}% body fat`);
      return {
        id: `measurement-${m.id}`,
        date: m.recordedAt,
        label: "Measurement",
        detail: parts.join(" · ") || "—",
      };
    }),
    ...(fitnessQuery.data ?? []).map((f) => ({
      id: `fitness-${f.id}`,
      date: f.recordedAt,
      label: f.testName,
      detail: `${f.value} ${f.unit}`,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end gap-2">
        <Dialog open={measurementOpen} onOpenChange={setMeasurementOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="size-3.5" />
              Log measurement
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log a measurement</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <Input
                type="number"
                placeholder="Weight (kg)"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Body fat %"
                value={bodyFatPercent}
                onChange={(e) => setBodyFatPercent(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button onClick={handleLogMeasurement} disabled={createMeasurement.isPending}>
                {createMeasurement.isPending ? "Logging..." : "Log measurement"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={fitnessOpen} onOpenChange={setFitnessOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="size-3.5" />
              Log fitness test
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log a fitness test result</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <Input
                placeholder="Test name (e.g. 1RM Bench Press)"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  placeholder="Value"
                  value={testValue}
                  onChange={(e) => setTestValue(e.target.value)}
                />
                <Input
                  placeholder="Unit (kg, sec, reps...)"
                  value={testUnit}
                  onChange={(e) => setTestUnit(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleLogFitnessTest}
                disabled={!testName.trim() || !testValue || !testUnit.trim() || createFitness.isPending}
              >
                {createFitness.isPending ? "Logging..." : "Log result"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No measurements or fitness tests yet"
          description="Log a weigh-in or a fitness test result to start tracking progress."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <div>
                <span className="font-medium">{row.label}</span>
                <span className="ml-2 text-muted-foreground">{row.detail}</span>
              </div>
              <span className="text-xs text-muted-foreground">{fmtDateTime(row.date)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// -- Goals --------------------------------------------------------------------------

const GOAL_CATEGORY_LABELS: Record<MemberGoalCategory, string> = {
  WEIGHT_LOSS: "Weight loss",
  MUSCLE_GAIN: "Muscle gain",
  STRENGTH: "Strength",
  ENDURANCE: "Endurance",
  GENERAL_FITNESS: "General fitness",
  OTHER: "Other",
};

const GOAL_STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "warning"> = {
  ACTIVE: "default",
  ACHIEVED: "secondary",
  PAUSED: "warning",
  ABANDONED: "destructive",
};

function GoalMilestones({
  memberId,
  goalId,
  milestones,
}: {
  memberId: string;
  goalId: string;
  milestones: MemberGoalMilestone[];
}) {
  const createMilestone = useCreateMemberGoalMilestone(memberId);
  const achieveMilestone = useAchieveMemberGoalMilestone(memberId);
  const [title, setTitle] = React.useState("");

  async function handleAdd() {
    if (!title.trim()) return;
    try {
      await createMilestone.mutateAsync({ goalId, input: { title } });
      setTitle("");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to add milestone");
    }
  }

  return (
    <div className="mt-2 flex flex-col gap-2 border-t pt-2">
      {milestones.map((m) => (
        <div key={m.id} className="flex items-center justify-between text-sm">
          <span className={m.achievedAt ? "text-muted-foreground line-through" : ""}>{m.title}</span>
          {m.achievedAt ? (
            <CheckCircle2 className="size-4 text-primary" />
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              disabled={achieveMilestone.isPending}
              onClick={() =>
                achieveMilestone
                  .mutateAsync({ goalId, milestoneId: m.id })
                  .catch((e) => toast.error(e instanceof ApiError ? e.message : "Failed to update"))
              }
            >
              Mark achieved
            </Button>
          )}
        </div>
      ))}
      <div className="flex gap-2">
        <Input
          placeholder="Add a milestone..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-8 text-sm"
        />
        <Button size="sm" className="h-8" onClick={handleAdd} disabled={!title.trim() || createMilestone.isPending}>
          Add
        </Button>
      </div>
    </div>
  );
}

function GoalsPanel({ memberId }: { memberId: string }) {
  const query = useMemberGoals(memberId);
  const create = useCreateMemberGoal(memberId);
  const updateStatus = useUpdateMemberGoal(memberId);
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState<MemberGoalCategory>("GENERAL_FITNESS");

  async function handleCreate() {
    if (!title.trim()) return;
    try {
      await create.mutateAsync({ title, category });
      toast.success("Goal created");
      setOpen(false);
      setTitle("");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to create goal");
    }
  }

  if (query.isLoading) return <Skeleton className="h-24 w-full" />;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="size-3.5" />
              Add goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a goal</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <Input placeholder="Goal title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Select value={category} onValueChange={(v) => setCategory(v as MemberGoalCategory)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GOAL_CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={!title.trim() || create.isPending}>
                {create.isPending ? "Creating..." : "Create goal"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!query.data || query.data.length === 0 ? (
        <EmptyState icon={Target} title="No goals yet" description="Set a goal to track this member's progress." />
      ) : (
        <div className="flex flex-col gap-2">
          {query.data.map((goal) => (
            <div key={goal.id} className="rounded-md border p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{goal.title}</p>
                  <p className="text-xs text-muted-foreground">{GOAL_CATEGORY_LABELS[goal.category]}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={GOAL_STATUS_VARIANT[goal.status]}>{goal.status}</Badge>
                  {goal.status === "ACTIVE" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={updateStatus.isPending}
                      onClick={() =>
                        updateStatus
                          .mutateAsync({ goalId: goal.id, status: "ACHIEVED" })
                          .then(() => toast.success("Goal marked achieved"))
                          .catch((e) => toast.error(e instanceof ApiError ? e.message : "Failed to update"))
                      }
                    >
                      Mark achieved
                    </Button>
                  )}
                </div>
              </div>
              <GoalMilestones memberId={memberId} goalId={goal.id} milestones={goal.milestones} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// -- Root -----------------------------------------------------------------------

export function Member360Tabs({ memberId }: { memberId: string }) {
  return (
    <Tabs defaultValue="addresses">
      <TabsList>
        <TabsTrigger value="addresses">Addresses</TabsTrigger>
        <TabsTrigger value="emergency">Emergency contacts</TabsTrigger>
        <TabsTrigger value="notes">Notes</TabsTrigger>
        <TabsTrigger value="consents">Consents</TabsTrigger>
        <TabsTrigger value="assessments">Assessments</TabsTrigger>
        <TabsTrigger value="goals">Goals</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      <TabsContent value="addresses">
        <AddressesPanel memberId={memberId} />
      </TabsContent>
      <TabsContent value="emergency">
        <EmergencyContactsPanel memberId={memberId} />
      </TabsContent>
      <TabsContent value="notes">
        <NotesPanel memberId={memberId} />
      </TabsContent>
      <TabsContent value="consents">
        <ConsentsPanel memberId={memberId} />
      </TabsContent>
      <TabsContent value="assessments">
        <AssessmentsPanel memberId={memberId} />
      </TabsContent>
      <TabsContent value="goals">
        <GoalsPanel memberId={memberId} />
      </TabsContent>
      <TabsContent value="history">
        <HistoryPanel memberId={memberId} />
      </TabsContent>
    </Tabs>
  );
}

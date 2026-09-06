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
  FileText,
  Clock,
  CreditCard,
  Dumbbell,
  UtensilsCrossed,
  User,
  Mail,
  Calendar,
  Users,
  TrendingUp,
  Award,
  Undo2,
  AlertCircle,
  RefreshCw,
  TrendingDown,
  GitMerge,
  AlertTriangle,
  Snowflake,
  PlayCircle,
  XCircle,
  Pause,
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
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiError } from "@/lib/api/client";
import type {
  MemberAddressType,
  MemberConsentType,
  MemberDocumentCategory,
  MemberGoalCategory,
  MemberGoalMilestone,
  Payment,
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
  useMemberDocuments,
  useUploadMemberDocument,
  useDeleteMemberDocument,
} from "@/lib/hooks/use-member-documents";
import { useMember } from "@/lib/hooks/use-members";
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
import { useMemberAttendance } from "@/lib/hooks/use-member-attendance";
import { useMemberPayments } from "@/lib/hooks/use-member-payments";
import { useRefundPayment } from "@/lib/hooks/use-payments";
import { useMemberships, useCreateMembership } from "@/lib/hooks/use-memberships";
import { useMembershipPlans } from "@/lib/hooks/use-membership-plans";
import { useMemberScreenings, useCreateMemberScreening } from "@/lib/hooks/use-member-screenings";
import { useMemberPtSessions } from "@/lib/hooks/use-member-pt-sessions";
import { useMemberDietAssignments } from "@/lib/hooks/use-member-diet";
import { useMemberTimeline } from "@/lib/hooks/use-member-360";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { DuplicateDetectionResult, TimelineEventType } from "@/lib/types/gym";

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
}

// -- Overview Panel ----------------------------------------------------------------

function InfoRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card/50 p-3 transition-colors hover:bg-card">
      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="size-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className="mt-0.5 text-sm font-semibold">{value || "—"}</div>
      </div>
    </div>
  );
}

function MemberOverviewPanel({ memberId }: { memberId: string }) {
  const { data: member, isLoading: memberLoading } = useMember(memberId);
  const { data: addresses } = useMemberAddresses(memberId);
  const { data: emergencyContacts } = useMemberEmergencyContacts(memberId);
  const { data: goals } = useMemberGoals(memberId);
  const { data: measurements } = useMemberMeasurements(memberId);
  const { data: screenings } = useMemberScreenings(memberId);
  const { data: payments } = useMemberPayments(memberId);
  const { data: attendance } = useMemberAttendance(memberId);
  const { data: consents } = useMemberConsents(memberId);

  if (memberLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!member) {
    return <EmptyState title="Member not found" description="Unable to load member information." />;
  }

  const activeGoals = goals?.filter((g) => g.status === "ACTIVE") ?? [];
  const latestMeasurement = measurements
    ? [...measurements].sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0]
    : null;
  const latestScreening = screenings?.[0];
  const totalPaid = payments?.reduce((sum, p) => sum + (p.status === "COMPLETED" ? Number(p.amount) : 0), 0) ?? 0;
  const thisMonthAttendance = attendance?.filter((a) => {
    const date = new Date(a.checkInAt);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length ?? 0;

  const latestConsent = consents?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  return (
    <div className="flex flex-col gap-6">
      {/* Personal Information */}
      <div>
        <h3 className="mb-3 text-lg font-semibold tracking-tight">Personal Information</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoRow icon={User} label="Full Name" value={`${member.firstName} ${member.lastName}`} />
          <InfoRow icon={Mail} label="Email" value={member.email} />
          <InfoRow icon={Phone} label="Phone" value={member.phone} />
          <InfoRow
            icon={Calendar}
            label="Date of Birth"
            value={member.dateOfBirth ? fmtDate(member.dateOfBirth) : "—"}
          />
          <InfoRow icon={MapPin} label="City" value={member.city || member.addressLine1 || "—"} />
          <InfoRow icon={Award} label="Member Type" value={member.memberType || "—"} />
        </div>
      </div>

      <Separator />

      {/* Emergency & Contact */}
      <div>
        <h3 className="mb-3 text-lg font-semibold tracking-tight">Emergency & Contact</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoRow
            icon={Phone}
            label="Emergency Contact"
            value={
              emergencyContacts?.[0] ? (
                <span>
                  {emergencyContacts[0].name} — {emergencyContacts[0].phone}
                  {emergencyContacts[0].relationship && ` (${emergencyContacts[0].relationship})`}
                </span>
              ) : (
                "—"
              )
            }
          />
          <InfoRow
            icon={MapPin}
            label="Primary Address"
            value={
              addresses?.find((a) => a.isPrimary)
                ? `${addresses.find((a) => a.isPrimary)?.addressLine1}${
                    addresses.find((a) => a.isPrimary)?.city
                      ? `, ${addresses.find((a) => a.isPrimary)?.city}`
                      : ""
                  }`
                : addresses?.[0]
                  ? `${addresses[0].addressLine1}${
                      addresses[0].city ? `, ${addresses[0].city}` : ""
                    }`
                  : "—"
            }
          />
        </div>
      </div>

      <Separator />

      {/* Health & Fitness */}
      <div>
        <h3 className="mb-3 text-lg font-semibold tracking-tight">Health & Fitness</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InfoRow
            icon={TrendingUp}
            label="Current Weight"
            value={latestMeasurement?.weightKg ? `${latestMeasurement.weightKg} kg` : "—"}
          />
          <InfoRow
            icon={Target}
            label="Active Goals"
            value={activeGoals.length > 0 ? `${activeGoals.length} goal${activeGoals.length > 1 ? "s" : ""}` : "—"}
          />
          <InfoRow
            icon={Activity}
            label="PAR-Q Status"
            value={
              latestScreening?.flaggedForMedicalClearance ? (
                <Badge variant="warning" className="rounded-full">Review Needed</Badge>
              ) : latestScreening ? (
                <Badge variant="default" className="rounded-full bg-emerald-500">Cleared</Badge>
              ) : (
                "Not completed"
              )
            }
          />
          <InfoRow
            icon={ShieldCheck}
            label="Latest Consent"
            value={
              latestConsent ? (
                <Badge
                  variant={latestConsent.granted ? "default" : "secondary"}
                  className="rounded-full"
                >
                  {latestConsent.type}
                </Badge>
              ) : (
                "—"
              )
            }
          />
        </div>
      </div>

      <Separator />

      {/* Engagement */}
      <div>
        <h3 className="mb-3 text-lg font-semibold tracking-tight">Engagement</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InfoRow
            icon={Calendar}
            label="This Month's Visits"
            value={thisMonthAttendance}
          />
          <InfoRow
            icon={CreditCard}
            label="Total Paid"
            value={totalPaid > 0 ? `$${totalPaid.toLocaleString()}` : "—"}
          />
          <InfoRow
            icon={Users}
            label="Assigned Trainer"
            value={
              member.assignedTrainer
                ? `${member.assignedTrainer.firstName} ${member.assignedTrainer.lastName}`
                : "—"
            }
          />
          <InfoRow
            icon={Dumbbell}
            label="Member Since"
            value={fmtDate(member.joinedAt)}
          />
        </div>
      </div>
    </div>
  );
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

// -- Documents ------------------------------------------------------------------

const DOCUMENT_CATEGORY_LABELS: Record<MemberDocumentCategory, string> = {
  DOCUMENT: "Document",
  PROGRESS_PHOTO: "Progress photo",
  ID_SCAN: "ID scan",
  OTHER: "Other",
};

const ALLOWED_DOCUMENT_TYPES = "image/jpeg,image/png,image/webp,application/pdf";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentsPanel({ memberId }: { memberId: string }) {
  const query = useMemberDocuments(memberId);
  const upload = useUploadMemberDocument(memberId);
  const remove = useDeleteMemberDocument(memberId);
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [category, setCategory] = React.useState<MemberDocumentCategory>("DOCUMENT");
  const [description, setDescription] = React.useState("");

  async function handleUpload() {
    if (!file) return;
    try {
      await upload.mutateAsync({ file, category, description: description || undefined });
      toast.success("Document uploaded");
      setOpen(false);
      setFile(null);
      setDescription("");
      setCategory("DOCUMENT");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to upload document");
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
              Upload document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload a document</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <Input
                type="file"
                accept={ALLOWED_DOCUMENT_TYPES}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, or PDF, up to 10MB.</p>
              <Select value={category} onValueChange={(v) => setCategory(v as MemberDocumentCategory)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button onClick={handleUpload} disabled={!file || upload.isPending}>
                {upload.isPending ? "Uploading..." : "Upload"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!query.data || query.data.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Upload documents and progress photos for this member."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {query.data.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
              <div className="flex min-w-0 items-center gap-3">
                {doc.mimeType.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element -- signed URL, not a static asset Next's optimizer can proxy
                  <img
                    src={doc.url}
                    alt={doc.originalName}
                    className="size-10 shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="flex size-10 shrink-0 items-center justify-center rounded bg-muted">
                    <FileText className="size-4 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{doc.originalName}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{DOCUMENT_CATEGORY_LABELS[doc.category]}</Badge>
                    <span>{formatFileSize(doc.sizeBytes)}</span>
                    <span>· {fmtDateTime(doc.createdAt)}</span>
                  </div>
                  {doc.description && <p className="mt-1 text-xs text-muted-foreground">{doc.description}</p>}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button variant="ghost" size="sm" asChild>
                  <a href={doc.url} target="_blank" rel="noreferrer">
                    View
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  disabled={remove.isPending}
                  onClick={() =>
                    remove
                      .mutateAsync(doc.id)
                      .then(() => toast.success("Document deleted"))
                      .catch((e) => toast.error(e instanceof ApiError ? e.message : "Failed to delete"))
                  }
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// -- Attendance Panel
function AttendancePanel({ memberId }: { memberId: string }) {
  const query = useMemberAttendance(memberId);

  if (query.isLoading) return <Skeleton className="h-24 w-full" />;

  if (!query.data || query.data.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="No attendance history"
        description="Check-in history will appear here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {query.data.map((record) => (
        <div key={record.id} className="flex items-center justify-between rounded-md border p-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
              <Clock className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {new Date(record.checkInAt).toLocaleDateString()} {new Date(record.checkInAt).toLocaleTimeString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {record.method} &bull; Branch: {record.branchId}
              </p>
            </div>
          </div>
          {record.checkOutAt && (
            <Badge variant="secondary">Out: {new Date(record.checkOutAt).toLocaleTimeString()}</Badge>
          )}
        </div>
      ))}
    </div>
  );
}

// -- Payments Panel
function PaymentsPanel({ memberId }: { memberId: string }) {
  const paymentsQuery = useMemberPayments(memberId);
  const membershipsQuery = useMemberships({ memberId });
  const refundPayment = useRefundPayment();
  const [refundOpen, setRefundOpen] = React.useState(false);
  const [selectedPayment, setSelectedPayment] = React.useState<Payment | null>(null);
  const [renewOpen, setRenewOpen] = React.useState(false);
  const [renewPlanId, setRenewPlanId] = React.useState("");
  const createMembership = useCreateMembership();
  const plansQuery = useMembershipPlans({ pageSize: 100 });

  if (paymentsQuery.isLoading || membershipsQuery.isLoading) return <Skeleton className="h-24 w-full" />;

  const payments = paymentsQuery.data ?? [];
  const memberships = membershipsQuery.data?.items ?? [];

  const totalFromMemberships = memberships.reduce((sum, m) => sum + Number(m.price), 0);
  const totalDiscounts = memberships.reduce((sum, m) => {
    const planPrice = Number(m.membershipPlan?.price ?? m.price);
    return sum + Math.max(0, planPrice - Number(m.price));
  }, 0);
  const finalAmount = totalFromMemberships - totalDiscounts;

  const totalPaid = payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const totalRefunded = payments.flatMap((p) => p.refunds ?? []).reduce((sum, r) => sum + Number(r.amount), 0);
  const outstandingBalance = finalAmount - totalPaid + totalRefunded;

  const currency = payments[0]?.currency ?? memberships[0]?.currency ?? "USD";

  const activeOrExpiring = memberships.filter(
    (m) => m.status === "ACTIVE" || m.status === "EXPIRED" || m.status === "PENDING"
  );
  const canRenew = activeOrExpiring.length > 0;

  function openRefundDialog(payment: Payment) {
    setSelectedPayment(payment);
    setRefundOpen(true);
  }

  async function handleRefund(amount: number, reason: string) {
    if (!selectedPayment) return;
    try {
      await refundPayment.mutateAsync({
        id: selectedPayment.id,
        input: { amount, reason },
      });
      toast.success("Refund recorded");
      setRefundOpen(false);
      setSelectedPayment(null);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Refund failed");
    }
  }

  async function handleRenew() {
    if (!renewPlanId) return;
    try {
      await createMembership.mutateAsync({ memberId, membershipPlanId: renewPlanId });
      toast.success("Membership renewed successfully");
      setRenewOpen(false);
      setRenewPlanId("");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to renew membership");
    }
  }

  if (payments.length === 0 && memberships.length === 0) {
    return (
      <EmptyState
        icon={CreditCard}
        title="No billing history"
        description="Membership and payment history will appear here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        {canRenew && (
          <Dialog open={renewOpen} onOpenChange={setRenewOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <RefreshCw className="size-3.5" />
                Renew Membership
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Renew Membership</DialogTitle>
              </DialogHeader>
              <Select value={renewPlanId} onValueChange={setRenewPlanId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plansQuery.data?.items
                    .filter((plan) => plan.isActive)
                    .map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} — {plan.currency} {plan.price} / {plan.durationDays}d
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <DialogFooter>
                <Button onClick={handleRenew} disabled={!renewPlanId || createMembership.isPending}>
                  {createMembership.isPending ? "Renewing..." : "Renew"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border bg-muted/20 p-3">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-lg font-semibold tabular-nums">
            {currency} {totalFromMemberships.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border bg-muted/20 p-3">
          <p className="text-xs text-muted-foreground">Discounts</p>
          <p className="text-lg font-semibold tabular-nums text-muted-foreground">
            -{currency} {totalDiscounts.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border bg-primary/5 p-3">
          <p className="text-xs text-muted-foreground">Final</p>
          <p className="text-lg font-semibold tabular-nums">
            {currency} {finalAmount.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border bg-muted/20 p-3">
          <p className="text-xs text-muted-foreground">Paid</p>
          <p className="text-lg font-semibold tabular-nums text-emerald-600">
            {currency} {totalPaid.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border bg-muted/20 p-3">
          <p className="text-xs text-muted-foreground">Outstanding</p>
          <p className={`text-lg font-semibold tabular-nums ${outstandingBalance > 0 ? "text-red-600" : "text-emerald-600"}`}>
            {currency} {Math.abs(outstandingBalance).toLocaleString()}
            {outstandingBalance > 0 ? " due" : ""}
          </p>
        </div>
      </div>

      {memberships.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium">Memberships</h4>
          <div className="flex flex-col gap-2">
            {memberships.map((membership) => (
              <div key={membership.id} className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
                    <Dumbbell className="size-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {membership.membershipPlan?.name ?? "Membership"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {membership.membershipPlan?.durationDays ?? 0} days &bull;{" "}
                      {new Date(membership.startDate).toLocaleDateString()} -{" "}
                      {new Date(membership.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      membership.status === "ACTIVE"
                        ? "default"
                        : membership.status === "EXPIRED"
                        ? "destructive"
                        : membership.status === "FROZEN"
                        ? "warning"
                        : "secondary"
                    }
                  >
                    {membership.status}
                  </Badge>
                  <span className="text-sm font-medium tabular-nums">
                    {membership.currency} {Number(membership.price).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {payments.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium">Payments</h4>
          <div className="flex flex-col gap-2">
            {payments.map((payment) => {
              const refunded = (payment.refunds ?? []).reduce((sum, r) => sum + Number(r.amount), 0);
              const statusVariant =
                payment.status === "COMPLETED"
                  ? "success"
                  : payment.status === "PARTIALLY_REFUNDED"
                  ? "warning"
                  : "secondary";
              return (
                <div key={payment.id} className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
                      <CreditCard className="size-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {payment.currency} {Number(payment.amount).toLocaleString()}
                        {refunded > 0 && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (refunded: {payment.currency} {refunded.toLocaleString()})
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payment.method} &bull; {new Date(payment.createdAt).toLocaleDateString()}
                        {payment.note && <> &bull; {payment.note}</>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant as "success" | "warning" | "secondary"}>
                      {payment.status}
                    </Badge>
                    {payment.status === "COMPLETED" && (
                      <Button variant="ghost" size="sm" onClick={() => openRefundDialog(payment)}>
                        <Undo2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refund Payment</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <RefundPaymentForm
              payment={selectedPayment}
              onSubmit={handleRefund}
              onCancel={() => setRefundOpen(false)}
              isPending={refundPayment.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RefundPaymentForm({
  payment,
  onSubmit,
  onCancel,
  isPending,
}: {
  payment: Payment;
  onSubmit: (amount: number, reason: string) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [amount, setAmount] = React.useState("");
  const [reason, setReason] = React.useState("");
  const alreadyRefunded = (payment.refunds ?? []).reduce((sum, r) => sum + Number(r.amount), 0);
  const remaining = Number(payment.amount) - alreadyRefunded;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(Number(amount) || remaining, reason);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Remaining refundable balance: {payment.currency} {remaining.toFixed(2)}
      </p>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Amount</label>
        <Input
          type="number"
          step="0.01"
          placeholder={remaining.toFixed(2)}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Reason (optional)</label>
        <Input
          placeholder="Customer request, service issue, ..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="destructive" disabled={isPending}>
          {isPending ? "Refunding..." : "Issue refund"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// -- Screening Panel (PAR-Q)
function ScreeningPanel({ memberId }: { memberId: string }) {
  const query = useMemberScreenings(memberId);
  const create = useCreateMemberScreening(memberId);
  const [open, setOpen] = React.useState(false);
  const [responses, setResponses] = React.useState<Record<string, boolean>>({});

  const PAR_Q_QUESTIONS = [
    { key: "heartCondition", question: "Has a doctor ever said you have a heart condition?" },
    { key: "chestPain", question: "Do you experience chest pain during physical activity?" },
    { key: "dizziness", question: "Do you ever feel dizzy or faint?" },
    { key: "jointProblems", question: "Do you have joint or bone problems that may worsen with exercise?" },
    { key: "onMedication", question: "Are you currently taking any medication?" },
    { key: "pregnant", question: "Are you pregnant or possibly pregnant?" },
  ];

  async function handleSubmit() {
    const flagged = Object.entries(responses).some(([, value]) => value);
    await create.mutateAsync({
      responses,
      flaggedForMedicalClearance: flagged,
    });
    toast.success("PAR-Q submitted");
    setOpen(false);
    setResponses({});
  }

  if (query.isLoading) return <Skeleton className="h-24 w-full" />;

  const latestScreening = query.data?.[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="size-3.5" />
              New PAR-Q
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>PAR-Q Health Screening</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              {PAR_Q_QUESTIONS.map((q) => (
                <div key={q.key} className="flex items-center justify-between">
                  <span className="text-sm">{q.question}</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={responses[q.key] === true ? "default" : "outline"}
                      onClick={() => setResponses({ ...responses, [q.key]: true })}
                    >
                      Yes
                    </Button>
                    <Button
                      size="sm"
                      variant={responses[q.key] === false ? "default" : "outline"}
                      onClick={() => setResponses({ ...responses, [q.key]: false })}
                    >
                      No
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={create.isPending}>
                {create.isPending ? "Submitting..." : "Submit"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {latestScreening ? (
        <div className="rounded-md border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Latest PAR-Q</p>
              <p className="text-sm text-muted-foreground">{new Date(latestScreening.completedAt).toLocaleDateString()}</p>
            </div>
            {latestScreening.flaggedForMedicalClearance && (
              <Badge variant="destructive">Medical clearance needed</Badge>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(latestScreening.responses).map(([key, value]) => (
              <Badge key={key} variant={value ? "destructive" : "secondary"}>
                {PAR_Q_QUESTIONS.find((q) => q.key === key)?.question.slice(0, 30)}: {value ? "Yes" : "No"}
              </Badge>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={ShieldCheck}
          title="No PAR-Q on file"
          description="Complete a PAR-Q health screening to document health history."
        />
      )}
    </div>
  );
}

// -- PT Sessions Panel
function PtSessionsPanel({ memberId }: { memberId: string }) {
  const query = useMemberPtSessions(memberId);

  if (query.isLoading) return <Skeleton className="h-24 w-full" />;

  if (!query.data || query.data.length === 0) {
    return (
      <EmptyState
        icon={Dumbbell}
        title="No PT sessions"
        description="Book a personal training session to get started."
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {query.data.map((session) => (
        <div key={session.id} className="rounded-md border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <Dumbbell className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">
                  {new Date(session.scheduledAt).toLocaleDateString()} at {new Date(session.scheduledAt).toLocaleTimeString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {session.trainer?.firstName} {session.trainer?.lastName}
                  {session.workoutPlan && ` &bull; ${session.workoutPlan.name}`}
                </p>
              </div>
            </div>
            <Badge
              variant={session.status === "COMPLETED" ? "default" : session.status === "CANCELLED" ? "secondary" : "outline"}
            >
              {session.status}
            </Badge>
          </div>
          {session.notes && <p className="mt-2 text-sm text-muted-foreground">{session.notes}</p>}
        </div>
      ))}
    </div>
  );
}

// -- Nutrition Panel
function NutritionPanel({ memberId }: { memberId: string }) {
  const query = useMemberDietAssignments(memberId);

  if (query.isLoading) return <Skeleton className="h-24 w-full" />;

  if (!query.data || query.data.length === 0) {
    return (
      <EmptyState
        icon={UtensilsCrossed}
        title="No diet plans assigned"
        description="Assign a diet plan to help track nutrition."
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {query.data.map((assignment) => (
        <div key={assignment.id} className="rounded-md border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{assignment.dietPlan?.name}</p>
              <p className="text-sm text-muted-foreground">Started {new Date(assignment.startDate).toLocaleDateString()}</p>
            </div>
            <Badge variant={assignment.status === "ACTIVE" ? "default" : assignment.status === "COMPLETED" ? "secondary" : "outline"}>
              {assignment.status}
            </Badge>
          </div>
          {assignment.dietPlan && (
            <p className="mt-2 text-sm text-muted-foreground">Diet plan assigned</p>
          )}
        </div>
      ))}
    </div>
  );
}

// -- Timeline Panel
const TIMELINE_ICON_MAP: Record<TimelineEventType, typeof Activity> = {
  member_created: User,
  status_changed: TrendingUp,
  branch_changed: MapPin,
  trainer_changed: Users,
  membership_started: CreditCard,
  membership_renewed: RefreshCw,
  membership_frozen: Snowflake,
  membership_resumed: PlayCircle,
  membership_cancelled: XCircle,
  membership_expired: Clock,
  attendance_checkin: Clock,
  attendance_checkout: Clock,
  payment_received: CreditCard,
  refund_issued: Undo2,
  pt_session_scheduled: Dumbbell,
  pt_session_completed: CheckCircle2,
  pt_session_cancelled: XCircle,
  pt_session_no_show: AlertTriangle,
  assessment_completed: Activity,
  measurement_recorded: TrendingDown,
  fitness_test_recorded: TrendingUp,
  screening_completed: ShieldCheck,
  goal_created: Target,
  goal_achieved: Award,
  goal_paused: Pause,
  goal_abandoned: XCircle,
  document_uploaded: FileText,
  note_added: StickyNote,
  consent_recorded: ShieldCheck,
  message_sent: Mail,
};

function TimelinePanel({ memberId }: { memberId: string }) {
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(50);
  const { data, isLoading } = useMemberTimeline(memberId, page, pageSize);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.events.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No activity yet"
        description="This member's activity timeline will appear here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {data.events.map((event) => {
          const Icon = TIMELINE_ICON_MAP[event.type] ?? History;
          return (
            <div key={event.id} className="flex items-start gap-3 rounded-md border p-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="size-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{event.title}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {fmtDateTime(event.timestamp)}
                  </span>
                </div>
                {event.description && (
                  <p className="mt-0.5 text-sm text-muted-foreground">{event.description}</p>
                )}
                {event.actorName && (
                  <p className="mt-0.5 text-xs text-muted-foreground">by {event.actorName}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {data.totalCount > pageSize && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {Math.ceil(data.totalCount / pageSize)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page * pageSize >= data.totalCount}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

// -- Duplicates Panel
function DuplicatesPanel({ memberId }: { memberId: string }) {
  const [mergeOpen, setMergeOpen] = React.useState(false);
  const [selectedDuplicate, setSelectedDuplicate] = React.useState<DuplicateDetectionResult | null>(null);

  const { data, isLoading, refetch } = useQuery<DuplicateDetectionResult>({
    queryKey: ["member-duplicates", memberId],
    queryFn: () => api.get<DuplicateDetectionResult>(`/members/${memberId}/duplicates`),
  });

  const previewMerge = useMutation({
    mutationFn: ({ sourceId, targetId }: { sourceId: string; targetId: string }) =>
      api.get<unknown>("/members/duplicates/preview-merge", {
        query: { sourceId, targetId },
      }),
  });

  const executeMerge = useMutation({
    mutationFn: ({
      sourceMemberId,
      targetMemberId,
      resolution,
    }: {
      sourceMemberId: string;
      targetMemberId: string;
      resolution: Record<string, "source" | "target">;
    }) =>
      api.post<{ success: boolean; mergedMemberId: string }>("/members/duplicates/execute-merge", {
        sourceMemberId,
        targetMemberId,
        resolution,
      }),
    onSuccess: () => {
      toast.success("Members merged successfully");
      setMergeOpen(false);
      setSelectedDuplicate(null);
      void refetch();
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Failed to merge members");
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.potentialDuplicates.length === 0) {
    return (
      <EmptyState
        icon={GitMerge}
        title="No duplicates found"
        description="This member doesn't have any potential duplicate records."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Found {data.potentialDuplicates.length} potential duplicate
          {data.potentialDuplicates.length !== 1 ? "s" : ""}
        </p>
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          <RefreshCw className="size-3.5" />
          Refresh
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {data.potentialDuplicates.map((dup) => (
          <div key={dup.memberId} className="flex items-center justify-between rounded-md border p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-warning/10">
                <AlertTriangle className="size-5 text-warning" />
              </div>
              <div>
                <p className="font-medium">
                  {dup.firstName} {dup.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {dup.email && <span>{dup.email}</span>}
                  {dup.phone && <span> · {dup.phone}</span>}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="outline">{dup.status}</Badge>
                  <Badge variant={dup.matchScore >= 80 ? "destructive" : "secondary"}>
                    {dup.matchScore}% match
                  </Badge>
                </div>
                {dup.matchReasons.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Reasons: {dup.matchReasons.join(", ")}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedDuplicate(data);
                  setMergeOpen(true);
                }}
              >
                Review & Merge
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={mergeOpen} onOpenChange={setMergeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Merge Members</DialogTitle>
          </DialogHeader>
          {selectedDuplicate && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">Source (to merge)</p>
                  <p className="mt-1">
                    {data.firstName} {data.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{data.email ?? "No email"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Target (to keep)</p>
                  <p className="mt-1">
                    {selectedDuplicate.firstName} {selectedDuplicate.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDuplicate.email ?? "No email"}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => setMergeOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() =>
                    executeMerge.mutate({
                      sourceMemberId: data.memberId,
                      targetMemberId: selectedDuplicate.memberId,
                      resolution: {},
                    })
                  }
                  disabled={executeMerge.isPending}
                >
                  {executeMerge.isPending ? "Merging..." : "Confirm Merge"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// -- Root -----------------------------------------------------------------------

export function Member360Tabs({ memberId }: { memberId: string }) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <div className="relative">
        <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-none border-b bg-transparent p-0">
          <TabsTrigger
            value="overview"
            className="relative rounded-none border-b-2 border-transparent px-4 py-3 text-sm transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:translate-y-full data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="addresses"
            className="relative rounded-none border-b-2 border-transparent px-4 py-3 text-sm transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:translate-y-full data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Addresses
          </TabsTrigger>
          <TabsTrigger
            value="emergency"
            className="relative rounded-none border-b-2 border-transparent px-4 py-3 text-sm transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:translate-y-full data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Emergency
          </TabsTrigger>
          <TabsTrigger
            value="notes"
            className="relative rounded-none border-b-2 border-transparent px-4 py-3 text-sm transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:translate-y-full data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Notes
          </TabsTrigger>
          <TabsTrigger
            value="consents"
            className="relative rounded-none border-b-2 border-transparent px-4 py-3 text-sm transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:translate-y-full data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Consents
          </TabsTrigger>
          <TabsTrigger
            value="assessments"
            className="relative rounded-none border-b-2 border-transparent px-4 py-3 text-sm transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:translate-y-full data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Assessments
          </TabsTrigger>
          <TabsTrigger
            value="goals"
            className="relative rounded-none border-b-2 border-transparent px-4 py-3 text-sm transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:translate-y-full data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Goals
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="relative rounded-none border-b-2 border-transparent px-4 py-3 text-sm transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:translate-y-full data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Documents
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="relative rounded-none border-b-2 border-transparent px-4 py-3 text-sm transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:translate-y-full data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            History
          </TabsTrigger>
          <TabsTrigger
            value="attendance"
            className="relative rounded-none border-b-2 border-transparent px-4 py-3 text-sm transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:translate-y-full data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Attendance
          </TabsTrigger>
          <TabsTrigger
            value="payments"
            className="relative rounded-none border-b-2 border-transparent px-4 py-3 text-sm transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:translate-y-full data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Payments
          </TabsTrigger>
          <TabsTrigger
            value="screening"
            className="relative rounded-none border-b-2 border-transparent px-4 py-3 text-sm transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:translate-y-full data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            PAR-Q
          </TabsTrigger>
          <TabsTrigger
            value="pt-sessions"
            className="relative rounded-none border-b-2 border-transparent px-4 py-3 text-sm transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:translate-y-full data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            PT Sessions
          </TabsTrigger>
          <TabsTrigger
            value="nutrition"
            className="relative rounded-none border-b-2 border-transparent px-4 py-3 text-sm transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:translate-y-full data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Nutrition
          </TabsTrigger>
          <TabsTrigger
            value="timeline"
            className="relative rounded-none border-b-2 border-transparent px-4 py-3 text-sm transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:translate-y-full data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Timeline
          </TabsTrigger>
          <TabsTrigger
            value="duplicates"
            className="relative rounded-none border-b-2 border-transparent px-4 py-3 text-sm transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:translate-y-full data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Duplicates
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="overview" className="mt-6">
        <MemberOverviewPanel memberId={memberId} />
      </TabsContent>
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
      <TabsContent value="documents">
        <DocumentsPanel memberId={memberId} />
      </TabsContent>
      <TabsContent value="history">
        <HistoryPanel memberId={memberId} />
      </TabsContent>
      <TabsContent value="attendance">
        <AttendancePanel memberId={memberId} />
      </TabsContent>
      <TabsContent value="payments">
        <PaymentsPanel memberId={memberId} />
      </TabsContent>
      <TabsContent value="screening">
        <ScreeningPanel memberId={memberId} />
      </TabsContent>
      <TabsContent value="pt-sessions">
        <PtSessionsPanel memberId={memberId} />
      </TabsContent>
      <TabsContent value="nutrition">
        <NutritionPanel memberId={memberId} />
      </TabsContent>
      <TabsContent value="timeline">
        <TimelinePanel memberId={memberId} />
      </TabsContent>
      <TabsContent value="duplicates">
        <DuplicatesPanel memberId={memberId} />
      </TabsContent>
    </Tabs>
  );
}

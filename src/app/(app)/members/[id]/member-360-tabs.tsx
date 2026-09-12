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
  CalendarDays,
  CheckSquare,
  Tag,
  Send,
  MessageSquare,
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
  useSubmitMemberDocument,
  useReviewMemberDocument,
  useUploadMemberDocumentVersion,
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
import { OPEN_INVOICE_STATUSES, useInvoices, useRetryCollection } from "@/lib/hooks/use-invoices";
import { useMemberships, useRenewMembership, useMembershipHistory } from "@/lib/hooks/use-memberships";
import { useMembershipPlans } from "@/lib/hooks/use-membership-plans";
import { useMemberScreenings, useCreateMemberScreening } from "@/lib/hooks/use-member-screenings";
import { useMemberPtSessions } from "@/lib/hooks/use-member-pt-sessions";
import { useMemberDietAssignments } from "@/lib/hooks/use-member-diet";
import { useMemberWorkoutAssignments } from "@/lib/hooks/use-member-workouts";
import { useMemberTimeline } from "@/lib/hooks/use-member-360";
import {
  useMemberFollowUps,
  useCreateMemberFollowUp,
  useUpdateMemberFollowUp,
  useCompleteMemberFollowUp,
  useUncompleteMemberFollowUp,
  useDeleteMemberFollowUp,
} from "@/lib/hooks/use-member-follow-ups";
import {
  useMemberTags,
  useMemberTagAssignments,
  useAssignMemberTags,
  useAddMemberTag,
  useRemoveMemberTag,
} from "@/lib/hooks/use-member-tags";
import { useMemberCommunications, useSendMemberMessage } from "@/lib/hooks/use-member-communications";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { CommunicationChannel, DuplicateDetectionResult, TimelineEventType } from "@/lib/types/gym";

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
}

// -- Overview Panel ----------------------------------------------------------------

function InfoRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-[20px] border border-stone-200/70 bg-white/80 p-4 shadow-sm transition hover:border-violet-200 hover:shadow-md">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-md shadow-violet-500/20">
        <Icon className="size-4" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wide text-stone-500">{label}</p>
        <div className="mt-0.5 text-sm font-bold text-stone-900">{value || "—"}</div>
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
        <h3 className="mb-3 font-serif text-lg font-semibold tracking-tight text-stone-950">Personal Information</h3>
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
        <h3 className="mb-3 font-serif text-lg font-semibold tracking-tight text-stone-950">Emergency & Contact</h3>
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
        <h3 className="mb-3 font-serif text-lg font-semibold tracking-tight text-stone-950">Health & Fitness</h3>
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
        <h3 className="mb-3 font-serif text-lg font-semibold tracking-tight text-stone-950">Engagement</h3>
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
            <Button size="sm" variant="outline" className="min-h-11 rounded-2xl border-violet-200/70 bg-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">
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
            <div key={addr.id} className="flex items-start justify-between rounded-[20px] border border-stone-200/70 bg-white/80 p-4 shadow-sm transition hover:border-violet-200 hover:shadow-md">
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
            <Button size="sm" variant="outline" className="min-h-11 rounded-2xl border-violet-200/70 bg-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">
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
            <div key={contact.id} className="flex items-start justify-between rounded-[20px] border border-stone-200/70 bg-white/80 p-4 shadow-sm transition hover:border-violet-200 hover:shadow-md">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{contact.name}</p>
                  {contact.isPrimary && <Badge>Primary</Badge>}
                </div>
                <p className="text-sm text-stone-600">
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
            <div key={note.id} className="flex items-start justify-between rounded-[20px] border border-stone-200/70 bg-white/80 p-4 shadow-sm transition hover:border-violet-200 hover:shadow-md">
              <div>
                <div className="flex items-center gap-2 text-xs text-stone-600">
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
            <Button size="sm" variant="outline" className="min-h-11 rounded-2xl border-violet-200/70 bg-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">
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
            <div key={consent.id} className="flex items-center justify-between rounded-[20px] border border-stone-200/70 bg-white/80 p-4 shadow-sm transition hover:border-violet-200 hover:shadow-md">
              <div>
                <p className="font-medium">{CONSENT_LABELS[consent.type]}</p>
                {consent.note && <p className="text-sm text-stone-600">{consent.note}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={consent.granted ? "default" : "destructive"}>
                  {consent.granted ? "Granted" : "Revoked"}
                </Badge>
                <span className="text-xs text-stone-600">{fmtDateTime(consent.createdAt)}</span>
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
        <div key={row.id} className="flex items-center justify-between rounded-[20px] border border-stone-200/70 bg-white/80 p-4 shadow-sm transition hover:border-violet-200 hover:shadow-md text-sm">
          <span>{row.label}</span>
          <span className="text-xs text-stone-600">{fmtDateTime(row.createdAt)}</span>
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
            <Button size="sm" variant="outline" className="min-h-11 rounded-2xl border-violet-200/70 bg-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">
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
            <Button size="sm" variant="outline" className="min-h-11 rounded-2xl border-violet-200/70 bg-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                className="w-full sm:w-auto"
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
            <div key={row.id} className="flex items-center justify-between rounded-[20px] border border-stone-200/70 bg-white/80 p-4 shadow-sm transition hover:border-violet-200 hover:shadow-md text-sm">
              <div>
                <span className="font-medium">{row.label}</span>
                <span className="ml-2 text-stone-600">{row.detail}</span>
              </div>
              <span className="text-xs text-stone-600">{fmtDateTime(row.date)}</span>
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
          <span className={m.achievedAt ? "text-stone-600 line-through" : ""}>{m.title}</span>
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
            <Button size="sm" variant="outline" className="min-h-11 rounded-2xl border-violet-200/70 bg-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">
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
            <div key={goal.id} className="rounded-[20px] border border-stone-200/70 bg-white/80 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{goal.title}</p>
                  <p className="text-xs text-stone-600">{GOAL_CATEGORY_LABELS[goal.category]}</p>
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
  const submit = useSubmitMemberDocument(memberId);
  const review = useReviewMemberDocument(memberId);
  const uploadVersion = useUploadMemberDocumentVersion(memberId);
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [category, setCategory] = React.useState<MemberDocumentCategory>("DOCUMENT");
  const [description, setDescription] = React.useState("");
  const [versionOpen, setVersionOpen] = React.useState(false);
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [selectedDocId, setSelectedDocId] = React.useState<string | null>(null);
  const [versionFile, setVersionFile] = React.useState<File | null>(null);
  const [changeNotes, setChangeNotes] = React.useState("");
  const [reviewAction, setReviewAction] = React.useState<"approve" | "reject">("approve");
  const [rejectionReason, setRejectionReason] = React.useState("");

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

  async function handleSubmit(docId: string) {
    try {
      await submit.mutateAsync({ documentId: docId, changeNotes });
      toast.success("Document submitted for review");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to submit document");
    }
  }

  async function handleReview() {
    if (!selectedDocId) return;
    try {
      await review.mutateAsync({
        documentId: selectedDocId,
        action: reviewAction,
        rejectionReason: reviewAction === "reject" ? rejectionReason : undefined,
      });
      toast.success(reviewAction === "approve" ? "Document approved" : "Document rejected");
      setReviewOpen(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to review document");
    }
  }

  async function handleUploadVersion() {
    if (!selectedDocId || !versionFile) return;
    try {
      await uploadVersion.mutateAsync({
        documentId: selectedDocId,
        file: versionFile,
        changeNotes: changeNotes || undefined,
      });
      toast.success("New version uploaded");
      setVersionOpen(false);
      setVersionFile(null);
      setChangeNotes("");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to upload version");
    }
  }

  const statusVariant: Record<string, "default" | "secondary" | "destructive" | "warning" | "outline"> = {
    DRAFT: "outline",
    SUBMITTED: "warning",
    APPROVED: "default",
    REJECTED: "destructive",
  };

  if (query.isLoading) return <Skeleton className="h-24 w-full" />;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="min-h-11 rounded-2xl border-violet-200/70 bg-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">
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
              <p className="text-xs text-stone-600">JPEG, PNG, WebP, or PDF, up to 10MB.</p>
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

      <Dialog open={versionOpen} onOpenChange={setVersionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload new version</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input
              type="file"
              accept={ALLOWED_DOCUMENT_TYPES}
              onChange={(e) => setVersionFile(e.target.files?.[0] ?? null)}
            />
            <Textarea
              placeholder="Change notes (optional)"
              value={changeNotes}
              onChange={(e) => setChangeNotes(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVersionOpen(false)}>Cancel</Button>
            <Button onClick={handleUploadVersion} disabled={!versionFile || uploadVersion.isPending}>
              {uploadVersion.isPending ? "Uploading..." : "Upload version"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{reviewAction === "approve" ? "Approve" : "Reject"} document</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {reviewAction === "reject" && (
              <Textarea
                placeholder="Rejection reason (required)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewOpen(false)}>Cancel</Button>
            <Button
              variant={reviewAction === "reject" ? "destructive" : "default"}
              onClick={handleReview}
              disabled={reviewAction === "reject" && !rejectionReason.trim() || review.isPending}
            >
              {review.isPending ? "Processing..." : reviewAction === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!query.data || query.data.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Upload documents and progress photos for this member."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {query.data.map((doc) => (
            <div key={doc.id} className="flex flex-col gap-2 rounded-[20px] border border-stone-200/70 bg-white/80 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  {doc.mimeType?.startsWith("image/") && doc.url ? (
                    <img
                      src={doc.url}
                      alt={doc.originalName ?? ""}
                      className="size-10 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="flex size-10 shrink-0 items-center justify-center rounded bg-muted">
                      <FileText className="size-4 text-stone-600" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{doc.originalName ?? "Unknown"}</p>
                    <div className="flex items-center gap-2 flex-wrap text-xs text-stone-600">
                      <Badge variant="outline">{DOCUMENT_CATEGORY_LABELS[doc.category]}</Badge>
                      <Badge variant={statusVariant[doc.status]}>{doc.status}</Badge>
                      {doc.sizeBytes && <span>{formatFileSize(doc.sizeBytes)}</span>}
                      <span>v{doc.currentVersion}</span>
                      <span>· {fmtDateTime(doc.createdAt)}</span>
                    </div>
                    {doc.description && <p className="mt-1 text-xs text-stone-600">{doc.description}</p>}
                    {doc.status === "REJECTED" && doc.rejectionReason && (
                      <p className="mt-1 text-xs text-destructive">Rejected: {doc.rejectionReason}</p>
                    )}
                    {doc.reviewedBy && (
                      <p className="mt-1 text-xs text-stone-600">
                        {doc.status === "APPROVED" ? "Approved" : "Reviewed"} by {doc.reviewedBy.firstName} {doc.reviewedBy.lastName}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {doc.url && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={doc.url} target="_blank" rel="noreferrer">View</a>
                    </Button>
                  )}
                  {(doc.status === "DRAFT" || doc.status === "REJECTED") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedDocId(doc.id);
                        setChangeNotes("");
                        setVersionOpen(true);
                      }}
                    >
                      <RefreshCw className="size-3.5" />
                      New version
                    </Button>
                  )}
                  {(doc.status === "DRAFT" || doc.status === "REJECTED") && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleSubmit(doc.id)}
                      disabled={submit.isPending}
                    >
                      <Send className="size-3.5" />
                      Submit
                    </Button>
                  )}
                  {doc.status === "SUBMITTED" && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setSelectedDocId(doc.id);
                          setReviewAction("approve");
                          setRejectionReason("");
                          setReviewOpen(true);
                        }}
                      >
                        <CheckCircle2 className="size-3.5" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedDocId(doc.id);
                          setReviewAction("reject");
                          setRejectionReason("");
                          setReviewOpen(true);
                        }}
                      >
                        <XCircle className="size-3.5" />
                        Reject
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive"
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
              {doc.versions.length > 1 && (
                <div className="flex flex-wrap gap-1 rounded bg-muted/50 p-2">
                  <p className="text-xs font-medium text-stone-600">Version history:</p>
                  {doc.versions.map((v) => (
                    <Badge key={v.id} variant="secondary" className="text-xs">
                      v{v.version}: {v.changeNotes ?? "no notes"}
                    </Badge>
                  ))}
                </div>
              )}
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
        <div key={record.id} className="flex items-center justify-between rounded-[20px] border border-stone-200/70 bg-white/80 p-4 shadow-sm transition hover:border-violet-200 hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-md shadow-violet-500/20">
              <Clock className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {new Date(record.checkInAt).toLocaleDateString()} {new Date(record.checkInAt).toLocaleTimeString()}
              </p>
              <p className="text-xs text-stone-600">
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

function OutstandingInvoicesBanner({ memberId, currency }: { memberId: string; currency: string }) {
  const { hasPermission } = useAuth();
  const invoicesQuery = useInvoices({ memberId, pageSize: 50, order: "desc" });
  const retryCollection = useRetryCollection();
  const [expanded, setExpanded] = React.useState(false);
  const [unconfigured, setUnconfigured] = React.useState(false);

  const openInvoices = (invoicesQuery.data?.items ?? []).filter((i) =>
    OPEN_INVOICE_STATUSES.includes(i.status),
  );

  if (invoicesQuery.isLoading || invoicesQuery.isError || openInvoices.length === 0) return null;

  const displayCurrency = openInvoices[0]?.currency ?? currency;
  const total = openInvoices.reduce((sum, i) => sum + Number(i.grandTotal), 0);
  const byDate = [...openInvoices].sort(
    (a, b) =>
      new Date(a.dueAt ?? a.issuedAt ?? 0).getTime() - new Date(b.dueAt ?? b.issuedAt ?? 0).getTime(),
  );
  const oldestOverdue =
    byDate.find((i) => i.status === "OVERDUE") ?? byDate[0];

  async function handleRemind() {
    if (!oldestOverdue) return;
    setUnconfigured(false);
    try {
      await retryCollection.mutateAsync(oldestOverdue.id);
      toast.success(`Reminder sent for ${oldestOverdue.number}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 503) {
        setUnconfigured(true);
      } else {
        toast.error(error instanceof ApiError ? error.message : "Reminder failed");
      }
    }
  }

  return (
    <div className="rounded-[20px] border border-amber-200/70 bg-gradient-to-br from-amber-50/90 to-white p-4 dark:border-amber-900/40 dark:from-amber-950/40 dark:to-stone-950">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md">
          <AlertTriangle className="size-4" aria-hidden="true" />
        </span>
        <p className="min-w-0 flex-1 text-sm font-bold text-stone-900 dark:text-stone-100">
          {displayCurrency} {total.toLocaleString()} outstanding across {openInvoices.length} invoice
          {openInvoices.length > 1 ? "s" : ""}
        </p>
        <Button
          size="sm"
          variant="outline"
          className="min-h-11 rounded-2xl border-amber-200/70 bg-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 dark:bg-white/5"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Hide" : "View"}
        </Button>
        {hasPermission("payments.create") && oldestOverdue && (
          <Button
            size="sm"
            className="min-h-11 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
            disabled={retryCollection.isPending}
            onClick={handleRemind}
          >
            <Send className="size-3.5" aria-hidden="true" />
            {retryCollection.isPending ? "Sending..." : "Remind"}
          </Button>
        )}
      </div>
      {expanded && (
        <div className="mt-3 flex flex-col gap-2">
          {openInvoices.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between gap-2 rounded-2xl border border-amber-200/50 bg-white/80 p-3 text-sm dark:border-white/10 dark:bg-white/5"
            >
              <div>
                <p className="font-mono font-bold tabular-nums">{inv.number}</p>
                <p className="text-xs text-stone-600 tabular-nums dark:text-stone-400">
                  Due {inv.dueAt ? new Date(inv.dueAt).toLocaleDateString() : "—"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    inv.status === "OVERDUE"
                      ? "destructive"
                      : inv.status === "PART_PAID"
                        ? "warning"
                        : "secondary"
                  }
                >
                  {inv.status}
                </Badge>
                <span className="font-bold tabular-nums">
                  {inv.currency} {Number(inv.grandTotal).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      {unconfigured && (
        <p className="mt-2 text-xs font-medium text-amber-800 dark:text-amber-300">
          Online collection isn&apos;t configured — record a cash payment instead.
        </p>
      )}
    </div>
  );
}
function PaymentsPanel({ memberId }: { memberId: string }) {
  const paymentsQuery = useMemberPayments(memberId);
  const membershipsQuery = useMemberships({ memberId });
  const refundPayment = useRefundPayment();
  const [refundOpen, setRefundOpen] = React.useState(false);
  const [selectedPayment, setSelectedPayment] = React.useState<Payment | null>(null);
  const [renewOpen, setRenewOpen] = React.useState(false);
  const [renewMembershipId, setRenewMembershipId] = React.useState("");
  const [renewDiscount, setRenewDiscount] = React.useState("");
  const renewMembership = useRenewMembership();
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
    (m) => m.status === "ACTIVE" || m.status === "EXPIRED" || m.status === "PENDING" || m.status === "FROZEN" || m.status === "PAUSED"
  );
  const canRenew = activeOrExpiring.length > 0;
  const renewTarget = activeOrExpiring.find((m) => m.id === renewMembershipId) ?? activeOrExpiring[0];

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
    if (!renewTarget) return;
    try {
      const discount = renewDiscount ? Number(renewDiscount) : undefined;
      await renewMembership.mutateAsync({ id: renewTarget.id, discount });
      toast.success("Membership renewed successfully");
      setRenewOpen(false);
      setRenewDiscount("");
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
      <OutstandingInvoicesBanner memberId={memberId} currency={currency} />
      <div className="flex justify-end">
        {canRenew && (
          <Dialog open={renewOpen} onOpenChange={setRenewOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="min-h-11 rounded-2xl border-violet-200/70 bg-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">
                <RefreshCw className="size-3.5" />
                Renew Membership
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Renew Membership</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-2">
                <Label htmlFor="renew-membership">Membership</Label>
                <Select
                  value={renewTarget?.id ?? ""}
                  onValueChange={setRenewMembershipId}
                >
                  <SelectTrigger className="w-full" id="renew-membership">
                    <SelectValue placeholder="Select membership" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeOrExpiring.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.membershipPlan?.name ?? "Plan"} — {m.status} (ends{" "}
                        {m.endDate ? new Date(m.endDate).toLocaleDateString() : "—"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Label htmlFor="renew-discount">Discount (optional)</Label>
                <Input
                  id="renew-discount"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="e.g. 10"
                  value={renewDiscount}
                  onChange={(e) => setRenewDiscount(e.target.value)}
                />
                <p className="text-xs text-stone-600">
                  Renewing extends the current term at the plan&apos;s duration and price; the
                  selected membership&apos;s plan is used. Payment is recorded separately in
                  billing.
                </p>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleRenew}
                  disabled={!renewTarget || renewMembership.isPending}
                >
                  {renewMembership.isPending ? "Renewing..." : "Renew"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-[20px] border border-violet-200/60 bg-gradient-to-br from-violet-50/80 to-white p-3">
          <p className="text-[10px] font-black uppercase tracking-[.16em] text-stone-500">Total</p>
          <p className="font-mono text-lg font-black tabular-nums text-stone-950">
            {currency} {totalFromMemberships.toLocaleString()}
          </p>
        </div>
        <div className="rounded-[20px] border border-stone-200/70 bg-white/80 p-3">
          <p className="text-[10px] font-black uppercase tracking-[.16em] text-stone-500">Discounts</p>
          <p className="font-mono text-lg font-black tabular-nums text-stone-500">
            -{currency} {totalDiscounts.toLocaleString()}
          </p>
        </div>
        <div className="rounded-[20px] border border-cyan-200/60 bg-gradient-to-br from-cyan-50/80 to-white p-3">
          <p className="text-[10px] font-black uppercase tracking-[.16em] text-stone-500">Final</p>
          <p className="font-mono text-lg font-black tabular-nums text-stone-950">
            {currency} {finalAmount.toLocaleString()}
          </p>
        </div>
        <div className="rounded-[20px] border border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 to-white p-3">
          <p className="text-[10px] font-black uppercase tracking-[.16em] text-stone-500">Paid</p>
          <p className="font-mono text-lg font-black tabular-nums text-emerald-700">
            {currency} {totalPaid.toLocaleString()}
          </p>
        </div>
        <div className="rounded-[20px] border border-amber-200/60 bg-gradient-to-br from-amber-50/80 to-white p-3">
          <p className="text-[10px] font-black uppercase tracking-[.16em] text-stone-500">Outstanding</p>
          <p className={`text-lg font-semibold tabular-nums ${outstandingBalance > 0 ? "text-rose-600" : "text-emerald-600"}`}>
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
              <div key={membership.id} className="flex items-center justify-between rounded-[20px] border border-stone-200/70 bg-white/80 p-4 shadow-sm transition hover:border-violet-200 hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-md shadow-violet-500/20">
                    <Dumbbell className="size-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {membership.membershipPlan?.name ?? "Membership"}
                    </p>
                    <p className="text-xs text-stone-600">
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
                <div key={payment.id} className="flex items-center justify-between rounded-[20px] border border-stone-200/70 bg-white/80 p-4 shadow-sm transition hover:border-violet-200 hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-md shadow-violet-500/20">
                      <CreditCard className="size-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {payment.currency} {Number(payment.amount).toLocaleString()}
                        {refunded > 0 && (
                          <span className="ml-2 text-xs text-stone-600">
                            (refunded: {payment.currency} {refunded.toLocaleString()})
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-stone-600">
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
      <p className="text-sm text-stone-600">
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
            <Button size="sm" variant="outline" className="min-h-11 rounded-2xl border-violet-200/70 bg-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">
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
        <div className="rounded-[20px] border border-stone-200/70 bg-white/80 p-4 shadow-sm transition hover:border-violet-200 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Latest PAR-Q</p>
              <p className="text-sm text-stone-600">{new Date(latestScreening.completedAt).toLocaleDateString()}</p>
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

// -- Workouts Panel
function WorkoutsPanel({ memberId }: { memberId: string }) {
  const query = useMemberWorkoutAssignments(memberId);

  if (query.isLoading) return <Skeleton className="h-24 w-full" />;

  if (!query.data || query.data.length === 0) {
    return (
      <EmptyState
        icon={Dumbbell}
        title="No workouts assigned"
        description="Assign a workout plan to get started."
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {query.data.map((assignment) => (
        <div key={assignment.id} className="rounded-[20px] border border-stone-200/70 bg-white/80 p-4 shadow-sm transition hover:border-violet-200 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{assignment.workoutPlan.name}</p>
              <p className="text-sm text-stone-600">
                Started {new Date(assignment.startDate).toLocaleDateString()}
              </p>
            </div>
            <Badge
              variant={assignment.status === "ACTIVE" ? "default" : assignment.status === "COMPLETED" ? "secondary" : "outline"}
            >
              {assignment.status}
            </Badge>
          </div>
          {assignment.notes && <p className="mt-2 text-sm text-stone-600">{assignment.notes}</p>}
        </div>
      ))}
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
        <div key={session.id} className="rounded-[20px] border border-stone-200/70 bg-white/80 p-4 shadow-sm transition hover:border-violet-200 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-md shadow-violet-500/20">
                <Dumbbell className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">
                  {new Date(session.scheduledAt).toLocaleDateString()} at {new Date(session.scheduledAt).toLocaleTimeString()}
                </p>
                <p className="text-sm text-stone-600">
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
          {session.notes && <p className="mt-2 text-sm text-stone-600">{session.notes}</p>}
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
        <div key={assignment.id} className="rounded-[20px] border border-stone-200/70 bg-white/80 p-4 shadow-sm transition hover:border-violet-200 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{assignment.dietPlan?.name}</p>
              <p className="text-sm text-stone-600">Started {new Date(assignment.startDate).toLocaleDateString()}</p>
            </div>
            <Badge variant={assignment.status === "ACTIVE" ? "default" : assignment.status === "COMPLETED" ? "secondary" : "outline"}>
              {assignment.status}
            </Badge>
          </div>
          {assignment.dietPlan && (
            <p className="mt-2 text-sm text-stone-600">Diet plan assigned</p>
          )}
        </div>
      ))}
    </div>
  );
}

// -- Follow-ups Panel
const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

const PRIORITY_VARIANT: Record<string, "secondary" | "default" | "destructive" | "warning"> = {
  LOW: "secondary",
  MEDIUM: "default",
  HIGH: "warning",
  URGENT: "destructive",
};

function FollowUpsPanel({ memberId }: { memberId: string }) {
  const query = useMemberFollowUps(memberId);
  const create = useCreateMemberFollowUp(memberId);
  const complete = useCompleteMemberFollowUp(memberId);
  const uncomplete = useUncompleteMemberFollowUp(memberId);
  const remove = useDeleteMemberFollowUp(memberId);

  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [dueAt, setDueAt] = React.useState("");
  const [priority, setPriority] = React.useState<string>("MEDIUM");

  async function handleCreate() {
    if (!title.trim()) return;
    try {
      await create.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        dueAt: dueAt || undefined,
        priority,
      });
      toast.success("Follow-up created");
      setOpen(false);
      setTitle("");
      setDescription("");
      setDueAt("");
      setPriority("MEDIUM");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to create follow-up");
    }
  }

  if (query.isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  const openFollowUps = query.data?.filter((f) => !f.completedAt) ?? [];
  const completedFollowUps = query.data?.filter((f) => f.completedAt) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="min-h-11 rounded-2xl border-violet-200/70 bg-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">
              <Plus className="size-3.5" />
              Add follow-up
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a follow-up</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <Input
                placeholder="Follow-up title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Textarea
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Input
                type="datetime-local"
                placeholder="Due date (optional)"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
              />
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={!title.trim() || create.isPending}>
                {create.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {query.data?.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No follow-ups yet"
          description="Add tasks and todo items to track actions for this member."
        />
      ) : (
        <>
          {openFollowUps.length > 0 && (
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-medium">Open ({openFollowUps.length})</h4>
              {openFollowUps.map((followUp) => (
                <div key={followUp.id} className="flex items-start justify-between rounded-[20px] border border-stone-200/70 bg-white/80 p-4 shadow-sm transition hover:border-violet-200 hover:shadow-md">
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-md shadow-violet-500/20">
                      <CheckSquare className="size-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{followUp.title}</p>
                      {followUp.description && (
                        <p className="mt-0.5 text-sm text-stone-600">{followUp.description}</p>
                      )}
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant={PRIORITY_VARIANT[followUp.priority]}>{PRIORITY_LABELS[followUp.priority]}</Badge>
                        {followUp.dueAt && (
                          <span className={`text-xs ${followUp.isOverdue ? "text-rose-600 font-medium" : "text-stone-600"}`}>
                            {followUp.isOverdue ? "Overdue: " : "Due: "}
                            {new Date(followUp.dueAt).toLocaleDateString()}
                          </span>
                        )}
                        {followUp.assignedToUser && (
                          <span className="text-xs text-stone-600">
                            Assigned to {followUp.assignedToUser.firstName} {followUp.assignedToUser.lastName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() =>
                        complete
                          .mutateAsync(followUp.id)
                          .then(() => toast.success("Follow-up completed"))
                          .catch((e) => toast.error(e instanceof ApiError ? e.message : "Failed to complete"))
                      }
                      disabled={complete.isPending}
                    >
                      <CheckCircle2 className="size-4 text-emerald-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() =>
                        remove
                          .mutateAsync(followUp.id)
                          .then(() => toast.success("Follow-up deleted"))
                          .catch((e) => toast.error(e instanceof ApiError ? e.message : "Failed to delete"))
                      }
                      disabled={remove.isPending}
                    >
                      <Trash2 className="size-4 text-stone-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {completedFollowUps.length > 0 && (
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-medium text-stone-600">Completed ({completedFollowUps.length})</h4>
              {completedFollowUps.map((followUp) => (
                <div key={followUp.id} className="flex items-start justify-between rounded-md border bg-muted/30 p-3">
                  <div className="flex items-start gap-3 opacity-60">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <CheckCircle2 className="size-4 text-stone-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium line-through">{followUp.title}</p>
                      <p className="mt-0.5 text-xs text-stone-600">
                        Completed {new Date(followUp.completedAt!).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() =>
                      uncomplete
                        .mutateAsync(followUp.id)
                        .then(() => toast.success("Follow-up reopened"))
                        .catch((e) => toast.error(e instanceof ApiError ? e.message : "Failed to reopen"))
                    }
                    disabled={uncomplete.isPending}
                  >
                    <Undo2 className="size-4 text-stone-600" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// -- Tags Panel
function TagsPanel({ memberId }: { memberId: string }) {
  const tagsQuery = useMemberTags();
  const assignmentsQuery = useMemberTagAssignments(memberId);
  const assignTags = useAssignMemberTags(memberId);
  const addTag = useAddMemberTag(memberId);
  const removeTag = useRemoveMemberTag(memberId);
  const [open, setOpen] = React.useState(false);
  const [selectedTagIds, setSelectedTagIds] = React.useState<string[]>([]);
  React.useEffect(() => {
    if (assignmentsQuery.data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedTagIds(assignmentsQuery.data.map((a) => a.tagId));
    }
  }, [assignmentsQuery.data]);

  async function handleSaveTags() {
    try {
      await assignTags.mutateAsync(selectedTagIds);
      toast.success("Tags updated");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update tags");
    }
  }

  async function handleAddTag(tagId: string) {
    try {
      await addTag.mutateAsync(tagId);
      toast.success("Tag added");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to add tag");
    }
  }

  async function handleRemoveTag(tagId: string) {
    try {
      await removeTag.mutateAsync(tagId);
      toast.success("Tag removed");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to remove tag");
    }
  }

  if (tagsQuery.isLoading || assignmentsQuery.isLoading) {
    return <Skeleton className="h-24 w-full" />;
  }

  const assignedTagIds = assignmentsQuery.data?.map((a) => a.tagId) ?? [];
  const assignedTags = assignmentsQuery.data?.map((a) => a.tag) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="min-h-11 rounded-2xl border-violet-200/70 bg-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">
              <Plus className="size-3.5" />
              Manage tags
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage tags</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <p className="text-sm text-stone-600">
                Select tags to assign to this member:
              </p>
              <div className="flex flex-wrap gap-2">
                {tagsQuery.data?.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  return (
                    <Button
                      key={tag.id}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedTagIds(selectedTagIds.filter((id) => id !== tag.id));
                        } else {
                          setSelectedTagIds([...selectedTagIds, tag.id]);
                        }
                      }}
                      style={{
                        backgroundColor: isSelected ? tag.color : "transparent",
                        borderColor: tag.color,
                        color: isSelected ? "white" : tag.color,
                      }}
                    >
                      {tag.name}
                    </Button>
                  );
                })}
                {tagsQuery.data?.length === 0 && (
                  <p className="text-sm text-stone-600">No tags created yet.</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTags} disabled={assignTags.isPending}>
                {assignTags.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {assignedTags.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No tags assigned"
          description="Add tags to categorize and segment this member."
        />
      ) : (
        <div className="flex flex-wrap gap-2">
          {assignedTags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium"
              style={{ backgroundColor: tag.color + "20", color: tag.color }}
            >
              <Tag className="size-3" />
              {tag.name}
              <button
                className="ml-1 rounded-full p-0.5 hover:bg-black/10"
                onClick={() => handleRemoveTag(tag.id)}
              >
                <XCircle className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// -- Communications Panel
function CommunicationsPanel({ memberId }: { memberId: string }) {
  const query = useMemberCommunications(memberId);
  const sendMessage = useSendMemberMessage(memberId);
  const [sendOpen, setSendOpen] = React.useState(false);
  const [channel, setChannel] = React.useState<CommunicationChannel>("EMAIL");
  const [customBody, setCustomBody] = React.useState("");
  const [customSubject, setCustomSubject] = React.useState("");

  async function handleSend() {
    if (!customBody.trim()) return;
    try {
      await sendMessage.mutateAsync({
        channel,
        customBody,
        customSubject: channel === "EMAIL" ? customSubject : undefined,
      });
      toast.success("Message sent");
      setSendOpen(false);
      setCustomBody("");
      setCustomSubject("");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to send message");
    }
  }

  const statusVariant: Record<string, "default" | "secondary" | "destructive" | "warning"> = {
    PENDING: "warning",
    SENT: "default",
    FAILED: "destructive",
    SKIPPED_NO_CONSENT: "secondary",
  };

  if (query.isLoading) return <Skeleton className="h-24 w-full" />;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Dialog open={sendOpen} onOpenChange={setSendOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="min-h-11 rounded-2xl border-violet-200/70 bg-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">
              <Mail className="size-3.5" />
              Send message
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send message to member</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <div>
                <Label className="text-xs">Channel</Label>
                <Select value={channel} onValueChange={(v) => setChannel(v as CommunicationChannel)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {channel === "EMAIL" && (
                <div>
                  <Label className="text-xs">Subject</Label>
                  <Input
                    placeholder="Email subject..."
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                  />
                </div>
              )}
              <div>
                <Label className="text-xs">Message</Label>
                <Textarea
                  placeholder="Write your message..."
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  rows={5}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSendOpen(false)}>Cancel</Button>
              <Button onClick={handleSend} disabled={!customBody.trim() || sendMessage.isPending}>
                {sendMessage.isPending ? "Sending..." : "Send"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!query.data || query.data.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No messages yet"
          description="Send emails or WhatsApp messages to this member."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {query.data.map((msg) => (
            <div key={msg.id} className="flex items-start gap-3 rounded-[20px] border border-stone-200/70 bg-white/80 p-4 shadow-sm">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                {msg.channel === "EMAIL" ? <Mail className="size-4" /> : <MessageSquare className="size-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{msg.channel}</p>
                  <Badge variant={statusVariant[msg.status] ?? "outline"}>{msg.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-stone-600">{msg.recipient}</p>
                <p className="mt-1 text-xs text-stone-600">
                  {fmtDateTime(msg.createdAt)}
                </p>
                {msg.errorMessage && (
                  <p className="mt-1 text-xs text-destructive">{msg.errorMessage}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
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
            <div key={event.id} className="flex items-start gap-3 rounded-[20px] border border-stone-200/70 bg-white/80 p-4 shadow-sm">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-md shadow-violet-500/20">
                <Icon className="size-4 text-white" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{event.title}</p>
                  <span className="shrink-0 text-xs text-stone-600">
                    {fmtDateTime(event.timestamp)}
                  </span>
                </div>
                {event.description && (
                  <p className="mt-0.5 text-sm text-stone-600">{event.description}</p>
                )}
                {event.actorName && (
                  <p className="mt-0.5 text-xs text-stone-600">by {event.actorName}</p>
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
          <span className="text-sm text-stone-600">
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
        <p className="text-sm text-stone-600">
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
          <div key={dup.memberId} className="flex items-center justify-between rounded-[20px] border border-stone-200/70 bg-white/80 p-4 shadow-sm transition hover:border-violet-200 hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
                <AlertTriangle className="size-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium">
                  {dup.firstName} {dup.lastName}
                </p>
                <p className="text-sm text-stone-600">
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
                  <p className="mt-1 text-xs text-stone-600">
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
                  <p className="text-sm text-stone-600">{data.email ?? "No email"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Target (to keep)</p>
                  <p className="mt-1">
                    {selectedDuplicate.firstName} {selectedDuplicate.lastName}
                  </p>
                  <p className="text-sm text-stone-600">
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

// -- Membership History Panel
function MembershipHistoryPanel({ memberId }: { memberId: string }) {
  const membershipsQuery = useMemberships({ memberId });
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const activeId = selectedId ?? membershipsQuery.data?.items?.[0]?.id ?? null;
  const historyQuery = useMembershipHistory(activeId);

  if (membershipsQuery.isLoading) return <Skeleton className="h-24 w-full" />;

  const memberships = membershipsQuery.data?.items ?? [];
  if (memberships.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No memberships yet"
        description="Membership purchases and their lifecycle history will appear here."
      />
    );
  }

  const entries = historyQuery.data ?? [];
  const selected = memberships.find((m) => m.id === activeId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="membership-select">Membership</Label>
        <Select value={activeId ?? ""} onValueChange={setSelectedId}>
          <SelectTrigger className="w-full" id="membership-select">
            <SelectValue placeholder="Select membership" />
          </SelectTrigger>
          <SelectContent>
            {memberships.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.membershipPlan?.name ?? "Plan"} — {m.status} (ends{" "}
                {m.endDate ? new Date(m.endDate).toLocaleDateString() : "—"})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selected?.previousMembershipId && (
          <p className="text-xs text-stone-600">
            Renewed/continued from a previous membership — full chain is preserved in the audit
            trail.
          </p>
        )}
      </div>

      {historyQuery.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={History}
          title="No lifecycle events"
          description="Actions like freeze, resume, upgrade and transfer will be recorded here."
        />
      ) : (
        <ol className="relative ml-3 border-l border-border">
          {entries.map((entry) => (
            <li key={entry.id} className="mb-6 ml-6">
              <span className="absolute -left-[7px] mt-1.5 size-3.5 rounded-full border-2 border-background bg-violet-500/60" />
              <p className="text-sm font-medium">
                {entry.fromStatus ? `${entry.fromStatus} → ${entry.toStatus}` : `Created as ${entry.toStatus}`}
              </p>
              {entry.detail && <p className="text-sm text-stone-600">{entry.detail}</p>}
              <p className="text-xs text-stone-600">
                {fmtDateTime(entry.createdAt)}
                {entry.changedByUser
                  ? ` — by ${entry.changedByUser.firstName} ${entry.changedByUser.lastName}`.trim()
                  : ""}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function Member360Tabs({ memberId }: { memberId: string }) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <div className="relative -mx-1 px-1">
        <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-[20px] border border-violet-100/70 bg-gradient-to-r from-violet-50/70 via-white to-cyan-50/70 p-1.5 shadow-sm">
          <TabsTrigger
            value="overview"
            className="relative min-h-11 rounded-t-[16px] border-b-2 border-transparent px-4 py-3 text-sm font-bold text-stone-600 transition-colors after:absolute after:inset-x-2 after:bottom-0 after:h-1 after:rounded-full after:bg-gradient-to-r after:from-violet-600 after:to-cyan-500 after:opacity-0 after:transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 data-[state=active]:border-transparent data-[state=active]:bg-violet-50/70 data-[state=active]:text-violet-800 data-[state=active]:shadow-none data-[state=active]:after:opacity-100"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="tags"
            className="relative min-h-11 rounded-t-[16px] border-b-2 border-transparent px-4 py-3 text-sm font-bold text-stone-600 transition-colors after:absolute after:inset-x-2 after:bottom-0 after:h-1 after:rounded-full after:bg-gradient-to-r after:from-violet-600 after:to-cyan-500 after:opacity-0 after:transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 data-[state=active]:border-transparent data-[state=active]:bg-violet-50/70 data-[state=active]:text-violet-800 data-[state=active]:shadow-none data-[state=active]:after:opacity-100"
          >
            Tags
          </TabsTrigger>
          <TabsTrigger
            value="addresses"
            className="relative min-h-11 rounded-t-[16px] border-b-2 border-transparent px-4 py-3 text-sm font-bold text-stone-600 transition-colors after:absolute after:inset-x-2 after:bottom-0 after:h-1 after:rounded-full after:bg-gradient-to-r after:from-violet-600 after:to-cyan-500 after:opacity-0 after:transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 data-[state=active]:border-transparent data-[state=active]:bg-violet-50/70 data-[state=active]:text-violet-800 data-[state=active]:shadow-none data-[state=active]:after:opacity-100"
          >
            Addresses
          </TabsTrigger>
          <TabsTrigger
            value="emergency"
            className="relative min-h-11 rounded-t-[16px] border-b-2 border-transparent px-4 py-3 text-sm font-bold text-stone-600 transition-colors after:absolute after:inset-x-2 after:bottom-0 after:h-1 after:rounded-full after:bg-gradient-to-r after:from-violet-600 after:to-cyan-500 after:opacity-0 after:transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 data-[state=active]:border-transparent data-[state=active]:bg-violet-50/70 data-[state=active]:text-violet-800 data-[state=active]:shadow-none data-[state=active]:after:opacity-100"
          >
            Emergency
          </TabsTrigger>
          <TabsTrigger
            value="notes"
            className="relative min-h-11 rounded-t-[16px] border-b-2 border-transparent px-4 py-3 text-sm font-bold text-stone-600 transition-colors after:absolute after:inset-x-2 after:bottom-0 after:h-1 after:rounded-full after:bg-gradient-to-r after:from-violet-600 after:to-cyan-500 after:opacity-0 after:transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 data-[state=active]:border-transparent data-[state=active]:bg-violet-50/70 data-[state=active]:text-violet-800 data-[state=active]:shadow-none data-[state=active]:after:opacity-100"
          >
            Notes
          </TabsTrigger>
          <TabsTrigger
            value="consents"
            className="relative min-h-11 rounded-t-[16px] border-b-2 border-transparent px-4 py-3 text-sm font-bold text-stone-600 transition-colors after:absolute after:inset-x-2 after:bottom-0 after:h-1 after:rounded-full after:bg-gradient-to-r after:from-violet-600 after:to-cyan-500 after:opacity-0 after:transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 data-[state=active]:border-transparent data-[state=active]:bg-violet-50/70 data-[state=active]:text-violet-800 data-[state=active]:shadow-none data-[state=active]:after:opacity-100"
          >
            Consents
          </TabsTrigger>
          <TabsTrigger
            value="assessments"
            className="relative min-h-11 rounded-t-[16px] border-b-2 border-transparent px-4 py-3 text-sm font-bold text-stone-600 transition-colors after:absolute after:inset-x-2 after:bottom-0 after:h-1 after:rounded-full after:bg-gradient-to-r after:from-violet-600 after:to-cyan-500 after:opacity-0 after:transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 data-[state=active]:border-transparent data-[state=active]:bg-violet-50/70 data-[state=active]:text-violet-800 data-[state=active]:shadow-none data-[state=active]:after:opacity-100"
          >
            Assessments
          </TabsTrigger>
          <TabsTrigger
            value="goals"
            className="relative min-h-11 rounded-t-[16px] border-b-2 border-transparent px-4 py-3 text-sm font-bold text-stone-600 transition-colors after:absolute after:inset-x-2 after:bottom-0 after:h-1 after:rounded-full after:bg-gradient-to-r after:from-violet-600 after:to-cyan-500 after:opacity-0 after:transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 data-[state=active]:border-transparent data-[state=active]:bg-violet-50/70 data-[state=active]:text-violet-800 data-[state=active]:shadow-none data-[state=active]:after:opacity-100"
          >
            Goals
          </TabsTrigger>
          <TabsTrigger
            value="documents"
            className="relative min-h-11 rounded-t-[16px] border-b-2 border-transparent px-4 py-3 text-sm font-bold text-stone-600 transition-colors after:absolute after:inset-x-2 after:bottom-0 after:h-1 after:rounded-full after:bg-gradient-to-r after:from-violet-600 after:to-cyan-500 after:opacity-0 after:transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 data-[state=active]:border-transparent data-[state=active]:bg-violet-50/70 data-[state=active]:text-violet-800 data-[state=active]:shadow-none data-[state=active]:after:opacity-100"
          >
            Documents
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="relative min-h-11 rounded-t-[16px] border-b-2 border-transparent px-4 py-3 text-sm font-bold text-stone-600 transition-colors after:absolute after:inset-x-2 after:bottom-0 after:h-1 after:rounded-full after:bg-gradient-to-r after:from-violet-600 after:to-cyan-500 after:opacity-0 after:transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 data-[state=active]:border-transparent data-[state=active]:bg-violet-50/70 data-[state=active]:text-violet-800 data-[state=active]:shadow-none data-[state=active]:after:opacity-100"
          >
            History
          </TabsTrigger>
          <TabsTrigger
            value="attendance"
            className="relative min-h-11 rounded-t-[16px] border-b-2 border-transparent px-4 py-3 text-sm font-bold text-stone-600 transition-colors after:absolute after:inset-x-2 after:bottom-0 after:h-1 after:rounded-full after:bg-gradient-to-r after:from-violet-600 after:to-cyan-500 after:opacity-0 after:transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 data-[state=active]:border-transparent data-[state=active]:bg-violet-50/70 data-[state=active]:text-violet-800 data-[state=active]:shadow-none data-[state=active]:after:opacity-100"
          >
            Attendance
          </TabsTrigger>
          <TabsTrigger
            value="payments"
            className="relative min-h-11 rounded-t-[16px] border-b-2 border-transparent px-4 py-3 text-sm font-bold text-stone-600 transition-colors after:absolute after:inset-x-2 after:bottom-0 after:h-1 after:rounded-full after:bg-gradient-to-r after:from-violet-600 after:to-cyan-500 after:opacity-0 after:transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 data-[state=active]:border-transparent data-[state=active]:bg-violet-50/70 data-[state=active]:text-violet-800 data-[state=active]:shadow-none data-[state=active]:after:opacity-100"
          >
            Payments
          </TabsTrigger>
          <TabsTrigger
            value="screening"
            className="relative min-h-11 rounded-t-[16px] border-b-2 border-transparent px-4 py-3 text-sm font-bold text-stone-600 transition-colors after:absolute after:inset-x-2 after:bottom-0 after:h-1 after:rounded-full after:bg-gradient-to-r after:from-violet-600 after:to-cyan-500 after:opacity-0 after:transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 data-[state=active]:border-transparent data-[state=active]:bg-violet-50/70 data-[state=active]:text-violet-800 data-[state=active]:shadow-none data-[state=active]:after:opacity-100"
          >
            PAR-Q
          </TabsTrigger>
          <TabsTrigger
            value="pt-sessions"
            className="relative min-h-11 rounded-t-[16px] border-b-2 border-transparent px-4 py-3 text-sm font-bold text-stone-600 transition-colors after:absolute after:inset-x-2 after:bottom-0 after:h-1 after:rounded-full after:bg-gradient-to-r after:from-violet-600 after:to-cyan-500 after:opacity-0 after:transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 data-[state=active]:border-transparent data-[state=active]:bg-violet-50/70 data-[state=active]:text-violet-800 data-[state=active]:shadow-none data-[state=active]:after:opacity-100"
          >
            PT Sessions
          </TabsTrigger>
          <TabsTrigger
            value="workouts"
            className="relative min-h-11 rounded-t-[16px] border-b-2 border-transparent px-4 py-3 text-sm font-bold text-stone-600 transition-colors after:absolute after:inset-x-2 after:bottom-0 after:h-1 after:rounded-full after:bg-gradient-to-r after:from-violet-600 after:to-cyan-500 after:opacity-0 after:transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 data-[state=active]:border-transparent data-[state=active]:bg-violet-50/70 data-[state=active]:text-violet-800 data-[state=active]:shadow-none data-[state=active]:after:opacity-100"
          >
            Workouts
          </TabsTrigger>
          <TabsTrigger
            value="nutrition"
            className="relative min-h-11 rounded-t-[16px] border-b-2 border-transparent px-4 py-3 text-sm font-bold text-stone-600 transition-colors after:absolute after:inset-x-2 after:bottom-0 after:h-1 after:rounded-full after:bg-gradient-to-r after:from-violet-600 after:to-cyan-500 after:opacity-0 after:transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 data-[state=active]:border-transparent data-[state=active]:bg-violet-50/70 data-[state=active]:text-violet-800 data-[state=active]:shadow-none data-[state=active]:after:opacity-100"
          >
            Nutrition
          </TabsTrigger>
          <TabsTrigger
            value="follow-ups"
            className="relative min-h-11 rounded-t-[16px] border-b-2 border-transparent px-4 py-3 text-sm font-bold text-stone-600 transition-colors after:absolute after:inset-x-2 after:bottom-0 after:h-1 after:rounded-full after:bg-gradient-to-r after:from-violet-600 after:to-cyan-500 after:opacity-0 after:transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 data-[state=active]:border-transparent data-[state=active]:bg-violet-50/70 data-[state=active]:text-violet-800 data-[state=active]:shadow-none data-[state=active]:after:opacity-100"
          >
            Follow-ups
          </TabsTrigger>
          <TabsTrigger
            value="communications"
            className="relative min-h-11 rounded-t-[16px] border-b-2 border-transparent px-4 py-3 text-sm font-bold text-stone-600 transition-colors after:absolute after:inset-x-2 after:bottom-0 after:h-1 after:rounded-full after:bg-gradient-to-r after:from-violet-600 after:to-cyan-500 after:opacity-0 after:transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 data-[state=active]:border-transparent data-[state=active]:bg-violet-50/70 data-[state=active]:text-violet-800 data-[state=active]:shadow-none data-[state=active]:after:opacity-100"
          >
            Messages
          </TabsTrigger>
          <TabsTrigger
            value="timeline"
            className="relative min-h-11 rounded-t-[16px] border-b-2 border-transparent px-4 py-3 text-sm font-bold text-stone-600 transition-colors after:absolute after:inset-x-2 after:bottom-0 after:h-1 after:rounded-full after:bg-gradient-to-r after:from-violet-600 after:to-cyan-500 after:opacity-0 after:transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 data-[state=active]:border-transparent data-[state=active]:bg-violet-50/70 data-[state=active]:text-violet-800 data-[state=active]:shadow-none data-[state=active]:after:opacity-100"
          >
            Timeline
          </TabsTrigger>
          <TabsTrigger
            value="duplicates"
            className="relative min-h-11 rounded-t-[16px] border-b-2 border-transparent px-4 py-3 text-sm font-bold text-stone-600 transition-colors after:absolute after:inset-x-2 after:bottom-0 after:h-1 after:rounded-full after:bg-gradient-to-r after:from-violet-600 after:to-cyan-500 after:opacity-0 after:transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 data-[state=active]:border-transparent data-[state=active]:bg-violet-50/70 data-[state=active]:text-violet-800 data-[state=active]:shadow-none data-[state=active]:after:opacity-100"
          >
            Duplicates
          </TabsTrigger>
          <TabsTrigger
            value="membership-history"
            className="relative min-h-11 rounded-t-[16px] border-b-2 border-transparent px-4 py-3 text-sm font-bold text-stone-600 transition-colors after:absolute after:inset-x-2 after:bottom-0 after:h-1 after:rounded-full after:bg-gradient-to-r after:from-violet-600 after:to-cyan-500 after:opacity-0 after:transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 data-[state=active]:border-transparent data-[state=active]:bg-violet-50/70 data-[state=active]:text-violet-800 data-[state=active]:shadow-none data-[state=active]:after:opacity-100"
          >
            Membership History
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="overview" className="mt-6">
        <MemberOverviewPanel memberId={memberId} />
      </TabsContent>
      <TabsContent value="tags">
        <TagsPanel memberId={memberId} />
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
      <TabsContent value="workouts">
        <WorkoutsPanel memberId={memberId} />
      </TabsContent>
      <TabsContent value="nutrition">
        <NutritionPanel memberId={memberId} />
      </TabsContent>
      <TabsContent value="follow-ups">
        <FollowUpsPanel memberId={memberId} />
      </TabsContent>
      <TabsContent value="communications">
        <CommunicationsPanel memberId={memberId} />
      </TabsContent>
      <TabsContent value="timeline">
        <TimelinePanel memberId={memberId} />
      </TabsContent>
      <TabsContent value="duplicates">
        <DuplicatesPanel memberId={memberId} />
      </TabsContent>
      <TabsContent value="membership-history">
        <MembershipHistoryPanel memberId={memberId} />
      </TabsContent>
    </Tabs>
  );
}

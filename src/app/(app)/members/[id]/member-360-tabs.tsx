"use client";

import * as React from "react";
import { MapPin, Phone, StickyNote, ShieldCheck, History, Plus, Trash2, Pin } from "lucide-react";
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
import type { MemberAddressType, MemberConsentType } from "@/lib/types/gym";
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

// -- Root -----------------------------------------------------------------------

export function Member360Tabs({ memberId }: { memberId: string }) {
  return (
    <Tabs defaultValue="addresses">
      <TabsList>
        <TabsTrigger value="addresses">Addresses</TabsTrigger>
        <TabsTrigger value="emergency">Emergency contacts</TabsTrigger>
        <TabsTrigger value="notes">Notes</TabsTrigger>
        <TabsTrigger value="consents">Consents</TabsTrigger>
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
      <TabsContent value="history">
        <HistoryPanel memberId={memberId} />
      </TabsContent>
    </Tabs>
  );
}

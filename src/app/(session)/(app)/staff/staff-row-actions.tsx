"use client";

import * as React from "react";
import { toast } from "sonner";
import { Mail, MoreHorizontal, Pencil, Send, UserX } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ApiError } from "@/lib/api/client";
import { useBranches } from "@/lib/hooks/use-branches";
import {
  staffAccessState,
  useDeactivateStaff,
  useGrantStaffAccess,
  useUpdateStaff,
} from "@/lib/hooks/use-staff";
import type { StaffUser } from "@/lib/types/gym";
import { cn } from "@/lib/utils";
import { StaffAvatar } from "./staff-visuals";

const errorText = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.message : fallback;

/** Email a set-your-password link: first access, or a fresh invite. */
export function GiveAccessDialog({
  user,
  open,
  onOpenChange,
}: {
  user: StaffUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const grant = useGrantStaffAccess();
  const [email, setEmail] = React.useState(user.email ?? "");
  const firstAccess = !user.email;

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function send() {
    try {
      const trimmed = email.trim().toLowerCase();
      await grant.mutateAsync({ id: user.id, email: trimmed !== user.email ? trimmed : undefined });
      toast.success(`Invite sent to ${trimmed}`);
      onOpenChange(false);
    } catch (error) {
      toast.error(errorText(error, "Could not send the invite."));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{firstAccess ? `Give ${user.firstName} app access` : `Resend ${user.firstName}'s invite`}</DialogTitle>
          <DialogDescription>
            We will email a link to set their password. It works for 7 days, and any earlier link stops working.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`access-email-${user.id}`}>Email</Label>
          <Input
            id={`access-email-${user.id}`}
            type="email"
            inputMode="email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="h-11 rounded-xl"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" className="min-h-11 rounded-full" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="min-h-11 rounded-full" disabled={!valid || grant.isPending} onClick={send}>
            <Send className="size-4" aria-hidden="true" />
            {grant.isPending ? "Sending..." : "Send invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EditStaffDialog({
  user,
  open,
  onOpenChange,
}: {
  user: StaffUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const update = useUpdateStaff();
  const branches = useBranches({ pageSize: 100 });
  const initial = React.useMemo(
    () => ({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? "",
      jobTitle: user.staffProfile?.jobTitle ?? "",
      isTrainer: user.staffProfile?.isTrainer ?? false,
      primaryBranchId: user.primaryBranchId ?? "",
    }),
    [user],
  );
  const [draft, setDraft] = React.useState(initial);

  const valid = draft.firstName.trim() && draft.lastName.trim();

  async function save() {
    try {
      await update.mutateAsync({
        id: user.id,
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        phone: draft.phone.trim(),
        jobTitle: draft.jobTitle.trim(),
        isTrainer: draft.isTrainer,
        ...(draft.primaryBranchId && draft.primaryBranchId !== user.primaryBranchId
          ? { primaryBranchId: draft.primaryBranchId }
          : {}),
      });
      toast.success("Saved");
      onOpenChange(false);
    } catch (error) {
      toast.error(errorText(error, "Could not save these changes."));
    }
  }

  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <StaffAvatar firstName={draft.firstName || user.firstName} lastName={draft.lastName || user.lastName} seed={user.id} />
            <div>
              <DialogTitle>Edit {user.firstName}</DialogTitle>
              <DialogDescription>{user.email ?? "No app access"}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(
            [
              ["firstName", "First name", "text"],
              ["lastName", "Last name", "text"],
              ["phone", "Phone", "tel"],
              ["jobTitle", "Job title", "text"],
            ] as const
          ).map(([key, label, type]) => (
            <div key={key} className="flex flex-col gap-2">
              <Label htmlFor={`edit-${key}-${user.id}`}>{label}</Label>
              <Input
                id={`edit-${key}-${user.id}`}
                type={type}
                value={draft[key]}
                onChange={(e) => set(key, e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
          ))}
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor={`edit-branch-${user.id}`}>Home branch</Label>
            <select
              id={`edit-branch-${user.id}`}
              value={draft.primaryBranchId}
              onChange={(e) => set("primaryBranchId", e.target.value)}
              className="h-11 rounded-xl border bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring"
            >
              {!draft.primaryBranchId && <option value="">Pick a branch</option>}
              {branches.data?.items.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center justify-between gap-3 rounded-2xl border p-4 sm:col-span-2">
            <span className="text-sm font-semibold">Trains members</span>
            <Switch checked={draft.isTrainer} onCheckedChange={(v) => set("isTrainer", v)} aria-label="Trains members" />
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" className="min-h-11 rounded-full" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="min-h-11 rounded-full" disabled={!valid || update.isPending} onClick={save}>
            {update.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeactivateDialog({
  user,
  open,
  onOpenChange,
}: {
  user: StaffUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const deactivate = useDeactivateStaff();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deactivate {user.firstName} {user.lastName}?</DialogTitle>
          <DialogDescription>
            They can no longer sign in and leave the staff list. Their past records stay.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" className="min-h-11 rounded-full" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="min-h-11 rounded-full"
            disabled={deactivate.isPending}
            onClick={() =>
              deactivate
                .mutateAsync(user.id)
                .then(() => {
                  toast.success(`${user.firstName} deactivated`);
                  onOpenChange(false);
                })
                .catch((e) => toast.error(errorText(e, "Could not deactivate.")))
            }
          >
            <UserX className="size-4" aria-hidden="true" />
            {deactivate.isPending ? "Deactivating..." : "Deactivate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Everything you can do to one staff member. Each item gates itself on
 * the permission its endpoint checks, so the menu never offers a 403.
 */
export function StaffRowActions({
  user,
  canUpdate,
  canInvite,
  canDeactivate,
  rolesSlot,
}: {
  user: StaffUser;
  canUpdate: boolean;
  canInvite: boolean;
  canDeactivate: boolean;
  /** The Manage roles dialog, which carries its own trigger. */
  rolesSlot?: React.ReactNode;
}) {
  const [dialog, setDialog] = React.useState<"edit" | "access" | "deactivate" | null>(null);
  const state = staffAccessState(user);
  const accessLabel =
    state === "NO_ACCESS" ? "Give app access" : state === "INVITE_PENDING" ? "Resend invite" : null;
  const showMenu = canUpdate || (canInvite && accessLabel) || canDeactivate;

  return (
    <div className="flex items-center justify-end gap-1">
      {canInvite && accessLabel && (
        <Button
          variant="outline"
          size="sm"
          className={cn("hidden min-h-9 rounded-full md:inline-flex")}
          onClick={() => setDialog("access")}
        >
          <Mail className="size-3.5" aria-hidden="true" />
          {state === "NO_ACCESS" ? "Give access" : "Resend"}
        </Button>
      )}
      {rolesSlot}
      {showMenu && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-10 rounded-full" aria-label={`More for ${user.firstName}`}>
              <MoreHorizontal className="size-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            {canUpdate && (
              <DropdownMenuItem onSelect={() => setDialog("edit")}>
                <Pencil className="size-4" aria-hidden="true" /> Edit details
              </DropdownMenuItem>
            )}
            {canInvite && accessLabel && (
              <DropdownMenuItem onSelect={() => setDialog("access")}>
                <Mail className="size-4" aria-hidden="true" /> {accessLabel}
              </DropdownMenuItem>
            )}
            {canDeactivate && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => setDialog("deactivate")}>
                  <UserX className="size-4" aria-hidden="true" /> Deactivate
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Mounted only while open, so each opening starts from the saved
          values rather than whatever was typed and cancelled last time. */}
      {dialog === "edit" && <EditStaffDialog user={user} open onOpenChange={(o) => setDialog(o ? "edit" : null)} />}
      {dialog === "access" && <GiveAccessDialog user={user} open onOpenChange={(o) => setDialog(o ? "access" : null)} />}
      {dialog === "deactivate" && (
        <DeactivateDialog user={user} open onOpenChange={(o) => setDialog(o ? "deactivate" : null)} />
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

import { ApiError } from "@/lib/api/client";
import { useBranches } from "@/lib/hooks/use-branches";
import {
 useAssignableRoles,
 useAssignStaffRole,
 useRevokeStaffRole,
} from "@/lib/hooks/use-staff";
import type { StaffUser } from "@/lib/types/gym";
import { ConfirmAction } from "@/components/shared/confirm-action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";

const ORG_WIDE = "__org_wide__";

function RolesBody({ user }: { user: StaffUser }) {
 const roles = useAssignableRoles();
 const branches = useBranches({ page: 1, pageSize: 100 });
 const assign = useAssignStaffRole();
 const revoke = useRevokeStaffRole();
 const [roleKey, setRoleKey] = React.useState("");
 const [branchId, setBranchId] = React.useState(ORG_WIDE);

 async function submit() {
  if (!roleKey) return;
  try {
   await assign.mutateAsync({
    userId: user.id,
    roleKey,
    branchId: branchId === ORG_WIDE ? undefined : branchId,
   });
   toast.success("Role granted");
   setRoleKey("");
  } catch (error) {
   toast.error(error instanceof ApiError ? error.message : "Could not grant this role.");
  }
 }

 const branchName = (id: string | null) =>
  id ? branches.data?.items?.find((b: { id: string }) => b.id === id)?.name ?? "A branch" : null;

 return (
  <div className="grid gap-4">
   <div className="grid gap-2">
    <p className="text-sm font-bold">Current grants</p>
    {user.userRoles.length === 0 ? (
     <p className="rounded-lg bg-muted/50 p-3 text-xs font-medium text-muted-foreground">
      No roles. This account can sign in and see nothing.
     </p>
    ) : (
     <div className="grid gap-2">
      {user.userRoles.map((grant) => (
       <div key={grant.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
        <div className="min-w-0">
         <p className="truncate text-sm font-bold">{grant.role.name}</p>
         <p className="truncate text-xs text-muted-foreground">
          {/* A grant is either org-wide or scoped to one branch, and
              which it is decides what the person can actually reach. */}
          {grant.branchId ? `${branchName(grant.branchId)} only` : "All branches"}
         </p>
        </div>
        <ConfirmAction
         label="Revoke"
         title={`Revoke ${grant.role.name}?`}
         description={`${user.firstName} ${user.lastName} loses everything this role grants, immediately.`}
         confirmLabel="Revoke role"
         pendingLabel="Revoking..."
         successMessage="Role revoked"
         errorMessage="Could not revoke this role."
         onConfirm={() => revoke.mutateAsync({ userId: user.id, userRoleId: grant.id })}
        />
       </div>
      ))}
     </div>
    )}
   </div>

   <div className="grid gap-3 rounded-lg border border-border p-3">
    <p className="text-sm font-bold">Grant another role</p>
    <div className="grid gap-3 sm:grid-cols-2">
     <div className="grid gap-1.5">
      <Label htmlFor="grant-role">Role</Label>
      <Select value={roleKey} onValueChange={setRoleKey}>
       <SelectTrigger id="grant-role"><SelectValue placeholder="Pick a role" /></SelectTrigger>
       <SelectContent>
        {(roles.data ?? []).map((role) => (
         <SelectItem key={role.key} value={role.key}>{role.name}</SelectItem>
        ))}
       </SelectContent>
      </Select>
     </div>
     <div className="grid gap-1.5">
      <Label htmlFor="grant-branch">Scope</Label>
      <Select value={branchId} onValueChange={setBranchId}>
       <SelectTrigger id="grant-branch"><SelectValue /></SelectTrigger>
       <SelectContent>
        <SelectItem value={ORG_WIDE}>All branches</SelectItem>
        {branches.data?.items?.map((branch: { id: string; name: string }) => (
         <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
        ))}
       </SelectContent>
      </Select>
     </div>
    </div>
    {roleKey && (
     <p className="text-xs text-muted-foreground">
      {(roles.data ?? []).find((role) => role.key === roleKey)?.description ??
       `${(roles.data ?? []).find((role) => role.key === roleKey)?.permissions.length ?? 0} permissions`}
     </p>
    )}
    <div className="flex justify-end">
     <Button type="button" disabled={!roleKey || assign.isPending} aria-busy={assign.isPending} onClick={() => void submit()}>
      {assign.isPending ? "Granting..." : "Grant role"}
     </Button>
    </div>
   </div>
  </div>
 );
}

/**
 * Roles for one staff member.
 *
 * POST /users/:id/roles and DELETE /users/:id/roles/:userRoleId both
 * existed with nothing able to call them: a role could be chosen once, at
 * invite time, and never changed. Promoting a receptionist to head trainer
 * meant editing the database.
 */
export function ManageRolesDialog({ user }: { user: StaffUser }) {
 const [open, setOpen] = React.useState(false);
 return (
  <>
   <Button type="button" variant="ghost" size="sm" className="min-h-11 rounded-xl" onClick={() => setOpen(true)}>
    <ShieldCheck className="size-3.5" aria-hidden="true" />
    Roles
    {user.userRoles.length > 0 && (
     <Badge variant="secondary" className="ml-1 rounded-full">{user.userRoles.length}</Badge>
    )}
   </Button>
   <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent className="sm:max-w-xl">
     <DialogHeader>
      <DialogTitle>{user.firstName} {user.lastName}</DialogTitle>
      <DialogDescription>What this account can reach, and where.</DialogDescription>
     </DialogHeader>
     {open ? <RolesBody user={user} /> : null}
    </DialogContent>
   </Dialog>
  </>
 );
}

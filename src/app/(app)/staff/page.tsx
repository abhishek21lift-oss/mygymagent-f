"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, UserX } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { BranchSelect } from "@/components/shared/branch-select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/lib/auth/auth-context";
import { useStaff, useInviteStaff, useDeactivateStaff } from "@/lib/hooks/use-staff";
import { ApiError } from "@/lib/api/client";
import { inviteStaffSchema, type InviteStaffInput } from "@/lib/validation/gym";
import type { StaffUser } from "@/lib/types/gym";

const ROLE_OPTIONS = [
  { key: "ORG_ADMIN", label: "Organization Admin" },
  { key: "BRANCH_MANAGER", label: "Branch Manager" },
  { key: "HEAD_TRAINER", label: "Head Trainer" },
  { key: "TRAINER", label: "Trainer" },
  { key: "NUTRITIONIST", label: "Nutritionist" },
  { key: "RECEPTIONIST", label: "Receptionist" },
  { key: "SALES_EXECUTIVE", label: "Sales Executive" },
  { key: "ACCOUNTANT", label: "Accountant" },
  { key: "INVENTORY_MANAGER", label: "Inventory Manager" },
  { key: "STAFF", label: "Staff" },
];

function InviteStaffDialog() {
  const [open, setOpen] = React.useState(false);
  const inviteStaff = useInviteStaff();

  const form = useForm<InviteStaffInput>({
    resolver: zodResolver(inviteStaffSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      primaryBranchId: "",
      roleKey: "STAFF",
      jobTitle: "",
      isTrainer: false,
    },
  });

  async function onSubmit(values: InviteStaffInput) {
    try {
      await inviteStaff.mutateAsync(values);
      toast.success("Invitation sent");
      setOpen(false);
      form.reset();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to invite staff member");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Invite staff
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a staff member</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="primaryBranchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch</FormLabel>
                  <FormControl>
                    <BranchSelect value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="roleKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ROLE_OPTIONS.map((role) => (
                        <SelectItem key={role.key} value={role.key}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isTrainer"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                  <FormLabel className="mb-0">This person is a trainer</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={inviteStaff.isPending}>
                {inviteStaff.isPending ? "Sending invite..." : "Send invite"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function useColumns(canManage: boolean): ColumnDef<StaffUser>[] {
  const deactivate = useDeactivateStaff();

  const base: ColumnDef<StaffUser>[] = [
    {
      header: "Name",
      accessorKey: "firstName",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {row.original.firstName} {row.original.lastName}
          </span>
          <span className="text-xs text-muted-foreground">{row.original.email}</span>
        </div>
      ),
    },
    {
      header: "Roles",
      accessorKey: "userRoles",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.userRoles.map((ur) => (
            <Badge key={ur.id} variant="secondary">
              {ur.role.name}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => (
        <Badge variant={row.original.status === "ACTIVE" ? "default" : "secondary"}>
          {row.original.status}
        </Badge>
      ),
    },
  ];

  if (canManage) {
    base.push({
      id: "actions",
      header: "",
      cell: ({ row }) =>
        row.original.status !== "DISABLED" ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={deactivate.isPending}
            onClick={() =>
              deactivate
                .mutateAsync(row.original.id)
                .then(() => toast.success("Staff member deactivated"))
                .catch((e) => toast.error(e instanceof ApiError ? e.message : "Failed to deactivate"))
            }
          >
            <UserX className="size-3.5" />
            Deactivate
          </Button>
        ) : null,
    });
  }

  return base;
}

export default function StaffPage() {
  const { hasPermission } = useAuth();
  const [page, setPage] = React.useState(1);
  const staffQuery = useStaff({ page, pageSize: 20 });
  const canManage = hasPermission("users.delete");
  const columns = useColumns(canManage);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Staff"
        description="Trainers and team members at your gym"
        actions={hasPermission("users.create") && <InviteStaffDialog />}
      />

      <DataTable
        columns={columns}
        data={staffQuery.data}
        isLoading={staffQuery.isLoading}
        isError={staffQuery.isError}
        onRetry={() => staffQuery.refetch()}
        page={page}
        onPageChange={setPage}
        emptyTitle="No staff yet"
        emptyDescription="Invite your first team member."
      />
    </div>
  );
}

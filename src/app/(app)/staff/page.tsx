"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Sparkles, UserRound, UserX, Users } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/shared/data-table";
import { PageHero } from "@/components/shared/page-hero";
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
        <Button className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[linear-gradient(105deg,#0891b2,#2563eb_55%,#4f46e5)] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-cyan-500/25 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600">
          <Plus className="size-4" aria-hidden="true" />
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
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[13px] bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25" aria-hidden="true">
            <UserRound className="size-4" aria-hidden="true" />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-bold text-stone-900 dark:text-stone-100">
              {row.original.firstName} {row.original.lastName}
            </span>
            <span className="truncate text-xs font-medium text-stone-600 dark:text-stone-400">{row.original.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Roles",
      accessorKey: "userRoles",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.userRoles.map((ur) => (
            <Badge key={ur.id} variant="secondary" className="rounded-full bg-cyan-500/10 text-cyan-800 ring-1 ring-cyan-200/60">
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
        <Badge variant={row.original.status === "ACTIVE" ? "default" : "secondary"} className={row.original.status === "ACTIVE" ? "rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm" : "rounded-full"}>
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
            className="min-h-11 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
            disabled={deactivate.isPending}
            onClick={() =>
              deactivate
                .mutateAsync(row.original.id)
                .then(() => toast.success("Staff member deactivated"))
                .catch((e) => toast.error(e instanceof ApiError ? e.message : "Failed to deactivate"))
            }
          >
            <UserX className="size-3.5" aria-hidden="true" />
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
    <div className="relative -mx-2 min-h-full overflow-hidden pb-12 sm:-mx-3 lg:-mx-5">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_5%_2%,rgba(6,182,212,.13),transparent_19%),radial-gradient(circle_at_96%_4%,rgba(99,102,241,.15),transparent_22%),radial-gradient(circle_at_70%_38%,rgba(217,70,239,.10),transparent_25%),radial-gradient(circle_at_12%_72%,rgba(16,185,129,.08),transparent_24%)]" aria-hidden="true" />
      <div className="mx-auto flex max-w-[1680px] flex-col gap-8 px-2 sm:px-4 lg:px-6">
        <PageHero
          id="staff-title"
          icon={Users}
          title="Staff"
          variant="light"
          accent="blue"
          actions={
            <>
              {hasPermission("users.create") && <InviteStaffDialog />}
              <Link href="/attendance" className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-cyan-200/80 bg-white/80 px-5 py-3 text-sm font-bold text-cyan-900 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-cyan-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600">
                <Sparkles className="size-4" aria-hidden="true" /> Attendance
              </Link>
            </>
          }
        />

        <section aria-labelledby="staff-roster" className="overflow-hidden rounded-[28px] border border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-500 dark:border-white/10 dark:bg-stone-950/80">
          <div className="flex items-center gap-3 border-b border-stone-100/80 bg-gradient-to-r from-cyan-50/90 via-white to-teal-50/60 px-5 py-5 sm:px-6 dark:from-cyan-950/40 dark:via-stone-950 dark:to-teal-950/30">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25">
              <Users className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="staff-roster" className="font-serif text-xl font-semibold tracking-tight text-stone-950 dark:text-white">Team roster</h2>
            </div>
          </div>
          <div className="p-4 sm:p-5">
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
        </section>
      </div>
    </div>
  );
}

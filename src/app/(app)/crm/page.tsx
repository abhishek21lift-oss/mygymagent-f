"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Check, ArrowRightCircle } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { BranchSelect } from "@/components/shared/branch-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth/auth-context";
import {
  useLeads,
  useLead,
  useCreateLead,
  useUpdateLeadStatus,
  useConvertLead,
  useAddFollowUp,
  useCompleteFollowUp,
} from "@/lib/hooks/use-leads";
import { ApiError } from "@/lib/api/client";
import {
  createLeadSchema,
  createFollowUpSchema,
  type CreateLeadInput,
  type CreateFollowUpInput,
} from "@/lib/validation/gym";
import type { Lead, LeadStatus } from "@/lib/types/gym";

const STATUS_TABS: { label: string; value: LeadStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "New", value: "NEW" },
  { label: "Contacted", value: "CONTACTED" },
  { label: "Qualified", value: "QUALIFIED" },
  { label: "Trial", value: "TRIAL" },
  { label: "Won", value: "WON" },
  { label: "Lost", value: "LOST" },
];

const NEXT_STATUSES: Exclude<LeadStatus, "WON">[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "TRIAL",
  "LOST",
];

const statusVariant: Record<LeadStatus, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  NEW: "default",
  CONTACTED: "default",
  QUALIFIED: "warning",
  TRIAL: "warning",
  WON: "success",
  LOST: "destructive",
};

function NewLeadDialog() {
  const [open, setOpen] = React.useState(false);
  const createLead = useCreateLead();

  const form = useForm<CreateLeadInput>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: { firstName: "", lastName: "", email: "", phone: "", source: "", notes: "" },
  });

  async function onSubmit(values: CreateLeadInput) {
    try {
      await createLead.mutateAsync(values);
      toast.success("Lead added");
      setOpen(false);
      form.reset();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to add lead");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          New lead
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New lead</DialogTitle>
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
            <div className="grid grid-cols-2 gap-4">
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
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
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
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source</FormLabel>
                  <FormControl>
                    <Input placeholder="Walk-in, referral, Instagram, ..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={createLead.isPending}>
                {createLead.isPending ? "Adding..." : "Add lead"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AddFollowUpForm({ leadId }: { leadId: string }) {
  const addFollowUp = useAddFollowUp();
  const form = useForm<CreateFollowUpInput>({
    resolver: zodResolver(createFollowUpSchema),
    defaultValues: { dueAt: "", note: "" },
  });

  async function onSubmit(values: CreateFollowUpInput) {
    try {
      await addFollowUp.mutateAsync({
        leadId,
        input: { ...values, dueAt: new Date(values.dueAt).toISOString() },
      });
      toast.success("Follow-up added");
      form.reset();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to add follow-up");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-2">
          <FormField
            control={form.control}
            name="dueAt"
            render={({ field }) => (
              <FormItem className="col-span-1">
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormControl>
                  <Input placeholder="Call to discuss pricing" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" size="sm" variant="outline" disabled={addFollowUp.isPending} className="self-start">
          {addFollowUp.isPending ? "Adding..." : "Add follow-up"}
        </Button>
      </form>
    </Form>
  );
}

function LeadDetailDialog({ leadId, onClose }: { leadId: string; onClose: () => void }) {
  const leadQuery = useLead(leadId);
  const updateStatus = useUpdateLeadStatus();
  const convertLead = useConvertLead();
  const completeFollowUp = useCompleteFollowUp();
  const [convertBranchId, setConvertBranchId] = React.useState("");

  const lead = leadQuery.data;

  async function handleConvert() {
    if (!lead) return;
    try {
      await convertLead.mutateAsync({
        id: lead.id,
        branchId: lead.branchId ? undefined : convertBranchId,
      });
      toast.success(`${lead.firstName} ${lead.lastName} converted to a member`);
      onClose();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to convert lead");
    }
  }

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {!lead ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                {lead.firstName} {lead.lastName}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {lead.email && <span>{lead.email}</span>}
                {lead.phone && <span>· {lead.phone}</span>}
                {lead.source && <span>· {lead.source}</span>}
                <Badge variant={statusVariant[lead.status]}>{lead.status}</Badge>
              </div>

              {lead.status !== "WON" && (
                <div className="flex items-center gap-2">
                  <Select
                    value={lead.status}
                    onValueChange={(status) =>
                      updateStatus
                        .mutateAsync({ id: lead.id, status: status as LeadStatus })
                        .catch((e) =>
                          toast.error(e instanceof ApiError ? e.message : "Failed to update status"),
                        )
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NEXT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {!lead.branchId && (
                    <div className="w-40">
                      <BranchSelect value={convertBranchId} onChange={setConvertBranchId} />
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={convertLead.isPending || (!lead.branchId && !convertBranchId)}
                    onClick={handleConvert}
                  >
                    <ArrowRightCircle className="size-3.5" />
                    Convert to member
                  </Button>
                </div>
              )}

              <div>
                <p className="mb-2 text-sm font-medium">Follow-ups</p>
                {lead.followUps && lead.followUps.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {lead.followUps.map((fu) => (
                      <div
                        key={fu.id}
                        className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                      >
                        <div>
                          <p className={fu.completedAt ? "text-muted-foreground line-through" : ""}>
                            {fu.note}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Due {new Date(fu.dueAt).toLocaleDateString()}
                          </p>
                        </div>
                        {!fu.completedAt && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={completeFollowUp.isPending}
                            onClick={() =>
                              completeFollowUp
                                .mutateAsync({ leadId: lead.id, followUpId: fu.id })
                                .then(() => toast.success("Marked done"))
                                .catch((e) =>
                                  toast.error(e instanceof ApiError ? e.message : "Failed to update"),
                                )
                            }
                          >
                            <Check className="size-3.5" />
                            Done
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No follow-ups yet.</p>
                )}
              </div>

              <AddFollowUpForm leadId={lead.id} />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

const columns: ColumnDef<Lead>[] = [
  {
    header: "Name",
    accessorKey: "firstName",
    cell: ({ row }) => `${row.original.firstName} ${row.original.lastName}`,
  },
  {
    header: "Contact",
    accessorKey: "email",
    cell: ({ row }) => row.original.email ?? row.original.phone ?? "—",
  },
  {
    header: "Source",
    accessorKey: "source",
    cell: ({ row }) => row.original.source ?? "—",
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row }) => <Badge variant={statusVariant[row.original.status]}>{row.original.status}</Badge>,
  },
  {
    header: "Follow-ups",
    accessorKey: "_count",
    cell: ({ row }) => row.original._count?.followUps ?? 0,
  },
];

export default function CrmPage() {
  const { hasPermission } = useAuth();
  const [statusFilter, setStatusFilter] = React.useState<LeadStatus | "ALL">("ALL");
  const [page, setPage] = React.useState(1);
  const [selectedLeadId, setSelectedLeadId] = React.useState<string | null>(null);

  const leadsQuery = useLeads({
    page,
    pageSize: 20,
    order: "desc",
    status: statusFilter === "ALL" ? undefined : statusFilter,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Leads / CRM"
        description="Pipeline from first contact to won or lost"
        actions={hasPermission("leads.manage") && <NewLeadDialog />}
      />

      <Tabs
        value={statusFilter}
        onValueChange={(v) => {
          setStatusFilter(v as LeadStatus | "ALL");
          setPage(1);
        }}
      >
        <TabsList>
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <DataTable
        columns={columns}
        data={leadsQuery.data}
        isLoading={leadsQuery.isLoading}
        isError={leadsQuery.isError}
        onRetry={() => leadsQuery.refetch()}
        onRowClick={(lead) => setSelectedLeadId(lead.id)}
        page={page}
        onPageChange={setPage}
        emptyTitle="No leads yet"
        emptyDescription="Add a lead to start tracking your pipeline."
      />

      {selectedLeadId && (
        <LeadDetailDialog leadId={selectedLeadId} onClose={() => setSelectedLeadId(null)} />
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowRightCircle,
  CalendarClock,
  Check,
  Clock,
  Columns3,
  Kanban,
  LayoutGrid,
  List,
  Megaphone,
  Plus,
  Send,
  Sparkles,
  Table as TableIcon,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { PageHero } from "@/components/shared/page-hero";
import { ImportLeadsDialog } from "./import-leads-dialog";
import { MetricStrip } from "@/components/shared/panel";
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
  useLeadScore,
  useSendLeadMessage,
  useCrmSla,
  formatSlaMin,
} from "@/lib/hooks/use-leads";
import { ApiError } from "@/lib/api/client";
import {
  createLeadSchema,
  createFollowUpSchema,
  type CreateLeadInput,
  type CreateFollowUpInput,
} from "@/lib/validation/gym";
import type { Lead, LeadStatus } from "@/lib/types/gym";
import { StatCard, toStatTone } from "@/components/shared/stat-card";
import { cn } from "@/lib/utils";

const STATUS_TABS: { label: string; value: LeadStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "New", value: "NEW" },
  { label: "Contacted", value: "CONTACTED" },
  { label: "Qualified", value: "QUALIFIED" },
  { label: "Trial", value: "TRIAL" },
  { label: "Proposal", value: "PROPOSAL" },
  { label: "Won", value: "WON" },
  { label: "Lost", value: "LOST" },
];

const KANBAN_STAGES: { status: LeadStatus; label: string; tone: string }[] = [
  { status: "NEW", label: "New Leads", tone: "from-blue-500/20 to-indigo-500/10 text-blue-600 dark:text-blue-400" },
  { status: "CONTACTED", label: "Contacted", tone: "from-cyan-500/20 to-sky-500/10 text-cyan-600 dark:text-cyan-400" },
  { status: "QUALIFIED", label: "Qualified", tone: "from-amber-500/20 to-orange-500/10 text-amber-600 dark:text-amber-400" },
  { status: "TRIAL", label: "Scheduled Trial", tone: "from-purple-500/20 to-violet-500/10 text-purple-600 dark:text-purple-400" },
  { status: "PROPOSAL", label: "Proposal Sent", tone: "from-fuchsia-500/20 to-pink-500/10 text-fuchsia-600 dark:text-fuchsia-400" },
  { status: "WON", label: "Won & Joined", tone: "from-emerald-500/20 to-teal-500/10 text-emerald-600 dark:text-emerald-400" },
  { status: "LOST", label: "Lost / Inactive", tone: "from-rose-500/20 to-red-500/10 text-rose-600 dark:text-rose-400" },
];

const NEXT_STATUSES: Exclude<LeadStatus, "WON">[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "TRIAL",
  "PROPOSAL",
  "LOST",
];

const statusVariant: Record<
  LeadStatus,
  "default" | "secondary" | "success" | "warning" | "destructive"
> = {
  NEW: "default",
  CONTACTED: "default",
  QUALIFIED: "warning",
  TRIAL: "warning",
  PROPOSAL: "secondary",
  WON: "success",
  LOST: "destructive",
};

function NewLeadDialog() {
  const [open, setOpen] = React.useState(false);
  const createLead = useCreateLead();
  const form = useForm<CreateLeadInput>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      source: "",
      notes: "",
    },
  });

  async function submit(v: CreateLeadInput) {
    try {
      await createLead.mutateAsync(v);
      toast.success("Lead added");
      setOpen(false);
      form.reset();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to add lead");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="btn-sheen min-h-11 rounded-xl bg-primary shadow-sm transition duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          <Plus className="size-4" aria-hidden="true" /> New lead
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl border border-border/80 bg-card/95 shadow-xl backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Add New Lead</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(["firstName", "lastName"] as const).map((n) => (
                <FormField
                  key={n}
                  control={form.control}
                  name={n}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">{n === "firstName" ? "First name" : "Last name"}</FormLabel>
                      <FormControl>
                        <Input className="rounded-xl bg-background/80" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(["email", "phone"] as const).map((n) => (
                <FormField
                  key={n}
                  control={form.control}
                  name={n}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">{n === "email" ? "Email" : "Phone"}</FormLabel>
                      <FormControl>
                        <Input className="rounded-xl bg-background/80" type={n === "email" ? "email" : "text"} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold">Lead Source</FormLabel>
                  <FormControl>
                    <Input className="rounded-xl bg-background/80" placeholder="Walk-in, Instagram, Referral..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-2">
              <Button
                type="submit"
                disabled={createLead.isPending}
                className="w-full rounded-xl"
              >
                {createLead.isPending ? "Adding lead..." : "Create Lead"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AddFollowUp({ leadId }: { leadId: string }) {
  const m = useAddFollowUp();
  const f = useForm<CreateFollowUpInput>({
    resolver: zodResolver(createFollowUpSchema),
    defaultValues: { dueAt: "", note: "" },
  });

  async function submit(v: CreateFollowUpInput) {
    try {
      await m.mutateAsync({ leadId, input: { ...v, dueAt: new Date(v.dueAt).toISOString() } });
      toast.success("Follow-up added");
      f.reset();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to add follow-up");
    }
  }

  return (
    <Form {...f}>
      <form
        onSubmit={f.handleSubmit(submit)}
        className="flex flex-col gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-3.5 sm:flex-row"
      >
        <FormField
          control={f.control}
          name="dueAt"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input type="date" className="rounded-xl bg-background/80" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={f.control}
          name="note"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input placeholder="Next follow-up action / call notes..." className="rounded-xl bg-background/80" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          size="sm"
          disabled={m.isPending}
          className="rounded-xl"
        >
          {m.isPending ? "Adding..." : "Add"}
        </Button>
      </form>
    </Form>
  );
}

function LeadDetail({ leadId, onClose }: { leadId: string; onClose: () => void }) {
  const q = useLead(leadId);
  const status = useUpdateLeadStatus();
  const convert = useConvertLead();
  const complete = useCompleteFollowUp();
  const score = useLeadScore(leadId);
  const send = useSendLeadMessage();
  const [branch, setBranch] = React.useState("");
  const [lostReason, setLostReason] = React.useState("");
  const [showLost, setShowLost] = React.useState(false);
  const [msgChannel, setMsgChannel] = React.useState<"EMAIL" | "WHATSAPP">("EMAIL");
  const [msgBody, setMsgBody] = React.useState("");
  const lead = q.data;

  if (!lead)
    return (
      <Dialog open onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="rounded-3xl border border-border/80 bg-card p-6">
          <p className="text-sm text-muted-foreground">Loading lead details...</p>
        </DialogContent>
      </Dialog>
    );

  async function doConvert() {
    const currentLead = q.data;
    if (!currentLead) return;
    try {
      await convert.mutateAsync({
        id: currentLead.id,
        branchId: currentLead.branchId ? undefined : branch,
      });
      toast.success("Lead converted to member");
      onClose();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Conversion failed");
    }
  }

  async function doStatus(s: string) {
    if (s === "LOST") {
      setShowLost(true);
      return;
    }
    const currentLead = q.data;
    if (!currentLead) return;
    try {
      await status.mutateAsync({ id: currentLead.id, status: s as LeadStatus });
      setLostReason("");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Status update failed");
    }
  }

  async function doLost() {
    if (!lostReason.trim()) {
      toast.error("A reason is required to mark a lead lost");
      return;
    }
    const currentLead = q.data;
    if (!currentLead) return;
    try {
      await status.mutateAsync({
        id: currentLead.id,
        status: "LOST",
        reason: lostReason.trim(),
      });
      setShowLost(false);
      setLostReason("");
      toast.success("Lead marked lost");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not mark lead lost");
    }
  }

  async function doSend() {
    const currentLead = q.data;
    if (!currentLead) return;
    if (!msgBody.trim()) {
      toast.error("Write a message first");
      return;
    }
    try {
      await send.mutateAsync({
        id: currentLead.id,
        channel: msgChannel,
        customBody: msgBody.trim(),
      });
      setMsgBody("");
      toast.success(msgChannel === "EMAIL" ? "Email sent" : "WhatsApp dispatched");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Send failed");
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border border-border/80 bg-card/95 shadow-2xl backdrop-blur-xl sm:max-w-xl">
        <DialogHeader className="border-b border-border/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 font-bold text-primary">
              {lead.firstName?.[0] ?? ""}{lead.lastName?.[0] ?? ""}
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                {lead.firstName} {lead.lastName}
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                {lead.email ?? "No email"} {lead.phone ? `· ${lead.phone}` : ""}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {lead.source && (
              <span className="rounded-full bg-muted px-2.5 py-1 font-semibold text-muted-foreground">
                Source: {lead.source}
              </span>
            )}
            <Badge variant={statusVariant[lead.status]}>{lead.status}</Badge>
            {score.data && (
              <Badge
                variant={
                  score.data.grade === "HOT"
                    ? "destructive"
                    : score.data.grade === "WARM"
                    ? "warning"
                    : "secondary"
                }
                title={score.data.factors
                  .map((f) => `${f.label} (${f.points >= 0 ? "+" : ""}${f.points})`)
                  .join("\n")}
              >
                Score: {score.data.grade} ({score.data.score})
              </Badge>
            )}
          </div>

          {lead.status === "LOST" && lead.lostReason && (
            <p className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs font-medium text-destructive">
              Lost reason: {lead.lostReason}
            </p>
          )}

          {lead.trialScheduledFor && (
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-3.5 text-xs font-medium text-foreground">
              Trial scheduled: {new Date(lead.trialScheduledFor).toLocaleString()}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Select value={lead.status} onValueChange={doStatus}>
              <SelectTrigger className="w-40 rounded-xl">
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
              <div className="w-44">
                <BranchSelect value={branch} onChange={setBranch} />
              </div>
            )}

            {lead.status !== "WON" && (
              <Button
                size="sm"
                variant="outline"
                disabled={convert.isPending || (!lead.branchId && !branch)}
                onClick={doConvert}
                className="rounded-xl border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <ArrowRightCircle className="mr-1.5 size-4" aria-hidden="true" /> Convert to Member
              </Button>
            )}
          </div>

          {showLost && (
            <div className="space-y-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-3.5">
              <p className="text-xs font-semibold text-destructive">Reason for marking lead as lost:</p>
              <Input
                placeholder="e.g. Price too high, joined another gym, unreachable..."
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                className="rounded-xl bg-background"
              />
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={doLost}
                  disabled={status.isPending}
                  className="rounded-xl"
                >
                  Confirm Lost
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowLost(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Follow-ups timeline */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Follow-up History</p>
              <span className="font-mono text-xs text-muted-foreground">{lead.followUps?.length ?? 0} total</span>
            </div>
            <div className="space-y-2">
              {lead.followUps?.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/20 p-3 transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p
                      className={
                        f.completedAt
                          ? "line-through text-xs text-muted-foreground"
                          : "text-xs font-semibold text-foreground"
                      }
                    >
                      {f.note}
                    </p>
                    <p className="text-[11px] font-medium text-muted-foreground">
                      Due {new Date(f.dueAt).toLocaleDateString()}
                    </p>
                  </div>
                  {!f.completedAt && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        complete
                          .mutateAsync({ leadId: lead.id, followUpId: f.id })
                          .then(() => toast.success("Follow-up completed"))
                      }
                      className="h-8 rounded-lg text-xs"
                    >
                      <Check className="mr-1 size-3.5" aria-hidden="true" /> Done
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {(!lead.followUps || lead.followUps.length === 0) && (
              <p className="rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                No follow-ups recorded yet.
              </p>
            )}
            <AddFollowUp leadId={lead.id} />
          </div>

          {/* Quick Outreach */}
          {lead.status !== "WON" && (
            <div className="space-y-2 rounded-2xl border border-border/80 bg-muted/20 p-3.5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quick Outreach</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select
                  value={msgChannel}
                  onValueChange={(v) => setMsgChannel(v as "EMAIL" | "WHATSAPP")}
                >
                  <SelectTrigger className="w-32 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMAIL">Email{lead.email ? "" : " (none)"}</SelectItem>
                    <SelectItem value="WHATSAPP">
                      WhatsApp{lead.phone ? "" : " (none)"}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Draft quick outreach message..."
                  value={msgBody}
                  onChange={(e) => setMsgBody(e.target.value)}
                  className="flex-1 rounded-xl bg-background"
                />
                <Button
                  size="sm"
                  disabled={send.isPending}
                  onClick={doSend}
                  className="rounded-xl"
                >
                  <Send className="mr-1.5 size-3.5" /> Send
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function KanbanBoard({
  leads,
  onSelectLead,
  slaByLead,
}: {
  leads: Lead[];
  onSelectLead: (id: string) => void;
  slaByLead: Map<string, number | null | undefined>;
}) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 pt-1">
      {KANBAN_STAGES.map((col) => {
        const colLeads = leads.filter((l) => l.status === col.status);
        return (
          <div
            key={col.status}
            className="flex w-72 shrink-0 flex-col rounded-3xl border border-border/70 bg-card/60 p-3 shadow-xs backdrop-blur-xl"
          >
            {/* Column Header */}
            <div className="mb-3 flex items-center justify-between rounded-2xl bg-muted/40 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className={`size-2.5 rounded-full bg-gradient-to-br ${col.tone}`} />
                <h3 className="text-xs font-bold text-foreground">{col.label}</h3>
              </div>
              <span className="flex size-5 items-center justify-center rounded-full bg-muted font-mono text-[10px] font-bold text-muted-foreground">
                {colLeads.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto max-h-[560px] pr-1">
              {colLeads.map((lead) => {
                const slaMin = slaByLead.get(lead.id);
                const isOverdue = typeof slaMin === "number" && slaMin > 120;

                return (
                  <div
                    key={lead.id}
                    onClick={() => onSelectLead(lead.id)}
                    className="group cursor-pointer rounded-2xl border border-border/70 bg-card p-3 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-foreground group-hover:text-primary">
                          {lead.firstName} {lead.lastName}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {lead.email ?? lead.phone ?? "No contact details"}
                        </p>
                      </div>
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                        {lead.firstName?.[0] ?? "L"}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-1 border-t border-border/40 pt-2 text-[10px]">
                      <span className="truncate rounded-md bg-muted px-1.5 py-0.5 font-medium text-muted-foreground">
                        {lead.source ?? "Direct"}
                      </span>

                      <div className="flex items-center gap-1.5 font-mono">
                        {typeof slaMin === "number" && (
                          <span
                            className={cn(
                              "inline-flex items-center gap-0.5 font-semibold",
                              isOverdue ? "text-rose-600 dark:text-rose-400 font-bold" : "text-muted-foreground"
                            )}
                          >
                            <Clock className="size-2.5" />
                            {formatSlaMin(slaMin)}
                          </span>
                        )}
                        {(lead._count?.followUps ?? 0) > 0 && (
                          <span className="rounded-md bg-primary/10 px-1 py-0.5 text-primary font-bold">
                            {lead._count?.followUps} FU
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {colLeads.length === 0 && (
                <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-border/50 text-center text-xs text-muted-foreground">
                  No leads in stage
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const columns: ColumnDef<Lead>[] = [
  {
    header: "Lead",
    accessorKey: "firstName",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-bold text-primary">
          {row.original.firstName?.[0] ?? ""}{row.original.lastName?.[0] ?? ""}
        </div>
        <div>
          <p className="font-semibold text-foreground">
            {row.original.firstName} {row.original.lastName}
          </p>
          <p className="text-xs text-muted-foreground">
            {row.original.email ?? row.original.phone ?? "No contact"}
          </p>
        </div>
      </div>
    ),
  },
  {
    header: "Source",
    accessorKey: "source",
    cell: ({ row }) => (
      <span className="rounded-full bg-muted/80 px-2.5 py-1 text-xs font-medium text-foreground">
        {row.original.source ?? "—"}
      </span>
    ),
  },
  {
    header: "Stage",
    accessorKey: "status",
    cell: ({ row }) => (
      <Badge variant={statusVariant[row.original.status]}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    header: "Follow-ups",
    accessorKey: "_count",
    cell: ({ row }) => (
      <span className="font-mono tabular-nums text-foreground">
        {row.original._count?.followUps ?? 0}
      </span>
    ),
  },
];

export default function CrmPage() {
  const { hasPermission } = useAuth();
  const [filter, setFilter] = React.useState<LeadStatus | "ALL">("ALL");
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<"table" | "kanban">("table");

  const q = useLeads({
    page,
    pageSize: viewMode === "kanban" ? 60 : 20,
    order: "desc",
    status: filter === "ALL" ? undefined : filter,
  });

  const sla = useCrmSla();
  const visible = q.data?.items.length ?? 0;

  const slaByLead = React.useMemo(() => {
    const map = new Map<string, number | null | undefined>();
    for (const item of sla.data?.items ?? []) map.set(item.leadId, item.slaMin);
    return map;
  }, [sla.data]);

  const tableColumns = React.useMemo<ColumnDef<Lead>[]>(() => {
    if (!sla.data) return columns;
    return [
      ...columns,
      {
        header: "SLA Response",
        accessorKey: "sla",
        cell: ({ row }) => {
          const min = slaByLead.get(row.original.id);
          const overdue = typeof min === "number" && min > 120;
          return (
            <span
              className={
                overdue
                  ? "font-mono font-bold tabular-nums text-rose-600 dark:text-rose-400"
                  : "font-mono tabular-nums text-foreground"
              }
            >
              {formatSlaMin(min)}
            </span>
          );
        },
      },
    ];
  }, [sla.data, slaByLead]);

  return (
    <div className="pb-6">
      <div className="flex flex-col gap-6">
        {/* Hero */}
        <PageHero
          id="crm-title"
          icon={Megaphone}
          title="Leads"
          description="Pipeline velocity, follow-up SLAs and conversion tracking"
          actions={
            <>
              <Button
                asChild
                variant="outline"
                className="min-h-11 rounded-xl border-border bg-card hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <a href="/ai">
                  <Sparkles className="size-4" aria-hidden="true" /> Ask AI
                </a>
              </Button>
              {hasPermission("leads.manage") && <ImportLeadsDialog />}
              {hasPermission("leads.manage") && <NewLeadDialog />}
            </>
          }
        >
          <div className="flex flex-wrap gap-2">
            <Link
              href="/crm/follow-ups"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-blue-500/10 px-3.5 py-2 text-xs font-bold text-blue-700 ring-1 ring-blue-200/60 transition hover:bg-foreground hover:text-background dark:text-blue-300"
            >
              <CalendarClock className="size-3.5" aria-hidden="true" /> Follow-ups
            </Link>
            <Link
              href="/crm/analytics"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-violet-500/10 px-3.5 py-2 text-xs font-bold text-violet-700 ring-1 ring-violet-200/60 transition hover:bg-foreground hover:text-background dark:text-violet-300"
            >
              <TrendingUp className="size-3.5" aria-hidden="true" /> Analytics
            </Link>
          </div>
        </PageHero>

        {/* Apple-style SLA & Pipeline Telemetry Bar */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center gap-4 rounded-3xl border border-border/80 bg-card/90 p-4 shadow-sm backdrop-blur-xl">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Users className="size-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Leads</p>
              <p className="text-2xl font-black tabular-nums text-foreground">{visible}</p>
              <p className="text-xs text-muted-foreground">{filter === "ALL" ? "All active stages" : `Filter: ${filter}`}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-3xl border border-border/80 bg-card/90 p-4 shadow-sm backdrop-blur-xl">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Clock className="size-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Median SLA Contact</p>
              <p className="text-2xl font-black tabular-nums text-foreground">
                {sla.data ? formatSlaMin(sla.data.medianMin) : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Target: &lt; 30 minutes</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-3xl border border-border/80 bg-card/90 p-4 shadow-sm backdrop-blur-xl sm:col-span-2 lg:col-span-1">
            <div className={cn(
              "flex size-12 items-center justify-center rounded-2xl",
              (sla.data?.overdueCount ?? 0) > 0 ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            )}>
              <AlertCircle className="size-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Overdue Leads</p>
              <p className={cn("text-2xl font-black tabular-nums", (sla.data?.overdueCount ?? 0) > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400")}>
                {sla.data?.overdueCount ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Require immediate contact</p>
            </div>
          </div>
        </div>

        {/* Pipeline Filter & View Switcher */}
        <div className="flex flex-col gap-4 rounded-3xl border border-border/80 bg-card/90 p-4 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <Tabs
            value={filter}
            onValueChange={(v) => {
              setFilter(v as LeadStatus | "ALL");
              setPage(1);
            }}
            className="w-full sm:w-auto"
          >
            <TabsList className="h-10 w-full justify-start overflow-x-auto rounded-xl bg-muted/60 p-1 sm:w-auto">
              <div className="flex min-w-max gap-1">
                {STATUS_TABS.map((t) => (
                  <TabsTrigger key={t.value} value={t.value} className="rounded-lg px-3 text-xs font-semibold">
                    {t.label}
                  </TabsTrigger>
                ))}
              </div>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-1.5 self-end rounded-xl border border-border/60 bg-muted/30 p-1">
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="h-8 rounded-lg px-2.5 text-xs font-semibold"
              title="Table View"
            >
              <TableIcon className="mr-1.5 size-3.5" />
              Table
            </Button>
            <Button
              variant={viewMode === "kanban" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("kanban")}
              className="h-8 rounded-lg px-2.5 text-xs font-semibold"
              title="Kanban Board View"
            >
              <Kanban className="mr-1.5 size-3.5" />
              Kanban
            </Button>
          </div>
        </div>

        {/* Content Section: Table vs Kanban */}
        <section className="overflow-hidden rounded-3xl border border-border/80 bg-card/90 shadow-sm backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-muted/20 px-6 py-4">
            <h2 className="text-base font-bold text-foreground">
              {viewMode === "kanban" ? "Pipeline Kanban Board" : "Lead Directory"}
            </h2>
            {sla.data && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/70 bg-blue-50/70 px-3 py-1 text-xs font-bold text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-blue-200">
                Median contact: {formatSlaMin(sla.data.medianMin)} · {sla.data.overdueCount} overdue
              </span>
            )}
          </div>

          <div className="p-4 sm:p-6">
            {viewMode === "kanban" ? (
              <KanbanBoard
                leads={q.data?.items ?? []}
                onSelectLead={(id) => setSelected(id)}
                slaByLead={slaByLead}
              />
            ) : (
              <DataTable
                columns={tableColumns}
                data={q.data?.items ?? []}
                isLoading={q.isLoading}
                isError={q.isError}
                onRetry={() => q.refetch()}
                onRowClick={(l) => setSelected(l.id)}
                page={page}
                onPageChange={setPage}
                emptyTitle="No leads found"
                emptyDescription="Add a new lead to start tracking your conversion funnel."
              />
            )}
          </div>
        </section>

        {selected && <LeadDetail leadId={selected} onClose={() => setSelected(null)} />}
      </div>
    </div>
  );
}

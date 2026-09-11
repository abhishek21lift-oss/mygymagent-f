"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  ArrowRight,
  ArrowRightCircle,
  CalendarClock,
  Check,
  Flame,
  Megaphone,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { BranchSelect } from "@/components/shared/branch-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  { label: "Proposal", value: "PROPOSAL" },
  { label: "Won", value: "WON" },
  { label: "Lost", value: "LOST" },
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

type MetricTone = "cyan" | "rose" | "violet" | "amber" | "blue";

const METRIC_TONES: Record<
  MetricTone,
  { bar: string; tile: string; orb: string; ring: string }
> = {
  cyan: {
    bar: "from-cyan-400 via-sky-500 to-blue-600",
    tile: "from-cyan-500 to-blue-600 shadow-cyan-500/30",
    orb: "bg-cyan-400/20",
    ring: "hover:border-cyan-200 hover:shadow-cyan-500/10",
  },
  rose: {
    bar: "from-rose-500 via-red-500 to-orange-500",
    tile: "from-rose-500 to-orange-500 shadow-rose-500/30",
    orb: "bg-rose-400/20",
    ring: "hover:border-rose-200 hover:shadow-rose-500/10",
  },
  violet: {
    bar: "from-violet-600 via-purple-600 to-fuchsia-600",
    tile: "from-violet-600 to-fuchsia-600 shadow-violet-500/30",
    orb: "bg-fuchsia-400/20",
    ring: "hover:border-violet-200 hover:shadow-violet-500/10",
  },
  amber: {
    bar: "from-amber-400 via-orange-500 to-rose-500",
    tile: "from-amber-500 to-orange-600 shadow-amber-500/30",
    orb: "bg-amber-400/20",
    ring: "hover:border-amber-200 hover:shadow-amber-500/10",
  },
  blue: {
    bar: "from-blue-500 via-indigo-500 to-violet-600",
    tile: "from-blue-600 to-indigo-600 shadow-blue-500/30",
    orb: "bg-blue-400/20",
    ring: "hover:border-blue-200 hover:shadow-blue-500/10",
  },
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
        <Button className="min-h-11 rounded-2xl bg-[linear-gradient(105deg,#2563eb,#4f46e5_55%,#7c3aed)] shadow-lg shadow-blue-500/25 transition duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
          <Plus className="size-4" aria-hidden="true" /> New lead
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a new lead</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              {(["firstName", "lastName"] as const).map((n) => (
                <FormField
                  key={n}
                  control={form.control}
                  name={n}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{n === "firstName" ? "First name" : "Last name"}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {(["email", "phone"] as const).map((n) => (
                <FormField
                  key={n}
                  control={form.control}
                  name={n}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{n === "email" ? "Email" : "Phone"}</FormLabel>
                      <FormControl>
                        <Input type={n === "email" ? "email" : "text"} {...field} />
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
                  <FormLabel>Source</FormLabel>
                  <FormControl>
                    <Input placeholder="Walk-in, referral, Instagram..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="submit"
                disabled={createLead.isPending}
                className="min-h-11 rounded-2xl"
              >
                {createLead.isPending ? "Adding..." : "Add lead"}
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
        className="flex flex-col gap-2 rounded-2xl border border-blue-100/80 bg-blue-50/40 p-3 sm:flex-row"
      >
        <FormField
          control={f.control}
          name="dueAt"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input type="date" {...field} />
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
                <Input placeholder="Next action / note" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          size="sm"
          variant="outline"
          disabled={m.isPending}
          className="min-h-11 rounded-xl border-blue-200 bg-white/80 hover:bg-stone-950 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
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
        <DialogContent>
          <p className="text-sm text-stone-600">Loading lead...</p>
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {lead.firstName} {lead.lastName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2 text-sm text-stone-600">
            {lead.email && <span>{lead.email}</span>}
            {lead.phone && <span>· {lead.phone}</span>}
            {lead.source && <span>· {lead.source}</span>}
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
                {score.data.grade} · {score.data.score}
              </Badge>
            )}
          </div>
          {lead.status === "LOST" && lead.lostReason && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
              Lost reason: {lead.lostReason}
            </p>
          )}
          {lead.trialScheduledFor && (
            <p className="text-sm font-medium text-stone-600">
              Trial scheduled: {new Date(lead.trialScheduledFor).toLocaleString()}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Select value={lead.status} onValueChange={doStatus}>
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
                className="min-h-11 rounded-xl border-blue-200 hover:bg-stone-950 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                <ArrowRightCircle className="size-4" aria-hidden="true" /> Convert
              </Button>
            )}
          </div>
          {showLost && (
            <div className="space-y-2 rounded-xl border border-rose-200 bg-rose-50/60 p-3">
              <p className="text-sm font-semibold text-stone-900">Why is this lead lost?</p>
              <Input
                placeholder="e.g. chose a cheaper gym, no response..."
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={doLost}
                  disabled={status.isPending}
                  className="min-h-11 rounded-xl"
                >
                  Mark lost
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowLost(false)}
                  className="min-h-11 rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          <div>
            <p className="mb-2 text-sm font-semibold text-stone-900">Follow-up timeline</p>
            <div className="space-y-2">
              {lead.followUps?.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-stone-200/70 bg-white/70 p-3"
                >
                  <div className="min-w-0">
                    <p
                      className={
                        f.completedAt
                          ? "line-through text-stone-600"
                          : "text-sm font-medium text-stone-900"
                      }
                    >
                      {f.note}
                    </p>
                    <p className="text-xs font-medium text-stone-600">
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
                      className="min-h-11 shrink-0 rounded-xl hover:bg-stone-950 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                      <Check className="size-3.5" aria-hidden="true" /> Done
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {(!lead.followUps || lead.followUps.length === 0) && (
              <p className="text-sm font-medium text-stone-600">No follow-ups yet.</p>
            )}
          </div>
          <AddFollowUp leadId={lead.id} />
          {lead.status !== "WON" && (
            <div className="space-y-2 rounded-2xl border border-violet-100 bg-violet-50/40 p-3">
              <p className="text-sm font-semibold text-stone-900">Quick outreach</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select
                  value={msgChannel}
                  onValueChange={(v) => setMsgChannel(v as "EMAIL" | "WHATSAPP")}
                >
                  <SelectTrigger className="w-32">
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
                  placeholder="Write a quick message..."
                  value={msgBody}
                  onChange={(e) => setMsgBody(e.target.value)}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={send.isPending}
                  onClick={doSend}
                  className="min-h-11 rounded-xl hover:bg-stone-950 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
                >
                  Send
                </Button>
              </div>
              <p className="text-xs font-medium text-stone-600">
                Sends are recorded in the message log for audit.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const columns: ColumnDef<Lead>[] = [
  {
    header: "Lead",
    accessorKey: "firstName",
    cell: ({ row }) => (
      <div>
        <p className="font-semibold text-stone-900">
          {row.original.firstName} {row.original.lastName}
        </p>
        <p className="text-xs font-medium text-stone-600">
          {row.original.email ?? row.original.phone ?? "No contact"}
        </p>
      </div>
    ),
  },
  {
    header: "Source",
    accessorKey: "source",
    cell: ({ row }) => (
      <span className="text-sm font-medium text-stone-700">{row.original.source ?? "—"}</span>
    ),
  },
  {
    header: "Stage",
    accessorKey: "status",
    cell: ({ row }) => <Badge variant={statusVariant[row.original.status]}>{row.original.status}</Badge>,
  },
  {
    header: "Follow-ups",
    accessorKey: "_count",
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">{row.original._count?.followUps ?? 0}</span>
    ),
  },
];

export default function CrmPage() {
  const { hasPermission } = useAuth();
  const [filter, setFilter] = React.useState<LeadStatus | "ALL">("ALL");
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState<string | null>(null);
  const q = useLeads({
    page,
    pageSize: 20,
    order: "desc",
    status: filter === "ALL" ? undefined : filter,
  });
  const visible = q.data?.items.length ?? 0;

  return (
    <div className="relative -mx-2 min-h-full overflow-hidden pb-12 sm:-mx-3 lg:-mx-5">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_5%_2%,rgba(6,182,212,.13),transparent_19%),radial-gradient(circle_at_96%_4%,rgba(99,102,241,.15),transparent_22%),radial-gradient(circle_at_70%_38%,rgba(217,70,239,.10),transparent_25%),radial-gradient(circle_at_12%_72%,rgba(16,185,129,.08),transparent_24%)]"
        aria-hidden="true"
      />
      <div className="mx-auto flex max-w-[1680px] flex-col gap-8 px-2 sm:px-4 lg:px-6">
        {/* Hero */}
        <section
          aria-labelledby="crm-title"
          className="relative overflow-hidden rounded-[34px] border border-white/90 bg-white/88 p-6 shadow-[0_35px_110px_-48px_rgba(79,70,229,.48)] backdrop-blur-2xl sm:p-8 lg:p-10"
        >
          <div
            className="pointer-events-none absolute -left-24 -top-32 size-80 rounded-full bg-blue-300/30 blur-3xl motion-safe:animate-blob"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -right-28 -top-24 size-96 rounded-full bg-cyan-300/30 blur-3xl motion-safe:animate-blob motion-safe:[animation-delay:2.5s]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-40 left-[35%] size-96 rounded-full bg-violet-300/25 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/75 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em] text-blue-700">
                <Sparkles className="size-3.5" aria-hidden="true" /> Sales intelligence
              </div>
              <h1
                id="crm-title"
                className="font-serif text-4xl font-semibold tracking-[-.045em] text-stone-950 sm:text-5xl"
              >
                Sales OS
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-stone-600">
                Know who to contact next — pipeline, follow-ups and conversion actions in
                one focused workspace.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/crm/follow-ups"
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-blue-500/10 px-3 py-2 text-xs font-extrabold text-blue-700 ring-1 ring-blue-200/60 transition hover:bg-stone-950 hover:text-white hover:ring-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  <CalendarClock className="size-3.5" aria-hidden="true" /> Follow-ups
                </Link>
                <Link
                  href="/crm/analytics"
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-violet-500/10 px-3 py-2 text-xs font-extrabold text-violet-700 ring-1 ring-violet-200/60 transition hover:bg-stone-950 hover:text-white hover:ring-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
                >
                  <TrendingUp className="size-3.5" aria-hidden="true" /> Analytics
                </Link>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                variant="outline"
                className="min-h-11 rounded-2xl border-violet-200 bg-white/80 hover:bg-stone-950 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
              >
                <a href="/ai">
                  <Sparkles className="size-4" aria-hidden="true" /> Ask AI who to call
                </a>
              </Button>
              {hasPermission("leads.manage") && <NewLeadDialog />}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section aria-label="Pipeline snapshot">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Metric icon={Users} label="Visible leads" value={visible} tone="cyan" hint="On this page of results" />
            <Metric
              icon={Flame}
              label="Current stage"
              value={filter === "ALL" ? "All" : filter}
              tone="rose"
              hint="Active pipeline filter"
            />
            <Metric icon={Target} label="Qualified" value="—" tone="violet" hint="Move warm to trial" />
            <Metric icon={CalendarClock} label="Follow-ups" value="—" tone="amber" hint="Work today's actions" />
            <Metric icon={Sparkles} label="AI priority" value="Ready" tone="blue" hint="Ask who to call next" />
          </div>
        </section>

        {/* Pipeline filter */}
        <section
          aria-labelledby="crm-pipeline"
          className="overflow-hidden rounded-[28px] border border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between gap-3 border-b border-stone-100/80 bg-gradient-to-r from-blue-50/90 via-white to-cyan-50/60 px-5 py-5 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/25">
                <Megaphone className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2
                  id="crm-pipeline"
                  className="font-serif text-xl font-semibold tracking-tight text-stone-950"
                >
                  Conversion pipeline
                </h2>
                <p className="mt-0.5 text-xs font-medium text-stone-600">
                  Filter the pipeline without losing lead context.
                </p>
              </div>
            </div>
          </div>
          <div className="p-3 sm:p-4">
            <Tabs
              value={filter}
              onValueChange={(v) => {
                setFilter(v as LeadStatus | "ALL");
                setPage(1);
              }}
            >
              <TabsList className="w-full justify-start overflow-x-auto rounded-2xl">
                <div className="flex min-w-max gap-1">
                  {STATUS_TABS.map((t) => (
                    <TabsTrigger key={t.value} value={t.value} className="min-h-11">
                      {t.label}
                    </TabsTrigger>
                  ))}
                </div>
              </TabsList>
            </Tabs>
          </div>
        </section>

        {/* Leads + next actions */}
        <section className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
          <div className="overflow-hidden rounded-[28px] border border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl">
            <div className="border-b border-stone-100/80 bg-gradient-to-r from-blue-50/90 via-white to-violet-50/60 px-5 py-5 sm:px-6">
              <h2 className="font-serif text-xl font-semibold tracking-tight text-stone-950">
                Leads
              </h2>
              <p className="mt-0.5 text-xs font-medium text-stone-600">
                Select any row to open the full lead workspace.
              </p>
            </div>
            <div className="p-3 sm:p-4">
              <DataTable
                columns={columns}
                data={q.data?.items ?? []}
                isLoading={q.isLoading}
                isError={q.isError}
                onRetry={() => q.refetch()}
                onRowClick={(l) => setSelected(l.id)}
                page={page}
                onPageChange={setPage}
                emptyTitle="No leads yet"
                emptyDescription="Add a lead to start tracking your pipeline."
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl">
            <div className="flex items-center gap-3 border-b border-stone-100/80 bg-gradient-to-r from-violet-50/90 via-white to-cyan-50/60 px-5 py-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/25">
                <Sparkles className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-serif text-xl font-semibold tracking-tight text-stone-950">
                  Next best actions
                </h2>
                <p className="mt-0.5 text-xs font-medium text-stone-600">
                  AI-guided moves that protect revenue.
                </p>
              </div>
            </div>
            <div className="space-y-3 p-5">
              <Action
                icon={CalendarClock}
                title="Follow up today"
                text="Work the leads with the next scheduled action."
                tile="from-blue-600 to-cyan-500 shadow-blue-500/25"
              />
              <Action
                icon={Target}
                title="Prioritize qualified leads"
                text="Move warm prospects toward a trial or offer."
                tile="from-violet-600 to-fuchsia-600 shadow-violet-500/25"
              />
              <Action
                icon={Flame}
                title="Protect hot leads"
                text="Respond while purchase intent is high."
                tile="from-rose-500 to-orange-500 shadow-rose-500/25"
              />
              <Button
                asChild
                variant="outline"
                className="min-h-11 w-full rounded-2xl border-violet-200 bg-white/80 hover:bg-stone-950 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
              >
                <a href="/ai">
                  <Sparkles className="size-4" aria-hidden="true" /> Open AI sales assistant
                </a>
              </Button>
              <Link
                href="/crm/follow-ups"
                className="group inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-stone-950 px-4 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
              >
                Open follow-up queue
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {selected && <LeadDetail leadId={selected} onClose={() => setSelected(null)} />}
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  tone,
  hint,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  tone: MetricTone;
  hint: string;
}) {
  const t = METRIC_TONES[tone];
  return (
    <Card
      className={`group relative overflow-hidden border-white/90 bg-white/85 shadow-[0_20px_60px_-38px_rgba(79,70,229,.35)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 ${t.ring}`}
    >
      <span
        className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${t.bar}`}
        aria-hidden="true"
      />
      <div
        className={`pointer-events-none absolute -right-10 -top-10 size-32 rounded-full blur-2xl transition duration-300 group-hover:scale-125 ${t.orb}`}
        aria-hidden="true"
      />
      <CardContent className="relative flex items-center gap-4 p-5">
        <span
          className={`flex size-14 shrink-0 items-center justify-center rounded-[19px] bg-gradient-to-br text-white shadow-lg ${t.tile} transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}
        >
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[.18em] text-stone-500">
            {label}
          </p>
          <p className="mt-1 truncate text-2xl font-black tracking-tight text-stone-950 tabular-nums">
            {value}
          </p>
          <p className="mt-1 text-[11px] font-medium text-stone-600">{hint}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Action({
  icon: Icon,
  title,
  text,
  tile,
}: {
  icon: typeof Target;
  title: string;
  text: string;
  tile: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[20px] border border-stone-200/70 bg-white/70 p-4 transition hover:-translate-y-px hover:shadow-md">
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br text-white shadow-md ${tile}`}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-extrabold tracking-tight text-stone-950">
          {title}
        </span>
        <span className="mt-0.5 block text-xs font-medium leading-5 text-stone-600">{text}</span>
      </span>
    </div>
  );
}

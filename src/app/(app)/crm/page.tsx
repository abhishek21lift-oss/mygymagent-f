"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
 ArrowRightCircle,
 CalendarClock,
 Check,
 Megaphone,
 Plus,
 Sparkles,
 TrendingUp,
 Users,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { PageHero } from "@/components/shared/page-hero";
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
const NEXT_STATUSES: Exclude<LeadStatus, "WON">[] = [ "NEW", "CONTACTED", "QUALIFIED", "TRIAL", "PROPOSAL", "LOST",
];
const statusVariant: Record<
 LeadStatus, "default" | "secondary" | "success" | "warning" | "destructive"
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
 bar: "bg-cyan-400",
 tile: "bg-cyan-500 shadow-cyan-500/30",
 orb: "bg-cyan-400/20",
 ring: "hover:border-cyan-200 hover:shadow-cyan-500/10",
 },
 rose: {
 bar: "bg-rose-500",
 tile: "bg-rose-500 shadow-rose-500/30",
 orb: "bg-rose-400/20",
 ring: "hover:border-rose-200 hover:shadow-rose-500/10",
 },
 violet: {
 bar: "bg-violet-600",
 tile: "bg-violet-600 shadow-violet-500/30",
 orb: "bg-fuchsia-400/20",
 ring: "hover:border-violet-200 hover:shadow-violet-500/10",
 },
 amber: {
 bar: "bg-amber-400",
 tile: "bg-amber-500 shadow-amber-500/30",
 orb: "bg-amber-400/20",
 ring: "hover:border-amber-200 hover:shadow-amber-500/10",
 },
 blue: {
 bar: "bg-blue-500",
 tile: "bg-blue-600 shadow-blue-500/30",
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
 <Button className="btn-sheen min-h-11 rounded-lg bg-primary transition duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
 <Plus className="size-4" aria-hidden="true" /> New lead
 </Button>
 </DialogTrigger>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Add a new lead</DialogTitle>
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
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
 className="min-h-11 rounded-lg"
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
 className="flex flex-col gap-2 rounded-lg border border-blue-100/80 bg-blue-50/40 p-3 sm:flex-row"
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
 className="min-h-11 rounded-xl border-border bg-card hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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
 className="min-h-11 rounded-xl border-blue-200 hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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
 className="flex items-center justify-between gap-3 rounded-xl border border-stone-200/70 bg-card p-3"
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
 className="min-h-11 shrink-0 rounded-xl hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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
 <div className="space-y-2 rounded-lg border border-violet-100 bg-violet-50/40 p-3">
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
 className="min-h-11 rounded-xl hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
 >
 Send
 </Button>
 </div>
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
 const sla = useCrmSla();
 const visible = q.data?.items.length ?? 0;

 const slaByLead = React.useMemo(() => {
 const map = new Map<string, number | null | undefined>();
 for (const item of sla.data?.items ?? []) map.set(item.leadId, item.slaMin);
 return map;
 }, [sla.data]);

 // SLA column is only added once the snapshot loads; on 404/error the
 // table renders exactly as before instead of crashing.
 const tableColumns = React.useMemo<ColumnDef<Lead>[]>(() => {
 if (!sla.data) return columns;
 return [
 ...columns,
 {
 header: "SLA",
 accessorKey: "sla",
 cell: ({ row }) => {
 const min = slaByLead.get(row.original.id);
 const overdue = typeof min === "number" && min > 120;
 return (
 <span
 className={
 overdue
 ? "font-mono font-bold tabular-nums text-rose-600 dark:text-rose-400"
 : "font-mono tabular-nums text-stone-700 dark:text-stone-300"
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
 <div className="pb-4">
 <div className="flex flex-col gap-5">
 {/* Hero */}
 <PageHero
 id="crm-title"
 icon={Megaphone}
 title="Leads"
 description="Pipeline, follow-ups and conversion"
 actions={
 <>
 <Button
 asChild
 variant="outline"
 className="min-h-11 rounded-lg border-border bg-card hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
 >
 <a href="/ai">
 <Sparkles className="size-4" aria-hidden="true" /> Ask AI
 </a>
 </Button>
 {hasPermission("leads.manage") && <NewLeadDialog />}
 </>
 }
 >
 <div className="flex flex-wrap gap-2">
 <Link
 href="/crm/follow-ups"
 className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-blue-500/10 px-3 py-2 text-xs font-extrabold text-blue-700 ring-1 ring-blue-200/60 transition hover:bg-foreground hover:text-background hover:ring-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
 >
 <CalendarClock className="size-3.5" aria-hidden="true" /> Follow-ups
 </Link>
 <Link
 href="/crm/analytics"
 className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-violet-500/10 px-3 py-2 text-xs font-extrabold text-violet-700 ring-1 ring-violet-200/60 transition hover:bg-foreground hover:text-background hover:ring-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
 >
 <TrendingUp className="size-3.5" aria-hidden="true" /> Analytics
 </Link>
 </div>
 </PageHero>

 {/* One figure, because there is one. "Current stage" was a tile
 restating which pipeline tab is selected directly below it -- a
 filter's own state is not a measurement, and putting it in a
 metric slot made the page look like it had twice the information
 it has. */}
 <MetricStrip label="Pipeline" columns={4}>
 <Metric icon={Users} label="Visible leads" value={visible} hint={filter === "ALL" ? "All stages" : `Stage: ${filter}`} />
 </MetricStrip>

 {/* Pipeline filter */}
 <section
 aria-labelledby="crm-pipeline"
 className="overflow-hidden rounded-xl border border-border bg-card"
 >
 <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5 sm:px-5">
 <div className="flex items-center gap-3">
 <div>
 <h2
 id="crm-pipeline"
 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
 >
 Conversion pipeline
 </h2>
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
 <TabsList className="w-full justify-start overflow-x-auto rounded-lg">
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

 {/* Leads */}
 <section className="grid gap-5">
 <div className="overflow-hidden rounded-xl border border-border bg-card">
 <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-2.5 sm:px-5">
 <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
 Leads
 </h2>
 {sla.data && (
 <span className="inline-flex min-h-11 items-center rounded-full border border-blue-200/70 bg-blue-50/70 px-3 py-1 text-xs font-bold text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-blue-200">
 Median first contact: {formatSlaMin(sla.data.medianMin)} · {sla.data.overdueCount} overdue
 </span>
 )}
 </div>
 <div className="p-3 sm:p-4">
 <DataTable
 columns={tableColumns}
 data={q.data?.items ?? []}
 isLoading={q.isLoading}
 isError={q.isError}
 onRetry={() => q.refetch()}
 onRowClick={(l) => setSelected(l.id)}
 page={page}
 onPageChange={setPage}
 emptyTitle="No leads yet"
 emptyDescription="Add a lead to begin."
 />
 </div>
 </div>
 </section>

 {selected && <LeadDetail leadId={selected} onClose={() => setSelected(null)} />}
 </div>
 </div>
 );
}

function Metric({ label, value, tone, hint }: { icon?: unknown; label: string; value: React.ReactNode; tone?: string; hint?: string }) {
 return <StatCard title={label} value={typeof value === "string" || typeof value === "number" ? value : String(value ?? "")} isLoading={false} hint={hint} tone={toStatTone(tone)} />;
}


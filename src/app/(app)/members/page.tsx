"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Download,
  Filter,
  Plus,
  Search,
  Sparkles,
  SquareCheckBig,
  Tag,
  Upload,
  UserRound,
  Users,
  Wallet,
  X,
} from "lucide-react";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMembers, type MemberFilters } from "@/lib/hooks/use-members";
import { useMemberTags } from "@/lib/hooks/use-member-tags";
import { useBulkStatusChange, useBulkTagAssignment, useBulkExport } from "@/lib/hooks/use-bulk-member-actions";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import type { Member, MemberStatus, MemberType } from "@/lib/types/gym";

const STATUS_OPTIONS: MemberStatus[] = ["ACTIVE", "INACTIVE", "FROZEN", "EXPIRED"];
const TYPE_OPTIONS: MemberType[] = ["GYM", "PT", "GYM_PT"];
const statusVariant: Record<MemberStatus, "default" | "secondary" | "destructive" | "warning"> = {
  ACTIVE: "default",
  INACTIVE: "secondary",
  FROZEN: "warning",
  EXPIRED: "destructive",
};

/* Members accent = violet + cyan. Status keeps meaning:
   ACTIVE emerald, INACTIVE amber, FROZEN cyan, EXPIRED rose. */
const STATUS_PILL: Record<MemberStatus, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-700 ring-emerald-200/70",
  INACTIVE: "bg-amber-500/15 text-amber-800 ring-amber-200/70",
  FROZEN: "bg-cyan-500/10 text-cyan-800 ring-cyan-200/70",
  EXPIRED: "bg-rose-500/10 text-rose-700 ring-rose-200/70",
};

type MetricTone = "cyan" | "emerald" | "amber" | "violet";

const METRIC_TONES: Record<MetricTone, { bar: string; tile: string; ring: string; orb: string }> = {
  cyan: {
    bar: "from-cyan-400 via-sky-500 to-blue-600",
    tile: "from-cyan-500 to-blue-600 shadow-cyan-500/30",
    ring: "hover:border-cyan-200 hover:shadow-cyan-500/10",
    orb: "bg-cyan-400/20",
  },
  emerald: {
    bar: "from-emerald-400 via-teal-500 to-green-600",
    tile: "from-emerald-500 to-teal-600 shadow-emerald-500/30",
    ring: "hover:border-emerald-200 hover:shadow-emerald-500/10",
    orb: "bg-emerald-400/20",
  },
  amber: {
    bar: "from-amber-400 via-orange-500 to-rose-500",
    tile: "from-amber-500 to-orange-600 shadow-amber-500/30",
    ring: "hover:border-amber-200 hover:shadow-amber-500/10",
    orb: "bg-amber-400/20",
  },
  violet: {
    bar: "from-violet-600 via-purple-600 to-fuchsia-600",
    tile: "from-violet-600 to-fuchsia-600 shadow-violet-500/30",
    ring: "hover:border-violet-200 hover:shadow-violet-500/10",
    orb: "bg-fuchsia-400/20",
  },
};

function Metric({ icon: Icon, label, value, hint, tone }: { icon: typeof Users; label: string; value: React.ReactNode; hint: string; tone: MetricTone }) {
  const t = METRIC_TONES[tone];
  return (
    <Card className={`group relative overflow-hidden border-white/90 bg-white/85 shadow-[0_20px_60px_-38px_rgba(79,70,229,.35)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_-38px_rgba(79,70,229,.42)] ${t.ring}`}>
      <span className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${t.bar}`} aria-hidden="true" />
      <div className={`pointer-events-none absolute -right-10 -top-10 size-32 rounded-full blur-2xl transition duration-300 group-hover:scale-125 ${t.orb}`} aria-hidden="true" />
      <CardContent className="relative flex items-center gap-4 p-5 lg:p-6">
        <span className={`flex size-14 shrink-0 items-center justify-center rounded-[19px] bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${t.tile}`}>
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[.18em] text-stone-500">{label}</p>
          <p className="mt-1 truncate text-2xl font-black tracking-tight text-stone-950 tabular-nums" aria-live="polite">{value}</p>
          <p className="mt-1 text-[11px] font-medium text-stone-600">{hint}</p>
        </div>
      </CardContent>
    </Card>
  );
}

const SEGMENT_TONES: Record<string, { tile: string; ring: string }> = {
  all: { tile: "from-violet-600 to-fuchsia-600 shadow-violet-500/25", ring: "hover:border-violet-200 hover:shadow-violet-500/10" },
  active: { tile: "from-emerald-500 to-teal-600 shadow-emerald-500/25", ring: "hover:border-emerald-200 hover:shadow-emerald-500/10" },
  inactive: { tile: "from-amber-500 to-orange-600 shadow-amber-500/25", ring: "hover:border-amber-200 hover:shadow-amber-500/10" },
  frozen: { tile: "from-cyan-500 to-blue-600 shadow-cyan-500/25", ring: "hover:border-cyan-200 hover:shadow-cyan-500/10" },
  expired: { tile: "from-rose-500 to-orange-500 shadow-rose-500/25", ring: "hover:border-rose-200 hover:shadow-rose-500/10" },
  pt: { tile: "from-blue-600 to-violet-600 shadow-blue-500/25", ring: "hover:border-blue-200 hover:shadow-blue-500/10" },
};

function Segment({ title, description, icon: Icon, tone, onClick }: { title: string; description: string; icon: typeof Users; tone: string; onClick: () => void }) {
  const t = SEGMENT_TONES[tone] ?? SEGMENT_TONES.all;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group min-h-11 rounded-[22px] border border-white/90 bg-white/85 p-4 text-left shadow-[0_16px_45px_-30px_rgba(79,70,229,.4)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 ${t.ring}`}
    >
      <div className="flex items-center gap-2.5">
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md transition-transform duration-300 group-hover:scale-110 ${t.tile}`}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <span className="text-sm font-extrabold tracking-tight text-stone-900">{title}</span>
        <ChevronRight className="ml-auto size-4 shrink-0 text-stone-400 transition group-hover:translate-x-0.5 group-hover:text-violet-600" aria-hidden="true" />
      </div>
      <p className="mt-2 text-xs font-medium leading-5 text-stone-600">{description}</p>
    </button>
  );
}

function Filters({ filters, onChange }: { filters: MemberFilters; onChange: (next: MemberFilters) => void }) {
  const tagsQuery = useMemberTags();
  const [open, setOpen] = React.useState(false);
  const active = Boolean(filters.status?.length || filters.memberType?.length || filters.tagIds?.length || filters.joinedFrom || filters.joinedTo);
  const toggle = <T,>(key: "status" | "memberType", value: T) => {
    const current = (filters[key] ?? []) as T[];
    const next = current.includes(value) ? current.filter((x) => x !== value) : [...current, value];
    onChange({ ...filters, [key]: next.length ? next : undefined, page: 1 });
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="min-h-11 gap-1.5 rounded-xl border-violet-200/70 bg-white/80 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">
          <Filter className="size-3.5" aria-hidden="true" /> Filters {active && <span className="flex size-4 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-[10px] font-black text-white">!</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="border-white/90 bg-white/95 backdrop-blur-xl sm:max-w-lg">
        <DialogHeader><DialogTitle className="font-serif text-xl tracking-tight">Member intelligence filters</DialogTitle></DialogHeader>
        <div className="space-y-5">
          <div><p className="mb-2 text-sm font-bold text-stone-900">Status</p><div className="flex flex-wrap gap-2">{STATUS_OPTIONS.map((s) => <Button key={s} variant={filters.status?.includes(s) ? "default" : "outline"} size="sm" className="min-h-11 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600" onClick={() => toggle("status", s)}>{s}</Button>)}</div></div>
          <div><p className="mb-2 text-sm font-bold text-stone-900">Member Type</p><div className="flex flex-wrap gap-2">{TYPE_OPTIONS.map((t) => <Button key={t} variant={filters.memberType?.includes(t) ? "default" : "outline"} size="sm" className="min-h-11 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600" onClick={() => toggle("memberType", t)}>{t}</Button>)}</div></div>
          {tagsQuery.data?.length ? <div><p className="mb-2 text-sm font-bold text-stone-900">Tags</p><div className="flex flex-wrap gap-2">{tagsQuery.data.map((tag) => { const selected = filters.tagIds?.includes(tag.id); return <Button key={tag.id} variant={selected ? "default" : "outline"} size="sm" className="min-h-11 rounded-xl" onClick={() => { const current = filters.tagIds ?? []; const next = selected ? current.filter((id) => id !== tag.id) : [...current, tag.id]; onChange({ ...filters, tagIds: next.length ? next : undefined, page: 1 }); }} style={{ borderColor: tag.color, color: selected ? "white" : tag.color, backgroundColor: selected ? tag.color : "transparent" }}>{tag.name}</Button>; })}</div></div> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-bold text-stone-900">Joined from<input type="date" className="mt-2 flex h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-violet-600" value={filters.joinedFrom ?? ""} onChange={(e) => onChange({ ...filters, joinedFrom: e.target.value || undefined, page: 1 })} /></label>
            <label className="text-sm font-bold text-stone-900">Joined to<input type="date" className="mt-2 flex h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-violet-600" value={filters.joinedTo ?? ""} onChange={(e) => onChange({ ...filters, joinedTo: e.target.value || undefined, page: 1 })} /></label>
          </div>
        </div>
        <DialogFooter><Button variant="ghost" className="min-h-11 rounded-xl" onClick={() => onChange({ page: 1, search: filters.search })}>Clear all</Button><Button className="min-h-11 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600" onClick={() => setOpen(false)}>Apply filters</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BulkBar({ selected, clear }: { selected: string[]; clear: () => void }) {
  const [statusOpen, setStatusOpen] = React.useState(false);
  const [tagOpen, setTagOpen] = React.useState(false);
  const [status, setStatus] = React.useState<MemberStatus | null>(null);
  const [tagIds, setTagIds] = React.useState<string[]>([]);
  const tags = useMemberTags();
  const bulkStatus = useBulkStatusChange();
  const bulkTags = useBulkTagAssignment();
  const bulkExport = useBulkExport();
  async function applyStatus() { if (!status) return; try { const r = await bulkStatus.mutateAsync({ memberIds: selected, status }); toast.success(`Updated ${r.updated} members`); setStatusOpen(false); clear(); } catch (e) { toast.error(e instanceof ApiError ? e.message : "Failed to update status"); } }
  async function applyTags() { try { const r = await bulkTags.mutateAsync({ memberIds: selected, tagIds }); toast.success(`Tagged ${r.assigned} members`); setTagOpen(false); clear(); } catch (e) { toast.error(e instanceof ApiError ? e.message : "Failed to assign tags"); } }
  async function exportMembers() { try { const r = await bulkExport.mutateAsync({ memberIds: selected }); const headers = ["memberCode","firstName","lastName","email","phone","status","memberType","branch","trainer","joinedAt","tags"]; const rows = r.members.map((m: Record<string,string>) => headers.map((h) => m[h] ?? "")); const csv = [headers, ...rows].map((row) => row.map((v) => `"${String(v).replaceAll('"','""')}"`).join(",")).join("\n"); const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); const a = document.createElement("a"); a.href = url; a.download = "members-export.csv"; a.click(); URL.revokeObjectURL(url); toast.success(`Exported ${r.total} members`); } catch (e) { toast.error(e instanceof ApiError ? e.message : "Failed to export"); } }
  return (
    <div className="sticky top-3 z-20 flex flex-wrap items-center gap-2 rounded-[22px] border border-violet-200/70 bg-gradient-to-r from-violet-50/90 via-white/95 to-cyan-50/90 p-3 shadow-xl backdrop-blur-xl">
      <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1.5 text-xs font-black text-white shadow-md shadow-fuchsia-500/20 tabular-nums">{selected.length} selected</span>
      <div className="ml-auto flex flex-wrap gap-2">
        <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
          <DialogTrigger asChild><Button size="sm" variant="outline" className="min-h-11 rounded-xl bg-white/80"><SquareCheckBig className="mr-1.5 size-3.5" aria-hidden="true" /> Status</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Change status</DialogTitle></DialogHeader><div className="flex flex-wrap gap-2">{STATUS_OPTIONS.map((s) => <Button key={s} variant={status === s ? "default" : "outline"} size="sm" className="min-h-11 rounded-xl" onClick={() => setStatus(s)}>{s}</Button>)}</div><DialogFooter><Button variant="outline" className="min-h-11 rounded-xl" onClick={() => setStatusOpen(false)}>Cancel</Button><Button className="min-h-11 rounded-xl" disabled={!status || bulkStatus.isPending} onClick={applyStatus}>{bulkStatus.isPending ? "Applying..." : "Apply"}</Button></DialogFooter></DialogContent>
        </Dialog>
        <Dialog open={tagOpen} onOpenChange={setTagOpen}>
          <DialogTrigger asChild><Button size="sm" variant="outline" className="min-h-11 rounded-xl bg-white/80"><Tag className="mr-1.5 size-3.5" aria-hidden="true" /> Tags</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Assign tags</DialogTitle></DialogHeader><div className="flex flex-wrap gap-2">{tags.data?.map((tag) => { const on = tagIds.includes(tag.id); return <Button key={tag.id} size="sm" variant={on ? "default" : "outline"} className="min-h-11 rounded-xl" onClick={() => setTagIds(on ? tagIds.filter((id) => id !== tag.id) : [...tagIds, tag.id])} style={{ borderColor: tag.color, backgroundColor: on ? tag.color : "transparent", color: on ? "white" : tag.color }}>{tag.name}</Button>; })}</div><DialogFooter><Button variant="outline" className="min-h-11 rounded-xl" onClick={() => setTagOpen(false)}>Cancel</Button><Button className="min-h-11 rounded-xl" disabled={bulkTags.isPending} onClick={applyTags}>{bulkTags.isPending ? "Applying..." : "Apply"}</Button></DialogFooter></DialogContent>
        </Dialog>
        <Button size="sm" variant="outline" className="min-h-11 rounded-xl bg-white/80" onClick={exportMembers} disabled={bulkExport.isPending}><Download className="mr-1.5 size-3.5" aria-hidden="true" /> {bulkExport.isPending ? "Exporting..." : "Export"}</Button>
        <Button size="icon" variant="ghost" className="min-h-11 min-w-11 rounded-xl" onClick={clear} aria-label="Clear selection"><X className="size-4" aria-hidden="true" /></Button>
      </div>
    </div>
  );
}

const columns: ColumnDef<Member>[] = [
  { id: "select", header: ({ table }) => <Checkbox checked={table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? "indeterminate" : false} onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)} aria-label="Select all" />, cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} aria-label="Select member" />, size: 42 },
  { header: "Member", accessorKey: "firstName", cell: ({ row }) => <div className="flex items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-md shadow-violet-500/25"><UserRound className="size-4" aria-hidden="true" /></span><div className="min-w-0"><span className="block truncate font-bold text-stone-900">{row.original.firstName} {row.original.lastName}</span><span className="font-mono text-[11px] font-medium text-stone-600 tabular-nums">{row.original.memberCode}</span></div></div> },
  { header: "Contact", accessorKey: "email", cell: ({ row }) => <div className="text-sm"><span className="block font-medium text-stone-900">{row.original.email ?? "—"}</span><span className="text-xs font-medium text-stone-600 tabular-nums">{row.original.phone ?? ""}</span></div> },
  { header: "Branch", accessorKey: "primaryBranch", cell: ({ row }) => <span className="text-sm font-semibold text-stone-700">{row.original.primaryBranch?.name ?? "—"}</span> },
  { header: "Status", accessorKey: "status", cell: ({ row }) => <Badge variant={statusVariant[row.original.status]} className={`rounded-full px-2.5 py-1 text-[10px] font-black tracking-wide ring-1 ${STATUS_PILL[row.original.status]}`}>{row.original.status}</Badge> },
  { header: "Type", accessorKey: "memberType", cell: ({ row }) => <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-[10px] font-black tracking-wide text-violet-700 ring-1 ring-violet-200/60">{row.original.memberType}</span> },
];

export default function MembersPage() {
  const router = useRouter();
  const [filters, setFilters] = React.useState<MemberFilters>({ page: 1, pageSize: 25, orderBy: "createdAt", order: "desc" });
  const [selection, setSelection] = React.useState<RowSelectionState>({});
  const members = useMembers(filters);
  const items = members.data?.items ?? [];
  const total = members.data?.total ?? 0;
  const active = items.filter((m) => m.status === "ACTIVE").length;
  const inactive = items.filter((m) => m.status === "INACTIVE").length;
  const frozen = items.filter((m) => m.status === "FROZEN").length;
  const expired = items.filter((m) => m.status === "EXPIRED").length;
  const selectedIds = Object.entries(selection).filter(([, value]) => value).map(([id]) => items[Number(id)]?.id).filter((id): id is string => Boolean(id));
  const setSearch = (search: string) => setFilters((f) => ({ ...f, search: search || undefined, page: 1 }));
  const setSegment = (segment: "all" | "active" | "inactive" | "frozen" | "expired" | "pt") => setFilters((f) => ({ ...f, page: 1, status: segment === "all" || segment === "pt" ? undefined : [segment.toUpperCase() as MemberStatus], memberType: segment === "pt" ? ["PT", "GYM_PT"] : undefined }));

  return (
    <div className="relative -mx-2 min-h-full overflow-hidden pb-12 sm:-mx-3 lg:-mx-5">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_5%_2%,rgba(6,182,212,.13),transparent_19%),radial-gradient(circle_at_96%_4%,rgba(99,102,241,.15),transparent_22%),radial-gradient(circle_at_70%_38%,rgba(217,70,239,.10),transparent_25%),radial-gradient(circle_at_12%_72%,rgba(16,185,129,.08),transparent_24%)]"
        aria-hidden="true"
      />
      <div className="mx-auto flex max-w-[1680px] flex-col gap-8 px-2 sm:px-4 lg:px-6">
        <section aria-labelledby="members-title" className="relative overflow-hidden rounded-[34px] border border-white/90 bg-white/88 p-6 shadow-[0_35px_110px_-48px_rgba(79,70,229,.48)] backdrop-blur-2xl sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -left-24 -top-32 size-80 rounded-full bg-violet-300/30 blur-3xl motion-safe:animate-blob" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-28 -top-24 size-96 rounded-full bg-cyan-300/30 blur-3xl motion-safe:animate-blob motion-safe:[animation-delay:2.5s]" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-40 left-[35%] size-96 rounded-full bg-fuchsia-300/20 blur-3xl motion-safe:animate-pulse-slow" aria-hidden="true" />
          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-200/70 bg-white/75 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em] text-violet-700">
                <Sparkles className="size-3.5" aria-hidden="true" /> Member OS · Command Center
              </p>
              <h1 id="members-title" className="font-serif text-4xl font-semibold tracking-[-.045em] text-stone-950 sm:text-5xl lg:text-6xl">Members, in context.</h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-stone-600">One operational surface for every member, signal, segment and action — while keeping the complete existing Member OS workflow intact.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="min-h-11 rounded-2xl border-stone-200/80 bg-white/80 px-5 font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600" onClick={() => document.getElementById("member-table")?.scrollIntoView({ behavior: "smooth" })}>
                <Search className="mr-2 size-4" aria-hidden="true" /> Explore members
              </Button>
              <Button className="min-h-11 rounded-2xl bg-[linear-gradient(105deg,#4338ca,#7c3aed_52%,#c026d3)] px-5 font-extrabold text-white shadow-lg shadow-violet-500/25 transition duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600" onClick={() => router.push("/members/new")}>
                <Plus className="mr-2 size-4" aria-hidden="true" /> Add member
              </Button>
            </div>
          </div>
        </section>

        <section aria-labelledby="members-pulse" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="mb-4 px-1">
            <p className="text-[10px] font-black uppercase tracking-[.22em] text-violet-700">Member pulse</p>
            <h2 id="members-pulse" className="mt-1 font-serif text-2xl font-semibold tracking-tight text-stone-950 sm:text-[28px]">Today at a glance</h2>
            <p className="mt-1 text-xs font-medium text-stone-600">Live directory health — each number owns one color.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric icon={Users} label="Total members" value={members.isLoading ? "—" : total} hint="Complete member directory" tone="violet" />
            <Metric icon={CheckCircle2} label="Active" value={members.isLoading ? "—" : active} hint="On current page" tone="emerald" />
            <Metric icon={AlertTriangle} label="Attention signals" value={members.isLoading ? "—" : inactive + frozen + expired} hint="Inactive, frozen or expired" tone="amber" />
            <Metric icon={Sparkles} label="PT members" value={members.isLoading ? "—" : items.filter((m) => m.memberType !== "GYM").length} hint="PT + hybrid members" tone="cyan" />
          </div>
        </section>

        <section aria-labelledby="members-segments" className="animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-delay:100ms]">
          <div className="mb-4 px-1">
            <p className="text-[10px] font-black uppercase tracking-[.22em] text-violet-700">Smart segments</p>
            <h2 id="members-segments" className="mt-1 font-serif text-2xl font-semibold tracking-tight text-stone-950">Go from signal to cohort</h2>
            <p className="mt-1 text-xs font-medium text-stone-600">One tap filters the directory below.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Segment title="All members" description="Full operational directory." icon={Users} tone="all" onClick={() => setSegment("all")} />
            <Segment title="Active" description="Currently active members." icon={CheckCircle2} tone="active" onClick={() => setSegment("active")} />
            <Segment title="Inactive" description="Members needing re-engagement." icon={AlertTriangle} tone="inactive" onClick={() => setSegment("inactive")} />
            <Segment title="Frozen" description="Paused memberships." icon={CalendarClock} tone="frozen" onClick={() => setSegment("frozen")} />
            <Segment title="Expired" description="Membership lifecycle attention." icon={Wallet} tone="expired" onClick={() => setSegment("expired")} />
            <Segment title="PT clients" description="Personal-training cohort." icon={Sparkles} tone="pt" onClick={() => setSegment("pt")} />
          </div>
        </section>

        <section id="member-table" aria-labelledby="members-directory" className="scroll-mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-delay:150ms]">
          <Card className="overflow-hidden rounded-[28px] border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl">
            <CardHeader className="border-b border-stone-100/80 bg-gradient-to-r from-violet-50/90 via-white to-cyan-50/70 px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-500/25">
                    <Users className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <CardTitle id="members-directory" className="font-serif text-2xl font-semibold tracking-tight text-stone-950">Member directory</CardTitle>
                    <p className="mt-0.5 text-xs font-medium text-stone-600">Search, filter, select, export and open Member 360 without leaving the command surface.</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Filters filters={filters} onChange={setFilters} />
                  <Button variant="outline" size="sm" className="min-h-11 rounded-xl bg-white/80" onClick={() => router.push("/members/new")}><Plus className="mr-1.5 size-3.5" aria-hidden="true" /> Add</Button>
                  <Button variant="outline" size="sm" className="min-h-11 rounded-xl bg-white/80" onClick={() => toast.info("Use the existing member import workflow to upload members.")}><Upload className="mr-1.5 size-3.5" aria-hidden="true" /> Import</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              {selectedIds.length ? <div className="mb-4"><BulkBar selected={selectedIds} clear={() => setSelection({})} /></div> : null}
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" aria-hidden="true" />
                  <label htmlFor="member-search" className="sr-only">Search members</label>
                  <input
                    id="member-search"
                    value={filters.search ?? ""}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, member code, email or phone..."
                    className="h-11 w-full rounded-2xl border border-stone-200/80 bg-white/80 pl-10 pr-4 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
                  />
                </div>
                {filters.search ? <Button variant="ghost" size="icon" className="min-h-11 min-w-11 rounded-xl" onClick={() => setSearch("")} aria-label="Clear search"><X className="size-4" aria-hidden="true" /></Button> : null}
              </div>
              <DataTable
                columns={columns}
                data={members.data}
                isLoading={members.isLoading}
                isError={members.isError}
                onRetry={() => void members.refetch()}
                onRowClick={(member) => router.push(`/members/${member.id}`)}
                page={filters.page}
                onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
                rowSelection={selection}
                onRowSelectionChange={setSelection}
                emptyTitle="No members found"
                emptyDescription="Try another search or filter, or add a new member."
                emptyAction={<Button className="min-h-11 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600" onClick={() => router.push("/members/new")}><Plus className="mr-2 size-4" aria-hidden="true" /> Add member</Button>}
              />
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="members-workflow" className="grid animate-in fade-in slide-in-from-bottom-2 gap-5 duration-500 [animation-delay:200ms] lg:grid-cols-[1.25fr_.75fr]">
          <Card className="overflow-hidden rounded-[28px] border-white/90 bg-white/88 backdrop-blur-xl">
            <CardHeader className="border-b border-stone-100/80 bg-gradient-to-r from-white via-violet-50/50 to-cyan-50/50">
              <CardTitle className="font-serif text-xl tracking-tight text-stone-950">Member OS workflow</CardTitle>
              <p className="mt-0.5 text-xs font-medium text-stone-600">Nothing is hidden behind the redesign — the command surface simply makes the existing workflows easier to reach.</p>
            </CardHeader>
            <CardContent className="grid gap-3 p-5 sm:grid-cols-2">
              <div className="rounded-[20px] border border-cyan-100/70 bg-gradient-to-br from-cyan-50/80 to-white p-4"><p className="text-[10px] font-black uppercase tracking-[.16em] text-cyan-700">Directory</p><p className="mt-1 text-sm font-bold text-stone-900">Search · filters · tags · status · types</p></div>
              <div className="rounded-[20px] border border-violet-100/70 bg-gradient-to-br from-violet-50/80 to-white p-4"><p className="text-[10px] font-black uppercase tracking-[.16em] text-violet-700">Member 360</p><p className="mt-1 text-sm font-bold text-stone-900">Open any member for the full profile workspace</p></div>
              <div className="rounded-[20px] border border-amber-100/70 bg-gradient-to-br from-amber-50/80 to-white p-4"><p className="text-[10px] font-black uppercase tracking-[.16em] text-amber-800">Operations</p><p className="mt-1 text-sm font-bold text-stone-900">Bulk status · bulk tags · export</p></div>
              <div className="rounded-[20px] border border-emerald-100/70 bg-gradient-to-br from-emerald-50/80 to-white p-4"><p className="text-[10px] font-black uppercase tracking-[.16em] text-emerald-700">Lifecycle</p><p className="mt-1 text-sm font-bold text-stone-900">Active · inactive · frozen · expired</p></div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden rounded-[28px] border-0 bg-[linear-gradient(145deg,#2e1065,#6d28d9_45%,#0e7490)] text-white shadow-[0_28px_75px_-38px_rgba(79,70,229,.78)]">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="flex items-center gap-3 font-serif text-xl"><span className="flex size-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20"><Sparkles className="size-5" aria-hidden="true" /></span> Member intelligence</CardTitle>
              <p className="mt-1 text-xs font-medium text-white/65">The redesigned shell is ready for the Risk → Analytics → Churn → AI Insights → Actions pipeline.</p>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="rounded-[20px] border border-white/15 bg-white/10 p-4 backdrop-blur">
                <p className="text-[10px] font-black uppercase tracking-[.16em] text-white/60">Next-best action</p>
                <p className="mt-1 text-sm font-bold">Open a member to inspect their complete operational context and available actions.</p>
              </div>
              <Button variant="secondary" className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-white font-extrabold text-indigo-950 hover:bg-white/90" onClick={() => router.push("/intelligence")}>
                <span>Open Intelligence</span><ArrowRight className="ml-2 size-4" aria-hidden="true" />
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

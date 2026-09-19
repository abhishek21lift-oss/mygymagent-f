"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
 AlertTriangle,
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
import { PageHero } from "@/components/shared/page-hero";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/shared/stat-card";
import { useMemberMetrics, useMembers, type MemberFilters } from "@/lib/hooks/use-members";
import { useMemberTags } from "@/lib/hooks/use-member-tags";
import { useBulkStatusChange, useBulkTagAssignment, useBulkExport } from "@/lib/hooks/use-bulk-member-actions";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import type { Member, MemberStatus, MemberType } from "@/lib/types/gym";

const STATUS_OPTIONS: MemberStatus[] = ["ACTIVE", "INACTIVE", "FROZEN", "EXPIRED"];
const TYPE_OPTIONS: MemberType[] = ["GYM", "PT", "GYM_PT"];
const statusVariant: Record<MemberStatus, "success" | "warning" | "secondary" | "destructive"> = {
 ACTIVE: "success",
 INACTIVE: "warning",
 FROZEN: "secondary",
 EXPIRED: "destructive",
};

function Metric({ icon: Icon, label, value, tone }: { icon: typeof Users; label: string; value: React.ReactNode; tone: "primary" | "success" | "warning" | "destructive" }) {
 const numeric = typeof value === "number" ? value : undefined;
 return (
  <StatCard
   icon={Icon}
   title={label}
   value={numeric ?? (typeof value === "string" ? value : undefined)}
   isLoading={value === "—"}
   tone={tone}
  />
 );
}

function Segment({ title, description, icon: Icon, onClick }: { title: string; description: string; icon: typeof Users; tone: string; onClick: () => void }) {
  return (
   <Button
    type="button"
    variant="outline"
    onClick={onClick}
    className="h-auto min-h-11 w-full flex-col items-stretch justify-start rounded-lg p-4 text-left text-sm font-normal whitespace-normal"
   >
    <span className="flex items-center gap-2.5">
     <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
      <Icon className="size-4" aria-hidden="true" />
     </span>
     <span className="text-sm font-semibold tracking-tight">{title}</span>
     <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </span>
    <span className="mt-2 block text-xs leading-5 text-muted-foreground">{description}</span>
   </Button>
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
    <Button variant="outline" size="sm" className="min-h-11 gap-1.5">
     <Filter className="size-3.5" aria-hidden="true" /> Filters {active && <Badge className="px-1.5 text-xs">•</Badge>}
    </Button>
   </DialogTrigger>
   <DialogContent className="sm:max-w-lg">
    <DialogHeader><DialogTitle>Member filters</DialogTitle><DialogDescription>Filter the directory by status, type, tags, or join date.</DialogDescription></DialogHeader>
    <div className="space-y-5">
     <div><p className="mb-2 text-sm font-medium">Status</p><div className="flex flex-wrap gap-2">{STATUS_OPTIONS.map((s) => <Button key={s} variant={filters.status?.includes(s) ? "default" : "outline"} size="sm" className="min-h-10" onClick={() => toggle("status", s)}>{s}</Button>)}</div></div>
     <div><p className="mb-2 text-sm font-medium">Member Type</p><div className="flex flex-wrap gap-2">{TYPE_OPTIONS.map((t) => <Button key={t} variant={filters.memberType?.includes(t) ? "default" : "outline"} size="sm" className="min-h-10" onClick={() => toggle("memberType", t)}>{t}</Button>)}</div></div>
     {tagsQuery.data?.length ? <div><p className="mb-2 text-sm font-medium">Tags</p><div className="flex flex-wrap gap-2">{tagsQuery.data.map((tag) => { const selected = filters.tagIds?.includes(tag.id); return <Button key={tag.id} variant={selected ? "default" : "outline"} size="sm" className="min-h-10" onClick={() => { const current = filters.tagIds ?? []; const next = selected ? current.filter((id) => id !== tag.id) : [...current, tag.id]; onChange({ ...filters, tagIds: next.length ? next : undefined, page: 1 }); }}>{tag.name}</Button>; })}</div></div> : null}
     <div className="grid gap-3 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5"><label htmlFor="joined-from" className="text-sm font-medium">Joined from</label><Input id="joined-from" type="date" className="h-11" value={filters.joinedFrom ?? ""} onChange={(e) => onChange({ ...filters, joinedFrom: e.target.value || undefined, page: 1 })} /></div>
      <div className="flex flex-col gap-1.5"><label htmlFor="joined-to" className="text-sm font-medium">Joined to</label><Input id="joined-to" type="date" className="h-11" value={filters.joinedTo ?? ""} onChange={(e) => onChange({ ...filters, joinedTo: e.target.value || undefined, page: 1 })} /></div>
     </div>
    </div>
    <DialogFooter><Button variant="ghost" className="min-h-10" onClick={() => onChange({ page: 1, search: filters.search })}>Clear all</Button><Button className="min-h-10" onClick={() => setOpen(false)}>Apply filters</Button></DialogFooter>
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
  <div className="sticky top-3 z-20 flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3 shadow-md" role="toolbar" aria-label={`${selected.length} members selected`}>
   <Badge className="tabular-nums">{selected.length} selected</Badge>
   <div className="ml-auto flex flex-wrap gap-2">
    <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
     <DialogTrigger asChild><Button size="sm" variant="outline" className="min-h-10"><SquareCheckBig className="mr-1.5 size-3.5" aria-hidden="true" /> Status</Button></DialogTrigger>
     <DialogContent><DialogHeader><DialogTitle>Change status</DialogTitle><DialogDescription>Apply a new status to all selected members.</DialogDescription></DialogHeader><div className="flex flex-wrap gap-2">{STATUS_OPTIONS.map((s) => <Button key={s} variant={status === s ? "default" : "outline"} size="sm" className="min-h-10" onClick={() => setStatus(s)}>{s}</Button>)}</div><DialogFooter><Button variant="outline" className="min-h-10" onClick={() => setStatusOpen(false)}>Cancel</Button><Button className="min-h-10" disabled={!status || bulkStatus.isPending} aria-busy={bulkStatus.isPending} onClick={applyStatus}>{bulkStatus.isPending ? "Applying..." : "Apply"}</Button></DialogFooter></DialogContent>
    </Dialog>
    <Dialog open={tagOpen} onOpenChange={setTagOpen}>
     <DialogTrigger asChild><Button size="sm" variant="outline" className="min-h-10"><Tag className="mr-1.5 size-3.5" aria-hidden="true" /> Tags</Button></DialogTrigger>
     <DialogContent><DialogHeader><DialogTitle>Assign tags</DialogTitle><DialogDescription>Tags will be added to all selected members.</DialogDescription></DialogHeader><div className="flex flex-wrap gap-2">{tags.data?.map((tag) => { const on = tagIds.includes(tag.id); return <Button key={tag.id} size="sm" variant={on ? "default" : "outline"} className="min-h-10" onClick={() => setTagIds(on ? tagIds.filter((id) => id !== tag.id) : [...tagIds, tag.id])}>{tag.name}</Button>; })}</div><DialogFooter><Button variant="outline" className="min-h-10" onClick={() => setTagOpen(false)}>Cancel</Button><Button className="min-h-10" disabled={bulkTags.isPending} aria-busy={bulkTags.isPending} onClick={applyTags}>{bulkTags.isPending ? "Applying..." : "Apply"}</Button></DialogFooter></DialogContent>
    </Dialog>
    <Button size="sm" variant="outline" className="min-h-10" onClick={exportMembers} disabled={bulkExport.isPending} aria-busy={bulkExport.isPending}><Download className="mr-1.5 size-3.5" aria-hidden="true" /> {bulkExport.isPending ? "Exporting..." : "Export"}</Button>
    <Button size="icon" variant="ghost" className="min-h-10 min-w-10" onClick={clear} aria-label="Clear selection"><X className="size-4" aria-hidden="true" /></Button>
   </div>
  </div>
 );
}

const columns: ColumnDef<Member>[] = [
 { id: "select", header: ({ table }) => <Checkbox checked={table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? "indeterminate" : false} onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)} aria-label="Select all" />, cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} aria-label="Select member" />, size: 42 },
 { header: "Member", accessorKey: "firstName", cell: ({ row }) => <div className="flex items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><UserRound className="size-4" aria-hidden="true" /></span><div className="min-w-0"><span className="block truncate font-medium">{row.original.firstName} {row.original.lastName}</span><span className="font-mono text-xs text-muted-foreground tabular-nums">{row.original.memberCode}</span></div></div> },
 { header: "Contact", accessorKey: "email", cell: ({ row }) => <div className="text-sm"><span className="block font-medium">{row.original.email ?? "—"}</span><span className="text-xs text-muted-foreground tabular-nums">{row.original.phone ?? ""}</span></div> },
 { header: "Branch", accessorKey: "primaryBranch", cell: ({ row }) => <span className="text-sm">{row.original.primaryBranch?.name ?? "—"}</span> },
 { header: "Status", accessorKey: "status", cell: ({ row }) => <Badge variant={statusVariant[row.original.status]}>{row.original.status}</Badge> },
 { header: "Type", accessorKey: "memberType", cell: ({ row }) => row.original.memberType ? <Badge variant="secondary">{row.original.memberType}</Badge> : <span className="text-sm text-muted-foreground">—</span> },
];

export default function MembersPage() {
 const router = useRouter();
 const [filters, setFilters] = React.useState<MemberFilters>({ page: 1, pageSize: 25, orderBy: "createdAt", order: "desc" });
 const [selection, setSelection] = React.useState<RowSelectionState>({});
 const members = useMembers(filters);
 const metrics = useMemberMetrics();
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
  <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-6 pb-8">
    <PageHero
     id="members-title"
     icon={Users}
     title="Members"
     variant="light"
     accent="indigo"
     actions={
      <>
       <Button variant="outline" className="min-h-10" onClick={() => document.getElementById("member-table")?.scrollIntoView()}>
        <Search className="mr-2 size-4" aria-hidden="true" /> Explore
       </Button>
       <Button className="min-h-10" onClick={() => router.push("/members/new")}>
        <Plus className="mr-2 size-4" aria-hidden="true" /> Add member
       </Button>
      </>
     }
    />

    <section aria-labelledby="members-pulse">
     <h2 id="members-pulse" className="mb-3 text-xl font-semibold tracking-tight">Overview</h2>
     <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={Users} label="Total members" value={metrics.isLoading ? "—" : metrics.data?.total ?? 0} tone="primary" />
      <Metric icon={CheckCircle2} label="Active" value={metrics.isLoading ? "—" : metrics.data?.active ?? 0} tone="success" />
      <Metric icon={AlertTriangle} label="Attention signals" value={metrics.isLoading ? "—" : (metrics.data?.inactive ?? 0) + (metrics.data?.frozen ?? 0) + (metrics.data?.expired ?? 0)} tone="warning" />
      <Metric icon={Sparkles} label="PT members" value={metrics.isLoading ? "—" : metrics.data?.pt ?? 0} tone="primary" />
     </div>
    </section>

    <section aria-labelledby="members-segments">
     <h2 id="members-segments" className="mb-3 text-xl font-semibold tracking-tight">Segments</h2>
     <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <Segment title="All members" description="Full operational directory." icon={Users} tone="all" onClick={() => setSegment("all")} />
      <Segment title="Active" description="Currently active members." icon={CheckCircle2} tone="active" onClick={() => setSegment("active")} />
      <Segment title="Inactive" description="Members needing re-engagement." icon={AlertTriangle} tone="inactive" onClick={() => setSegment("inactive")} />
      <Segment title="Frozen" description="Paused memberships." icon={CalendarClock} tone="frozen" onClick={() => setSegment("frozen")} />
      <Segment title="Expired" description="Membership lifecycle attention." icon={Wallet} tone="expired" onClick={() => setSegment("expired")} />
      <Segment title="PT clients" description="Personal-training cohort." icon={Sparkles} tone="pt" onClick={() => setSegment("pt")} />
     </div>
    </section>

    <section id="member-table" aria-labelledby="members-directory" className="scroll-mt-6">
     <Card className="overflow-hidden">
      <CardHeader className="border-b px-5 py-4 sm:px-6">
       <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
         <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Users className="size-5" aria-hidden="true" />
         </span>
         <CardTitle id="members-directory" className="text-lg">Member directory</CardTitle>
        </div>
        <div className="flex flex-wrap items-center gap-2">
         <Filters filters={filters} onChange={setFilters} />
         <Button variant="outline" size="sm" className="min-h-10" onClick={() => router.push("/members/new")}><Plus className="mr-1.5 size-3.5" aria-hidden="true" /> Add</Button>
         <Button variant="outline" size="sm" className="min-h-10" onClick={() => toast.info("Use the existing member import workflow to upload members.")}><Upload className="mr-1.5 size-3.5" aria-hidden="true" /> Import</Button>
        </div>
       </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-5">
       {selectedIds.length ? <div className="mb-4"><BulkBar selected={selectedIds} clear={() => setSelection({})} /></div> : null}
       <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
         <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
         <label htmlFor="member-search" className="sr-only">Search members</label>
         <Input
          id="member-search"
          value={filters.search ?? ""}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, member code, email or phone..."
          className="h-11 pl-10"
         />
        </div>
        {filters.search ? <Button variant="ghost" size="icon" className="min-h-10 min-w-10" onClick={() => setSearch("")} aria-label="Clear search"><X className="size-4" aria-hidden="true" /></Button> : null}
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
        emptyDescription="Try adjusting your search or filters."
        emptyAction={<Button className="min-h-10" onClick={() => router.push("/members/new")}><Plus className="mr-2 size-4" aria-hidden="true" /> Add member</Button>}
       />
      </CardContent>
     </Card>
    </section>
  </div>
 );
}

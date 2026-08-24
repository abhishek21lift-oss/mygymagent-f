"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronRight, Clock3, Plus, Sparkles, UserRound, Users } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useMembers } from "@/lib/hooks/use-members";
import { useAuth } from "@/lib/auth/auth-context";
import type { Member, MemberStatus } from "@/lib/types/gym";

const statusVariant: Record<MemberStatus, "default" | "secondary" | "destructive" | "warning"> = { ACTIVE: "default", INACTIVE: "secondary", FROZEN: "warning", EXPIRED: "destructive" };
const columns: ColumnDef<Member>[] = [
  { header: "Member", accessorKey: "firstName", cell: ({ row }) => <div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><UserRound className="size-4" /></span><div><span className="block font-semibold">{row.original.firstName} {row.original.lastName}</span><span className="text-xs text-muted-foreground">{row.original.memberCode}</span></div></div> },
  { header: "Contact", accessorKey: "email", cell: ({ row }) => <div className="flex flex-col text-sm"><span>{row.original.email ?? "—"}</span><span className="text-xs text-muted-foreground">{row.original.phone ?? ""}</span></div> },
  { header: "Branch", accessorKey: "primaryBranch", cell: ({ row }) => row.original.primaryBranch?.name ?? "—" },
  { header: "Status", accessorKey: "status", cell: ({ row }) => <Badge variant={statusVariant[row.original.status]}>{row.original.status}</Badge> },
];

export default function MembersPage() {
  const router = useRouter(); const { hasPermission } = useAuth(); const [page, setPage] = React.useState(1); const [search, setSearch] = React.useState(""); const [debouncedSearch, setDebouncedSearch] = React.useState("");
  React.useEffect(() => { const timeout = setTimeout(() => setDebouncedSearch(search), 300); return () => clearTimeout(timeout); }, [search]);
  const membersQuery = useMembers({ page, pageSize: 20, search: debouncedSearch || undefined }); const memberCount = membersQuery.data?.items.length ?? 0;
  return <div className="flex flex-col gap-7"><PageHeader title="Members" description="Understand your members, their lifecycle, and what needs attention." actions={hasPermission("members.create") && <Button className="rounded-xl" onClick={() => router.push("/members/new")}><Plus /> New member</Button>} /><section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/[0.09] via-card to-card p-6 shadow-sm"><div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-primary/10 blur-3xl"/><div className="relative grid gap-5 lg:grid-cols-[1.5fr_1fr] lg:items-end"><div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/70 px-3 py-1.5 text-xs font-semibold text-primary"><Sparkles className="size-3.5"/> Member intelligence</div><h2 className="text-2xl font-semibold tracking-tight">Your member base, in context.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Search members quickly, then open Member 360 for membership, engagement, training and AI insights.</p></div><div className="grid grid-cols-3 gap-2"><MiniMetric icon={Users} label="Showing" value={memberCount}/><MiniMetric icon={AlertTriangle} label="At risk" value="—"/><MiniMetric icon={Clock3} label="Expiring" value="—"/></div></div></section><section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Segment href="/members" title="All members" description="Browse the complete member base." icon={Users}/><Segment href="/members" title="At risk" description="Members whose engagement is falling." icon={AlertTriangle}/><Segment href="/members" title="Expiring soon" description="Prioritize upcoming renewals." icon={Clock3}/><Segment href="/ai" title="Ask AI" description="Find high-value or inactive members." icon={Sparkles}/></section><Card className="overflow-hidden border-0 shadow-sm ring-1 ring-border/70"><CardContent className="p-0"><DataTable columns={columns} data={membersQuery.data?.items ?? []} isLoading={membersQuery.isLoading} isError={membersQuery.isError} onRetry={() => membersQuery.refetch()} onRowClick={(member) => router.push(`/members/${member.id}`)} page={page} onPageChange={setPage} search={search} onSearchChange={(value) => { setSearch(value); setPage(1); }} searchPlaceholder="Search by name, email, phone, or member code..." emptyTitle="No members yet" emptyDescription="Add your first member to get started." emptyAction={hasPermission("members.create") ? <Button size="sm" onClick={() => router.push("/members/new")}><UserRound /> Add a member</Button> : undefined}/></CardContent></Card></div>;
}
function MiniMetric({icon:Icon,label,value}:{icon:typeof Users;label:string;value:string|number}){return <div className="rounded-2xl border bg-background/60 p-3 backdrop-blur"><Icon className="size-4 text-primary"/><p className="mt-2 text-lg font-semibold tabular-nums">{value}</p><p className="text-[11px] text-muted-foreground">{label}</p></div>}
function Segment({href,title,description,icon:Icon}:{href:string;title:string;description:string;icon:typeof Users}){return <a href={href} className="group rounded-2xl border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-sm"><div className="flex items-center gap-2"><span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-4"/></span><span className="text-sm font-semibold">{title}</span><ChevronRight className="ml-auto size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary"/></div><p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p></a>}

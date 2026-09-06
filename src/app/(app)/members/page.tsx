"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Clock3,
  Filter,
  Plus,
  Sparkles,
  SquareCheckBig,
  Tag,
  Upload,
  UserRound,
  Users,
  X,
} from "lucide-react";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMembers, MemberFilters } from "@/lib/hooks/use-members";
import { useAuth } from "@/lib/auth/auth-context";
import { useMemberTags } from "@/lib/hooks/use-member-tags";
import { useBulkStatusChange, useBulkTagAssignment, useBulkExport } from "@/lib/hooks/use-bulk-member-actions";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import type { Member, MemberStatus, MemberType } from "@/lib/types/gym";

const statusVariant: Record<MemberStatus, "default" | "secondary" | "destructive" | "warning"> = {
  ACTIVE: "default",
  INACTIVE: "secondary",
  FROZEN: "warning",
  EXPIRED: "destructive",
};

const STATUS_OPTIONS: MemberStatus[] = ["ACTIVE", "INACTIVE", "FROZEN", "EXPIRED"];
const TYPE_OPTIONS: MemberType[] = ["GYM", "PT", "GYM_PT"];

const columns: ColumnDef<Member>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected()
            ? true
            : table.getIsSomePageRowsSelected()
              ? "indeterminate"
              : false
        }
        onCheckedChange={(val) => table.toggleAllPageRowsSelected(!!val)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(val) => row.toggleSelected(!!val)}
        aria-label="Select row"
      />
    ),
    size: 40,
  },
  {
    header: "Member",
    accessorKey: "firstName",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <UserRound className="size-4" />
        </span>
        <div>
          <span className="block font-semibold">
            {row.original.firstName} {row.original.lastName}
          </span>
          <span className="text-xs text-muted-foreground">{row.original.memberCode}</span>
        </div>
      </div>
    ),
  },
  {
    header: "Contact",
    accessorKey: "email",
    cell: ({ row }) => (
      <div className="flex flex-col text-sm">
        <span>{row.original.email ?? "—"}</span>
        <span className="text-xs text-muted-foreground">{row.original.phone ?? ""}</span>
      </div>
    ),
  },
  {
    header: "Branch",
    accessorKey: "primaryBranch",
    cell: ({ row }) => row.original.primaryBranch?.name ?? "—",
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row }) => (
      <Badge variant={statusVariant[row.original.status]}>{row.original.status}</Badge>
    ),
  },
];

function MiniMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border bg-background/60 p-3 backdrop-blur">
      <Icon className="size-4 text-primary" />
      <p className="mt-2 text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function Segment({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: typeof Users;
}) {
  return (
    <a
      href={href}
      className="group rounded-2xl border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-sm"
    >
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <span className="text-sm font-semibold">{title}</span>
        <ChevronRight className="ml-auto size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p>
    </a>
  );
}

function FilterPanel({
  filters,
  onChange,
}: {
  filters: MemberFilters;
  onChange: (f: MemberFilters) => void;
}) {
  const tagsQuery = useMemberTags();
  const [open, setOpen] = React.useState(false);

  const hasFilters =
    (filters.status && filters.status.length > 0) ||
    (filters.memberType && filters.memberType.length > 0) ||
    (filters.trainerId && filters.trainerId.length > 0) ||
    (filters.tagIds && filters.tagIds.length > 0) ||
    filters.joinedFrom ||
    filters.joinedTo;

  function toggleStatus(s: MemberStatus) {
    const current = filters.status ?? [];
    const next = current.includes(s)
      ? current.filter((x) => x !== s)
      : [...current, s];
    onChange({ ...filters, status: next.length > 0 ? next : undefined });
  }

  function toggleType(t: MemberType) {
    const current = filters.memberType ?? [];
    const next = current.includes(t)
      ? current.filter((x) => x !== t)
      : [...current, t];
    onChange({ ...filters, memberType: next.length > 0 ? next : undefined });
  }

  function clearFilters() {
    onChange({ page: 1, search: filters.search });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Filter className="size-3.5" />
          Filters
          {hasFilters && (
            <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              !
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Filter members</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-5">
          <div>
            <p className="mb-2 text-sm font-medium">Status</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((s) => {
                const active = (filters.status ?? []).includes(s);
                return (
                  <Button
                    key={s}
                    variant={active ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleStatus(s)}
                  >
                    {s}
                  </Button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Member Type</p>
            <div className="flex flex-wrap gap-2">
              {TYPE_OPTIONS.map((t) => {
                const active = (filters.memberType ?? []).includes(t);
                return (
                  <Button
                    key={t}
                    variant={active ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleType(t)}
                  >
                    {t}
                  </Button>
                );
              })}
            </div>
          </div>
          {tagsQuery.data && tagsQuery.data.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium">Tags</p>
              <div className="flex flex-wrap gap-2">
                {tagsQuery.data.map((tag) => {
                  const active = (filters.tagIds ?? []).includes(tag.id);
                  return (
                    <Button
                      key={tag.id}
                      variant={active ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const current = filters.tagIds ?? [];
                        const next = active
                          ? current.filter((id) => id !== tag.id)
                          : [...current, tag.id];
                        onChange({
                          ...filters,
                          tagIds: next.length > 0 ? next : undefined,
                        });
                      }}
                      style={{
                        backgroundColor: active ? tag.color : "transparent",
                        borderColor: tag.color,
                        color: active ? "white" : tag.color,
                      }}
                    >
                      {tag.name}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="mb-2 text-sm font-medium">Joined from</p>
              <input
                type="date"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={filters.joinedFrom ?? ""}
                onChange={(e) =>
                  onChange({ ...filters, joinedFrom: e.target.value || undefined })
                }
              />
            </div>
            <div className="flex-1">
              <p className="mb-2 text-sm font-medium">Joined to</p>
              <input
                type="date"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={filters.joinedTo ?? ""}
                onChange={(e) =>
                  onChange({ ...filters, joinedTo: e.target.value || undefined })
                }
              />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear all
            </Button>
          )}
          <Button size="sm" onClick={() => setOpen(false)}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BulkActionsBar({
  selected,
  onClear,
}: {
  selected: string[];
  onClear: () => void;
}) {
  const [statusOpen, setStatusOpen] = React.useState(false);
  const [tagOpen, setTagOpen] = React.useState(false);
  const bulkStatus = useBulkStatusChange();
  const bulkTags = useBulkTagAssignment();
  const bulkExport = useBulkExport();
  const tagsQuery = useMemberTags();
  const [selectedStatus, setSelectedStatus] = React.useState<MemberStatus | null>(null);
  const [selectedTagIds, setSelectedTagIds] = React.useState<string[]>([]);

  async function handleStatusChange() {
    if (!selectedStatus) return;
    try {
      const result = await bulkStatus.mutateAsync({
        memberIds: selected,
        status: selectedStatus,
      });
      toast.success(`Updated ${result.updated} members`);
      setStatusOpen(false);
      onClear();
    } catch (err: unknown) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update status");
    }
  }

  async function handleTagAssignment() {
    try {
      const result = await bulkTags.mutateAsync({
        memberIds: selected,
        tagIds: selectedTagIds,
      });
      toast.success(`Tagged ${result.assigned} members`);
      setTagOpen(false);
      onClear();
    } catch (err: unknown) {
      toast.error(err instanceof ApiError ? err.message : "Failed to assign tags");
    }
  }

  async function handleExport() {
    try {
      const result = await bulkExport.mutateAsync({ memberIds: selected });
      const csv = [
        [
          "memberCode",
          "firstName",
          "lastName",
          "email",
          "phone",
          "status",
          "memberType",
          "branch",
          "trainer",
          "joinedAt",
          "tags",
        ],
        ...result.members.map((m: Record<string, string>) => [
          m.memberCode,
          m.firstName,
          m.lastName,
          m.email,
          m.phone,
          m.status,
          m.memberType,
          m.branch,
          m.trainer,
          m.joinedAt,
          m.tags,
        ]),
      ]
        .map((row) => row.join(","))
        .join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "members-export.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${result.total} members`);
    } catch (err: unknown) {
      toast.error(err instanceof ApiError ? err.message : "Failed to export");
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm">
      <span className="text-sm font-medium">{selected.length} selected</span>
      <div className="ml-auto flex gap-2">
        <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <SquareCheckBig className="mr-1.5 size-3.5" />
              Status
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change status</DialogTitle>
            </DialogHeader>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((s) => (
                <Button
                  key={s}
                  variant={selectedStatus === s ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStatus(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStatusOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleStatusChange}
                disabled={!selectedStatus || bulkStatus.isPending}
              >
                {bulkStatus.isPending ? "Applying..." : "Apply"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={tagOpen} onOpenChange={setTagOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Tag className="mr-1.5 size-3.5" />
              Tags
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign tags</DialogTitle>
            </DialogHeader>
            <div className="flex flex-wrap gap-2">
              {tagsQuery.data?.map((tag) => {
                const active = selectedTagIds.includes(tag.id);
                return (
                  <Button
                    key={tag.id}
                    variant={active ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedTagIds(
                        active
                          ? selectedTagIds.filter((id) => id !== tag.id)
                          : [...selectedTagIds, tag.id],
                      );
                    }}
                    style={{
                      backgroundColor: active ? tag.color : "transparent",
                      borderColor: tag.color,
                      color: active ? "white" : tag.color,
                    }}
                  >
                    {tag.name}
                  </Button>
                );
              })}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTagOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleTagAssignment} disabled={bulkTags.isPending}>
                {bulkTags.isPending ? "Applying..." : "Apply"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button size="sm" variant="outline" onClick={handleExport}>
          <Upload className="mr-1.5 size-3.5" />
          Export
        </Button>

        <Button size="sm" variant="ghost" onClick={onClear}>
          <X className="mr-1.5 size-3.5" />
          Clear
        </Button>
      </div>
    </div>
  );
}

export default function MembersPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [filters, setFilters] = React.useState<MemberFilters>({});

  React.useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const allFilters: MemberFilters = {
    ...filters,
    page,
    pageSize: 20,
    search: debouncedSearch || undefined,
  };

  const membersQuery = useMembers(allFilters);
  const memberCount = membersQuery.data?.items.length ?? 0;

  const selectedIds = Object.keys(rowSelection).filter((idx) => rowSelection[idx]);

  function handleFiltersChange(newFilters: MemberFilters) {
    setFilters(newFilters);
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        title="Members"
        description="Understand your members, their lifecycle, and what needs attention."
        actions={
          hasPermission("members.create") && (
            <Button className="rounded-xl" onClick={() => router.push("/members/new")}>
              <Plus /> New member
            </Button>
          )
        }
      />
      <section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/[0.09] via-card to-card p-6 shadow-sm">
        <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative grid gap-5 lg:grid-cols-[1.5fr_1fr] lg:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/70 px-3 py-1.5 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" /> Member intelligence
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">Your member base, in context.</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Search members quickly, then open Member 360 for membership, engagement,
              training and AI insights.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <MiniMetric icon={Users} label="Showing" value={memberCount} />
            <MiniMetric icon={AlertTriangle} label="At risk" value="—" />
            <MiniMetric icon={Clock3} label="Expiring" value="—" />
          </div>
        </div>
      </section>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Segment
          href="/members"
          title="All members"
          description="Browse the complete member base."
          icon={Users}
        />
        <Segment
          href="/members"
          title="At risk"
          description="Members whose engagement is falling."
          icon={AlertTriangle}
        />
        <Segment
          href="/members"
          title="Expiring soon"
          description="Prioritize upcoming renewals."
          icon={Clock3}
        />
        <Segment href="/ai" title="Ask AI" description="Find high-value or inactive members." icon={Sparkles} />
      </section>
      {selectedIds.length > 0 && (
        <BulkActionsBar
          selected={selectedIds}
          onClear={() => setRowSelection({})}
        />
      )}
      <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-border/70">
        <CardContent className="p-0">
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <input
              className="flex h-9 w-full max-w-sm rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <FilterPanel filters={filters} onChange={handleFiltersChange} />
          </div>
          <DataTable
            columns={columns}
            data={membersQuery.data?.items ?? []}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            isLoading={membersQuery.isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}

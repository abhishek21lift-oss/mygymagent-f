"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, UserRound } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMembers } from "@/lib/hooks/use-members";
import { useAuth } from "@/lib/auth/auth-context";
import type { Member, MemberStatus } from "@/lib/types/gym";

const statusVariant: Record<MemberStatus, "default" | "secondary" | "destructive" | "warning"> = {
  ACTIVE: "default",
  INACTIVE: "secondary",
  FROZEN: "warning",
  EXPIRED: "destructive",
};

const columns: ColumnDef<Member>[] = [
  {
    header: "Member",
    accessorKey: "firstName",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">
          {row.original.firstName} {row.original.lastName}
        </span>
        <span className="text-xs text-muted-foreground">{row.original.memberCode}</span>
      </div>
    ),
  },
  {
    header: "Contact",
    accessorKey: "email",
    cell: ({ row }) => (
      <div className="flex flex-col text-sm">
        <span>{row.original.email ?? "—"}</span>
        <span className="text-muted-foreground">{row.original.phone ?? ""}</span>
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

export default function MembersPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  React.useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const membersQuery = useMembers({ page, pageSize: 20, search: debouncedSearch || undefined });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Members"
        description="Everyone training at your gym"
        actions={
          hasPermission("members.create") && (
            <Button onClick={() => router.push("/members/new")}>
              <Plus />
              New member
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        data={membersQuery.data}
        isLoading={membersQuery.isLoading}
        isError={membersQuery.isError}
        onRetry={() => membersQuery.refetch()}
        onRowClick={(member) => router.push(`/members/${member.id}`)}
        page={page}
        onPageChange={setPage}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search by name, email, phone, or member code..."
        emptyTitle="No members yet"
        emptyDescription="Add your first member to get started."
        emptyAction={
          hasPermission("members.create") ? (
            <Button size="sm" onClick={() => router.push("/members/new")}>
              <UserRound />
              Add a member
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}

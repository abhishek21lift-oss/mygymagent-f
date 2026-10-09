"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarCheck, Dumbbell, KeyRound, MailCheck, PauseCircle, UserRoundX, Users } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/shared/data-table";
import { BentoCard, BentoGrid, SectionHeader } from "@/components/shared/bento";
import { DonutChart } from "@/components/shared/donut-chart";
import { ErrorState } from "@/components/shared/error-state";
import { StatCard } from "@/components/shared/stat-card";
import { PageHero } from "@/components/shared/page-hero";
import { useAuth } from "@/lib/auth/auth-context";
import { staffAccessState, useStaff, useStaffStats } from "@/lib/hooks/use-staff";
import type { StaffUser } from "@/lib/types/gym";
import { AddStaffDialog } from "./add-staff-dialog";
import { ManageRolesDialog } from "./manage-roles-dialog";
import { StaffRowActions } from "./staff-row-actions";
import { AccessBadge, RolePill, StaffAvatar, accentVars } from "./staff-visuals";

function useColumns(perms: {
  canUpdate: boolean;
  canInvite: boolean;
  canDeactivate: boolean;
  canManageRoles: boolean;
}): ColumnDef<StaffUser>[] {
  return React.useMemo(() => {
    const columns: ColumnDef<StaffUser>[] = [
      {
        header: "Name",
        accessorKey: "firstName",
        cell: ({ row }) => {
          const user = row.original;
          const profile = user.staffProfile;
          return (
            <div className="flex min-w-0 items-center gap-3">
              <StaffAvatar firstName={user.firstName} lastName={user.lastName} seed={user.id} />
              <div className="flex min-w-0 flex-col">
                <span className="flex items-center gap-1.5 font-semibold text-foreground [overflow-wrap:anywhere]">
                  {user.firstName} {user.lastName}
                  {profile?.isTrainer && (
                    <span style={accentVars("emerald")} title="Trainer" className="text-[var(--tone-ink)]">
                      <Dumbbell className="size-3.5" aria-hidden="true" />
                      <span className="sr-only">Trainer</span>
                    </span>
                  )}
                </span>
                <span className="text-xs text-muted-foreground [overflow-wrap:anywhere]">
                  {[profile?.jobTitle, user.email ?? user.phone].filter(Boolean).join(" · ") || "—"}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        header: "Role",
        accessorKey: "userRoles",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.userRoles.length ? (
              row.original.userRoles.map((ur) => <RolePill key={ur.id} roleKey={ur.role.key} name={ur.role.name} />)
            ) : (
              <span className="text-xs text-muted-foreground">No role</span>
            )}
          </div>
        ),
      },
      {
        header: "App access",
        accessorKey: "status",
        cell: ({ row }) => <AccessBadge state={staffAccessState(row.original)} />,
      },
    ];

    if (perms.canUpdate || perms.canInvite || perms.canDeactivate || perms.canManageRoles) {
      columns.push({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <StaffRowActions
            user={row.original}
            canUpdate={perms.canUpdate}
            canInvite={perms.canInvite}
            canDeactivate={perms.canDeactivate && row.original.status !== "DISABLED"}
            rolesSlot={perms.canManageRoles ? <ManageRolesDialog user={row.original} /> : undefined}
          />
        ),
      });
    }
    return columns;
  }, [perms.canUpdate, perms.canInvite, perms.canDeactivate, perms.canManageRoles]);
}

export default function StaffPage() {
  const { hasPermission } = useAuth();
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [query, setQuery] = React.useState("");

  // Typing shouldn't fire a request per key.
  React.useEffect(() => {
    const id = window.setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(id);
  }, [search]);

  const staffQuery = useStaff({ page, pageSize: 20, ...(query ? { search: query } : {}) });
  const stats = useStaffStats();
  const canCreate = hasPermission("users.create");
  const columns = useColumns({
    canUpdate: hasPermission("users.update"),
    canInvite: canCreate,
    canDeactivate: hasPermission("users.delete"),
    canManageRoles: hasPermission("users.manage_roles"),
  });

  const total = stats.data?.total ?? 0;
  const active = stats.data?.active ?? 0;
  const invited = stats.data?.invited ?? 0;
  const noAccess = stats.data?.noAccess ?? 0;
  const trainers = stats.data?.trainers ?? 0;
  // DISABLED / SUSPENDED accounts sit in none of the three buckets above
  // (verified against users.service stats), so the remainder is "switched off".
  const switchedOff = Math.max(0, total - active - invited - noAccess);
  const accountSegments = [
    { label: "Can sign in", value: active, color: "var(--a-emerald)" },
    { label: "Invite pending", value: invited, color: "var(--a-amber)" },
    { label: "No app access", value: noAccess, color: "var(--a-violet)" },
    { label: "Switched off", value: switchedOff, color: "var(--a-rose)" },
  ];

  return (
    <div className="pb-4">
      <div className="flex flex-col gap-5">
        <PageHero
          id="staff-title"
          icon={Users}
          title="Staff"
          actions={
            <>
              {canCreate && <AddStaffDialog />}
              <Link
                href="/attendance"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border/80 bg-card px-5 text-sm font-semibold shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transform-none"
              >
                <CalendarCheck className="size-4" aria-hidden="true" /> Attendance
              </Link>
            </>
          }
        />

        {/* ── Accounts ──────────────────────────────────────────── */}
        <section aria-label="Accounts">
          <SectionHeader title="Accounts" />
          <BentoCard>
            {stats.isLoading ? (
              <DonutChart segments={[]} isLoading size={160} />
            ) : stats.isError ? (
              <ErrorState message="Could not load account totals." onRetry={() => void stats.refetch()} />
            ) : (
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <DonutChart
                  segments={accountSegments}
                  centerValue={total.toLocaleString()}
                  centerLabel="Accounts"
                  size={160}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="kpi-icon-tile kpi-blue" aria-hidden="true">
                      <Dumbbell className="size-5" strokeWidth={2} />
                    </span>
                    <div className="min-w-0">
                      <p className="kpi-value">{trainers.toLocaleString()}</p>
                      <p className="kpi-label">Trainers</p>
                    </div>
                    {total > 0 && (
                      <span className="kpi-trend kpi-trend-neutral ml-auto shrink-0">
                        {Math.round((trainers / total) * 100)}% of accounts
                      </span>
                    )}
                  </div>
                  <p className="kpi-hint mt-3">
                    Roles are assigned per person and listed on each row below.
                  </p>
                </div>
              </div>
            )}
          </BentoCard>
        </section>

        {/* ── State ─────────────────────────────────────────────── */}
        <section aria-label="Account state">
          <SectionHeader title="State" />
          <BentoGrid columns={4} label="Accounts by sign-in state">
            <StatCard icon={KeyRound} title="Can sign in" value={stats.data?.active} hint="Password set" isLoading={stats.isLoading} isError={stats.isError} tone="primary" accent="emerald" />
            <StatCard icon={MailCheck} title="Invite pending" value={stats.data?.invited} hint="Yet to accept" isLoading={stats.isLoading} isError={stats.isError} tone="primary" accent="amber" />
            <StatCard icon={UserRoundX} title="No app access" value={stats.data?.noAccess} hint="Works without sign-in" isLoading={stats.isLoading} isError={stats.isError} tone="primary" accent="violet" />
            <StatCard icon={PauseCircle} title="Switched off" value={stats.data ? switchedOff : undefined} hint="Disabled accounts" isLoading={stats.isLoading} isError={stats.isError} tone="primary" accent="rose" />
          </BentoGrid>
        </section>

        <section aria-labelledby="staff-roster" className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-5">
            <h2 id="staff-roster" className="section-title">Team roster</h2>
            {staffQuery.data && (
              <span className="text-xs font-medium text-muted-foreground">
                {staffQuery.data.total} {staffQuery.data.total === 1 ? "person" : "people"}
              </span>
            )}
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
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search by name, email or phone"
              emptyTitle={query ? "No one matches" : "No staff yet"}
              emptyDescription={query ? "Try another name, email or phone number." : "Add your first team member to get started."}
              emptyAction={!query && canCreate ? <AddStaffDialog /> : undefined}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

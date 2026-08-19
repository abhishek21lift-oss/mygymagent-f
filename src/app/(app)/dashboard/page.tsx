"use client";

import { Users, CreditCard, CalendarCheck, Building2 } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import { useMembers } from "@/lib/hooks/use-members";
import { useMemberships } from "@/lib/hooks/use-memberships";
import { useAttendance } from "@/lib/hooks/use-attendance";
import { useBranches } from "@/lib/hooks/use-branches";

function todayRangeLabel() {
  return new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

function StatCard({
  title,
  icon: Icon,
  value,
  isLoading,
  hint,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  value: number | undefined;
  isLoading: boolean;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-2xl font-bold">{value ?? 0}</div>
        )}
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user, hasPermission } = useAuth();

  const membersQuery = useMembers({ pageSize: 1 });
  const membershipsQuery = useMemberships({ pageSize: 1 });
  const attendanceQuery = useAttendance({ pageSize: 1 });
  const branchesQuery = useBranches({ pageSize: 1 });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Welcome back, ${user?.firstName ?? ""}`}
        description={todayRangeLabel()}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {hasPermission("members.read") && (
          <StatCard
            title="Total members"
            icon={Users}
            value={membersQuery.data?.total}
            isLoading={membersQuery.isLoading}
          />
        )}
        {hasPermission("memberships.read") && (
          <StatCard
            title="Active memberships"
            icon={CreditCard}
            value={membershipsQuery.data?.total}
            isLoading={membershipsQuery.isLoading}
          />
        )}
        {hasPermission("attendance.read") && (
          <StatCard
            title="Attendance records"
            icon={CalendarCheck}
            value={attendanceQuery.data?.total}
            isLoading={attendanceQuery.isLoading}
            hint="All-time"
          />
        )}
        {hasPermission("branches.read") && (
          <StatCard
            title="Branches"
            icon={Building2}
            value={branchesQuery.data?.total}
            isLoading={branchesQuery.isLoading}
          />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">What&apos;s next</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Revenue, churn, and trainer-performance analytics land with the Analytics module
          (see the backend&apos;s <code className="rounded bg-muted px-1 py-0.5">docs/ARCHITECTURE.md</code>).
          This dashboard already reflects live data from the Members, Memberships, Attendance,
          and Branches modules built in this phase.
        </CardContent>
      </Card>
    </div>
  );
}

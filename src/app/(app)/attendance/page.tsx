"use client";

import * as React from "react";
import { toast } from "sonner";
import { LogIn, LogOut } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { BranchSelect } from "@/components/shared/branch-select";
import { MemberPicker } from "@/components/shared/member-picker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAttendance, useCheckIn, useCheckOut } from "@/lib/hooks/use-attendance";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiError } from "@/lib/api/client";
import type { Attendance } from "@/lib/types/gym";

function CheckInForm() {
  const { user } = useAuth();
  const [branchId, setBranchId] = React.useState(user?.primaryBranchId ?? "");
  const [member, setMember] = React.useState<{ id: string; label: string } | null>(null);
  const checkIn = useCheckIn();

  async function handleCheckIn() {
    if (!branchId || !member) {
      toast.error("Select a branch and a member first");
      return;
    }
    try {
      await checkIn.mutateAsync({ branchId, memberId: member.id, method: "MANUAL" });
      toast.success(`Checked in ${member.label}`);
      setMember(null);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Check-in failed");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Manual check-in</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <p className="mb-1.5 text-sm font-medium">Branch</p>
          <BranchSelect value={branchId} onChange={setBranchId} />
        </div>
        <div className="flex-1">
          <p className="mb-1.5 text-sm font-medium">Member</p>
          <MemberPicker value={member} onChange={setMember} />
        </div>
        <Button onClick={handleCheckIn} disabled={checkIn.isPending}>
          <LogIn />
          {checkIn.isPending ? "Checking in..." : "Check in"}
        </Button>
      </CardContent>
    </Card>
  );
}

const columns: ColumnDef<Attendance>[] = [
  {
    header: "Who",
    accessorKey: "member",
    cell: ({ row }) => {
      const a = row.original;
      return a.member
        ? `${a.member.firstName} ${a.member.lastName}`
        : a.staffUser
          ? `${a.staffUser.firstName} ${a.staffUser.lastName} (staff)`
          : "—";
    },
  },
  {
    header: "Method",
    accessorKey: "method",
    cell: ({ row }) => <Badge variant="outline">{row.original.method}</Badge>,
  },
  {
    header: "Check-in",
    accessorKey: "checkInAt",
    cell: ({ row }) => new Date(row.original.checkInAt).toLocaleString(),
  },
  {
    header: "Check-out",
    accessorKey: "checkOutAt",
    cell: ({ row }) => <CheckOutCell attendance={row.original} />,
  },
];

function CheckOutCell({ attendance }: { attendance: Attendance }) {
  const checkOut = useCheckOut();
  if (attendance.checkOutAt) return new Date(attendance.checkOutAt).toLocaleString();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={checkOut.isPending}
      onClick={() =>
        checkOut
          .mutateAsync(attendance.id)
          .then(() => toast.success("Checked out"))
          .catch((e) => toast.error(e instanceof ApiError ? e.message : "Failed to check out"))
      }
    >
      <LogOut className="size-3.5" />
      Check out
    </Button>
  );
}

export default function AttendancePage() {
  const { hasPermission } = useAuth();
  const [page, setPage] = React.useState(1);
  const attendanceQuery = useAttendance({ page, pageSize: 20, order: "desc" });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Attendance" description="Check-ins and check-outs across your branches" />

      {hasPermission("attendance.create") && <CheckInForm />}

      <DataTable
        columns={columns}
        data={attendanceQuery.data}
        isLoading={attendanceQuery.isLoading}
        isError={attendanceQuery.isError}
        onRetry={() => attendanceQuery.refetch()}
        page={page}
        onPageChange={setPage}
        emptyTitle="No attendance records yet"
      />
    </div>
  );
}

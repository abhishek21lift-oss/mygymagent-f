"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight, CalendarCheck, LogIn, LogOut, ScanLine, Sparkles } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/shared/data-table";
import { BranchSelect } from "@/components/shared/branch-select";
import { MemberPicker } from "@/components/shared/member-picker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    <section aria-labelledby="attendance-checkin" className="overflow-hidden rounded-[28px] border border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-delay:100ms] dark:border-white/10 dark:bg-stone-950/80">
      <div className="flex items-center gap-3 border-b border-stone-100/80 bg-gradient-to-r from-cyan-50/90 via-white to-teal-50/60 px-5 py-5 sm:px-6 dark:from-cyan-950/40 dark:via-stone-950 dark:to-teal-950/30">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-cyan-500 to-teal-600 text-white shadow-lg shadow-cyan-500/25">
          <ScanLine className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 id="attendance-checkin" className="font-serif text-xl font-semibold tracking-tight text-stone-950 dark:text-white">Manual check-in</h2>
          <p className="mt-0.5 text-xs font-medium text-stone-600 dark:text-stone-400">Pick a branch and member, then tap check-in — live floor pulse.</p>
        </div>
      </div>
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end sm:p-6">
        <div className="flex-1">
          <p className="mb-1.5 text-sm font-bold text-stone-700 dark:text-stone-300">Branch</p>
          <BranchSelect value={branchId} onChange={setBranchId} />
        </div>
        <div className="flex-1">
          <p className="mb-1.5 text-sm font-bold text-stone-700 dark:text-stone-300">Member</p>
          <MemberPicker value={member} onChange={setMember} />
        </div>
        <Button onClick={handleCheckIn} disabled={checkIn.isPending} className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[linear-gradient(105deg,#0891b2,#0d9488_55%,#059669)] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-cyan-500/25 transition duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600">
          <LogIn className="size-4" aria-hidden="true" />
          {checkIn.isPending ? "Checking in..." : "Check in"}
        </Button>
      </div>
    </section>
  );
}

const columns: ColumnDef<Attendance>[] = [
  {
    header: "Who",
    accessorKey: "member",
    cell: ({ row }) => {
      const a = row.original;
      const label = a.member
        ? `${a.member.firstName} ${a.member.lastName}`
        : a.staffUser
          ? `${a.staffUser.firstName} ${a.staffUser.lastName} (staff)`
          : "—";
      return <span className="font-bold text-stone-900 dark:text-stone-100">{label}</span>;
    },
  },
  {
    header: "Method",
    accessorKey: "method",
    cell: ({ row }) => <Badge variant="outline" className="rounded-full border-cyan-200/70 bg-cyan-50/60 font-bold text-cyan-800">{row.original.method}</Badge>,
  },
  {
    header: "Check-in",
    accessorKey: "checkInAt",
    cell: ({ row }) => <span className="font-medium tabular-nums text-stone-700 dark:text-stone-300">{new Date(row.original.checkInAt).toLocaleString()}</span>,
  },
  {
    header: "Check-out",
    accessorKey: "checkOutAt",
    cell: ({ row }) => <CheckOutCell attendance={row.original} />,
  },
];

function CheckOutCell({ attendance }: { attendance: Attendance }) {
  const checkOut = useCheckOut();
  if (attendance.checkOutAt) return <span className="font-medium tabular-nums text-stone-600 dark:text-stone-400">{new Date(attendance.checkOutAt).toLocaleString()}</span>;
  return (
    <Button
      variant="ghost"
      size="sm"
      className="min-h-11 rounded-xl font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
      disabled={checkOut.isPending}
      onClick={() =>
        checkOut
          .mutateAsync(attendance.id)
          .then(() => toast.success("Checked out"))
          .catch((e) => toast.error(e instanceof ApiError ? e.message : "Failed to check out"))
      }
    >
      <LogOut className="size-3.5" aria-hidden="true" />
      Check out
    </Button>
  );
}

export default function AttendancePage() {
  const { hasPermission } = useAuth();
  const [page, setPage] = React.useState(1);
  const attendanceQuery = useAttendance({ page, pageSize: 20, order: "desc" });

  return (
    <div className="relative -mx-2 min-h-full overflow-hidden pb-12 sm:-mx-3 lg:-mx-5">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_5%_2%,rgba(6,182,212,.13),transparent_19%),radial-gradient(circle_at_96%_4%,rgba(99,102,241,.15),transparent_22%),radial-gradient(circle_at_70%_38%,rgba(217,70,239,.10),transparent_25%),radial-gradient(circle_at_12%_72%,rgba(16,185,129,.08),transparent_24%)]" aria-hidden="true" />
      <div className="mx-auto flex max-w-[1680px] flex-col gap-8 px-2 sm:px-4 lg:px-6">
        <section aria-labelledby="attendance-title" className="relative overflow-hidden rounded-[34px] border border-white/90 bg-white/88 p-6 shadow-[0_35px_110px_-48px_rgba(79,70,229,.48)] backdrop-blur-2xl sm:p-8 lg:p-10 dark:border-white/10 dark:bg-stone-950/80">
          <div className="pointer-events-none absolute -left-24 -top-32 size-80 rounded-full bg-cyan-300/30 blur-3xl motion-safe:animate-blob" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-28 -top-24 size-96 rounded-full bg-teal-300/25 blur-3xl motion-safe:animate-blob motion-safe:[animation-delay:2.5s]" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-40 left-[35%] size-96 rounded-full bg-sky-300/20 blur-3xl motion-safe:animate-pulse-slow" aria-hidden="true" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-200/70 bg-cyan-50/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em] text-cyan-800">
                <span className="relative flex size-2" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-teal-500" />
                </span>
                Live floor pulse
              </div>
              <h1 id="attendance-title" className="font-serif text-4xl font-semibold tracking-[-.045em] text-stone-950 sm:text-5xl lg:text-6xl dark:text-white">Attendance</h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-stone-600 dark:text-stone-400">Check-ins and check-outs across your branches — every visit, counted live.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/members" className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[linear-gradient(105deg,#0891b2,#0d9488_55%,#059669)] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-cyan-500/25 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600">
                <CalendarCheck className="size-4" aria-hidden="true" /> Members <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link href="/ai" className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-cyan-200/80 bg-white/80 px-5 py-3 text-sm font-bold text-cyan-900 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-cyan-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600">
                <Sparkles className="size-4" aria-hidden="true" /> Ask AI
              </Link>
            </div>
          </div>
        </section>

        {hasPermission("attendance.create") && <CheckInForm />}

        <section aria-labelledby="attendance-log" className="overflow-hidden rounded-[28px] border border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-delay:150ms] dark:border-white/10 dark:bg-stone-950/80">
          <div className="flex items-center gap-3 border-b border-stone-100/80 bg-gradient-to-r from-cyan-50/90 via-white to-blue-50/60 px-5 py-5 sm:px-6 dark:from-cyan-950/40 dark:via-stone-950 dark:to-blue-950/20">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25">
              <CalendarCheck className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="attendance-log" className="font-serif text-xl font-semibold tracking-tight text-stone-950 dark:text-white">Visit log</h2>
              <p className="mt-0.5 text-xs font-medium text-stone-600 dark:text-stone-400">Who walked in, how they checked in, and when they left.</p>
            </div>
          </div>
          <div className="p-4 sm:p-5">
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
        </section>
      </div>
    </div>
  );
}

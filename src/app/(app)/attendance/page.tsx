"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CalendarCheck, LogIn, LogOut, ScanLine, ShieldAlert, Sparkles, Users } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/shared/data-table";
import { PageHero } from "@/components/shared/page-hero";
import { BranchSelect } from "@/components/shared/branch-select";
import { MemberPicker } from "@/components/shared/member-picker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAttendance, useAttendanceLive, useCheckIn, useCheckOut, normalizeGateResult } from "@/lib/hooks/use-attendance";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiError } from "@/lib/api/client";
import type { Attendance } from "@/lib/types/gym";

function CheckInForm() {
  const { user } = useAuth();
  const [branchId, setBranchId] = React.useState(user?.primaryBranchId ?? "");
  const [member, setMember] = React.useState<{ id: string; label: string } | null>(null);
  const [gate, setGate] = React.useState<{ ok: boolean; text: string } | null>(null);
  const checkIn = useCheckIn();

  async function handleCheckIn() {
    if (!branchId || !member) {
      toast.error("Select a branch and a member first");
      return;
    }
    const label = member.label;
    // Auto-clear the previous gate result on every new submit.
    setGate(null);
    try {
      const result = normalizeGateResult(
        await checkIn.mutateAsync({ branchId, memberId: member.id, method: "MANUAL" }),
      );
      if (result.allowed) {
        setGate({ ok: true, text: `Checked in — ${label}` });
        toast.success(`Checked in ${label}`);
        setMember(null);
      } else {
        setGate({ ok: false, text: `Denied — ${result.reason || "Check-in denied"}` });
      }
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
      {gate && (
        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <p
            role="alert"
            className={
              gate.ok
                ? "rounded-2xl border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-200"
                : "rounded-2xl border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-200"
            }
          >
            {gate.text}
          </p>
        </div>
      )}
    </section>
  );
}

function LiveBoards() {
  const live = useAttendanceLive();
  const inside = live.data?.inside ?? [];
  const denied = live.data?.deniedToday ?? [];

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <section aria-labelledby="attendance-inside" className="overflow-hidden rounded-[28px] border border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-delay:125ms] dark:border-white/10 dark:bg-stone-950/80">
        <div className="flex items-center justify-between gap-3 border-b border-stone-100/80 bg-gradient-to-r from-emerald-50/90 via-white to-teal-50/60 px-5 py-5 sm:px-6 dark:from-emerald-950/40 dark:via-stone-950 dark:to-teal-950/30">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
              <Users className="size-5" aria-hidden="true" />
            </span>
            <h2 id="attendance-inside" className="truncate font-serif text-xl font-semibold tracking-tight text-stone-950 dark:text-white">Who&apos;s inside</h2>
          </div>
          <span aria-label={`${inside.length} inside now`} className="shrink-0 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-3 py-1 font-mono text-xs font-black text-white tabular-nums shadow-md shadow-emerald-500/20">
            {live.isLoading ? "…" : inside.length}
          </span>
        </div>
        <div className="p-4 sm:p-5">
          {live.isLoading ? (
            <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Loading live occupancy…</p>
          ) : live.isError ? (
            <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Live view unavailable right now.</p>
          ) : inside.length === 0 ? (
            <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Nobody checked in right now.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {inside.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200/70 bg-white/70 px-4 py-2.5 dark:border-white/10 dark:bg-white/5">
                  <span className="min-w-0 truncate text-sm font-bold text-stone-900 dark:text-stone-100">
                    {entry.member ? `${entry.member.firstName} ${entry.member.lastName}` : "Unknown member"}
                  </span>
                  <span className="shrink-0 font-mono text-xs font-medium tabular-nums text-stone-500 dark:text-stone-400">
                    {new Date(entry.checkInAt).toLocaleTimeString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section aria-labelledby="attendance-denied" className="overflow-hidden rounded-[28px] border border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-delay:140ms] dark:border-white/10 dark:bg-stone-950/80">
        <div className="flex items-center justify-between gap-3 border-b border-stone-100/80 bg-gradient-to-r from-rose-50/90 via-white to-orange-50/60 px-5 py-5 sm:px-6 dark:from-rose-950/40 dark:via-stone-950 dark:to-orange-950/20">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-500/25">
              <ShieldAlert className="size-5" aria-hidden="true" />
            </span>
            <h2 id="attendance-denied" className="truncate font-serif text-xl font-semibold tracking-tight text-stone-950 dark:text-white">Denied today</h2>
          </div>
          <span aria-label={`${denied.length} denied today`} className="shrink-0 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 px-3 py-1 font-mono text-xs font-black text-white tabular-nums shadow-md shadow-rose-500/20">
            {live.isLoading ? "…" : denied.length}
          </span>
        </div>
        <div className="p-4 sm:p-5">
          {live.isLoading ? (
            <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Loading denials…</p>
          ) : live.isError ? (
            <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Denial feed unavailable right now.</p>
          ) : denied.length === 0 ? (
            <p className="text-sm font-medium text-stone-500 dark:text-stone-400">No denials today.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {denied.map((entry) => (
                <li key={entry.id} className="flex flex-col gap-1 rounded-2xl border border-stone-200/70 bg-white/70 px-4 py-2.5 dark:border-white/10 dark:bg-white/5">
                  <span className="truncate text-sm font-bold text-stone-900 dark:text-stone-100">
                    {entry.member ? `${entry.member.firstName} ${entry.member.lastName}` : "Unknown member"}
                  </span>
                  <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                    {entry.deniedReason || entry.reason || "Denied"}
                    {" · "}
                    {new Date(entry.checkInAt).toLocaleTimeString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
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
        <PageHero
          id="attendance-title"
          icon={CalendarCheck}
          title="Attendance"
          variant="light"
          accent="cyan"
          actions={
            <>
              <Link href="/members" className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[linear-gradient(105deg,#0891b2,#0d9488_55%,#059669)] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-cyan-500/25 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600">
                <CalendarCheck className="size-4" aria-hidden="true" /> Members
              </Link>
              <Link href="/ai" className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-cyan-200/80 bg-white/80 px-5 py-3 text-sm font-bold text-cyan-900 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-cyan-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600">
                <Sparkles className="size-4" aria-hidden="true" /> Ask AI
              </Link>
            </>
          }
        />

        {hasPermission("attendance.create") && <CheckInForm />}

        <LiveBoards />

        <section aria-labelledby="attendance-log" className="overflow-hidden rounded-[28px] border border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-delay:150ms] dark:border-white/10 dark:bg-stone-950/80">
          <div className="flex items-center gap-3 border-b border-stone-100/80 bg-gradient-to-r from-cyan-50/90 via-white to-blue-50/60 px-5 py-5 sm:px-6 dark:from-cyan-950/40 dark:via-stone-950 dark:to-blue-950/20">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25">
              <CalendarCheck className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="attendance-log" className="font-serif text-xl font-semibold tracking-tight text-stone-950 dark:text-white">Visit log</h2>
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

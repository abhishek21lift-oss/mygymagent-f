"use client";

import * as React from "react";
import {
 CalendarDays,
 CheckCircle2,
 HandCoins,
 Plus,
 RefreshCw,
 Save,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { PageHero } from "@/components/shared/page-hero";
import { Button } from "@/components/ui/button";

type LeaveType = {
 id: string;
 name: string;
 code: string;
 paid: boolean;
 annualQuota: string | number;
};

type LeaveRequest = {
 id: string;
 startDate: string;
 endDate: string;
 days: string | number;
 status: string;
 reason?: string | null;
 leaveType: { name: string };
 staffProfile: { user: { firstName: string; lastName: string } };
};

type PayrollItem = {
 id: string;
 staffProfileId: string;
 baseSalary: string | number;
 regularHours: string | number;
 overtime: string | number;
 incentives: string | number;
 deductions: string | number;
 unpaidLeave: string | number;
 gross: string | number;
 net: string | number;
 staffProfile: { user: { firstName: string; lastName: string } };
};

type PayrollRun = {
 id: string;
 periodStart: string;
 periodEnd: string;
 status: string;
 items: PayrollItem[];
};

type Adjustment = {
 staffProfileId: string;
 regularHours: string;
 overtime: string;
 incentives: string;
 deductions: string;
 unpaidLeave: string;
};

function toInputDate(date: Date) {
 return date.toISOString().slice(0, 10);
}

function money(value: string | number) {
 return Number(value || 0).toLocaleString("en-IN", {
 maximumFractionDigits: 2,
 });
}

function adjustmentFromItem(item: PayrollItem): Adjustment {
 return {
 staffProfileId: item.staffProfileId,
 regularHours: String(item.regularHours ?? 0),
 overtime: String(item.overtime ?? 0),
 incentives: String(item.incentives ?? 0),
 deductions: String(item.deductions ?? 0),
 unpaidLeave: String(item.unpaidLeave ?? 0),
 };
}

export default function PayrollPage() {
 const today = new Date();
 const [periodStart, setPeriodStart] = React.useState(
 toInputDate(new Date(today.getFullYear(), today.getMonth(), 1)),
 );
 const [periodEnd, setPeriodEnd] = React.useState(toInputDate(today));
 const [leaveTypes, setLeaveTypes] = React.useState<LeaveType[]>([]);
 const [requests, setRequests] = React.useState<LeaveRequest[]>([]);
 const [runs, setRuns] = React.useState<PayrollRun[]>([]);
 const [adjustments, setAdjustments] = React.useState<Record<string, Adjustment>>({});
 const [loading, setLoading] = React.useState(true);
 const [creating, setCreating] = React.useState(false);
 const [savingItem, setSavingItem] = React.useState<string | null>(null);

 const load = React.useCallback(async () => {
 setLoading(true);
 try {
 const [lt, lr, pr] = await Promise.all([
 api.get<LeaveType[]>("/hr-payroll/leave-types"),
 api.get<LeaveRequest[]>("/hr-payroll/leave-requests"),
 api.get<PayrollRun[]>("/hr-payroll/payroll-runs"),
 ]);
 setLeaveTypes(lt);
 setRequests(lr);
 setRuns(pr);
 setAdjustments(
 Object.fromEntries(
 (pr[0]?.items ?? []).map((item) => [
 item.staffProfileId,
 adjustmentFromItem(item),
 ]),
 ),
 );
 } catch (e) {
 toast.error(
 e instanceof Error ? e.message : "HR & payroll data could not be loaded",
 );
 } finally {
 setLoading(false);
 }
 }, []);

 React.useEffect(() => {
 const timer = window.setTimeout(() => {
 void load();
 }, 0);
 return () => window.clearTimeout(timer);
 }, [load]);

 async function createRun() {
 if (periodEnd < periodStart) {
 toast.error("Payroll period end must be on or after start");
 return;
 }
 setCreating(true);
 try {
 await api.post("/hr-payroll/payroll-runs", {
 periodStart: new Date(`${periodStart}T00:00:00.000Z`).toISOString(),
 periodEnd: new Date(`${periodEnd}T23:59:59.999Z`).toISOString(),
 });
 toast.success("Payroll run created");
 await load();
 } catch (e) {
 toast.error(e instanceof Error ? e.message : "Payroll run creation failed");
 } finally {
 setCreating(false);
 }
 }

 async function review(id: string, status: "APPROVED" | "REJECTED") {
 try {
 await api.patch(`/hr-payroll/leave-requests/${id}/review`, { status });
 toast.success(`Leave request ${status.toLowerCase()}`);
 await load();
 } catch (e) {
 toast.error(e instanceof Error ? e.message : "Leave review failed");
 }
 }

 async function approve(id: string) {
 try {
 await api.post(`/hr-payroll/payroll-runs/${id}/approve`, {});
 toast.success("Payroll run approved");
 await load();
 } catch (e) {
 toast.error(e instanceof Error ? e.message : "Payroll approval failed");
 }
 }

 async function process(id: string) {
 try {
 await api.post(`/hr-payroll/payroll-runs/${id}/process`, {});
 toast.success("Payroll run processed");
 await load();
 } catch (e) {
 toast.error(e instanceof Error ? e.message : "Payroll processing failed");
 }
 }

 async function saveAdjustment(run: PayrollRun, staffProfileId: string) {
 const adjustment = adjustments[staffProfileId];
 if (!adjustment || run.status !== "DRAFT") return;

 setSavingItem(staffProfileId);
 try {
 await api.patch(`/hr-payroll/payroll-runs/${run.id}/items`, {
 staffProfileId,
 regularHours: Number(adjustment.regularHours || 0),
 overtime: Number(adjustment.overtime || 0),
 incentives: Number(adjustment.incentives || 0),
 deductions: Number(adjustment.deductions || 0),
 unpaidLeave: Number(adjustment.unpaidLeave || 0),
 });
 toast.success("Payroll item updated");
 await load();
 } catch (e) {
 toast.error(e instanceof Error ? e.message : "Payroll item update failed");
 } finally {
 setSavingItem(null);
 }
 }

 function updateAdjustment(
 staffProfileId: string,
 field: keyof Omit<Adjustment, "staffProfileId">,
 value: string,
 ) {
 setAdjustments((current) => ({
 ...current,
 [staffProfileId]: {
 ...(current[staffProfileId] ?? {
 staffProfileId,
 regularHours: "0",
 overtime: "0",
 incentives: "0",
 deductions: "0",
 unpaidLeave: "0",
 }),
 [field]: value,
 },
 }));
 }

 const latest = runs[0];
 const netPayable =
 latest?.items.reduce((sum, item) => sum + Number(item.net || 0), 0) ?? 0;

 return (
 <main className="space-y-8">
 <PageHero
 title="Payroll"
 description="Runs, leave and payslips"
 icon={HandCoins}
 actions={
 <Button variant="outline" onClick={() => void load()} disabled={loading}>
 <RefreshCw className="mr-2 size-4" />
 Refresh
 </Button>
 }
 />

 <section className="grid gap-6 md:grid-cols-3">
 <div className="rounded-xl border bg-card p-6 shadow-sm">
 <p className="text-sm text-stone-500">Leave types</p>
 <p className="mt-2 text-3xl font-black">{leaveTypes.length}</p>
 </div>
 <div className="rounded-xl border bg-card p-6 shadow-sm">
 <p className="text-sm text-stone-500">Pending leave</p>
 <p className="mt-2 text-3xl font-black">
 {requests.filter((r) => r.status === "PENDING").length}
 </p>
 </div>
 <div className="rounded-xl border bg-card p-6 shadow-sm">
 <p className="text-sm text-stone-500">Latest net payroll</p>
 <p className="mt-2 text-3xl font-black">₹{money(netPayable)}</p>
 </div>
 </section>

 <section className="rounded-xl border bg-card p-6 shadow-sm">
 <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
 <div>
 <h2 className="text-xl font-black">Create payroll run</h2>
 <p className="text-sm text-stone-500">
 Staff is selected server-side from the active organization and branch scope.
 </p>
 </div>
 <Button onClick={() => void createRun()} disabled={creating}>
 <Plus className="mr-2 size-4" />
 {creating ? "Creating..." : "Create run"}
 </Button>
 </div>
 <div className="grid gap-4 sm:grid-cols-2">
 <label className="text-sm font-semibold">
 Period start
 <input
 className="mt-2 w-full rounded-xl border px-3 py-2"
 type="date"
 value={periodStart}
 onChange={(event) => setPeriodStart(event.target.value)}
 />
 </label>
 <label className="text-sm font-semibold">
 Period end
 <input
 className="mt-2 w-full rounded-xl border px-3 py-2"
 type="date"
 value={periodEnd}
 onChange={(event) => setPeriodEnd(event.target.value)}
 />
 </label>
 </div>
 </section>

 <section className="rounded-xl border bg-card p-6 shadow-sm">
 <div className="mb-5 flex items-center justify-between">
 <h2 className="text-xl font-black">Leave requests</h2>
 <CalendarDays className="size-5 text-stone-400" />
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-left text-sm">
 <thead>
 <tr className="border-b text-stone-500">
 <th className="py-3">Staff</th>
 <th>Leave</th>
 <th>Dates</th>
 <th>Days</th>
 <th>Status</th>
 <th />
 </tr>
 </thead>
 <tbody>
 {requests.map((r) => (
 <tr key={r.id} className="border-b last:border-0">
 <td className="py-3 font-bold">
 {r.staffProfile.user.firstName} {r.staffProfile.user.lastName}
 </td>
 <td>{r.leaveType.name}</td>
 <td>
 {new Date(r.startDate).toLocaleDateString()} –{" "}
 {new Date(r.endDate).toLocaleDateString()}
 </td>
 <td>{Number(r.days)}</td>
 <td>{r.status}</td>
 <td className="text-right">
 {r.status === "PENDING" && (
 <span className="inline-flex gap-2">
 <Button size="sm" onClick={() => void review(r.id, "APPROVED")}>
 Approve
 </Button>
 <Button
 size="sm"
 variant="outline"
 onClick={() => void review(r.id, "REJECTED")}
 >
 Reject
 </Button>
 </span>
 )}
 </td>
 </tr>
 ))}
 {!loading && requests.length === 0 && (
 <tr>
 <td colSpan={6} className="py-10 text-center text-stone-500">
 No leave requests.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </section>

 <section className="rounded-xl border bg-card p-6 shadow-sm">
 <div className="mb-5 flex items-center justify-between">
 <h2 className="text-xl font-black">Payroll runs</h2>
 <HandCoins className="size-5 text-stone-400" />
 </div>
 <div className="space-y-6">
 {runs.map((run) => (
 <div key={run.id} className="rounded-lg border p-4">
 <div className="flex flex-wrap items-center justify-between gap-4">
 <div>
 <p className="font-bold">
 {new Date(run.periodStart).toLocaleDateString()} –{" "}
 {new Date(run.periodEnd).toLocaleDateString()}
 </p>
 <p className="text-sm text-stone-500">
 {run.items.length} staff · {run.status}
 </p>
 </div>
 <div className="flex items-center gap-3">
 <span className="font-black">
 ₹
 {money(
 run.items.reduce((sum, item) => sum + Number(item.net || 0), 0),
 )}
 </span>
 {run.status === "DRAFT" && (
 <Button size="sm" onClick={() => void approve(run.id)}>
 <CheckCircle2 className="mr-1 size-4" />
 Approve
 </Button>
 )}
 {run.status === "APPROVED" && (
 <Button size="sm" onClick={() => void process(run.id)}>
 Process
 </Button>
 )}
 </div>
 </div>

 {run.status === "DRAFT" && (
 <div className="mt-5 overflow-x-auto">
 <table className="w-full min-w-[900px] text-left text-xs">
 <thead className="border-b text-stone-500">
 <tr>
 <th className="py-2">Staff</th>
 <th>Regular hours</th>
 <th>Overtime</th>
 <th>Incentives</th>
 <th>Deductions</th>
 <th>Unpaid leave</th>
 <th>Gross / Net</th>
 <th />
 </tr>
 </thead>
 <tbody>
 {run.items.map((item) => {
 const adjustment =
 adjustments[item.staffProfileId] ?? adjustmentFromItem(item);
 return (
 <tr key={item.id} className="border-b last:border-0">
 <td className="py-3 font-semibold">
 {item.staffProfile.user.firstName}{" "}
 {item.staffProfile.user.lastName}
 </td>
 {(
 [ "regularHours", "overtime", "incentives", "deductions", "unpaidLeave",
 ] as const
 ).map((field) => (
 <td key={field} className="pr-2">
 <input
 className="w-28 rounded-lg border px-2 py-1"
 type="number"
 min="0"
 step="0.01"
 value={adjustment[field]}
 onChange={(event) =>
 updateAdjustment(
 item.staffProfileId,
 field,
 event.target.value,
 )
 }
 />
 </td>
 ))}
 <td className="font-semibold">
 ₹{money(item.gross)} / ₹{money(item.net)}
 </td>
 <td className="text-right">
 <Button
 size="sm"
 variant="outline"
 disabled={savingItem === item.staffProfileId}
 onClick={() =>
 void saveAdjustment(run, item.staffProfileId)
 }
 >
 <Save className="mr-1 size-3" />
 {savingItem === item.staffProfileId ? "Saving..." : "Save"}
 </Button>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 )}
 </div>
 ))}
 {!loading && runs.length === 0 && (
 <p className="py-10 text-center text-stone-500">
 No payroll runs yet. Create one above.
 </p>
 )}
 </div>
 </section>
 </main>
 );
}

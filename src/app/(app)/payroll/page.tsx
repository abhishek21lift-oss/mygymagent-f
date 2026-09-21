"use client";

import * as React from "react";
import { CalendarDays, CheckCircle2, HandCoins, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { PageHero } from "@/components/shared/page-hero";
import { Button } from "@/components/ui/button";

type LeaveType = { id: string; name: string; code: string; paid: boolean; annualQuota: string | number };
type LeaveRequest = { id: string; startDate: string; endDate: string; days: string | number; status: string; reason?: string | null; leaveType: { name: string }; staffProfile: { user: { firstName: string; lastName: string } } };
type PayrollRun = { id: string; periodStart: string; periodEnd: string; status: string; items: Array<{ id: string; net: string | number; gross: string | number; staffProfile: { user: { firstName: string; lastName: string } } }> };

export default function PayrollPage() {
  const [leaveTypes, setLeaveTypes] = React.useState<LeaveType[]>([]);
  const [requests, setRequests] = React.useState<LeaveRequest[]>([]);
  const [runs, setRuns] = React.useState<PayrollRun[]>([]);
  const [loading, setLoading] = React.useState(true);

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
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "HR & payroll data could not be loaded");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);

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

  const latest = runs[0];
  const netPayable = latest?.items.reduce((sum, item) => sum + Number(item.net || 0), 0) ?? 0;

  return (
    <main className="space-y-8">
      <PageHero title="HR & Payroll" icon={HandCoins}
        actions={<Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className="mr-2 size-4" />Refresh</Button>} />

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl border bg-white/80 p-6 shadow-sm"><p className="text-sm text-stone-500">Leave types</p><p className="mt-2 text-3xl font-black">{leaveTypes.length}</p></div>
        <div className="rounded-3xl border bg-white/80 p-6 shadow-sm"><p className="text-sm text-stone-500">Pending leave</p><p className="mt-2 text-3xl font-black">{requests.filter(r => r.status === "PENDING").length}</p></div>
        <div className="rounded-3xl border bg-white/80 p-6 shadow-sm"><p className="text-sm text-stone-500">Latest net payroll</p><p className="mt-2 text-3xl font-black">₹{netPayable.toLocaleString()}</p></div>
      </section>

      <section className="rounded-3xl border bg-white/80 p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-black">Leave requests</h2><CalendarDays className="size-5 text-stone-400" /></div>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-stone-500"><th className="py-3">Staff</th><th>Leave</th><th>Dates</th><th>Days</th><th>Status</th><th /></tr></thead><tbody>
          {requests.map(r => <tr key={r.id} className="border-b last:border-0"><td className="py-3 font-bold">{r.staffProfile.user.firstName} {r.staffProfile.user.lastName}</td><td>{r.leaveType.name}</td><td>{new Date(r.startDate).toLocaleDateString()} – {new Date(r.endDate).toLocaleDateString()}</td><td>{Number(r.days)}</td><td>{r.status}</td><td className="text-right">{r.status === "PENDING" && <span className="inline-flex gap-2"><Button size="sm" onClick={() => void review(r.id, "APPROVED")}>Approve</Button><Button size="sm" variant="outline" onClick={() => void review(r.id, "REJECTED")}>Reject</Button></span>}</td></tr>)}
          {!loading && requests.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-stone-500">No leave requests.</td></tr>}
        </tbody></table></div>
      </section>

      <section className="rounded-3xl border bg-white/80 p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-black">Payroll runs</h2><HandCoins className="size-5 text-stone-400" /></div>
        <div className="space-y-3">{runs.map(run => <div key={run.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4">
          <div><p className="font-bold">{new Date(run.periodStart).toLocaleDateString()} – {new Date(run.periodEnd).toLocaleDateString()}</p><p className="text-sm text-stone-500">{run.items.length} staff · {run.status}</p></div>
          <div className="flex items-center gap-3"><span className="font-black">₹{run.items.reduce((sum, i) => sum + Number(i.net || 0), 0).toLocaleString()}</span>{run.status === "DRAFT" && <Button size="sm" onClick={() => void approve(run.id)}><CheckCircle2 className="mr-1 size-4" />Approve</Button>}{run.status === "APPROVED" && <Button size="sm" onClick={() => void process(run.id)}>Process</Button>}</div>
        </div>)}{!loading && runs.length === 0 && <p className="py-10 text-center text-stone-500">No payroll runs yet. Create the first run from the HR payroll API/workflow.</p>}</div>
      </section>
    </main>
  );
}

"use client";

import * as React from "react";
import {
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  HandCoins,
  IndianRupee,
  Plus,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { ErrorState } from "@/components/shared/error-state";
import { StaffPayrollSection } from "./staff-payroll-section";
import { CommissionsSection } from "./commissions-section";
import { AddLeaveTypeDialog, RecordLeaveDialog } from "./leave-dialogs";
import { useAuth } from "@/lib/auth/auth-context";
import { PageHero } from "@/components/shared/page-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRefreshOnPull } from "@/components/shared/pull-to-refresh";
import { cn } from "@/lib/utils";

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
  const { hasPermission } = useAuth();
  const canReadHr = hasPermission("hr.read");
  const canManageHr = hasPermission("hr.manage");
  const [leaveDialog, setLeaveDialog] = React.useState<"type" | "request" | null>(null);
  const canReadPayroll = hasPermission("payroll.read");

  const [leaveTypes, setLeaveTypes] = React.useState<LeaveType[]>([]);
  const [requests, setRequests] = React.useState<LeaveRequest[]>([]);
  const [runs, setRuns] = React.useState<PayrollRun[]>([]);
  const [adjustments, setAdjustments] = React.useState<Record<string, Adjustment>>({});
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [savingItem, setSavingItem] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [lt, lr, pr] = await Promise.all([
        canReadHr ? api.get<LeaveType[]>("/hr-payroll/leave-types") : Promise.resolve<LeaveType[]>([]),
        canReadHr ? api.get<LeaveRequest[]>("/hr-payroll/leave-requests") : Promise.resolve<LeaveRequest[]>([]),
        canReadPayroll ? api.get<PayrollRun[]>("/hr-payroll/payroll-runs") : Promise.resolve<PayrollRun[]>([]),
      ]);
      setLeaveTypes(lt);
      setRequests(lr);
      setRuns(pr);
      setLoadError(false);
      setAdjustments(
        Object.fromEntries(
          (pr[0]?.items ?? []).map((item) => [
            item.staffProfileId,
            adjustmentFromItem(item),
          ]),
        ),
      );
    } catch (e) {
      setLoadError(true);
      toast.error(
        e instanceof Error ? e.message : "HR & payroll data could not be loaded",
      );
    } finally {
      setLoading(false);
    }
  }, [canReadHr, canReadPayroll]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useRefreshOnPull(load);

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
    <main className="space-y-6 pb-6">
      <PageHero
        title="Payroll & HR"
        description="Salary runs, leave administration, and compensation management"
        icon={HandCoins}
      />

      {/* Apple-style Metric Cards */}
      <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {canReadHr && (
          <div className="flex items-center gap-4 rounded-3xl border border-border/80 bg-card/90 p-5 shadow-sm backdrop-blur-xl">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Calendar className="size-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Leave Policies</p>
              <p className="text-2xl font-black tabular-nums text-foreground">{leaveTypes.length}</p>
              <p className="text-xs text-muted-foreground">Configured leave categories</p>
            </div>
          </div>
        )}

        {canReadHr && (
          <div className="flex items-center gap-4 rounded-3xl border border-border/80 bg-card/90 p-5 shadow-sm backdrop-blur-xl">
            <div className={cn(
              "flex size-12 items-center justify-center rounded-2xl",
              requests.filter((r) => r.status === "PENDING").length > 0
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            )}>
              <Clock className="size-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pending Approvals</p>
              <p className="text-2xl font-black tabular-nums text-foreground">
                {requests.filter((r) => r.status === "PENDING").length}
              </p>
              <p className="text-xs text-muted-foreground">Leave applications awaiting review</p>
            </div>
          </div>
        )}

        {canReadPayroll && (
          <div className="flex items-center gap-4 rounded-3xl border border-border/80 bg-card/90 p-5 shadow-sm backdrop-blur-xl sm:col-span-2 md:col-span-1">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <IndianRupee className="size-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Latest Net Disbursal</p>
              <p className="text-2xl font-black tabular-nums text-foreground">₹{money(netPayable)}</p>
              <p className="text-xs text-muted-foreground">
                {latest ? `${latest.items.length} staff enrolled in run` : "No active runs"}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Staff Payroll Settings */}
      {canReadHr && <StaffPayrollSection onChanged={() => void load()} />}

      {/* Create Payroll Run */}
      {canReadPayroll && (
        <Card className="rounded-3xl border border-border/80 bg-card/90 shadow-sm backdrop-blur-xl">
          <CardHeader className="border-b border-border/60 bg-muted/20 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  Initiate Payroll Run
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Calculate gross-to-net compensations for active branch scope
                </CardDescription>
              </div>
              <Button
                onClick={() => void createRun()}
                disabled={creating}
                className="rounded-xl shadow-xs"
              >
                <Plus className="mr-1.5 size-4" />
                {creating ? "Calculating..." : "Generate Run"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
            <div>
              <Label htmlFor="period-start" className="text-xs font-semibold">
                Period Start Date
              </Label>
              <Input
                id="period-start"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="mt-1.5 rounded-xl bg-background/80"
              />
            </div>
            <div>
              <Label htmlFor="period-end" className="text-xs font-semibold">
                Period End Date
              </Label>
              <Input
                id="period-end"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="mt-1.5 rounded-xl bg-background/80"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leave Requests Review Cards */}
      {canReadHr && (
        <Card className="rounded-3xl border border-border/80 bg-card/90 shadow-sm backdrop-blur-xl">
          <CardHeader className="border-b border-border/60 bg-muted/20 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <CalendarDays className="size-4" />
                  </span>
                  Leave Requests
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Review time-off requests from staff and personal trainers
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {canManageHr && (
                  <>
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setLeaveDialog("type")}>
                      <Plus className="mr-1 size-3.5" aria-hidden="true" /> Leave type
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-xl"
                      onClick={() => setLeaveDialog("request")}
                      disabled={leaveTypes.length === 0}
                      title={leaveTypes.length === 0 ? "Add a leave type first" : undefined}
                    >
                      <Plus className="mr-1 size-3.5" aria-hidden="true" /> Record leave
                    </Button>
                  </>
                )}
                <Badge variant="outline" className="rounded-full font-mono text-xs font-bold">
                  {requests.length} records
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-3">
              {requests.map((r) => {
                const isPending = r.status === "PENDING";
                const isApproved = r.status === "APPROVED";
                return (
                  <div
                    key={r.id}
                    className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-xs transition-all hover:border-primary/30 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                        {r.staffProfile.user.firstName?.[0] ?? "S"}{r.staffProfile.user.lastName?.[0] ?? ""}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-foreground">
                            {r.staffProfile.user.firstName} {r.staffProfile.user.lastName}
                          </p>
                          <Badge variant="secondary" className="rounded-full text-[11px] font-semibold">
                            {r.leaveType.name}
                          </Badge>
                          <Badge
                            variant={isApproved ? "success" : isPending ? "warning" : "destructive"}
                            className="rounded-full text-[11px]"
                          >
                            {r.status}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {new Date(r.startDate).toLocaleDateString()} – {new Date(r.endDate).toLocaleDateString()} ·{" "}
                          <span className="font-semibold text-foreground">{Number(r.days)} days</span>
                          {r.reason ? ` · "${r.reason}"` : ""}
                        </p>
                      </div>
                    </div>

                    {isPending && (
                      <div className="flex items-center gap-2 pt-2 sm:pt-0">
                        <Button
                          size="sm"
                          onClick={() => void review(r.id, "APPROVED")}
                          className="rounded-xl"
                        >
                          <Check className="mr-1 size-3.5" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void review(r.id, "REJECTED")}
                          className="rounded-xl text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <X className="mr-1 size-3.5" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}

              {!loading && loadError && (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-center text-sm text-destructive">
                  Leave requests could not be loaded.{" "}
                  <button type="button" onClick={() => void load()} className="underline underline-offset-2 font-bold">
                    Try again
                  </button>
                </div>
              )}

              {!loading && !loadError && requests.length === 0 && (
                <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  No leave requests logged yet.
                  {canManageHr
                    ? leaveTypes.length === 0
                      ? " Add a leave type, then record leave for a staff member."
                      : " Use Record leave to add one."
                    : ""}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payroll Runs Section */}
      {canReadPayroll && (
        <Card className="rounded-3xl border border-border/80 bg-card/90 shadow-sm backdrop-blur-xl">
          <CardHeader className="border-b border-border/60 bg-muted/20 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <HandCoins className="size-4" />
                  </span>
                  Payroll Runs & Settlements
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  History of processed salary runs with inline compensation adjustments
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {runs.map((run) => {
                const totalNet = run.items.reduce((sum, item) => sum + Number(item.net || 0), 0);
                return (
                  <div
                    key={run.id}
                    className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 bg-muted/20 p-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-foreground">
                            {new Date(run.periodStart).toLocaleDateString()} – {new Date(run.periodEnd).toLocaleDateString()}
                          </p>
                          <Badge
                            variant={
                              run.status === "PROCESSED"
                                ? "success"
                                : run.status === "APPROVED"
                                ? "default"
                                : "secondary"
                            }
                            className="rounded-full text-[11px]"
                          >
                            {run.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {run.items.length} employees enrolled
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono text-base font-black text-foreground">
                          ₹{money(totalNet)}
                        </span>
                        {run.status === "DRAFT" && (
                          <Button size="sm" onClick={() => void approve(run.id)} className="rounded-xl">
                            <CheckCircle2 className="mr-1.5 size-4" />
                            Approve Run
                          </Button>
                        )}
                        {run.status === "APPROVED" && (
                          <Button size="sm" onClick={() => void process(run.id)} className="rounded-xl">
                            Process Payouts
                          </Button>
                        )}
                      </div>
                    </div>

                    {run.status === "DRAFT" && (
                      <div className="overflow-x-auto p-4">
                        <table className="w-full min-w-[850px] text-left text-xs">
                          <thead>
                            <tr className="border-b border-border/60 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                              <th className="py-2.5 pl-2">Staff</th>
                              <th className="py-2.5">Regular Hrs</th>
                              <th className="py-2.5">Overtime Hrs</th>
                              <th className="py-2.5">Incentives (₹)</th>
                              <th className="py-2.5">Deductions (₹)</th>
                              <th className="py-2.5">Unpaid Leave</th>
                              <th className="py-2.5">Gross / Net</th>
                              <th className="py-2.5 pr-2 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40">
                            {run.items.map((item) => {
                              const adjustment =
                                adjustments[item.staffProfileId] ?? adjustmentFromItem(item);
                              return (
                                <tr key={item.id} className="transition-colors hover:bg-muted/20">
                                  <td className="py-3 pl-2 font-bold text-foreground">
                                    {item.staffProfile.user.firstName} {item.staffProfile.user.lastName}
                                  </td>
                                  {(
                                    ["regularHours", "overtime", "incentives", "deductions", "unpaidLeave"] as const
                                  ).map((field) => (
                                    <td key={field} className="pr-2">
                                      <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={adjustment[field]}
                                        onChange={(event) =>
                                          updateAdjustment(item.staffProfileId, field, event.target.value)
                                        }
                                        className="h-8 w-24 rounded-lg bg-background/80 font-mono text-xs"
                                      />
                                    </td>
                                  ))}
                                  <td className="font-mono font-semibold tabular-nums text-foreground">
                                    ₹{money(item.gross)} / <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{money(item.net)}</span>
                                  </td>
                                  <td className="pr-2 text-right">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={savingItem === item.staffProfileId}
                                      onClick={() => void saveAdjustment(run, item.staffProfileId)}
                                      className="h-8 rounded-lg text-xs"
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
                );
              })}

              {!loading && loadError && (
                <div className="py-4">
                  <ErrorState
                    message="Payroll runs could not be loaded."
                    onRetry={() => void load()}
                  />
                </div>
              )}

              {!loading && !loadError && runs.length === 0 && (
                <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  No payroll runs yet. Generate a run above to begin.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {canReadPayroll && <CommissionsSection />}

      {!canReadHr && !canReadPayroll && (
        <p className="text-sm text-muted-foreground">
          You do not have access to payroll on this organization.
        </p>
      )}
      {canManageHr && (
        <>
          <AddLeaveTypeDialog
            open={leaveDialog === "type"}
            onOpenChange={(open) => setLeaveDialog(open ? "type" : null)}
            onSaved={() => void load()}
          />
          <RecordLeaveDialog
            open={leaveDialog === "request"}
            onOpenChange={(open) => setLeaveDialog(open ? "request" : null)}
            leaveTypes={leaveTypes}
            onSaved={() => void load()}
          />
        </>
      )}
    </main>
  );
}

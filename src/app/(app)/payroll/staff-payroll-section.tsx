"use client";

import * as React from "react";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";

import { ErrorState } from "@/components/shared/error-state";
import { Panel } from "@/components/shared/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { api, ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";

type SalaryType = "MONTHLY" | "DAILY" | "HOURLY";

export interface StaffPayroll {
  id: string;
  userId: string;
  branchId: string | null;
  employeeCode: string | null;
  jobTitle: string | null;
  payrollEnabled: boolean;
  salaryType: SalaryType | null;
  baseSalary: string | null;
  hourlyRate: string | null;
  user: { id: string; firstName: string; lastName: string; email: string };
}

/**
 * Who is on payroll, and on what terms.
 *
 * This sits directly above "Create payroll run" for a reason: a run only
 * includes staff with `payrollEnabled` and a rate, and until B-P1-7 there
 * was no way to set either without opening a psql session — so the run
 * failed with "No payroll-enabled staff found for this scope" and the
 * screen gave you nowhere to go. The fix for that error is one row up.
 *
 * The API refuses an incoherent combination (enabled with no salary type,
 * a monthly salary of zero), so its 400 is surfaced as the message rather
 * than a generic failure — it names exactly which field is missing.
 */
export function StaffPayrollSection({ onChanged }: { onChanged?: () => void }) {
  const { hasPermission } = useAuth();
  const canRead = hasPermission("hr.read");
  const canManage = hasPermission("hr.manage");

  const [staff, setStaff] = React.useState<StaffPayroll[]>([]);
  const [loading, setLoading] = React.useState(true);
  // Without this a failed load rendered "No staff records yet. Invite
  // staff first" -- advice to fix a problem the reader does not have.
  const [loadError, setLoadError] = React.useState(false);
  const [saving, setSaving] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<Record<string, { salaryType: SalaryType; amount: string }>>({});

  // No `setLoading(true)` here: the initial state is already true, and
  // setting it synchronously would make this a setState-in-effect below.
  // It also reads better on a refresh after saving — the list updates in
  // place instead of blanking, and the row being saved has its own
  // spinner.
  const load = React.useCallback(async () => {
    try {
      const res = await api.get<{ items: StaffPayroll[] }>("/hr-payroll/staff");
      setStaff(res.items);
      setLoadError(false);
      setDraft(
        Object.fromEntries(
          res.items.map((s) => [
            s.userId,
            {
              salaryType: s.salaryType ?? "MONTHLY",
              amount:
                (s.salaryType === "HOURLY" ? s.hourlyRate : s.baseSalary) ?? "",
            },
          ]),
        ),
      );
    } catch (error) {
      setLoadError(true);
      toast.error(
        error instanceof ApiError ? error.message : "Staff payroll terms could not be loaded",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!canRead) return;
    // Deferred by a zero timeout, matching `payroll/page.tsx`: `load`
    // sets state, and doing that synchronously inside an effect triggers
    // a cascading render (react-hooks/set-state-in-effect).
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [canRead, load]);

  if (!canRead) return null;

  async function save(row: StaffPayroll, patch: Record<string, unknown>) {
    setSaving(row.userId);
    try {
      await api.patch(`/hr-payroll/staff/${row.userId}`, patch);
      await load();
      onChanged?.();
    } catch (error) {
      // The API's 400 names the missing field ("…needs a baseSalary
      // greater than 0…"), which is more useful than anything this
      // component could invent.
      toast.error(
        error instanceof ApiError ? error.message : "Could not save payroll terms",
      );
    } finally {
      setSaving(null);
    }
  }

  const enabled = staff.filter((s) => s.payrollEnabled).length;

  return (
    <Panel
      title="Staff on payroll"
      titleId="staff-payroll"
      description={
        loading
          ? undefined
          : `${enabled} of ${staff.length} included in a run`
      }
      flush
    >
      {loading ? (
        <div className="p-4 text-sm text-muted-foreground sm:p-5">Loading…</div>
      ) : loadError ? (
        <div className="p-4 sm:p-5">
          <ErrorState
            message="Staff payroll terms could not be loaded."
            onRetry={() => void load()}
          />
        </div>
      ) : staff.length === 0 ? (
        <div className="p-4 text-sm text-muted-foreground sm:p-5">
          No staff records yet. Invite staff first, then set their terms here.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {staff.map((row) => {
            const d = draft[row.userId] ?? { salaryType: "MONTHLY" as SalaryType, amount: "" };
            const isSaving = saving === row.userId;
            const rateLabel = d.salaryType === "HOURLY" ? "Per hour" : d.salaryType === "DAILY" ? "Per day" : "Per month";
            return (
              <li
                key={row.userId}
                className="flex flex-col gap-3 px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0 lg:w-56">
                  <p className="truncate text-sm font-semibold">
                    {row.user.firstName} {row.user.lastName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {row.jobTitle ?? row.user.email}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={d.salaryType}
                    disabled={!canManage || isSaving}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        [row.userId]: { ...d, salaryType: e.target.value as SalaryType },
                      }))
                    }
                    aria-label={`Salary type for ${row.user.firstName}`}
                    className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="DAILY">Daily</option>
                    <option value="HOURLY">Hourly</option>
                  </select>

                  <Input
                    value={d.amount}
                    disabled={!canManage || isSaving}
                    inputMode="decimal"
                    placeholder={rateLabel}
                    aria-label={`${rateLabel} for ${row.user.firstName}`}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        [row.userId]: { ...d, amount: e.target.value },
                      }))
                    }
                    className="h-9 w-28 tabular-nums"
                  />

                  {canManage && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isSaving || !d.amount.trim()}
                      onClick={() =>
                        void save(row, {
                          salaryType: d.salaryType,
                          ...(d.salaryType === "HOURLY"
                            ? { hourlyRate: Number(d.amount) }
                            : { baseSalary: Number(d.amount) }),
                        })
                      }
                      className="h-9 rounded-lg"
                    >
                      {isSaving ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Check className="size-4" aria-hidden="true" />
                      )}
                      Save
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2 lg:w-40 lg:justify-end">
                  {row.payrollEnabled ? (
                    <Badge variant="secondary" className="rounded-full">In runs</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">Excluded</span>
                  )}
                  <Switch
                    checked={row.payrollEnabled}
                    disabled={!canManage || isSaving}
                    onCheckedChange={(value) => void save(row, { payrollEnabled: value })}
                    aria-label={`Include ${row.user.firstName} in payroll runs`}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

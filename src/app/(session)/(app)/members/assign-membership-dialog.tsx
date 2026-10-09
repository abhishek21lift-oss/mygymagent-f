"use client";

import * as React from "react";
import { CalendarClock, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiError } from "@/lib/api/client";
import { useMembershipPlans } from "@/lib/hooks/use-membership-plans";
import {
  useBulkAssignMembership,
  type BulkAssignMembershipReport,
  type BulkMembershipSkipReason,
} from "@/lib/hooks/use-bulk-member-actions";

const SKIP_LABEL: Record<BulkMembershipSkipReason, string> = {
  alreadyHasActiveMembership: "already on a membership",
  outsideYourScope: "outside your access",
  branchMismatch: "at a different branch",
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Two steps, never one.
 *
 * Every other bulk action on this page applies on click, which is right
 * for a tag or a status: both are one field, and both are trivially
 * undone. This one creates a billable row with an expiry date for every
 * member selected -- the import it exists to finish leaves 290 eligible
 * at once -- and there is no bulk undo. So the first button only ever
 * asks the server what it *would* do, and the button that writes is not
 * reachable until that answer is on screen and carries a real count.
 *
 * Changing the plan or the date after a preview throws the preview away,
 * so the number on the confirm button can never describe a run other
 * than the one about to happen.
 */
export function AssignMembershipDialog({
  open,
  onOpenChange,
  memberIds,
  onApplied,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberIds: string[];
  onApplied: () => void;
}) {
  const plans = useMembershipPlans({ pageSize: 100 });
  const assign = useBulkAssignMembership();
  const [planId, setPlanId] = React.useState("");
  const [startDate, setStartDate] = React.useState(todayISO);
  const [preview, setPreview] = React.useState<BulkAssignMembershipReport | null>(
    null,
  );

  const activePlans = (plans.data?.items ?? []).filter((p) => p.isActive);

  function reset() {
    setPlanId("");
    setStartDate(todayISO());
    setPreview(null);
  }

  async function run(dryRun: boolean) {
    if (!planId) return;
    try {
      const report = await assign.mutateAsync({
        memberIds,
        membershipPlanId: planId,
        startDate: new Date(`${startDate}T00:00:00`).toISOString(),
        dryRun,
      });
      if (dryRun) {
        setPreview(report);
        return;
      }
      toast.success(
        `Created ${report.created} ${report.created === 1 ? "membership" : "memberships"}`,
      );
      onApplied();
      onOpenChange(false);
      reset();
    } catch (e) {
      toast.error(
        e instanceof ApiError ? e.message : "Could not assign memberships",
      );
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="max-h-[85svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign a membership</DialogTitle>
          <DialogDescription>
            {memberIds.length} selected. Nothing is created until you confirm
            the preview.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bulk-plan">Plan</Label>
            <select
              id="bulk-plan"
              value={planId}
              onChange={(e) => {
                setPlanId(e.target.value);
                setPreview(null);
              }}
              className="h-11 rounded-lg border border-border bg-card px-3 text-sm"
            >
              <option value="">Select a plan</option>
              {activePlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.currency} {p.price} · {p.durationDays} days
                </option>
              ))}
            </select>
            {plans.isSuccess && activePlans.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No active plans yet — create one under Plans first.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bulk-start">Start date</Label>
            <Input
              id="bulk-start"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPreview(null);
              }}
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              The plan&apos;s length sets the expiry date.
            </p>
          </div>

          {preview && (
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <CalendarClock
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Preview — nothing written yet
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Would be created
                  </p>
                  <p className="text-2xl font-semibold tabular-nums">
                    {preview.toCreate}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total value</p>
                  <p className="text-2xl font-semibold tabular-nums">
                    {preview.plan.currency} {preview.totalValue}
                  </p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Runs {new Date(preview.startDate).toLocaleDateString()} to{" "}
                {new Date(preview.endDate).toLocaleDateString()} · no payments
                are recorded
              </p>

              {preview.skippedMembers.length > 0 && (
                <div className="flex flex-col gap-1.5 border-t border-border pt-3">
                  <div className="flex items-center gap-2">
                    <TriangleAlert
                      className="size-4 text-warning"
                      aria-hidden="true"
                    />
                    <span className="text-xs font-medium">
                      {preview.skippedMembers.length} skipped
                    </span>
                  </div>
                  {/* Named, not just counted: a number alone is not
                      something anyone can act on. */}
                  <ul className="flex flex-col gap-1">
                    {preview.skippedMembers.slice(0, 8).map((s) => (
                      <li
                        key={s.memberId}
                        className="flex flex-wrap items-center gap-2 text-xs"
                      >
                        <span className="font-medium">
                          {s.name || s.memberCode || s.memberId}
                        </span>
                        <Badge variant="secondary">
                          {SKIP_LABEL[s.reason]}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                  {preview.skippedMembers.length > 8 && (
                    <p className="text-xs text-muted-foreground">
                      and {preview.skippedMembers.length - 8} more
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="min-h-11"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          {preview ? (
            <Button
              className="min-h-11"
              disabled={preview.toCreate === 0 || assign.isPending}
              aria-busy={assign.isPending}
              onClick={() => void run(false)}
            >
              {assign.isPending
                ? "Creating..."
                : `Create ${preview.toCreate} ${preview.toCreate === 1 ? "membership" : "memberships"}`}
            </Button>
          ) : (
            <Button
              className="min-h-11"
              disabled={!planId || assign.isPending}
              aria-busy={assign.isPending}
              onClick={() => void run(true)}
            >
              {assign.isPending ? "Checking..." : "Preview"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

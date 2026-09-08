"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  CalendarPlus,
  CheckCircle2,
  CreditCard,
  PauseCircle,
  RefreshCw,
  Snowflake,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import { useMember } from "@/lib/hooks/use-members";
import {
  useActivateMembership,
  usePauseMembership,
  useFreezeMembership,
  useResumeMembership,
  useExtendMembership,
  useUpgradeMembership,
  useDowngradeMembership,
  useRenewMembership,
  useTransferMembership,
  useCancelMembership,
  useRecordPaymentFailure,
} from "@/lib/hooks/use-memberships";
import { useMembershipPlans } from "@/lib/hooks/use-membership-plans";

type LifecycleMembership = {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  membershipPlan?: {
    id?: string;
    name?: string;
    currency?: string;
    price?: number;
  };
};

type MemberWithMemberships = {
  memberships?: unknown;
};

function isLifecycleMembership(value: unknown): value is LifecycleMembership {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.status === "string" &&
    typeof item.startDate === "string" &&
    typeof item.endDate === "string"
  );
}

export function MembershipLifecycleProfileActions({ memberId }: { memberId: string }) {
  const memberQuery = useMember(memberId);
  const plansQuery = useMembershipPlans({ pageSize: 100 });
  const [planId, setPlanId] = React.useState("");

  const activate = useActivateMembership();
  const pause = usePauseMembership();
  const freeze = useFreezeMembership();
  const resume = useResumeMembership();
  const extend = useExtendMembership();
  const upgrade = useUpgradeMembership();
  const downgrade = useDowngradeMembership();
  const renew = useRenewMembership();
  const transfer = useTransferMembership();
  const cancel = useCancelMembership();
  const paymentFailure = useRecordPaymentFailure();

  const rawMemberships = (memberQuery.data as MemberWithMemberships | undefined)?.memberships;
  const memberships = Array.isArray(rawMemberships) ? rawMemberships.filter(isLifecycleMembership) : [];
  const membership = memberships.find((item) =>
    ["PENDING", "ACTIVE", "FROZEN"].includes(item.status),
  ) ?? memberships[0];

  if (memberQuery.isLoading) return null;
  if (!membership) return null;

  const run = async (promise: Promise<unknown>, success: string) => {
    try {
      await promise;
      toast.success(success);
      await memberQuery.refetch();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Membership action failed");
    }
  };

  const askDays = (label: string, fallback = "7") => {
    const raw = window.prompt(label, fallback);
    if (raw === null) return null;
    const days = Number(raw);
    return Number.isFinite(days) && days > 0 ? Math.floor(days) : null;
  };

  const activeLike = membership.status === "ACTIVE" || membership.status === "FROZEN";

  return (
    <Card className="border-primary/15 bg-gradient-to-r from-primary/[0.04] via-card to-violet-500/[0.04] shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <CreditCard className="size-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">Membership Lifecycle</p>
                <Badge variant="outline" className="rounded-full">{membership.status}</Badge>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {membership.membershipPlan?.name ?? "Membership"} · {new Date(membership.startDate).toLocaleDateString()} – {new Date(membership.endDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {membership.status === "PENDING" && (
              <Button size="sm" className="rounded-xl" onClick={() => void run(activate.mutateAsync(membership.id), "Membership activated")} disabled={activate.isPending}>
                <CheckCircle2 className="size-3.5" /> Activate
              </Button>
            )}

            {membership.status === "ACTIVE" && (
              <>
                <Button size="sm" variant="outline" className="rounded-xl" onClick={() => {
                  const days = askDays("Pause membership for how many days?");
                  if (days) void run(pause.mutateAsync({ id: membership.id, days }), "Membership paused");
                }} disabled={pause.isPending}>
                  <PauseCircle className="size-3.5" /> Pause
                </Button>
                <Button size="sm" variant="outline" className="rounded-xl" onClick={() => {
                  const days = askDays("Freeze membership for how many days?");
                  if (days) void run(freeze.mutateAsync({ id: membership.id, days }), "Membership frozen");
                }} disabled={freeze.isPending}>
                  <Snowflake className="size-3.5" /> Freeze
                </Button>
              </>
            )}

            {membership.status === "FROZEN" && (
              <Button size="sm" variant="outline" className="rounded-xl" onClick={() => void run(resume.mutateAsync(membership.id), "Membership resumed")} disabled={resume.isPending}>
                <RefreshCw className="size-3.5" /> Resume
              </Button>
            )}

            {activeLike && (
              <>
                <Button size="sm" variant="outline" className="rounded-xl" onClick={() => {
                  const days = askDays("Extend membership by how many days?");
                  if (days) void run(extend.mutateAsync({ id: membership.id, days }), "Membership extended");
                }} disabled={extend.isPending}>
                  <CalendarPlus className="size-3.5" /> Extend
                </Button>
                <Button size="sm" variant="outline" className="rounded-xl" onClick={() => void run(renew.mutateAsync({ id: membership.id }), "Membership renewed")} disabled={renew.isPending}>
                  <RefreshCw className="size-3.5" /> Renew
                </Button>

                <Select value={planId} onValueChange={setPlanId}>
                  <SelectTrigger className="h-9 w-[170px] rounded-xl">
                    <SelectValue placeholder="Change plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plansQuery.data?.items
                      .filter((plan) => plan.id !== membership.membershipPlan?.id)
                      .map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} — {plan.currency} {plan.price}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" className="rounded-xl" disabled={!planId || upgrade.isPending} onClick={() => void run(upgrade.mutateAsync({ id: membership.id, membershipPlanId: planId }), "Membership upgraded")}>
                  <ArrowUp className="size-3.5" /> Upgrade
                </Button>
                <Button size="sm" variant="outline" className="rounded-xl" disabled={!planId || downgrade.isPending} onClick={() => void run(downgrade.mutateAsync({ id: membership.id, membershipPlanId: planId }), "Membership downgraded")}>
                  <ArrowDown className="size-3.5" /> Downgrade
                </Button>
                <Button size="sm" variant="outline" className="rounded-xl" onClick={() => {
                  const targetMemberId = window.prompt("Transfer membership to Member ID:");
                  if (targetMemberId) void run(transfer.mutateAsync({ id: membership.id, memberId: targetMemberId }), "Membership transferred");
                }} disabled={transfer.isPending}>
                  <ArrowUp className="size-3.5" /> Transfer
                </Button>
                <Button size="sm" variant="outline" className="rounded-xl" onClick={() => {
                  const reason = window.prompt("Payment failure reason:", "Payment failed");
                  if (reason !== null) void run(paymentFailure.mutateAsync({ id: membership.id, reason }), "Payment failure recorded");
                }} disabled={paymentFailure.isPending}>
                  <Zap className="size-3.5" /> Payment Failure
                </Button>
                <Button size="sm" variant="outline" className="rounded-xl text-destructive hover:text-destructive" onClick={() => {
                  const reason = window.prompt("Cancellation reason:", "Member requested cancellation");
                  if (reason !== null) void run(cancel.mutateAsync({ id: membership.id, reason }), "Membership cancelled");
                }} disabled={cancel.isPending}>
                  <XCircle className="size-3.5" /> Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

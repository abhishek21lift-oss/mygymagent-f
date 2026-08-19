"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Snowflake, XCircle, PlayCircle } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMember } from "@/lib/hooks/use-members";
import { useCreateMembership, useFreezeMembership, useResumeMembership, useCancelMembership } from "@/lib/hooks/use-memberships";
import { useMembershipPlans } from "@/lib/hooks/use-membership-plans";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiError } from "@/lib/api/client";
import type { MembershipStatus } from "@/lib/types/gym";

const membershipStatusVariant: Record<MembershipStatus, "default" | "secondary" | "destructive" | "warning"> = {
  PENDING: "secondary",
  ACTIVE: "default",
  FROZEN: "warning",
  EXPIRED: "destructive",
  CANCELLED: "secondary",
};

function SellMembershipDialog({ memberId }: { memberId: string }) {
  const [open, setOpen] = React.useState(false);
  const [planId, setPlanId] = React.useState<string>("");
  const plansQuery = useMembershipPlans({ pageSize: 100 });
  const createMembership = useCreateMembership();

  async function handleSell() {
    if (!planId) return;
    try {
      await createMembership.mutateAsync({ memberId, membershipPlanId: planId });
      toast.success("Membership sold");
      setOpen(false);
      setPlanId("");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to sell membership");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus />
          Sell membership
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sell a membership</DialogTitle>
        </DialogHeader>
        <Select value={planId} onValueChange={setPlanId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a plan" />
          </SelectTrigger>
          <SelectContent>
            {plansQuery.data?.items.map((plan) => (
              <SelectItem key={plan.id} value={plan.id}>
                {plan.name} — {plan.currency} {plan.price} / {plan.durationDays}d
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button onClick={handleSell} disabled={!planId || createMembership.isPending}>
            {createMembership.isPending ? "Selling..." : "Confirm sale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MembershipActions({ membershipId, status }: { membershipId: string; status: MembershipStatus }) {
  const freeze = useFreezeMembership();
  const resume = useResumeMembership();
  const cancel = useCancelMembership();

  if (status === "ACTIVE") {
    return (
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          disabled={freeze.isPending}
          onClick={() =>
            freeze
              .mutateAsync({ id: membershipId, days: 7 })
              .then(() => toast.success("Membership frozen for 7 days"))
              .catch((e) => toast.error(e instanceof ApiError ? e.message : "Failed to freeze"))
          }
        >
          <Snowflake className="size-3.5" />
          Freeze 7d
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={cancel.isPending}
          onClick={() =>
            cancel
              .mutateAsync({ id: membershipId })
              .then(() => toast.success("Membership cancelled"))
              .catch((e) => toast.error(e instanceof ApiError ? e.message : "Failed to cancel"))
          }
        >
          <XCircle className="size-3.5" />
          Cancel
        </Button>
      </div>
    );
  }

  if (status === "FROZEN") {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled={resume.isPending}
        onClick={() =>
          resume
            .mutateAsync(membershipId)
            .then(() => toast.success("Membership resumed"))
            .catch((e) => toast.error(e instanceof ApiError ? e.message : "Failed to resume"))
        }
      >
        <PlayCircle className="size-3.5" />
        Resume
      </Button>
    );
  }

  return null;
}

export function MemberDetailView({ memberId }: { memberId: string }) {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const memberQuery = useMember(memberId);

  if (memberQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (memberQuery.isError || !memberQuery.data) {
    return <ErrorState message="Member not found or you don't have access." onRetry={() => memberQuery.refetch()} />;
  }

  const member = memberQuery.data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-2" onClick={() => router.push("/members")}>
          <ArrowLeft className="size-4" />
          Back to members
        </Button>
        <PageHeader
          title={`${member.firstName} ${member.lastName}`}
          description={`Member code ${member.memberCode} · Joined ${new Date(member.joinedAt).toLocaleDateString()}`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge>{member.status}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Branch</span>
              <span>{member.primaryBranch?.name ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{member.email ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span>{member.phone ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Trainer</span>
              <span>
                {member.assignedTrainer
                  ? `${member.assignedTrainer.firstName} ${member.assignedTrainer.lastName}`
                  : "Unassigned"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Emergency contact</span>
              <span>{member.emergencyContactName ?? "—"}</span>
            </div>
            {member.notes && (
              <div className="border-t pt-3">
                <p className="text-muted-foreground">Notes</p>
                <p className="mt-1">{member.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Memberships</CardTitle>
            {hasPermission("memberships.create") && <SellMembershipDialog memberId={member.id} />}
          </CardHeader>
          <CardContent>
            {!member.memberships || member.memberships.length === 0 ? (
              <EmptyState title="No memberships yet" description="Sell this member their first plan." />
            ) : (
              <div className="flex flex-col gap-3">
                {member.memberships.map((membership) => (
                  <div
                    key={membership.id}
                    className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">{membership.membershipPlan?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(membership.startDate).toLocaleDateString()} —{" "}
                        {new Date(membership.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={membershipStatusVariant[membership.status]}>{membership.status}</Badge>
                      {hasPermission("memberships.update") && (
                        <MembershipActions membershipId={membership.id} status={membership.status} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

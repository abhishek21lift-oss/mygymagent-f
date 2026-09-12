"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  ArrowLeft,
  CalendarCheck,
  Dumbbell,
  Heart,
  MapPin,
  Phone,
  PlayCircle,
  Plus,
  Snowflake,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
  XCircle,
  Activity,
  Clock,
  AlertCircle,
  CheckCircle2,
  Users,
  BarChart3,
  Shield,
  Pencil,
  IndianRupee,
  MoreHorizontal,
  Copy,
  Mail,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { ErrorState } from "@/components/shared/error-state";
import { PageHero } from "@/components/shared/page-hero";
import { EmptyState } from "@/components/shared/empty-state";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { useMember, useUpdateMember, useDeleteMember } from "@/lib/hooks/use-members";
import { useMemberWorkoutHistory } from "@/lib/hooks/use-workout-history";
import { useMemberAttendance } from "@/lib/hooks/use-member-attendance";
import { useMemberPayments } from "@/lib/hooks/use-member-payments";
import { useMemberMeasurements } from "@/lib/hooks/use-member-assessments";
import { useMemberGoals } from "@/lib/hooks/use-member-goals";
import { useMemberScreenings } from "@/lib/hooks/use-member-screenings";
import { Member360Tabs } from "./member-360-tabs";
import { MemberAiProgress } from "./member-ai-progress";
import {
  useCreateMembership,
  useFreezeMembership,
  useResumeMembership,
  useCancelMembership,
  useRenewMembership,
} from "@/lib/hooks/use-memberships";
import { useMembershipPlans } from "@/lib/hooks/use-membership-plans";
import { ApiError } from "@/lib/api/client";
import type { MembershipStatus } from "@/lib/types/gym";
import { useCreatePayment } from "@/lib/hooks/use-payments";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createPaymentSchema, type CreatePaymentInput } from "@/lib/validation/gym";

const MEMBERSHIP_STATUS_VARIANT: Record<MembershipStatus, "default" | "secondary" | "destructive" | "warning"> = {
  PENDING: "secondary",
  ACTIVE: "default",
  FROZEN: "warning",
  PAUSED: "secondary",
  EXPIRED: "destructive",
  CANCELLED: "secondary",
};

function SellMembershipDialog({ memberId }: { memberId: string }) {
  const [open, setOpen] = React.useState(false);
  const [planId, setPlanId] = React.useState("");
  const [discount, setDiscount] = React.useState(0);
  const plansQuery = useMembershipPlans({ pageSize: 100 });
  const createMembership = useCreateMembership();

  const selectedPlan = plansQuery.data?.items.find((p) => p.id === planId);
  const finalPrice = selectedPlan ? Math.max(0, Number(selectedPlan.price) - discount) : null;

  async function handleSell() {
    if (!planId) return;
    try {
      await createMembership.mutateAsync({
        memberId,
        membershipPlanId: planId,
        ...(discount > 0 ? { discount } : {}),
      });
      toast.success("Membership sold successfully");
      setOpen(false);
      setPlanId("");
      setDiscount(0);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to sell membership");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="min-h-11 rounded-2xl bg-[linear-gradient(105deg,#4338ca,#7c3aed_52%,#c026d3)] text-white shadow-lg shadow-violet-500/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">
          <Plus className="size-3.5" aria-hidden="true" />
          Sell Membership
        </Button>
      </DialogTrigger>
      <DialogContent className="border-white/90 bg-white/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>Sell a Membership</DialogTitle>
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
        {selectedPlan && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
              <div className="flex-1">
                <p className="text-sm font-medium">Plan Price</p>
                <p className="text-lg font-bold">{selectedPlan.currency} {selectedPlan.price}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-sm font-medium text-stone-600">Discount</p>
                  <p className="text-sm font-medium text-destructive">-{selectedPlan.currency} {discount}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-stone-600">Final Amount</p>
                <p className="text-xl font-bold text-primary">{selectedPlan.currency} {finalPrice}</p>
              </div>
            </div>
            <div>
              <Label>Discount Amount</Label>
              <Input
                type="number"
                min="0"
                max={Number(selectedPlan.price)}
                step="1"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button
            onClick={handleSell}
            disabled={!planId || createMembership.isPending}
          >
            {createMembership.isPending ? "Selling..." : "Confirm Sale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CollectPaymentDialog({
  memberId,
  memberships,
}: {
  memberId: string;
  memberships: Array<{
    id: string;
    status: string;
    startDate: string;
    endDate: string;
    membershipPlan?: { id: string; name: string; price: string };
  }>;
}) {
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();
  const createPayment = useCreatePayment();
  const activeMemberships = memberships.filter(
    (m) => m.status === "ACTIVE" || m.status === "FROZEN"
  );

  const form = useForm<Omit<CreatePaymentInput, "memberId">>({
    resolver: zodResolver(createPaymentSchema.omit({ memberId: true })),
    defaultValues: {
      amount: 0,
      method: "CASH",
      membershipId: "",
      note: "",
    },
  });

  async function onSubmit(values: Omit<CreatePaymentInput, "memberId">) {
    try {
      await createPayment.mutateAsync({
        ...values,
        memberId,
        membershipId: values.membershipId || undefined,
      });
      toast.success("Payment collected successfully");
      setOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["member-payments", memberId] });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to collect payment");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) form.reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="min-h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
          <IndianRupee className="size-3.5" aria-hidden="true" />
          Collect Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="border-white/90 bg-white/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>Collect Payment</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="CARD">Card</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {activeMemberships.length > 0 && (
              <FormField
                control={form.control}
                name="membershipId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Membership (optional)</FormLabel>
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a membership" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeMemberships.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.membershipPlan?.name || "Membership"} —{" "}
                            {m.membershipPlan?.price || "—"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="PT session, product sale, ..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="submit"
                disabled={createPayment.isPending || !form.formState.isValid}
              >
                {createPayment.isPending ? "Collecting..." : "Collect Payment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function MembershipActions({
  membershipId,
  status,
}: {
  membershipId: string;
  status: MembershipStatus;
}) {
  const freeze = useFreezeMembership();
  const resume = useResumeMembership();
  const cancel = useCancelMembership();
  const renew = useRenewMembership();

  const [freezeOpen, setFreezeOpen] = React.useState(false);
  const [freezeDays, setFreezeDays] = React.useState(7);
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState("");

  const handle = (promise: Promise<unknown>, successMsg: string, close?: () => void) =>
    promise
      .then(() => {
        toast.success(successMsg);
        close?.();
      })
      .catch((e) => toast.error(e instanceof ApiError ? e.message : "Action failed"));

  // Only freeze/resume/renew/cancel have real backend support today
  // (see memberships.service.ts). Activate/Pause/Extend/Upgrade-Downgrade/
  // Transfer/Payment-failure were removed here because they called
  // endpoints that don't exist server-side; PAUSED is also not a status
  // the backend's MembershipStatus enum defines.
  const live = status === "ACTIVE" || status === "FROZEN";

  return (
    <div className="flex flex-wrap gap-2">
      {status === "ACTIVE" && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFreezeOpen(true)}
          className="min-h-11 rounded-2xl"
        >
          <Snowflake className="size-3.5" />
          Freeze
        </Button>
      )}

      {status === "FROZEN" && (
        <Button
          variant="outline"
          size="sm"
          disabled={resume.isPending}
          onClick={() => handle(resume.mutateAsync(membershipId), "Membership resumed")}
          className="min-h-11 rounded-2xl"
        >
          <PlayCircle className="size-3.5" />
          Resume
        </Button>
      )}

      {live && (
        <>
          <Button
            variant="outline"
            size="sm"
            disabled={renew.isPending}
            onClick={() => handle(renew.mutateAsync({ id: membershipId }), "Membership renewed")}
            className="min-h-11 rounded-2xl"
          >
            <Sparkles className="size-3.5" />
            Renew
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCancelOpen(true)}
            className="rounded-xl text-destructive hover:text-destructive"
          >
            <XCircle className="size-3.5" />
            Cancel
          </Button>
        </>
      )}

      {/* Freeze dialog */}
      <Dialog open={freezeOpen} onOpenChange={setFreezeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Freeze Membership</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Freeze Days</Label>
              <Input
                type="number"
                min={1}
                value={freezeDays}
                onChange={(e) => setFreezeDays(Math.max(1, Number(e.target.value) || 1))}
                className="mt-1"
              />
              <p className="mt-1 text-xs text-stone-600">
                Frozen days are added back to the end date on resume. Counts against the plan freeze quota.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={freeze.isPending}
              onClick={() =>
                handle(
                  freeze.mutateAsync({ id: membershipId, days: freezeDays }),
                  `Membership frozen for ${freezeDays} days`,
                  () => setFreezeOpen(false)
                )
              }
            >
              {freeze.isPending ? "Freezing..." : "Freeze"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Membership</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Reason (optional)</Label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Why is this membership being cancelled?"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              disabled={cancel.isPending}
              onClick={() =>
                handle(
                  cancel.mutateAsync({ id: membershipId, reason: cancelReason || undefined }),
                  "Membership cancelled",
                  () => {
                    setCancelOpen(false);
                    setCancelReason("");
                  }
                )
              }
            >
              {cancel.isPending ? "Cancelling..." : "Cancel Membership"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WorkoutProgress({ memberId }: { memberId: string }) {
  const history = useMemberWorkoutHistory(memberId, 12);
  const sessions = history.data ?? [];
  const completed = sessions.filter((session) => session.status === "COMPLETED");
  const totalVolume = completed.reduce(
    (sum, session) => sum + Number(session.volumeKg ?? 0),
    0
  );
  const last = completed[0];

  if (history.isLoading)
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <Skeleton key={item} className="h-20 rounded-2xl" />
        ))}
      </div>
    );

  if (history.isError)
    return (
      <ErrorState
        message="Unable to load workout history."
        onRetry={() => history.refetch()}
      />
    );

  if (!sessions.length)
    return (
      <EmptyState
        title="No workout history yet"
      />
    );

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <ProgressStat
        icon={CheckCircle2}
        label="Completed Sessions"
        value={String(completed.length)}
        color="text-emerald-500"
      />
      <ProgressStat
        icon={TrendingUp}
        label="Logged Volume"
        value={
          totalVolume > 0
            ? `${Math.round(totalVolume).toLocaleString()} kg`
            : "—"
        }
        color="text-blue-500"
      />
      <ProgressStat
        icon={Activity}
        label="Last Workout"
        value={last ? new Date(last.sessionDate).toLocaleDateString() : "—"}
        color="text-violet-500"
      />
    </div>
  );
}

function ProgressStat({
  icon: Icon,
  label,
  value,
  color = "text-primary",
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[20px] border border-stone-200/70 bg-white/80 p-4 transition-all duration-200 hover:-translate-y-px hover:shadow-md">
      <div className="relative">
        <Icon className={`size-5 ${color}`} aria-hidden="true" />
        <p className="mt-3 font-mono text-xl font-black tabular-nums text-stone-950">{value}</p>
        <p className="mt-0.5 text-xs font-medium text-stone-600">
          {label}
        </p>
      </div>
    </div>
  );
}

function AttendanceStats({ memberId }: { memberId: string }) {
  const { data: attendance, isLoading } = useMemberAttendance(memberId);

  if (isLoading) return <Skeleton className="h-16 w-full rounded-xl" />;

  if (!attendance || attendance.length === 0)
    return (
      <p className="text-sm font-medium text-stone-600">No attendance records</p>
    );

  const thisMonth = attendance.filter((a) => {
    const date = new Date(a.checkInAt);
    const now = new Date();
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }).length;

  const last30Days = attendance.filter((a) => {
    const date = new Date(a.checkInAt);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    return diff <= 30 * 24 * 60 * 60 * 1000;
  }).length;

  const streak = calculateStreak(attendance.map((a) => a.checkInAt));

  return (
    <div className="flex flex-wrap gap-2.5">
      <div className="flex items-center gap-2 rounded-[16px] border border-emerald-200/70 bg-emerald-50/70 px-3 py-2">
        <CalendarCheck className="size-4 text-emerald-600" aria-hidden="true" />
        <span className="font-mono text-sm font-black tabular-nums text-stone-900">{thisMonth}</span>
        <span className="text-xs font-medium text-stone-600">this month</span>
      </div>
      <div className="flex items-center gap-2 rounded-[16px] border border-cyan-200/70 bg-cyan-50/70 px-3 py-2">
        <Clock className="size-4 text-cyan-700" aria-hidden="true" />
        <span className="font-mono text-sm font-black tabular-nums text-stone-900">{last30Days}</span>
        <span className="text-xs font-medium text-stone-600">last 30 days</span>
      </div>
      <div className="flex items-center gap-2 rounded-[16px] border border-violet-200/70 bg-violet-50/70 px-3 py-2">
        <Sparkles className="size-4 text-violet-600" aria-hidden="true" />
        <span className="font-mono text-sm font-black tabular-nums text-stone-900">{streak}</span>
        <span className="text-xs font-medium text-stone-600">day streak</span>
      </div>
    </div>
  );
}

function calculateStreak(dates: string[]): number {
  if (!dates.length) return 0;

  const sorted = [...dates]
    .map((d) => new Date(d).toDateString())
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let streak = 0;
  let current = new Date();

  for (const date of sorted) {
    const d = new Date(date);
    const diff = Math.floor(
      (current.getTime() - d.getTime()) / (24 * 60 * 60 * 1000)
    );
    if (diff <= 1) {
      streak++;
      current = d;
    } else {
      break;
    }
  }

  return streak;
}

function PaymentSummary({ memberId }: { memberId: string }) {
  const { data: payments, isLoading } = useMemberPayments(memberId);

  if (isLoading) return <Skeleton className="h-16 w-full rounded-xl" />;

  if (!payments || payments.length === 0)
    return <p className="text-sm font-medium text-stone-600">No payments recorded</p>;

  const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const paid = payments.filter((p) => p.status === "COMPLETED").length;
  const refunded = payments.filter((p) => p.status === "REFUNDED").length;

  return (
    <div className="flex flex-wrap gap-2.5">
      <div className="flex items-center gap-2 rounded-[16px] border border-emerald-200/70 bg-emerald-50/70 px-3 py-2">
        <Wallet className="size-4 text-emerald-600" aria-hidden="true" />
        <span className="font-mono text-sm font-black tabular-nums text-stone-900">
          {payments[0]?.currency || "USD"} {total.toLocaleString()}
        </span>
        <span className="text-xs font-medium text-stone-600">total paid</span>
      </div>
      <div className="flex items-center gap-2 rounded-[16px] border border-cyan-200/70 bg-cyan-50/70 px-3 py-2">
        <CheckCircle2 className="size-4 text-cyan-700" aria-hidden="true" />
        <span className="font-mono text-sm font-black tabular-nums text-stone-900">{paid}</span>
        <span className="text-xs font-medium text-stone-600">completed</span>
      </div>
      {refunded > 0 && (
        <div className="flex items-center gap-2 rounded-[16px] border border-amber-200/70 bg-amber-50/70 px-3 py-2">
          <AlertCircle className="size-4 text-amber-600" aria-hidden="true" />
          <span className="font-mono text-sm font-black tabular-nums text-stone-900">{refunded}</span>
          <span className="text-xs font-medium text-stone-600">refunded</span>
        </div>
      )}
    </div>
  );
}

function HealthOverview({ memberId }: { memberId: string }) {
  const { data: screenings, isLoading: screeningLoading } =
    useMemberScreenings(memberId);
  const { data: measurements, isLoading: measurementLoading } =
    useMemberMeasurements(memberId);
  const { data: goals, isLoading: goalsLoading } = useMemberGoals(memberId);

  if (screeningLoading || measurementLoading || goalsLoading)
    return <Skeleton className="h-16 w-full rounded-xl" />;

  const latestScreening = screenings?.[0];
  const latestMeasurement = measurements
    ? [...measurements].sort(
        (a, b) =>
          new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
      )[0]
    : null;
  const activeGoals = goals?.filter((g) => g.status === "ACTIVE").length ?? 0;

  const hasHealthConcerns = latestScreening?.responses
    ? Object.values(latestScreening.responses).some((v) => v === true)
    : false;

  return (
    <div className="flex flex-wrap gap-2.5">
      {latestMeasurement && (
        <div className="flex items-center gap-2 rounded-[16px] border border-violet-200/70 bg-violet-50/70 px-3 py-2">
          <BarChart3 className="size-4 text-violet-600" aria-hidden="true" />
          <span className="font-mono text-sm font-black tabular-nums text-stone-900">
            {latestMeasurement.weightKg ?? "—"}{" "}
            {latestMeasurement.weightKg ? "kg" : ""}
          </span>
          <span className="text-xs font-medium text-stone-600">weight</span>
        </div>
      )}
      {activeGoals > 0 && (
        <div className="flex items-center gap-2 rounded-[16px] border border-emerald-200/70 bg-emerald-50/70 px-3 py-2">
          <Target className="size-4 text-emerald-600" aria-hidden="true" />
          <span className="font-mono text-sm font-black tabular-nums text-stone-900">{activeGoals}</span>
          <span className="text-xs font-medium text-stone-600">active goals</span>
        </div>
      )}
      {hasHealthConcerns || latestScreening?.flaggedForMedicalClearance ? (
        <div className="flex items-center gap-2 rounded-[16px] border border-amber-200 bg-amber-50 px-3 py-2">
          <AlertCircle className="size-4 text-amber-600" aria-hidden="true" />
          <span className="text-sm font-bold text-amber-800">
            Medical attention
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-[16px] border border-emerald-200 bg-emerald-50 px-3 py-2">
          <Shield className="size-4 text-emerald-600" aria-hidden="true" />
          <span className="text-sm font-bold text-emerald-700">Cleared</span>
        </div>
      )}
    </div>
  );
}

const editMemberSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email address").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "UNDISCLOSED"]).optional(),
  memberType: z.enum(["GYM", "PT", "GYM_PT"]).optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
  fitnessGoal: z.string().optional(),
  injuries: z.string().optional(),
  allergies: z.string().optional(),
  medicalNotes: z.string().optional(),
  notes: z.string().optional(),
  assignedTrainerId: z.string().optional(),
  primaryBranchId: z.string().optional(),
});

type EditMemberFormData = z.infer<typeof editMemberSchema>;

function EditMemberDialog({
  member,
  children,
}: {
  member: MemberWithMemberships;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const updateMember = useUpdateMember(member.id);

  const form = useForm<EditMemberFormData>({
    resolver: zodResolver(editMemberSchema),
    defaultValues: {
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email ?? "",
      phone: member.phone ?? "",
      dateOfBirth: member.dateOfBirth ?? "",
      gender: (member.gender as EditMemberFormData["gender"]) ?? undefined,
      memberType: (member.memberType as EditMemberFormData["memberType"]) ?? undefined,
      addressLine1: member.addressLine1 ?? "",
      addressLine2: member.addressLine2 ?? "",
      city: member.city ?? "",
      state: member.state ?? "",
      postalCode: member.postalCode ?? "",
      country: member.country ?? "",
      emergencyContactName: member.emergencyContactName ?? "",
      emergencyContactPhone: member.emergencyContactPhone ?? "",
      emergencyContactRelationship: member.emergencyContactRelationship ?? "",
      fitnessGoal: member.fitnessGoal ?? "",
      injuries: member.injuries ?? "",
      allergies: member.allergies ?? "",
      medicalNotes: member.medicalNotes ?? "",
      notes: member.notes ?? "",
      assignedTrainerId: member.assignedTrainerId ?? "",
      primaryBranchId: member.primaryBranchId ?? "",
    },
  });

  async function onSubmit(values: EditMemberFormData) {
    try {
      await updateMember.mutateAsync(values);
      toast.success("Member updated successfully");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update member");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-white/90 bg-white/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl tracking-tight">Edit Member</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid h-auto w-full grid-cols-5 rounded-[18px] border border-violet-100/70 bg-gradient-to-r from-violet-50/80 via-white to-cyan-50/70 p-1.5">
                <TabsTrigger value="personal" className="min-h-11 rounded-xl font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-md">Personal</TabsTrigger>
                <TabsTrigger value="address" className="min-h-11 rounded-xl font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-md">Address</TabsTrigger>
                <TabsTrigger value="emergency" className="min-h-11 rounded-xl font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-md">Emergency</TabsTrigger>
                <TabsTrigger value="fitness" className="min-h-11 rounded-xl font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-md">Fitness</TabsTrigger>
                <TabsTrigger value="assignment" className="min-h-11 rounded-xl font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-md">Assignment</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="MALE">Male</SelectItem>
                            <SelectItem value="FEMALE">Female</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                            <SelectItem value="UNDISCLOSED">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="memberType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Member Type</FormLabel>
                      <Select
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select member type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="GYM">Gym</SelectItem>
                          <SelectItem value="PT">Personal Training</SelectItem>
                          <SelectItem value="GYM_PT">Gym + PT</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="address" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="addressLine1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 1</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="addressLine2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 2</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Code</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="emergency" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="emergencyContactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Contact Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergencyContactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Contact Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergencyContactRelationship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="fitness" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="fitnessGoal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fitness Goal</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="injuries"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Injuries</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="allergies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allergies</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="medicalNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medical Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="assignment" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="assignedTrainerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned Trainer ID</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="primaryBranchId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Branch ID</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button
                type="submit"
                disabled={updateMember.isPending}
              >
                {updateMember.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

interface MemberWithMemberships {
  id: string;
  firstName: string;
  lastName: string;
  memberCode: string;
  status: string;
  memberType: string | null;
  email: string | null;
  phone: string | null;
  joinedAt: string;
  dateOfBirth: string | null;
  gender: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null;
  fitnessGoal: string | null;
  injuries: string | null;
  allergies: string | null;
  medicalNotes: string | null;
  notes: string | null;
  assignedTrainerId: string | null;
  primaryBranchId: string | null;
  assignedTrainer: { id: string; firstName: string; lastName: string } | null;
  memberships: Array<{
    id: string;
    status: string;
    startDate: string;
    endDate: string;
    membershipPlan?: { id: string; name: string; price: string };
  }>;
}

function MemberHeader({
  member,
  activeMembership,
  daysLeft,
  allMemberships,
}: {
  member: MemberWithMemberships;
  activeMembership: {
    id: string;
    status: string;
    startDate: string;
    endDate: string;
    membershipPlan?: { id: string; name: string; price: string };
  } | undefined;
  daysLeft: number | null;
  allMemberships: Array<{
    id: string;
    status: string;
    startDate: string;
    endDate: string;
    membershipPlan?: { id: string; name: string; price: string };
  }>;
}) {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const deleteMember = useDeleteMember();
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  async function handleDelete() {
    try {
      await deleteMember.mutateAsync(member.id);
      toast.success(`${member.firstName} ${member.lastName} has been deleted`);
      setDeleteOpen(false);
      router.push("/members");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to delete member");
    }
  }

  return (
    <PageHero
      id="member-title"
      icon={Users}
      title={
        <>
          {member?.firstName} {member?.lastName}
        </>
      }
      variant="light"
      accent="violet"
      actions={
        <>
          {activeMembership && (
            <MembershipActions
              membershipId={activeMembership.id}
              status={activeMembership.status as MembershipStatus}
            />
          )}
          <SellMembershipDialog memberId={member?.id ?? ""} />
          <CollectPaymentDialog
            memberId={member?.id ?? ""}
            memberships={allMemberships}
          />
          <EditMemberDialog member={member}>
            <Button size="sm" variant="outline" className="min-h-11 rounded-2xl border-violet-200/70 bg-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">
              <Pencil className="size-3.5" aria-hidden="true" />
              Edit
            </Button>
          </EditMemberDialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="min-h-11 rounded-2xl border-violet-200/70 bg-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600">
                <MoreHorizontal className="size-3.5" aria-hidden="true" />
                More
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Member Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  await navigator.clipboard.writeText(member?.memberCode ?? "");
                  toast.success("Member code copied!");
                }}
              >
                <Copy className="size-3.5 mr-2" />
                Copy Member Code
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  window.open(`tel:${member?.phone ?? ""}`, "_self");
                }}
              >
                <Phone className="size-3.5 mr-2" />
                Call Member
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  window.open(`mailto:${member?.email ?? ""}`, "_self");
                }}
              >
                <Mail className="size-3.5 mr-2" />
                Email Member
              </DropdownMenuItem>
              {hasPermission("members.delete") && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeleteOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="size-3.5 mr-2" />
                    Delete Member
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant={
            member?.status === "ACTIVE"
              ? "default"
              : member?.status === "FROZEN"
                ? "warning"
                : "secondary"
          }
          className={`rounded-full px-2.5 py-1 text-[10px] font-black tracking-widest ring-1 ${
            member?.status === "ACTIVE"
              ? "bg-emerald-500/10 text-emerald-700 ring-emerald-200/70"
              : member?.status === "FROZEN"
                ? "bg-cyan-500/10 text-cyan-800 ring-cyan-200/70"
                : member?.status === "INACTIVE"
                  ? "bg-amber-500/15 text-amber-800 ring-amber-200/70"
                  : "bg-rose-500/10 text-rose-700 ring-rose-200/70"
          }`}
        >
          {member?.status}
        </Badge>
        {activeMembership ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-stone-200/70 bg-white/70 px-3 py-1.5 text-xs font-bold text-stone-700">
            {activeMembership.membershipPlan?.name || "Plan"}
            <Badge
              variant={
                MEMBERSHIP_STATUS_VARIANT[activeMembership.status as MembershipStatus] ||
                "secondary"
              }
              className="rounded-full"
            >
              {activeMembership.status}
            </Badge>
            {daysLeft !== null && (
              <span className={`font-mono tabular-nums ${daysLeft <= 7 ? "text-amber-700" : "text-emerald-600"}`}>
                {daysLeft}d left
              </span>
            )}
          </span>
        ) : (
          <span className="text-xs font-semibold text-stone-500">No active membership</span>
        )}
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete member</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-stone-600">
            {member.firstName} {member.lastName} will be marked inactive and removed from active
            member views. Their membership, payment, and activity history is preserved and this
            can be reversed by support if needed.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleteMember.isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleDelete()} disabled={deleteMember.isPending}>
              {deleteMember.isPending ? "Deleting..." : "Delete member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageHero>
  );
}

function QuickStatsRow({ memberId }: { memberId: string }) {
  return (
    <section aria-label="Member quick stats" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="group relative overflow-hidden border-white/90 bg-white/85 shadow-[0_20px_60px_-38px_rgba(79,70,229,.35)] backdrop-blur-xl transition duration-300 hover:-translate-y-1">
        <span className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-green-600" aria-hidden="true" />
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-[19px] bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 transition-transform duration-300 group-hover:scale-110">
            <Dumbbell className="size-6" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[.18em] text-stone-500">Workout</p>
            <div className="mt-2"><WorkoutProgress memberId={memberId} /></div>
          </div>
        </CardContent>
      </Card>

      <Card className="group relative overflow-hidden border-white/90 bg-white/85 shadow-[0_20px_60px_-38px_rgba(79,70,229,.35)] backdrop-blur-xl transition duration-300 hover:-translate-y-1">
        <span className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600" aria-hidden="true" />
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-[19px] bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 transition-transform duration-300 group-hover:scale-110">
            <CalendarCheck className="size-6" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[.18em] text-stone-500">
              Attendance
            </p>
            <div className="mt-2"><AttendanceStats memberId={memberId} /></div>
          </div>
        </CardContent>
      </Card>

      <Card className="group relative overflow-hidden border-white/90 bg-white/85 shadow-[0_20px_60px_-38px_rgba(79,70,229,.35)] backdrop-blur-xl transition duration-300 hover:-translate-y-1">
        <span className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600" aria-hidden="true" />
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-[19px] bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30 transition-transform duration-300 group-hover:scale-110">
            <Wallet className="size-6" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[.18em] text-stone-500">
              Payments
            </p>
            <div className="mt-2"><PaymentSummary memberId={memberId} /></div>
          </div>
        </CardContent>
      </Card>

      <Card className="group relative overflow-hidden border-white/90 bg-white/85 shadow-[0_20px_60px_-38px_rgba(79,70,229,.35)] backdrop-blur-xl transition duration-300 hover:-translate-y-1">
        <span className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500" aria-hidden="true" />
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-[19px] bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30 transition-transform duration-300 group-hover:scale-110">
            <Heart className="size-6" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[.18em] text-stone-500">Health</p>
            <div className="mt-2"><HealthOverview memberId={memberId} /></div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export function MemberDetailView({ memberId }: { memberId: string }) {
  const router = useRouter();
  const memberQuery = useMember(memberId);
  const [now] = React.useState(() => Date.now());

  if (memberQuery.isLoading)
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full rounded-3xl" />
        <Skeleton className="h-32 w-full" />
      </div>
    );

  if (memberQuery.isError || !memberQuery.data)
    return (
      <ErrorState
        message="Member not found or you don't have access."
        onRetry={() => memberQuery.refetch()}
      />
    );

  const member = memberQuery.data as unknown as MemberWithMemberships;
  const activeMembership = member.memberships.find(
    (m) => m.status === "ACTIVE" || m.status === "FROZEN"
  );
  const daysLeft = activeMembership
    ? Math.max(
        0,
        Math.ceil(
          (new Date(activeMembership.endDate).getTime() - now) / 86400000
        )
      )
    : null;

  return (
    <div className="flex flex-col gap-8">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl px-2 font-bold text-stone-600 hover:text-stone-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
        onClick={() => router.push("/members")}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to members
      </Button>

      {/* Sticky Header */}
      <MemberHeader
        member={member}
        activeMembership={activeMembership}
        daysLeft={daysLeft}
        allMemberships={member.memberships}
      />

      {/* Quick Stats */}
      <QuickStatsRow memberId={memberId} />

      {/* AI Progress Card */}
      <Card className="overflow-hidden rounded-[28px] border-white/90 bg-white/88 p-0 shadow-xl shadow-violet-900/5 backdrop-blur-xl">
        <CardContent className="p-0">
          <MemberAiProgress memberId={memberId} />
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Card className="overflow-hidden rounded-[28px] border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl">
        <CardContent className="p-4 sm:p-6">
          <Member360Tabs memberId={memberId} />
        </CardContent>
      </Card>
    </div>
  );
}

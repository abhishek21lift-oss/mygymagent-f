"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { toast } from "sonner";

import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useMember } from "@/lib/hooks/use-members";
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
} from "@/lib/hooks/use-memberships";
import { useMembershipPlans } from "@/lib/hooks/use-membership-plans";
import { ApiError } from "@/lib/api/client";
import type { MembershipStatus } from "@/lib/types/gym";

const MEMBERSHIP_STATUS_VARIANT: Record<MembershipStatus, "default" | "secondary" | "destructive" | "warning"> = {
  PENDING: "secondary",
  ACTIVE: "default",
  FROZEN: "warning",
  EXPIRED: "destructive",
  CANCELLED: "secondary",
};

const MEMBER_TYPE_LABELS: Record<string, string> = {
  GYM: "Gym",
  PT: "Personal Training",
  GYM_PT: "Gym + PT",
};

function SellMembershipDialog({ memberId }: { memberId: string }) {
  const [open, setOpen] = React.useState(false);
  const [planId, setPlanId] = React.useState("");
  const plansQuery = useMembershipPlans({ pageSize: 100 });
  const createMembership = useCreateMembership();

  async function handleSell() {
    if (!planId) return;
    try {
      await createMembership.mutateAsync({ memberId, membershipPlanId: planId });
      toast.success("Membership sold successfully");
      setOpen(false);
      setPlanId("");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to sell membership");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-xl">
          <Plus className="size-3.5" />
          Sell Membership
        </Button>
      </DialogTrigger>
      <DialogContent>
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

  if (status === "ACTIVE")
    return (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={freeze.isPending}
          onClick={() =>
            freeze
              .mutateAsync({ id: membershipId, days: 7 })
              .then(() => toast.success("Membership frozen for 7 days"))
              .catch((e) =>
                toast.error(e instanceof ApiError ? e.message : "Failed to freeze")
              )
          }
          className="rounded-xl"
        >
          <Snowflake className="size-3.5" />
          Freeze
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={cancel.isPending}
          onClick={() =>
            cancel
              .mutateAsync({ id: membershipId })
              .then(() => toast.success("Membership cancelled"))
              .catch((e) =>
                toast.error(e instanceof ApiError ? e.message : "Failed to cancel")
              )
          }
          className="rounded-xl text-destructive hover:text-destructive"
        >
          <XCircle className="size-3.5" />
          Cancel
        </Button>
      </div>
    );

  if (status === "FROZEN")
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={resume.isPending}
        onClick={() =>
          resume
            .mutateAsync(membershipId)
            .then(() => toast.success("Membership resumed"))
            .catch((e) =>
              toast.error(e instanceof ApiError ? e.message : "Failed to resume")
            )
        }
        className="rounded-xl"
      >
        <PlayCircle className="size-3.5" />
        Resume
      </Button>
    );

  return null;
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
        description="Completed training sessions will appear here automatically."
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
    <div className="group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card to-muted/20 p-4 transition-all hover:shadow-md">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative">
        <Icon className={`size-5 ${color}`} />
        <p className="mt-3 text-xl font-bold">{value}</p>
        <p className="mt-0.5 text-xs font-medium text-muted-foreground">
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
      <p className="text-sm text-muted-foreground">No attendance records</p>
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
    <div className="flex flex-wrap gap-4">
      <div className="flex items-center gap-2 rounded-xl bg-card border px-3 py-2">
        <CalendarCheck className="size-4 text-emerald-500" />
        <span className="text-sm font-medium">{thisMonth}</span>
        <span className="text-xs text-muted-foreground">this month</span>
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-card border px-3 py-2">
        <Clock className="size-4 text-blue-500" />
        <span className="text-sm font-medium">{last30Days}</span>
        <span className="text-xs text-muted-foreground">last 30 days</span>
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-card border px-3 py-2">
        <Sparkles className="size-4 text-amber-500" />
        <span className="text-sm font-medium">{streak}</span>
        <span className="text-xs text-muted-foreground">day streak</span>
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
    return <p className="text-sm text-muted-foreground">No payments recorded</p>;

  const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const paid = payments.filter((p) => p.status === "COMPLETED").length;
  const refunded = payments.filter((p) => p.status === "REFUNDED").length;

  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex items-center gap-2 rounded-xl bg-card border px-3 py-2">
        <Wallet className="size-4 text-emerald-500" />
        <span className="text-sm font-bold">
          {payments[0]?.currency || "USD"} {total.toLocaleString()}
        </span>
        <span className="text-xs text-muted-foreground">total paid</span>
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-card border px-3 py-2">
        <CheckCircle2 className="size-4 text-blue-500" />
        <span className="text-sm font-medium">{paid}</span>
        <span className="text-xs text-muted-foreground">completed</span>
      </div>
      {refunded > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-card border px-3 py-2">
          <AlertCircle className="size-4 text-amber-500" />
          <span className="text-sm font-medium">{refunded}</span>
          <span className="text-xs text-muted-foreground">refunded</span>
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
    <div className="flex flex-wrap gap-4">
      {latestMeasurement && (
        <div className="flex items-center gap-2 rounded-xl bg-card border px-3 py-2">
          <BarChart3 className="size-4 text-violet-500" />
          <span className="text-sm font-medium">
            {latestMeasurement.weightKg ?? "—"}{" "}
            {latestMeasurement.weightKg ? "kg" : ""}
          </span>
          <span className="text-xs text-muted-foreground">weight</span>
        </div>
      )}
      {activeGoals > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-card border px-3 py-2">
          <Target className="size-4 text-emerald-500" />
          <span className="text-sm font-medium">{activeGoals}</span>
          <span className="text-xs text-muted-foreground">active goals</span>
        </div>
      )}
      {hasHealthConcerns || latestScreening?.flaggedForMedicalClearance ? (
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
          <AlertCircle className="size-4 text-amber-500" />
          <span className="text-sm font-medium text-amber-700">
            Medical attention
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2">
          <Shield className="size-4 text-emerald-500" />
          <span className="text-sm font-medium text-emerald-700">Cleared</span>
        </div>
      )}
    </div>
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
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/[0.08] via-card to-card p-6 shadow-sm sm:p-8">
      {/* Decorative gradient orbs */}
      <div className="absolute -right-20 -top-20 size-64 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-3xl" />
      <div className="absolute -bottom-10 -left-10 size-40 rounded-full bg-gradient-to-tr from-violet-200/30 to-transparent blur-2xl" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Avatar + Info */}
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="relative">
            <div className="flex size-18 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-violet-500 shadow-lg shadow-primary/20">
              <span className="text-2xl font-bold text-white">
                {member?.firstName?.[0]}
                {member?.lastName?.[0]}
              </span>
            </div>
            <div
              className={`absolute -bottom-1 -right-1 size-4 rounded-full border-2 border-card ${
                member?.status === "ACTIVE"
                  ? "bg-emerald-500"
                  : member?.status === "FROZEN"
                    ? "bg-amber-500"
                    : "bg-muted-foreground"
              }`}
            />
          </div>

          {/* Info */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {member?.firstName} {member?.lastName}
              </h1>
              <Badge
                variant={
                  member?.status === "ACTIVE"
                    ? "default"
                    : member?.status === "FROZEN"
                      ? "warning"
                      : "secondary"
                }
                className="rounded-full"
              >
                {member?.status}
              </Badge>
              {member?.memberType && (
                <Badge variant="outline" className="rounded-full">
                  {MEMBER_TYPE_LABELS[member.memberType] || member.memberType}
                </Badge>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="font-mono">{member?.memberCode}</span>
              <span>·</span>
              <span>
                Joined{" "}
                {member?.joinedAt
                  ? new Date(member.joinedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—"}
              </span>
              {member?.assignedTrainer && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Users className="size-3.5" />
                    {member.assignedTrainer.firstName}{" "}
                    {member.assignedTrainer.lastName}
                  </span>
                </>
              )}
            </div>

            {/* Contact info */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              {member?.phone && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Phone className="size-3.5" />
                  {member.phone}
                </span>
              )}
              {member?.email && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="size-3.5" />
                  {member.email}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Membership + Actions */}
        <div className="flex flex-col items-start gap-4 lg:items-end">
          {activeMembership ? (
            <div className="rounded-2xl border bg-card/80 backdrop-blur-sm px-4 py-3">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Active Membership
                  </p>
                  <p className="font-semibold">
                    {activeMembership.membershipPlan?.name || "Plan"}
                  </p>
                </div>
                <Separator orientation="vertical" className="h-8" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Status
                  </p>
                  <Badge
                    variant={
                      MEMBERSHIP_STATUS_VARIANT[activeMembership.status as MembershipStatus] ||
                      "secondary"
                    }
                    className="rounded-full"
                  >
                    {activeMembership.status}
                  </Badge>
                </div>
                {daysLeft !== null && (
                  <>
                    <Separator orientation="vertical" className="h-8" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Days Left
                      </p>
                      <p
                        className={`font-bold ${daysLeft <= 7 ? "text-amber-600" : "text-emerald-600"}`}
                      >
                        {daysLeft}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-muted-foreground/30 bg-muted/20 px-4 py-3">
              <p className="text-sm text-muted-foreground">
                No active membership
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {activeMembership && (
              <MembershipActions
                membershipId={activeMembership.id}
                status={activeMembership.status as MembershipStatus}
              />
            )}
            <SellMembershipDialog memberId={member?.id ?? ""} />
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickStatsRow({ memberId }: { memberId: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="border-0 shadow-sm">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
            <Dumbbell className="size-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Workout</p>
            <WorkoutProgress memberId={memberId} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5">
            <CalendarCheck className="size-6 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Attendance
            </p>
            <AttendanceStats memberId={memberId} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5">
            <Wallet className="size-6 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Payments
            </p>
            <PaymentSummary memberId={memberId} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/10 to-violet-500/5">
            <Heart className="size-6 text-violet-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Health</p>
            <HealthOverview memberId={memberId} />
          </div>
        </CardContent>
      </Card>
    </div>
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

  const member = memberQuery.data as MemberWithMemberships;
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
    <div className="flex flex-col gap-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 w-fit text-muted-foreground hover:text-foreground"
        onClick={() => router.push("/members")}
      >
        <ArrowLeft className="size-4" />
        Back to members
      </Button>

      {/* Sticky Header */}
      <MemberHeader
        member={member}
        activeMembership={activeMembership}
        daysLeft={daysLeft}
      />

      {/* Quick Stats */}
      <QuickStatsRow memberId={memberId} />

      {/* AI Progress Card */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <MemberAiProgress memberId={memberId} />
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <Member360Tabs memberId={memberId} />
        </CardContent>
      </Card>
    </div>
  );
}

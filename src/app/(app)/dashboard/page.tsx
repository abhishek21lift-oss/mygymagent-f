"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  CreditCard,
  Dumbbell,
  Megaphone,
  Sparkles,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";
import { useMembers } from "@/lib/hooks/use-members";
import { useMemberships } from "@/lib/hooks/use-memberships";
import { useAttendance } from "@/lib/hooks/use-attendance";
import { useBranches } from "@/lib/hooks/use-branches";

function todayRangeLabel() {
  return new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: string | string[];
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    title: "Add a member",
    description: "Register a new client",
    href: "/members/new",
    icon: UserPlus,
    permission: "members.create",
  },
  {
    title: "Record a payment",
    description: "Log cash, card, or UPI",
    href: "/billing",
    icon: Wallet,
    permission: "payments.create",
  },
  {
    title: "Check in a member",
    description: "Record attendance",
    href: "/attendance",
    icon: CalendarCheck,
    permission: "attendance.create",
  },
  {
    title: "Build a workout",
    description: "Create or assign a plan",
    href: "/workouts",
    icon: Dumbbell,
    permission: "workouts.create",
  },
  {
    title: "Add a lead",
    description: "Track a new prospect",
    href: "/crm",
    icon: Megaphone,
    permission: "leads.manage",
  },
  {
    title: "Ask the AI assistant",
    description: "Draft plans, look up members",
    href: "/ai",
    icon: Sparkles,
    permission: "ai.generate",
  },
];

export default function DashboardPage() {
  const { user, hasPermission } = useAuth();

  const membersQuery = useMembers({ pageSize: 1 });
  const membershipsQuery = useMemberships({ pageSize: 1 });
  const attendanceQuery = useAttendance({ pageSize: 1 });
  const branchesQuery = useBranches({ pageSize: 1 });

  const visibleActions = QUICK_ACTIONS.filter((action) => hasPermission(action.permission));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={`Welcome back, ${user?.firstName ?? ""}`} description={todayRangeLabel()} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {hasPermission(["members.read", "members.read_assigned"]) && (
          <StatCard
            title="Total members"
            icon={Users}
            value={membersQuery.data?.total}
            isLoading={membersQuery.isLoading}
          />
        )}
        {hasPermission("memberships.read") && (
          <StatCard
            title="Active memberships"
            icon={CreditCard}
            value={membershipsQuery.data?.total}
            isLoading={membershipsQuery.isLoading}
            tone="success"
          />
        )}
        {hasPermission("attendance.read") && (
          <StatCard
            title="Attendance records"
            icon={CalendarCheck}
            value={attendanceQuery.data?.total}
            isLoading={attendanceQuery.isLoading}
            hint="All-time"
          />
        )}
        {hasPermission("branches.read") && (
          <StatCard
            title="Branches"
            icon={Building2}
            value={branchesQuery.data?.total}
            isLoading={branchesQuery.isLoading}
          />
        )}
      </div>

      {visibleActions.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Quick actions</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleActions.map((action) => (
              <Link key={action.href + action.title} href={action.href}>
                <Card className="group gap-0 py-4 transition-all hover:border-primary/40 hover:shadow-md">
                  <CardContent className="flex items-center gap-3 px-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <action.icon className="size-5" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="text-sm font-medium">{action.title}</span>
                      <span className="truncate text-xs text-muted-foreground">{action.description}</span>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">What&apos;s next</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Revenue trends, churn, and trainer-performance analytics land with the Analytics module
          next. Everything else in the sidebar is live: Members, Billing, Workouts, Nutrition,
          Inventory, Leads/CRM, and the AI Assistant all reflect real data today.
        </CardContent>
      </Card>
    </div>
  );
}

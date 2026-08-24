"use client";

import Link from "next/link";
import * as React from "react";
import { ArrowRight, CheckCircle2, ClipboardCheck, Dumbbell, UserRound, Users } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";
import {
  useUpdateWorkoutAssignmentStatus,
  useWorkoutAssignments,
} from "@/lib/hooks/use-workouts";
import type { WorkoutAssignment } from "@/lib/types/gym";
import { ApiError } from "@/lib/api/client";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function AssignmentRow({ assignment }: { assignment: WorkoutAssignment }) {
  const { hasPermission } = useAuth();
  const updateStatus = useUpdateWorkoutAssignmentStatus();
  const member = assignment.member;
  const plan = assignment.workoutPlan;

  async function markComplete() {
    try {
      await updateStatus.mutateAsync({ id: assignment.id, status: "COMPLETED" });
      toast.success("Workout assignment marked complete");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to update assignment");
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UserRound className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium">
            {member ? `${member.firstName} ${member.lastName}` : "Member unavailable"}
          </p>
          <p className="truncate text-sm text-muted-foreground">{plan?.name ?? "Workout plan unavailable"}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>{formatDate(assignment.startDate)}</span>
        <Badge variant={assignment.status === "ACTIVE" ? "default" : assignment.status === "COMPLETED" ? "success" : "secondary"}>
          {assignment.status}
        </Badge>
      </div>

      <div className="flex items-center gap-2 sm:ml-2">
        {member && (
          <Button asChild variant="ghost" size="sm">
            <Link href={`/members/${member.id}`}>
              Client <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        )}
        {assignment.status === "ACTIVE" && hasPermission("workouts.assign") && (
          <Button variant="outline" size="sm" disabled={updateStatus.isPending} onClick={markComplete}>
            <CheckCircle2 className="size-4" />
            {updateStatus.isPending ? "Saving..." : "Complete"}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function PtoOperationsPage() {
  const assignmentsQuery = useWorkoutAssignments({ page: 1, pageSize: 50, order: "desc" });
  const assignments = assignmentsQuery.data?.items ?? [];
  const active = assignments.filter((item) => item.status === "ACTIVE");
  const completed = assignments.filter((item) => item.status === "COMPLETED");
  const uniqueMembers = new Set(active.map((item) => item.memberId)).size;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="PT Operations"
        description="Run your personal-training workload from one operational view."
        actions={
          <Button asChild variant="outline">
            <Link href="/workouts">
              <Dumbbell className="size-4" />
              Manage workouts
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active assignments" icon={ClipboardCheck} value={active.length} isLoading={assignmentsQuery.isLoading} />
        <StatCard title="Active clients" icon={Users} value={uniqueMembers} isLoading={assignmentsQuery.isLoading} tone="primary" />
        <StatCard title="Completed" icon={CheckCircle2} value={completed.length} isLoading={assignmentsQuery.isLoading} tone="success" />
        <StatCard title="Plans in workload" icon={Dumbbell} value={new Set(active.map((item) => item.workoutPlanId)).size} isLoading={assignmentsQuery.isLoading} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">Active PT workload</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Assignments currently requiring trainer attention.</p>
          </div>
          <Badge variant="outline">{active.length} active</Badge>
        </CardHeader>
        <CardContent>
          {assignmentsQuery.isError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              Unable to load PT assignments. Refresh the page and try again.
            </div>
          ) : active.length === 0 && !assignmentsQuery.isLoading ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <ClipboardCheck className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 font-medium">No active PT assignments</p>
              <p className="mt-1 text-sm text-muted-foreground">Assign a workout plan to a client to start building the workload.</p>
              <Button asChild className="mt-4">
                <Link href="/workouts">Assign a workout</Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {active.map((assignment) => (
                <AssignmentRow key={assignment.id} assignment={assignment} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent completions</CardTitle>
        </CardHeader>
        <CardContent>
          {completed.length === 0 ? (
            <p className="text-sm text-muted-foreground">No completed assignments in the current workload window.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {completed.slice(0, 10).map((assignment) => (
                <AssignmentRow key={assignment.id} assignment={assignment} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

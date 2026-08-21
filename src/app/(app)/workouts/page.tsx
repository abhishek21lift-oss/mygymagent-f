"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, Trash2, UserPlus } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { MemberPicker } from "@/components/shared/member-picker";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth/auth-context";
import {
  useExercises,
  useCreateExercise,
  useWorkoutPlans,
  useCreateWorkoutPlan,
  useAssignWorkoutPlan,
  useWorkoutAssignments,
  useUpdateWorkoutAssignmentStatus,
} from "@/lib/hooks/use-workouts";
import { ApiError } from "@/lib/api/client";
import {
  createExerciseSchema,
  createWorkoutPlanSchema,
  assignWorkoutPlanSchema,
  type CreateExerciseInput,
  type CreateWorkoutPlanInput,
  type AssignWorkoutPlanInput,
} from "@/lib/validation/gym";
import type { WorkoutAssignment, WorkoutAssignmentStatus } from "@/lib/types/gym";

function AddExerciseDialog() {
  const [open, setOpen] = React.useState(false);
  const createExercise = useCreateExercise();

  const form = useForm<CreateExerciseInput>({
    resolver: zodResolver(createExerciseSchema),
    defaultValues: { name: "", muscleGroup: "", equipment: "", description: "" },
  });

  async function onSubmit(values: CreateExerciseInput) {
    try {
      await createExercise.mutateAsync(values);
      toast.success("Exercise added");
      setOpen(false);
      form.reset();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to add exercise");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus />
          Add exercise
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New exercise</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Back Squat" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="muscleGroup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Muscle group</FormLabel>
                    <FormControl>
                      <Input placeholder="Legs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="equipment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipment</FormLabel>
                    <FormControl>
                      <Input placeholder="Barbell" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createExercise.isPending}>
                {createExercise.isPending ? "Adding..." : "Add exercise"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function CreatePlanDialog() {
  const [open, setOpen] = React.useState(false);
  const exercisesQuery = useExercises();
  const createPlan = useCreateWorkoutPlan();

  const form = useForm<CreateWorkoutPlanInput>({
    resolver: zodResolver(createWorkoutPlanSchema),
    defaultValues: { name: "", description: "", exercises: [] },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "exercises",
  });

  function addRow() {
    append({
      exerciseId: "",
      order: fields.length + 1,
      sets: 3,
      reps: "8-12",
      restSeconds: 60,
      notes: "",
    });
  }

  async function onSubmit(values: CreateWorkoutPlanInput) {
    try {
      await createPlan.mutateAsync(values);
      toast.success("Workout plan created");
      setOpen(false);
      form.reset({ name: "", description: "", exercises: [] });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to create plan");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          New plan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New workout plan</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Beginner Strength" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Exercises</p>
              <Button type="button" variant="outline" size="sm" onClick={addRow}>
                <Plus className="size-3.5" />
                Add exercise
              </Button>
            </div>

            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Add at least one exercise to this plan.
              </p>
            )}

            <div className="flex flex-col gap-3 max-h-72 overflow-y-auto">
              {fields.map((field, index) => (
                <div key={field.id} className="rounded-lg border p-3">
                  <div className="mb-2 flex items-start gap-2">
                    <FormField
                      control={form.control}
                      name={`exercises.${index}.exerciseId`}
                      render={({ field: exField }) => (
                        <FormItem className="flex-1">
                          <Select value={exField.value} onValueChange={exField.onChange}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select an exercise" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {exercisesQuery.data?.map((ex) => (
                                <SelectItem key={ex.id} value={ex.id}>
                                  {ex.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <FormField
                      control={form.control}
                      name={`exercises.${index}.sets`}
                      render={({ field: setsField }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Sets</FormLabel>
                          <FormControl>
                            <Input type="number" {...setsField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`exercises.${index}.reps`}
                      render={({ field: repsField }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Reps</FormLabel>
                          <FormControl>
                            <Input placeholder="8-12" {...repsField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`exercises.${index}.restSeconds`}
                      render={({ field: restField }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Rest (s)</FormLabel>
                          <FormControl>
                            <Input type="number" {...restField} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button type="submit" disabled={createPlan.isPending}>
                {createPlan.isPending ? "Creating..." : "Create plan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AssignPlanDialog({ planId, planName }: { planId: string; planName: string }) {
  const [open, setOpen] = React.useState(false);
  const [member, setMember] = React.useState<{ id: string; label: string } | null>(null);
  const assignPlan = useAssignWorkoutPlan();

  const form = useForm<Omit<AssignWorkoutPlanInput, "memberId">>({
    resolver: zodResolver(assignWorkoutPlanSchema.omit({ memberId: true })),
    defaultValues: { notes: "" },
  });

  async function onSubmit(values: Omit<AssignWorkoutPlanInput, "memberId">) {
    if (!member) {
      toast.error("Select a member first");
      return;
    }
    try {
      await assignPlan.mutateAsync({ planId, input: { ...values, memberId: member.id } });
      toast.success(`Assigned "${planName}" to ${member.label}`);
      setOpen(false);
      setMember(null);
      form.reset();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to assign plan");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setMember(null);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="size-3.5" />
          Assign
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign &quot;{planName}&quot;</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-1.5 text-sm font-medium">Member</p>
            <MemberPicker value={member} onChange={setMember} />
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optional)</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={assignPlan.isPending}>
                  {assignPlan.isPending ? "Assigning..." : "Assign plan"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const assignmentStatusVariant: Record<WorkoutAssignmentStatus, "default" | "success" | "secondary"> = {
  ACTIVE: "default",
  COMPLETED: "success",
  CANCELLED: "secondary",
};

function AssignmentStatusCell({ assignment }: { assignment: WorkoutAssignment }) {
  const { hasPermission } = useAuth();
  const updateStatus = useUpdateWorkoutAssignmentStatus();

  if (assignment.status !== "ACTIVE" || !hasPermission("workouts.assign")) {
    return (
      <Badge variant={assignmentStatusVariant[assignment.status]}>{assignment.status}</Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant={assignmentStatusVariant[assignment.status]}>{assignment.status}</Badge>
      <Button
        variant="ghost"
        size="sm"
        disabled={updateStatus.isPending}
        onClick={() =>
          updateStatus
            .mutateAsync({ id: assignment.id, status: "COMPLETED" })
            .then(() => toast.success("Marked complete"))
            .catch((e) => toast.error(e instanceof ApiError ? e.message : "Failed to update"))
        }
      >
        Mark complete
      </Button>
    </div>
  );
}

const assignmentColumns: ColumnDef<WorkoutAssignment>[] = [
  {
    header: "Member",
    accessorKey: "member",
    cell: ({ row }) => {
      const m = row.original.member;
      return m ? `${m.firstName} ${m.lastName}` : "—";
    },
  },
  {
    header: "Plan",
    accessorKey: "workoutPlan",
    cell: ({ row }) => row.original.workoutPlan?.name ?? "—",
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row }) => <AssignmentStatusCell assignment={row.original} />,
  },
  {
    header: "Assigned",
    accessorKey: "startDate",
    cell: ({ row }) => new Date(row.original.startDate).toLocaleDateString(),
  },
];

export default function WorkoutsPage() {
  const { hasPermission } = useAuth();
  const exercisesQuery = useExercises();
  const plansQuery = useWorkoutPlans({ pageSize: 50 });
  const [assignmentsPage, setAssignmentsPage] = React.useState(1);
  const assignmentsQuery = useWorkoutAssignments({ page: assignmentsPage, pageSize: 10, order: "desc" });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Workouts"
        description="Exercise library, workout plans, and assignments"
        actions={hasPermission("workouts.create") && <CreatePlanDialog />}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Exercise library</CardTitle>
          {hasPermission("workouts.create") && <AddExerciseDialog />}
        </CardHeader>
        <CardContent>
          {!exercisesQuery.data || exercisesQuery.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No exercises yet. Add your gym&apos;s exercises to start building plans.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {exercisesQuery.data.map((ex) => (
                <Badge key={ex.id} variant="outline">
                  {ex.name}
                  {ex.muscleGroup && <span className="text-muted-foreground"> · {ex.muscleGroup}</span>}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-medium">Plans</h2>
        {plansQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : !plansQuery.data || plansQuery.data.items.length === 0 ? (
          <EmptyState
            title="No workout plans yet"
            description="Create a plan and assign it to a member to get started."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plansQuery.data.items.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 text-sm">
                  {plan.description && (
                    <p className="text-muted-foreground">{plan.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {plan.exercises.length} exercise{plan.exercises.length === 1 ? "" : "s"}
                  </p>
                  {hasPermission("workouts.assign") && (
                    <AssignPlanDialog planId={plan.id} planName={plan.name} />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">Assignments</h2>
        <DataTable
          columns={assignmentColumns}
          data={assignmentsQuery.data}
          isLoading={assignmentsQuery.isLoading}
          isError={assignmentsQuery.isError}
          onRetry={() => assignmentsQuery.refetch()}
          page={assignmentsPage}
          onPageChange={setAssignmentsPage}
          emptyTitle="No plans assigned yet"
        />
      </div>
    </div>
  );
}

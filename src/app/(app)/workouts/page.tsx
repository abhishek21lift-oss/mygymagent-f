"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Dumbbell, Layers3, Plus, Trash2, UserPlus, Users } from "lucide-react";
import { MemberPicker } from "@/components/shared/member-picker";
import { PageHero } from "@/components/shared/page-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth/auth-context";
import { useCreateExercise, useCreateWorkoutPlan, useExercises, useAssignWorkoutPlan, useUpdateWorkoutAssignmentStatus, useWorkoutAssignments, useWorkoutPlans } from "@/lib/hooks/use-workouts";
import { ApiError } from "@/lib/api/client";
import { assignWorkoutPlanSchema, createExerciseSchema, createWorkoutPlanSchema, type AssignWorkoutPlanInput, type CreateExerciseInput, type CreateWorkoutPlanInput } from "@/lib/validation/gym";
import type { WorkoutAssignment } from "@/lib/types/gym";

function AddExerciseDialog() {
  const [open, setOpen] = React.useState(false);
  const create = useCreateExercise();
  const form = useForm<CreateExerciseInput>({ resolver: zodResolver(createExerciseSchema), defaultValues: { name: "", muscleGroup: "", equipment: "", description: "" } });
  async function submit(v: CreateExerciseInput) {
    try {
      await create.mutateAsync(v);
      toast.success("Exercise added");
      setOpen(false);
      form.reset();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to add exercise");
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="min-h-11 rounded-2xl border-stone-200 bg-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600">
          <Plus className="size-4" aria-hidden="true" />Add exercise
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New exercise</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="Back Squat" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField control={form.control} name="muscleGroup" render={({ field }) => (
                <FormItem><FormLabel>Muscle group</FormLabel><FormControl><Input placeholder="Legs" {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="equipment" render={({ field }) => (
                <FormItem><FormLabel>Equipment</FormLabel><FormControl><Input placeholder="Barbell" {...field} /></FormControl></FormItem>
              )} />
            </div>
            <DialogFooter><Button type="submit" disabled={create.isPending} className="min-h-11">{create.isPending ? "Adding..." : "Add exercise"}</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function CreatePlanDialog() {
  const [open, setOpen] = React.useState(false);
  const exercises = useExercises();
  const create = useCreateWorkoutPlan();
  const form = useForm<CreateWorkoutPlanInput>({ resolver: zodResolver(createWorkoutPlanSchema), defaultValues: { name: "", description: "", exercises: [] } });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "exercises" });
  function add() {
    append({ exerciseId: "", order: fields.length + 1, sets: 3, reps: "8-12", restSeconds: 60, notes: "" });
  }
  async function submit(v: CreateWorkoutPlanInput) {
    try {
      await create.mutateAsync(v);
      toast.success("Workout plan created");
      setOpen(false);
      form.reset({ name: "", description: "", exercises: [] });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to create plan");
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="min-h-11 rounded-2xl bg-[linear-gradient(105deg,#e11d48,#f97316_55%,#0891b2)] text-white shadow-lg shadow-rose-500/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600">
          <Plus className="size-4" aria-hidden="true" />New plan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader><DialogTitle>New workout plan</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Plan name</FormLabel><FormControl><Input placeholder="Beginner Strength" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl></FormItem>
            )} />
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">Exercises</p>
              <Button type="button" variant="outline" size="sm" onClick={add} className="min-h-11"><Plus className="size-3.5" aria-hidden="true" />Add exercise</Button>
            </div>
            {fields.length === 0 ? (
              <p className="rounded-xl bg-stone-50 p-4 text-xs font-medium text-stone-600">Add at least one exercise to this plan.</p>
            ) : (
              <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
                {fields.map((field, index) => (
                  <div key={field.id} className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50/60 to-orange-50/40 p-3">
                    <div className="flex gap-2">
                      <FormField control={form.control} name={`exercises.${index}.exerciseId`} render={({ field: f }) => (
                        <FormItem className="flex-1">
                          <Select value={f.value} onValueChange={f.onChange}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select an exercise" /></SelectTrigger></FormControl>
                            <SelectContent>{exercises.data?.map((ex) => <SelectItem key={ex.id} value={ex.id}>{ex.name}</SelectItem>)}</SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} aria-label="Remove exercise" className="min-h-11 min-w-11"><Trash2 className="size-4" aria-hidden="true" /></Button>
                    </div>
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <FormField control={form.control} name={`exercises.${index}.sets`} render={({ field: f }) => (
                        <FormItem><FormLabel className="text-xs">Sets</FormLabel><FormControl><Input type="number" {...f} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name={`exercises.${index}.reps`} render={({ field: f }) => (
                        <FormItem><FormLabel className="text-xs">Reps</FormLabel><FormControl><Input {...f} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name={`exercises.${index}.restSeconds`} render={({ field: f }) => (
                        <FormItem><FormLabel className="text-xs">Rest (s)</FormLabel><FormControl><Input type="number" {...f} /></FormControl></FormItem>
                      )} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <DialogFooter><Button type="submit" disabled={create.isPending} className="min-h-11">{create.isPending ? "Creating..." : "Create plan"}</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AssignDialog({ planId, planName }: { planId: string; planName: string }) {
  const [open, setOpen] = React.useState(false);
  const [member, setMember] = React.useState<{ id: string; label: string } | null>(null);
  const assign = useAssignWorkoutPlan();
  const form = useForm<Omit<AssignWorkoutPlanInput, "memberId">>({ resolver: zodResolver(assignWorkoutPlanSchema.omit({ memberId: true })), defaultValues: { notes: "" } });
  async function submit(v: Omit<AssignWorkoutPlanInput, "memberId">) {
    if (!member) return toast.error("Select a member first");
    try {
      await assign.mutateAsync({ planId, input: { ...v, memberId: member.id } });
      toast.success(`Assigned "${planName}" to ${member.label}`);
      setOpen(false);
      setMember(null);
      form.reset();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to assign plan");
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="min-h-11 rounded-xl border-rose-200 bg-rose-50/60 text-rose-800 hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600">
          <UserPlus className="size-3.5" aria-hidden="true" />Assign
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Assign &quot;{planName}&quot;</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <MemberPicker value={member} onChange={setMember} />
          <Form {...form}>
            <form onSubmit={form.handleSubmit(submit)}>
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Notes (optional)</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl></FormItem>
              )} />
              <DialogFooter className="mt-4"><Button type="submit" disabled={assign.isPending} className="min-h-11">{assign.isPending ? "Assigning..." : "Assign plan"}</Button></DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AssignmentRow({ assignment }: { assignment: WorkoutAssignment }) {
  const { hasPermission } = useAuth();
  const update = useUpdateWorkoutAssignmentStatus();
  const member = assignment.member;
  async function complete() {
    try {
      await update.mutateAsync({ id: assignment.id, status: "COMPLETED" });
      toast.success("Marked complete");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to update");
    }
  }
  return (
    <div className="group flex flex-col gap-3 rounded-[22px] border border-stone-200/80 bg-white/70 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-rose-200 hover:bg-white hover:shadow-[0_20px_50px_-30px_rgba(244,63,94,.4)] sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-md shadow-rose-500/25 transition-transform duration-200 group-hover:scale-110" aria-hidden="true">
          <UserPlus className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-stone-900">{member ? `${member.firstName} ${member.lastName}` : "Member unavailable"}</p>
          <p className="truncate text-xs font-medium text-stone-600">{assignment.workoutPlan?.name ?? "Workout plan"}</p>
        </div>
      </div>
      <Badge variant={assignment.status === "ACTIVE" ? "default" : assignment.status === "COMPLETED" ? "success" : "secondary"}>{assignment.status}</Badge>
      {assignment.status === "ACTIVE" && hasPermission("workouts.assign") && (
        <Button size="sm" variant="ghost" disabled={update.isPending} onClick={complete} className="min-h-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600">Complete</Button>
      )}
    </div>
  );
}

type MetricTone = "rose" | "orange" | "cyan";

const METRIC_TONES: Record<MetricTone, { bar: string; tile: string; orb: string; ring: string }> = {
  rose: {
    bar: "from-rose-500 via-red-500 to-orange-500",
    tile: "from-rose-500 to-orange-500 shadow-rose-500/30",
    orb: "bg-rose-400/20",
    ring: "hover:border-rose-200 hover:shadow-rose-500/10",
  },
  orange: {
    bar: "from-orange-400 via-amber-500 to-rose-500",
    tile: "from-orange-500 to-amber-500 shadow-orange-500/30",
    orb: "bg-orange-400/20",
    ring: "hover:border-orange-200 hover:shadow-orange-500/10",
  },
  cyan: {
    bar: "from-cyan-400 via-sky-500 to-blue-600",
    tile: "from-cyan-500 to-blue-600 shadow-cyan-500/30",
    orb: "bg-cyan-400/20",
    ring: "hover:border-cyan-200 hover:shadow-cyan-500/10",
  },
};

function Metric({ icon: Icon, label, value, hint, tone }: { icon: typeof Users; label: string; value: React.ReactNode; hint?: string; tone: MetricTone }) {
  const t = METRIC_TONES[tone];
  return (
    <Card className={`group relative overflow-hidden border-white/90 bg-white/85 shadow-[0_20px_60px_-38px_rgba(79,70,229,.35)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_-38px_rgba(79,70,229,.42)] ${t.ring}`}>
      <span className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${t.bar}`} aria-hidden="true" />
      <div className={`pointer-events-none absolute -right-10 -top-10 size-32 rounded-full blur-2xl transition duration-300 group-hover:scale-125 ${t.orb}`} aria-hidden="true" />
      <CardContent className="relative flex items-center gap-4 p-5">
        <span className={`flex size-14 shrink-0 items-center justify-center rounded-[19px] bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${t.tile}`}>
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[.18em] text-stone-500">{label}</p>
          <p className="mt-1 text-2xl font-black tracking-tight text-stone-950 tabular-nums">{value}</p>
          {hint ? <p className="mt-1 text-[11px] font-medium text-stone-600">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default function WorkoutsPage() {
  const { hasPermission } = useAuth();
  const ex = useExercises();
  const plans = useWorkoutPlans({ page: 1, pageSize: 50 });
  const assignments = useWorkoutAssignments({ page: 1, pageSize: 10, order: "desc" });
  const items = assignments.data?.items ?? [];
  const active = items.filter((x) => x.status === "ACTIVE").length;
  return (
    <div className="relative -mx-2 min-h-full overflow-hidden pb-12 sm:-mx-3 lg:-mx-5">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_5%_2%,rgba(6,182,212,.13),transparent_19%),radial-gradient(circle_at_96%_4%,rgba(99,102,241,.15),transparent_22%),radial-gradient(circle_at_70%_38%,rgba(217,70,239,.10),transparent_25%),radial-gradient(circle_at_12%_72%,rgba(16,185,129,.08),transparent_24%)]" aria-hidden="true" />
      <div className="mx-auto flex max-w-[1680px] flex-col gap-8 px-2 sm:px-4 lg:px-6">
        <PageHero
          id="workouts-title"
          icon={Dumbbell}
          title="Workouts"
          variant="light"
          accent="rose"
          actions={
            <>
              {hasPermission("workouts.create") && <AddExerciseDialog />}
              {hasPermission("workouts.create") && <CreatePlanDialog />}
            </>
          }
        />

        <section aria-labelledby="workouts-stats" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h2 id="workouts-stats" className="sr-only">Studio numbers</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric icon={Dumbbell} label="Exercises" value={ex.isLoading ? "—" : ex.data?.length ?? 0} tone="rose" />
            <Metric icon={Layers3} label="Workout plans" value={plans.isLoading ? "—" : plans.data?.total ?? 0} tone="orange" />
            <Metric icon={Users} label="Active assignments" value={assignments.isLoading ? "—" : active} tone="cyan" />
          </div>
        </section>

        <section aria-label="Programs" className="grid animate-in fade-in slide-in-from-bottom-2 gap-5 duration-500 [animation-delay:100ms]">
          <Card className="overflow-hidden rounded-[28px] border-white/90 bg-white/88 shadow-xl shadow-rose-900/5 backdrop-blur-xl">
            <div className="flex items-start gap-3 border-b border-stone-100/80 bg-gradient-to-r from-rose-50/90 via-white to-orange-50/60 px-5 py-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-md shadow-rose-500/25" aria-hidden="true">
                <Dumbbell className="size-5" />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-extrabold tracking-tight text-stone-950">Workout plans</h2>
              </div>
            </div>
            <CardContent className="p-4">
              {plans.isError ? (
                <p role="alert" className="rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50 to-orange-50 p-4 text-sm font-semibold text-rose-700">Unable to load workout plans.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {plans.data?.items.map((plan) => (
                    <div key={plan.id} className="group rounded-[20px] border border-stone-200/80 bg-white/70 p-4 transition duration-200 hover:-translate-y-1 hover:border-rose-200 hover:shadow-[0_20px_50px_-30px_rgba(244,63,94,.4)]">
                      <div className="flex items-start justify-between gap-3">
                        <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-md shadow-rose-500/25 transition-transform duration-200 group-hover:scale-110" aria-hidden="true">
                          <Dumbbell className="size-5" />
                        </span>
                        <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-800">{plan.exercises.length} exercises</Badge>
                      </div>
                      <h3 className="mt-4 text-sm font-extrabold tracking-tight text-stone-950">{plan.name}</h3>
                      <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-stone-600">{plan.description || "Structured training program"}</p>
                      <div className="mt-4 flex items-center justify-end gap-2">
                        {hasPermission("workouts.assign") && <AssignDialog planId={plan.id} planName={plan.name} />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {plans.data?.items.length === 0 && !plans.isLoading && <p className="py-8 text-center text-sm font-medium text-stone-600">No workout plans yet.</p>}
            </CardContent>
          </Card>
        </section>

        <Card className="overflow-hidden rounded-[28px] border-white/90 bg-white/85 shadow-lg backdrop-blur-xl">
          <div className="flex items-start gap-3 border-b border-stone-100/80 bg-gradient-to-r from-orange-50/80 via-white to-cyan-50/50 px-5 py-5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-md shadow-orange-500/25" aria-hidden="true">
              <Users className="size-5" />
            </span>
            <div>
              <h2 className="font-serif text-xl font-semibold tracking-tight text-stone-950">Recent assignments</h2>
            </div>
          </div>
          <CardContent className="space-y-3 p-4">
            {items.length === 0 ? (
              <p className="text-sm font-medium text-stone-600">No workout assignments yet.</p>
            ) : (
              items.map((x) => <AssignmentRow key={x.id} assignment={x} />)
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

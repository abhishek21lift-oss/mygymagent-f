"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { ApiError } from "@/lib/api/client";
import { useExercises, useUpdateWorkoutPlan, useWorkoutPlan } from "@/lib/hooks/use-workouts";
import type { WorkoutPlan } from "@/lib/types/gym";
import { updateWorkoutPlanSchema, type UpdateWorkoutPlanInput } from "@/lib/validation/gym";
import { Button } from "@/components/ui/button";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import {
 Form,
 FormControl,
 FormField,
 FormItem,
 FormLabel,
 FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

function EditForm({ plan, onDone }: { plan: WorkoutPlan; onDone: () => void }) {
 const exercises = useExercises();
 const update = useUpdateWorkoutPlan();
 const form = useForm<UpdateWorkoutPlanInput>({
  resolver: zodResolver(updateWorkoutPlanSchema),
  defaultValues: {
   name: plan.name,
   description: plan.description ?? "",
   exercises: plan.exercises.map((exercise) => ({
    exerciseId: exercise.exerciseId,
    order: exercise.order,
    sets: exercise.sets,
    reps: exercise.reps,
    restSeconds: exercise.restSeconds ?? 60,
    notes: exercise.notes ?? "",
   })),
  },
 });
 const { fields, append, remove } = useFieldArray({ control: form.control, name: "exercises" });

 async function submit(values: UpdateWorkoutPlanInput) {
  try {
   // The API replaces the exercise list wholesale, so sending the form's
   // current list is what makes a removal stick. `order` is renumbered from
   // the rendered order rather than trusted, so deleting the middle row
   // cannot leave a gap.
   await update.mutateAsync({
    id: plan.id,
    input: {
     ...values,
     exercises: values.exercises.map((exercise, index) => ({ ...exercise, order: index + 1 })),
    },
   });
   toast.success("Workout plan updated");
   onDone();
  } catch (error) {
   toast.error(error instanceof ApiError ? error.message : "Could not update this plan.");
  }
 }

 return (
  <Form {...form}>
   <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
    <FormField control={form.control} name="name" render={({ field }) => (
     <FormItem><FormLabel>Plan name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
    )} />
    <FormField control={form.control} name="description" render={({ field }) => (
     <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl></FormItem>
    )} />
    <div className="flex items-center justify-between">
     <p className="text-sm font-bold">Exercises</p>
     <Button
      type="button"
      variant="outline"
      size="sm"
      className="min-h-11"
      onClick={() => append({ exerciseId: "", order: fields.length + 1, sets: 3, reps: "8-12", restSeconds: 60, notes: "" })}
     >
      <Plus className="size-3.5" aria-hidden="true" />Add exercise
     </Button>
    </div>
    <FormMessage>{form.formState.errors.exercises?.root?.message ?? form.formState.errors.exercises?.message}</FormMessage>
    <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
     {fields.map((field, index) => (
      <div key={field.id} className="rounded-lg border border-border bg-muted/40 p-3">
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
        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} aria-label={`Remove exercise ${index + 1}`} className="min-h-11 min-w-11">
         <Trash2 className="size-4" aria-hidden="true" />
        </Button>
       </div>
       <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <FormField control={form.control} name={`exercises.${index}.sets`} render={({ field: f }) => (
         <FormItem><FormLabel className="text-xs">Sets</FormLabel><FormControl><Input type="number" {...f} /></FormControl></FormItem>
        )} />
        <FormField control={form.control} name={`exercises.${index}.reps`} render={({ field: f }) => (
         <FormItem><FormLabel className="text-xs">Reps</FormLabel><FormControl><Input {...f} /></FormControl></FormItem>
        )} />
        <FormField control={form.control} name={`exercises.${index}.restSeconds`} render={({ field: f }) => (
         <FormItem><FormLabel className="text-xs">Rest (s)</FormLabel><FormControl><Input type="number" {...f} value={f.value ?? ""} /></FormControl></FormItem>
        )} />
       </div>
      </div>
     ))}
    </div>
    <DialogFooter>
     <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
     <Button type="submit" disabled={update.isPending} aria-busy={update.isPending}>
      {update.isPending ? "Saving..." : "Save plan"}
     </Button>
    </DialogFooter>
   </form>
  </Form>
 );
}

function EditBody({ planId, onDone }: { planId: string; onDone: () => void }) {
 const detail = useWorkoutPlan(planId);
 if (detail.isPending) return <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-16 w-full" /><Skeleton className="h-32 w-full" /></div>;
 if (detail.isError || !detail.data) {
  return (
   <div className="space-y-3">
    <p role="alert" className="text-sm font-semibold text-destructive">Could not load this plan.</p>
    <Button type="button" variant="outline" onClick={() => void detail.refetch()}>Try again</Button>
   </div>
  );
 }
 return <EditForm plan={detail.data} onDone={onDone} />;
}

export function WorkoutPlanEditDialog({ planId, planName }: { planId: string; planName: string }) {
 const [open, setOpen] = React.useState(false);
 return (
  <>
   <Button type="button" variant="ghost" size="sm" className="min-h-11" onClick={() => setOpen(true)}>
    <Pencil className="size-3.5" aria-hidden="true" />Edit
   </Button>
   <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent className="sm:max-w-2xl">
     <DialogHeader>
      <DialogTitle>Edit &quot;{planName}&quot;</DialogTitle>
      <DialogDescription>Members already on this plan see the change on their next session.</DialogDescription>
     </DialogHeader>
     {open ? <EditBody planId={planId} onDone={() => setOpen(false)} /> : null}
    </DialogContent>
   </Dialog>
  </>
 );
}

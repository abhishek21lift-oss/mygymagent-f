"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { ApiError } from "@/lib/api/client";
import { useDietPlan, useFoodItems, useUpdateDietPlan } from "@/lib/hooks/use-nutrition";
import type { DietPlan, MealSlot } from "@/lib/types/gym";
import { updateDietPlanSchema, type UpdateDietPlanInput } from "@/lib/validation/gym";
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

const MEALS: MealSlot[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];

/** Prisma serialises the macro Decimals to strings; the form works in
 * numbers and the schema coerces on the way back. */
function toNumber(value: string | number | null | undefined) {
 return value === null || value === undefined || value === "" ? undefined : Number(value);
}

function EditForm({ plan, onDone }: { plan: DietPlan; onDone: () => void }) {
 const foods = useFoodItems();
 const update = useUpdateDietPlan();
 const form = useForm<UpdateDietPlanInput>({
  resolver: zodResolver(updateDietPlanSchema),
  defaultValues: {
   name: plan.name,
   description: plan.description ?? "",
   targetCalories: plan.targetCalories ?? undefined,
   targetProteinG: toNumber(plan.targetProteinG),
   targetCarbsG: toNumber(plan.targetCarbsG),
   targetFatG: toNumber(plan.targetFatG),
   items: plan.items.map((item) => ({
    foodItemId: item.foodItemId,
    mealSlot: item.mealSlot,
    quantity: item.quantity,
    unit: item.unit,
   })),
  },
 });
 const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });

 async function submit(values: UpdateDietPlanInput) {
  try {
   // The API replaces the item list wholesale, so sending the form's
   // current list is what makes a removal stick.
   await update.mutateAsync({ id: plan.id, input: values });
   toast.success("Diet plan updated");
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
    {/* All four targets: the create form only ever offered calories, though
        the API has taken the three macros from the start. */}
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
     <FormField control={form.control} name="targetCalories" render={({ field }) => (
      <FormItem><FormLabel className="text-xs">Calories</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} /></FormControl></FormItem>
     )} />
     <FormField control={form.control} name="targetProteinG" render={({ field }) => (
      <FormItem><FormLabel className="text-xs">Protein (g)</FormLabel><FormControl><Input type="number" step="0.1" {...field} value={field.value ?? ""} /></FormControl></FormItem>
     )} />
     <FormField control={form.control} name="targetCarbsG" render={({ field }) => (
      <FormItem><FormLabel className="text-xs">Carbs (g)</FormLabel><FormControl><Input type="number" step="0.1" {...field} value={field.value ?? ""} /></FormControl></FormItem>
     )} />
     <FormField control={form.control} name="targetFatG" render={({ field }) => (
      <FormItem><FormLabel className="text-xs">Fat (g)</FormLabel><FormControl><Input type="number" step="0.1" {...field} value={field.value ?? ""} /></FormControl></FormItem>
     )} />
    </div>
    <div className="flex items-center justify-between">
     <p className="text-sm font-bold">Meal items</p>
     <Button
      type="button"
      variant="outline"
      size="sm"
      className="min-h-11"
      onClick={() => append({ foodItemId: "", mealSlot: "BREAKFAST", quantity: 100, unit: "g" })}
     >
      <Plus className="size-3.5" aria-hidden="true" />Add item
     </Button>
    </div>
    <FormMessage>{form.formState.errors.items?.root?.message ?? form.formState.errors.items?.message}</FormMessage>
    <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
     {fields.map((field, index) => (
      <div key={field.id} className="rounded-lg border border-border bg-muted/40 p-3">
       <div className="flex gap-2">
        <FormField control={form.control} name={`items.${index}.foodItemId`} render={({ field: f }) => (
         <FormItem className="flex-1">
          <Select value={f.value} onValueChange={f.onChange}>
           <FormControl><SelectTrigger><SelectValue placeholder="Select a food item" /></SelectTrigger></FormControl>
           <SelectContent>{foods.data?.map((food) => <SelectItem key={food.id} value={food.id}>{food.name}</SelectItem>)}</SelectContent>
          </Select>
          <FormMessage />
         </FormItem>
        )} />
        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} aria-label={`Remove meal item ${index + 1}`} className="min-h-11 min-w-11">
         <Trash2 className="size-4" aria-hidden="true" />
        </Button>
       </div>
       <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <FormField control={form.control} name={`items.${index}.mealSlot`} render={({ field: f }) => (
         <FormItem>
          <FormLabel className="text-xs">Meal</FormLabel>
          <Select value={f.value} onValueChange={f.onChange}>
           <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
           <SelectContent>{MEALS.map((meal) => <SelectItem key={meal} value={meal}>{meal}</SelectItem>)}</SelectContent>
          </Select>
         </FormItem>
        )} />
        <FormField control={form.control} name={`items.${index}.quantity`} render={({ field: f }) => (
         <FormItem><FormLabel className="text-xs">Quantity</FormLabel><FormControl><Input type="number" step="0.1" {...f} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name={`items.${index}.unit`} render={({ field: f }) => (
         <FormItem><FormLabel className="text-xs">Unit</FormLabel><FormControl><Input placeholder="g" {...f} /></FormControl><FormMessage /></FormItem>
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
 const detail = useDietPlan(planId);
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

export function DietPlanEditDialog({ planId, planName }: { planId: string; planName: string }) {
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
      <DialogDescription>Members already on this plan see the change straight away.</DialogDescription>
     </DialogHeader>
     {open ? <EditBody planId={planId} onDone={() => setOpen(false)} /> : null}
    </DialogContent>
   </Dialog>
  </>
 );
}

"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Apple, Leaf, Plus, Salad, Trash2, UserPlus, Users, Utensils } from "lucide-react";
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
import { useAssignDietPlan, useCreateDietPlan, useCreateFoodItem, useDietAssignments, useDietPlans, useFoodItems, useUpdateDietAssignmentStatus } from "@/lib/hooks/use-nutrition";
import { ApiError } from "@/lib/api/client";
import { assignDietPlanSchema, createDietPlanSchema, createFoodItemSchema, type AssignDietPlanInput, type CreateDietPlanInput, type CreateFoodItemInput } from "@/lib/validation/gym";
import type { DietAssignment, MealSlot } from "@/lib/types/gym";

const MEALS: MealSlot[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];

const MEAL_STYLES: Record<MealSlot, string> = {
  BREAKFAST: "border-amber-200 bg-amber-50 text-amber-800",
  LUNCH: "border-emerald-200 bg-emerald-50 text-emerald-800",
  DINNER: "border-cyan-200 bg-cyan-50 text-cyan-800",
  SNACK: "border-lime-200 bg-lime-50 text-lime-800",
};

function AddFood() {
  const [open, setOpen] = React.useState(false);
  const create = useCreateFoodItem();
  const form = useForm<CreateFoodItemInput>({ resolver: zodResolver(createFoodItemSchema), defaultValues: { name: "", servingSize: "", calories: undefined, proteinG: undefined, carbsG: undefined, fatG: undefined } });
  async function submit(v: CreateFoodItemInput) {
    try {
      await create.mutateAsync(v);
      toast.success("Food item added");
      setOpen(false);
      form.reset();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to add food item");
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="min-h-11 rounded-2xl border-stone-200 bg-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
          <Plus className="size-4" aria-hidden="true" />Add food
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New food item</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="Chicken Breast" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="servingSize" render={({ field }) => (
              <FormItem><FormLabel>Serving size</FormLabel><FormControl><Input placeholder="100g" {...field} /></FormControl></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              {(["calories", "proteinG", "carbsG", "fatG"] as const).map((name) => (
                <FormField key={name} control={form.control} name={name} render={({ field }) => (
                  <FormItem>
                    <FormLabel>{name === "calories" ? "Calories" : name === "proteinG" ? "Protein (g)" : name === "carbsG" ? "Carbs (g)" : "Fat (g)"}</FormLabel>
                    <FormControl><Input type="number" {...field} value={field.value ?? ""} /></FormControl>
                  </FormItem>
                )} />
              ))}
            </div>
            <DialogFooter><Button type="submit" disabled={create.isPending} className="min-h-11">{create.isPending ? "Adding..." : "Add food item"}</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function CreatePlan() {
  const [open, setOpen] = React.useState(false);
  const foods = useFoodItems();
  const create = useCreateDietPlan();
  const form = useForm<CreateDietPlanInput>({ resolver: zodResolver(createDietPlanSchema), defaultValues: { name: "", description: "", items: [], targetCalories: undefined } });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });
  function add() {
    append({ foodItemId: "", mealSlot: "BREAKFAST", quantity: 1, unit: "g" });
  }
  async function submit(v: CreateDietPlanInput) {
    try {
      await create.mutateAsync(v);
      toast.success("Diet plan created");
      setOpen(false);
      form.reset({ name: "", description: "", items: [], targetCalories: undefined });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to create plan");
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="min-h-11 rounded-2xl bg-[linear-gradient(105deg,#059669,#65a30d_55%,#0891b2)] text-white shadow-lg shadow-emerald-500/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
          <Plus className="size-4" aria-hidden="true" />New diet plan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader><DialogTitle>New diet plan</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Plan name</FormLabel><FormControl><Input placeholder="High Protein Cut" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="targetCalories" render={({ field }) => (
              <FormItem><FormLabel>Target calories</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} /></FormControl></FormItem>
            )} />
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">Meal items</p>
              <Button type="button" variant="outline" size="sm" onClick={add} className="min-h-11"><Plus className="size-3.5" aria-hidden="true" />Add food</Button>
            </div>
            <div className="max-h-72 space-y-3 overflow-y-auto">
              {fields.map((field, index) => (
                <div key={field.id} className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 to-lime-50/50 p-3">
                  <div className="flex gap-2">
                    <FormField control={form.control} name={`items.${index}.foodItemId`} render={({ field: f }) => (
                      <FormItem className="flex-1">
                        <Select value={f.value} onValueChange={f.onChange}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select food" /></SelectTrigger></FormControl>
                          <SelectContent>{foods.data?.map((food) => <SelectItem key={food.id} value={food.id}>{food.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} aria-label="Remove food item" className="min-h-11 min-w-11"><Trash2 className="size-4" aria-hidden="true" /></Button>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <FormField control={form.control} name={`items.${index}.mealSlot`} render={({ field: f }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Meal</FormLabel>
                        <Select value={f.value} onValueChange={f.onChange}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>{MEALS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name={`items.${index}.quantity`} render={({ field: f }) => (
                      <FormItem><FormLabel className="text-xs">Quantity</FormLabel><FormControl><Input type="number" {...f} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name={`items.${index}.unit`} render={({ field: f }) => (
                      <FormItem><FormLabel className="text-xs">Unit</FormLabel><FormControl><Input placeholder="g" {...f} /></FormControl></FormItem>
                    )} />
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter><Button type="submit" disabled={create.isPending} className="min-h-11">{create.isPending ? "Creating..." : "Create plan"}</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AssignPlan({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = React.useState(false);
  const [member, setMember] = React.useState<{ id: string; label: string } | null>(null);
  const assign = useAssignDietPlan();
  const form = useForm<Omit<AssignDietPlanInput, "memberId">>({ resolver: zodResolver(assignDietPlanSchema.omit({ memberId: true })), defaultValues: { notes: "" } });
  async function submit(v: Omit<AssignDietPlanInput, "memberId">) {
    if (!member) return toast.error("Select a member first");
    try {
      await assign.mutateAsync({ planId: id, input: { ...v, memberId: member.id } });
      toast.success(`Assigned "${name}" to ${member.label}`);
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
        <Button size="sm" variant="outline" className="min-h-11 rounded-xl border-emerald-200 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
          <UserPlus className="size-3.5" aria-hidden="true" />Assign
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Assign &quot;{name}&quot;</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <MemberPicker value={member} onChange={setMember} />
          <Form {...form}>
            <form onSubmit={form.handleSubmit(submit)}>
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl></FormItem>
              )} />
              <DialogFooter className="mt-4"><Button type="submit" disabled={assign.isPending} className="min-h-11">{assign.isPending ? "Assigning..." : "Assign plan"}</Button></DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Assignment({ item }: { item: DietAssignment }) {
  const { hasPermission } = useAuth();
  const update = useUpdateDietAssignmentStatus();
  return (
    <div className="group flex flex-col gap-3 rounded-[22px] border border-stone-200/80 bg-white/70 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-[0_20px_50px_-30px_rgba(16,185,129,.45)] sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-lime-500 text-white shadow-md shadow-emerald-500/25 transition-transform duration-200 group-hover:scale-110" aria-hidden="true">
          <UserPlus className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-stone-900">{item.member ? `${item.member.firstName} ${item.member.lastName}` : "Member unavailable"}</p>
          <p className="truncate text-xs font-medium text-stone-600">{item.dietPlan?.name ?? "Diet plan"}</p>
        </div>
      </div>
      <Badge variant={item.status === "ACTIVE" ? "default" : item.status === "COMPLETED" ? "success" : "secondary"}>{item.status}</Badge>
      {item.status === "ACTIVE" && hasPermission("nutrition.assign") && (
        <Button
          size="sm"
          variant="ghost"
          disabled={update.isPending}
          onClick={() => update.mutateAsync({ id: item.id, status: "COMPLETED" }).then(() => toast.success("Marked complete")).catch((e) => toast.error(e instanceof ApiError ? e.message : "Failed to update"))}
          className="min-h-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
        >
          Complete
        </Button>
      )}
    </div>
  );
}

type MetricTone = "emerald" | "lime" | "cyan";

const METRIC_TONES: Record<MetricTone, { bar: string; tile: string; orb: string; ring: string }> = {
  emerald: {
    bar: "from-emerald-400 via-teal-500 to-green-600",
    tile: "from-emerald-500 to-teal-600 shadow-emerald-500/30",
    orb: "bg-emerald-400/20",
    ring: "hover:border-emerald-200 hover:shadow-emerald-500/10",
  },
  lime: {
    bar: "from-lime-400 via-green-500 to-emerald-600",
    tile: "from-lime-500 to-green-600 shadow-lime-500/30",
    orb: "bg-lime-400/20",
    ring: "hover:border-lime-200 hover:shadow-lime-500/10",
  },
  cyan: {
    bar: "from-cyan-400 via-teal-500 to-emerald-600",
    tile: "from-cyan-500 to-teal-600 shadow-cyan-500/30",
    orb: "bg-cyan-400/20",
    ring: "hover:border-cyan-200 hover:shadow-cyan-500/10",
  },
};

function Metric({ icon: Icon, label, value, hint, tone }: { icon: typeof Users; label: string; value: React.ReactNode; hint?: string; tone: MetricTone }) {
  const t = METRIC_TONES[tone];
  return (
    <Card className={`group relative overflow-hidden border-white/90 bg-white/85 shadow-[0_20px_60px_-38px_rgba(5,150,105,.28)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 ${t.ring}`}>
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

export default function NutritionPage() {
  const { hasPermission } = useAuth();
  const foods = useFoodItems();
  const plans = useDietPlans({ page: 1, pageSize: 50 });
  const assignments = useDietAssignments({ page: 1, pageSize: 10, order: "desc" });
  const items = assignments.data?.items ?? [];
  const active = items.filter((x) => x.status === "ACTIVE").length;
  return (
    <div className="relative -mx-2 min-h-full overflow-hidden pb-12 sm:-mx-3 lg:-mx-5">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_5%_2%,rgba(6,182,212,.13),transparent_19%),radial-gradient(circle_at_96%_4%,rgba(99,102,241,.15),transparent_22%),radial-gradient(circle_at_70%_38%,rgba(217,70,239,.10),transparent_25%),radial-gradient(circle_at_12%_72%,rgba(16,185,129,.08),transparent_24%)]" aria-hidden="true" />
      <div className="mx-auto flex max-w-[1680px] flex-col gap-8 px-2 sm:px-4 lg:px-6">
        <PageHero
          id="nutrition-title"
          icon={Apple}
          title="Nutrition"
          variant="light"
          accent="emerald"
          actions={
            <>
              {hasPermission("nutrition.create") && <AddFood />}
              {hasPermission("nutrition.create") && <CreatePlan />}
            </>
          }
        />

        <section aria-labelledby="nutrition-stats" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h2 id="nutrition-stats" className="sr-only">Nutrition numbers</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric icon={Apple} label="Food library" value={foods.isLoading ? "—" : foods.data?.length ?? 0} tone="emerald" />
            <Metric icon={Leaf} label="Diet plans" value={plans.isLoading ? "—" : plans.data?.total ?? 0} tone="lime" />
            <Metric icon={Users} label="Active assignments" value={assignments.isLoading ? "—" : active} tone="cyan" />
          </div>
        </section>

        <section aria-label="Plans" className="grid animate-in fade-in slide-in-from-bottom-2 gap-5 duration-500 [animation-delay:100ms]">
          <Card className="overflow-hidden rounded-[28px] border-white/90 bg-white/88 shadow-xl shadow-emerald-900/5 backdrop-blur-xl">
            <div className="flex items-start gap-3 border-b border-stone-100/80 bg-gradient-to-r from-emerald-50/90 via-white to-lime-50/60 px-5 py-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-emerald-500 to-lime-500 text-white shadow-md shadow-emerald-500/25" aria-hidden="true">
                <Salad className="size-5" />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-extrabold tracking-tight text-stone-950">Diet plan library</h2>
              </div>
            </div>
            <CardContent className="p-4">
              {plans.isError ? (
                <p role="alert" className="rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50 to-orange-50 p-4 text-sm font-semibold text-rose-700">Unable to load diet plans.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {plans.data?.items.map((plan) => (
                    <div key={plan.id} className="group rounded-[20px] border border-stone-200/80 bg-white/70 p-4 transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_20px_50px_-30px_rgba(16,185,129,.45)]">
                      <div className="flex items-start justify-between gap-3">
                        <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-lime-500 text-white shadow-md shadow-emerald-500/25 transition-transform duration-200 group-hover:scale-110" aria-hidden="true">
                          <Utensils className="size-5" />
                        </span>
                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 font-mono tabular-nums text-emerald-800">{plan.targetCalories ?? "—"} kcal</Badge>
                      </div>
                      <h3 className="mt-4 text-sm font-extrabold tracking-tight text-stone-950">{plan.name}</h3>
                      <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-stone-600">{plan.description || "Structured nutrition plan"}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Meal slots">
                        {MEALS.filter((m) => plan.items.some((i) => i.mealSlot === m)).slice(0, 4).map((m) => (
                          <span key={m} className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${MEAL_STYLES[m]}`}>{m}</span>
                        ))}
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[.16em] text-stone-500 tabular-nums">{plan.items.length} meal items</span>
                        {hasPermission("nutrition.assign") && <AssignPlan id={plan.id} name={plan.name} />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <Card className="overflow-hidden rounded-[28px] border-white/90 bg-white/85 shadow-lg backdrop-blur-xl">
          <div className="flex items-start gap-3 border-b border-stone-100/80 bg-gradient-to-r from-lime-50/80 via-white to-emerald-50/60 px-5 py-5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-lime-500 to-emerald-600 text-white shadow-md shadow-lime-500/25" aria-hidden="true">
              <Users className="size-5" />
            </span>
            <div>
              <h2 className="font-serif text-xl font-semibold tracking-tight text-stone-950">Recent nutrition assignments</h2>
            </div>
          </div>
          <CardContent className="space-y-3 p-4">
            {items.length === 0 ? (
              <p className="text-sm font-medium text-stone-600">No diet assignments yet.</p>
            ) : (
              items.map((x) => <Assignment key={x.id} item={x} />)
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

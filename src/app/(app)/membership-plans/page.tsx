"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { BadgeCheck, Clock3, Plus, Sparkles, Tag, Wallet } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHero } from "@/components/shared/page-hero";
import { ErrorState } from "@/components/shared/error-state";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { useAuth } from "@/lib/auth/auth-context";
import { useMembershipPlans, useCreateMembershipPlan } from "@/lib/hooks/use-membership-plans";
import { ApiError } from "@/lib/api/client";
import { createMembershipPlanSchema, type CreateMembershipPlanInput } from "@/lib/validation/gym";

const PLAN_TOPS = [ "bg-emerald-400", "bg-amber-400", "bg-cyan-400", "bg-violet-600",
];

const PLAN_TILES = [ "bg-emerald-500 shadow-emerald-500/25", "bg-amber-500 shadow-amber-500/25", "bg-cyan-500 shadow-cyan-500/25", "bg-violet-600 shadow-violet-500/25",
];

function CreatePlanDialog() {
 const [open, setOpen] = React.useState(false);
 const createPlan = useCreateMembershipPlan();

 const form = useForm<CreateMembershipPlanInput>({
 resolver: zodResolver(createMembershipPlanSchema),
 defaultValues: { name: "", description: "", durationDays: 30, price: 0, currency: "INR", maxFreezeDays: 0 },
 });

 async function onSubmit(values: CreateMembershipPlanInput) {
 try {
 await createPlan.mutateAsync(values);
 toast.success("Plan created");
 setOpen(false);
 form.reset();
 } catch (error) {
 toast.error(error instanceof ApiError ? error.message : "Failed to create plan");
 }
 }

 return (
 <Dialog open={open} onOpenChange={setOpen}>
 <DialogTrigger asChild>
 <Button className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[linear-gradient(105deg,#059669,#0d9488_55%,#0ea5e9)] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-500/25 transition duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
 <Plus className="size-4" aria-hidden="true" />
 New plan
 </Button>
 </DialogTrigger>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>New membership plan</DialogTitle>
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
 <Input placeholder="12-Month Unlimited" {...field} />
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
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
 <FormField
 control={form.control}
 name="durationDays"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Duration (days)</FormLabel>
 <FormControl>
 <Input type="number" {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 <FormField
 control={form.control}
 name="price"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Price</FormLabel>
 <FormControl>
 <Input type="number" step="0.01" {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 </div>
 <FormField
 control={form.control}
 name="maxFreezeDays"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Max freeze days</FormLabel>
 <FormControl>
 <Input type="number" {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 <DialogFooter>
 <Button type="submit" className="w-full sm:w-auto" disabled={createPlan.isPending}>
 {createPlan.isPending ? "Creating..." : "Create plan"}
 </Button>
 </DialogFooter>
 </form>
 </Form>
 </DialogContent>
 </Dialog>
 );
}

export default function MembershipPlansPage() {
 const { hasPermission } = useAuth();
 const plansQuery = useMembershipPlans({ pageSize: 50 });

 return (
 <div className="pb-4">
 <div className="flex flex-col gap-5">
 <PageHero
 id="plans-title"
 icon={Sparkles}
 title="Plans"
 actions={
 <>
 {hasPermission("membership_plans.create") && <CreatePlanDialog />}
 <Link href="/memberships" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-emerald-200/80 bg-card px-5 py-3 text-sm font-bold text-emerald-900 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
 <Sparkles className="size-4" aria-hidden="true" /> Lifecycle
 </Link>
 </>
 }
 />

 <section aria-labelledby="plans-grid-title" className="">
 <div className="mb-4 flex items-end justify-between gap-4">
 <div>
 <h2 id="plans-grid-title" className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">All plans</h2>
 </div>
 {!plansQuery.isLoading && !plansQuery.isError && plansQuery.data && plansQuery.data.items.length > 0 && (
 <span className="rounded-full bg-emerald-500 px-3 py-1 font-mono text-xs font-black text-white tabular-nums shadow-md shadow-emerald-500/20">{plansQuery.data.items.length}</span>
 )}
 </div>

 {plansQuery.isLoading ? (
 <TableSkeleton />
 ) : plansQuery.isError ? (
 <div className="overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm dark:bg-card">
 <ErrorState onRetry={() => plansQuery.refetch()} />
 </div>
 ) : !plansQuery.data || plansQuery.data.items.length === 0 ? (
 <div className="overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm dark:bg-card">
 <EmptyState title="No membership plans yet" description="Create your first plan to start selling memberships." />
 </div>
 ) : (
 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
 {plansQuery.data.items.map((plan, index) => {
 const top = PLAN_TOPS[index % PLAN_TOPS.length];
 const tile = PLAN_TILES[index % PLAN_TILES.length];
 return (
 <article key={plan.id} className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[0_20px_60px_-38px_rgba(79,70,229,.35)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_-38px_rgba(79,70,229,.42)] dark:bg-card">
 <span className={`absolute inset-x-0 top-0 h-1.5 ${top}`} aria-hidden="true" />
 <div className="flex items-start justify-between gap-3 px-5 pt-5 sm:px-6">
 <div className="flex min-w-0 items-center gap-3">
 <span className={`flex size-11 shrink-0 items-center justify-center rounded-lg text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${tile}`}>
 <Tag className="size-5" aria-hidden="true" />
 </span>
 <h3 className="truncate text-base font-extrabold tracking-tight text-stone-950 dark:text-white">{plan.name}</h3>
 </div>
 {!plan.isActive && <Badge variant="secondary" className="shrink-0 rounded-full">Inactive</Badge>}
 </div>
 <div className="flex flex-1 flex-col gap-2 px-5 py-5 text-sm sm:px-6">
 <p className="flex items-baseline gap-1.5 text-2xl font-black tracking-tight text-stone-950 tabular-nums dark:text-white">
 <Wallet className="size-5 self-center text-emerald-600" aria-hidden="true" />
 ₹ {plan.price}
 <span className="text-sm font-bold text-stone-600 dark:text-stone-400"> / {plan.durationDays}d</span>
 </p>
 {plan.description && <p className="text-sm font-medium leading-6 text-stone-600 dark:text-stone-400">{plan.description}</p>}
 <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
 <span className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-extrabold text-emerald-800 ring-1 ring-emerald-200/60">
 <Clock3 className="size-3.5" aria-hidden="true" /> {plan.durationDays} days
 </span>
 {plan.maxFreezeDays > 0 ? (
 <span className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1.5 text-xs font-extrabold text-cyan-800 ring-1 ring-cyan-200/60">
 <BadgeCheck className="size-3.5" aria-hidden="true" /> Up to {plan.maxFreezeDays} freeze days
 </span>
 ) : (
 <span className="inline-flex min-h-11 items-center rounded-full bg-stone-500/10 px-3 py-1.5 text-xs font-bold text-stone-600 ring-1 ring-stone-200/60">No freeze</span>
 )}
 </div>
 </div>
 </article>
 );
 })}
 </div>
 )}
 </section>
 </div>
 </div>
 );
}

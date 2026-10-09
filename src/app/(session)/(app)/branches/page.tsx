"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Building2, Clock, Mail, MapPin, Phone, Plus, Sparkles } from "lucide-react";

import { BranchEditDialog } from "@/components/branches/branch-edit-dialog";
import { BentoGrid, GradientIcon } from "@/components/shared/bento";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHero } from "@/components/shared/page-hero";
import { ErrorState } from "@/components/shared/error-state";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { useBranches, useCreateBranch } from "@/lib/hooks/use-branches";
import { BranchDevicesRow } from "./branch-devices-row";
import { ApiError } from "@/lib/api/client";
import { readableWeek } from "@/lib/opening-hours";
import { createBranchSchema, type CreateBranchInput } from "@/lib/validation/gym";
import { accentClass } from "@/lib/design-tokens";
import type { Accent } from "@/lib/section-accent";
import { cn } from "@/lib/utils";

/* One accent per card, cycling — the cap, glow and tile all follow it. */
const BRANCH_ACCENTS = ["blue", "cyan", "violet", "emerald"] as const satisfies readonly Accent[];

function slugify(input: string) {
 return input
 .toLowerCase()
 .trim()
 .replace(/[^a-z0-9]+/g, "-")
 .replace(/^-+|-+$/g, "");
}

function CreateBranchDialog() {
 const [open, setOpen] = React.useState(false);
 const createBranch = useCreateBranch();

 const form = useForm<CreateBranchInput>({
 resolver: zodResolver(createBranchSchema),
 defaultValues: { name: "", slug: "", phone: "", email: "", city: "", country: "" },
 });

 async function onSubmit(values: CreateBranchInput) {
 try {
 // Optional fields left blank are left out: the API reads "" as a
 // (malformed) email rather than none.
 const filled = Object.fromEntries(
 Object.entries(values).filter(([, value]) => typeof value !== "string" || value.trim() !== ""),
 ) as CreateBranchInput;
 await createBranch.mutateAsync(filled);
 toast.success("Branch created");
 setOpen(false);
 form.reset();
 } catch (error) {
 toast.error(error instanceof ApiError ? error.message : "Failed to create branch");
 }
 }

 return (
 <Dialog open={open} onOpenChange={setOpen}>
 <DialogTrigger asChild>
 <Button className="btn-sheen inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground transition duration-300 hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
 <Plus className="size-4" aria-hidden="true" />
 New branch
 </Button>
 </DialogTrigger>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>New branch</DialogTitle>
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
 <Input
 {...field}
 onChange={(e) => {
 field.onChange(e);
 if (!form.formState.dirtyFields.slug) {
 form.setValue("slug", slugify(e.target.value));
 }
 }}
 />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 <FormField
 control={form.control}
 name="slug"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Slug</FormLabel>
 <FormControl>
 <Input {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
 </div>
 <DialogFooter>
 <Button type="submit" className="w-full sm:w-auto" disabled={createBranch.isPending}>
 {createBranch.isPending ? "Creating..." : "Create branch"}
 </Button>
 </DialogFooter>
 </form>
 </Form>
 </DialogContent>
 </Dialog>
 );
}

export default function BranchesPage() {
 const { hasPermission } = useAuth();
 const branchesQuery = useBranches({ pageSize: 50 });

 return (
 <div className="pb-4">
 <div className="flex flex-col gap-5">
 <PageHero
 id="branches-title"
 icon={Building2}
 title="Branches"
 actions={
 <>
 {hasPermission("branches.create") && <CreateBranchDialog />}
 <Link href="/staff" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border/80 bg-card px-5 py-3 text-sm font-bold text-foreground shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
 <Sparkles className="size-4" aria-hidden="true" /> Staff
 </Link>
 </>
 }
 />

 <section aria-labelledby="branches-grid-title" className="">
 <div className="mb-4 flex items-end justify-between gap-4">
 <div>
 <h2 id="branches-grid-title" className="section-title">All locations</h2>
 </div>
 {!branchesQuery.isLoading && !branchesQuery.isError && branchesQuery.data && branchesQuery.data.items.length > 0 && (
 <span className="rounded-full px-3 py-1 font-mono text-xs font-black tabular-nums" style={{ background: "var(--section-fill)", color: "var(--section-on)" }}>{branchesQuery.data.items.length}</span>
 )}
 </div>

 {branchesQuery.isLoading ? (
 <TableSkeleton />
 ) : branchesQuery.isError ? (
 <div className="overflow-hidden rounded-3xl border border-border bg-card p-4 shadow-sm dark:bg-card">
 <ErrorState onRetry={() => branchesQuery.refetch()} />
 </div>
 ) : !branchesQuery.data || branchesQuery.data.items.length === 0 ? (
 <div className="overflow-hidden rounded-3xl border border-border bg-card p-4 shadow-sm dark:bg-card">
 <EmptyState title="No branches yet" />
 </div>
 ) : (
 <BentoGrid columns={3} label="Branches">
 {branchesQuery.data.items.map((branch, index) => {
 const accent = BRANCH_ACCENTS[index % BRANCH_ACCENTS.length];
 return (
 <article key={branch.id} className={cn("kpi-card", accentClass[accent], "group flex flex-col")}>
 <div className="flex flex-row items-center justify-between gap-3">
 <div className="flex min-w-0 items-center gap-3">
 <GradientIcon icon={Building2} accent={accent} />
 <h3 className="text-base font-extrabold tracking-tight [overflow-wrap:anywhere] text-foreground">{branch.name}</h3>
 </div>
 <Badge variant={branch.status === "ACTIVE" ? "success" : "secondary"} className="shrink-0 rounded-full">
 {branch.status}
 </Badge>
 </div>
 <div className="flex flex-col gap-1.5 pt-4 text-sm font-medium text-muted-foreground">
 {(branch.addressLine1 || branch.city) && <p className="inline-flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" style={{ color: "var(--section-ink)" }} />{[branch.addressLine1, branch.city, branch.country].filter(Boolean).join(", ")}</p>}
 {branch.phone && <p className="inline-flex items-center gap-2 tabular-nums"><Phone className="size-4 shrink-0" aria-hidden="true" style={{ color: "var(--section-ink)" }} />{branch.phone}</p>}
 {branch.email && <p className="inline-flex min-w-0 items-center gap-2"><Mail className="size-4 shrink-0" aria-hidden="true" style={{ color: "var(--section-ink)" }} /><span className="min-w-0 [overflow-wrap:anywhere]">{branch.email}</span></p>}
 {readableWeek(branch.openingHours).length > 0 && <p className="inline-flex items-start gap-2"><Clock className="mt-0.5 size-4 shrink-0" aria-hidden="true" style={{ color: "var(--section-ink)" }} /><span>{readableWeek(branch.openingHours).join(" · ")}</span></p>}
 {!branch.addressLine1 && !branch.city && !branch.phone && !branch.email && <p className="text-xs">No contact details yet.</p>}
 {hasPermission("branches.update") && <div className="pt-2"><BranchEditDialog branch={branch} /></div>}
 </div>
 <BranchDevicesRow branchId={branch.id} />
 </article>
 );
 })}
 </BentoGrid>
 )}
 </section>
 </div>
 </div>
 );
}

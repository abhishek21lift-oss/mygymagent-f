"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ArrowRight, Building2, Mail, MapPin, Phone, Plus, Sparkles } from "lucide-react";

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
import { ApiError } from "@/lib/api/client";
import { createBranchSchema, type CreateBranchInput } from "@/lib/validation/gym";

const BRANCH_TOPS = [
  "from-cyan-400 via-sky-500 to-blue-600",
  "from-teal-400 via-emerald-500 to-green-600",
  "from-violet-600 via-purple-600 to-fuchsia-600",
];

const BRANCH_TILES = [
  "from-cyan-500 to-blue-600 shadow-cyan-500/25",
  "from-teal-500 to-emerald-600 shadow-teal-500/25",
  "from-violet-600 to-fuchsia-600 shadow-violet-500/25",
];

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
      await createBranch.mutateAsync(values);
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
        <Button className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[linear-gradient(105deg,#0891b2,#2563eb_55%,#4f46e5)] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-cyan-500/25 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600">
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
            <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 gap-4">
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
              <Button type="submit" disabled={createBranch.isPending}>
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
    <div className="relative -mx-2 min-h-full overflow-hidden pb-12 sm:-mx-3 lg:-mx-5">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_5%_2%,rgba(6,182,212,.13),transparent_19%),radial-gradient(circle_at_96%_4%,rgba(99,102,241,.15),transparent_22%),radial-gradient(circle_at_70%_38%,rgba(217,70,239,.10),transparent_25%),radial-gradient(circle_at_12%_72%,rgba(16,185,129,.08),transparent_24%)]" aria-hidden="true" />
      <div className="mx-auto flex max-w-[1680px] flex-col gap-8 px-2 sm:px-4 lg:px-6">
        <PageHero
          id="branches-title"
          eyebrow="Footprint"
          icon={Building2}
          title="Branches"
          description="Locations your organization operates — every floor, one network."
          variant="light"
          accent="violet"
          actions={
            <>
              {hasPermission("branches.create") && <CreateBranchDialog />}
              <Link href="/staff" className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-cyan-200/80 bg-white/80 px-5 py-3 text-sm font-bold text-cyan-900 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-cyan-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600">
                <Sparkles className="size-4" aria-hidden="true" /> Staff <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </>
          }
        />

        <section aria-labelledby="branches-grid-title" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 id="branches-grid-title" className="font-serif text-2xl font-semibold tracking-tight text-stone-950 dark:text-white">All locations</h2>
              <p className="mt-1 text-xs font-medium text-stone-600 dark:text-stone-400">Status, city and contact for every branch.</p>
            </div>
            {!branchesQuery.isLoading && !branchesQuery.isError && branchesQuery.data && branchesQuery.data.items.length > 0 && (
              <span className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-1 font-mono text-xs font-black text-white tabular-nums shadow-md shadow-cyan-500/20">{branchesQuery.data.items.length}</span>
            )}
          </div>

          {branchesQuery.isLoading ? (
            <TableSkeleton />
          ) : branchesQuery.isError ? (
            <div className="overflow-hidden rounded-[28px] border border-white/90 bg-white/88 p-4 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-stone-950/80">
              <ErrorState onRetry={() => branchesQuery.refetch()} />
            </div>
          ) : !branchesQuery.data || branchesQuery.data.items.length === 0 ? (
            <div className="overflow-hidden rounded-[28px] border border-white/90 bg-white/88 p-4 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-stone-950/80">
              <EmptyState title="No branches yet" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {branchesQuery.data.items.map((branch, index) => {
                const top = BRANCH_TOPS[index % BRANCH_TOPS.length];
                const tile = BRANCH_TILES[index % BRANCH_TILES.length];
                return (
                  <article key={branch.id} className="group relative flex flex-col overflow-hidden rounded-[28px] border border-white/90 bg-white/88 shadow-[0_20px_60px_-38px_rgba(79,70,229,.35)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_-38px_rgba(79,70,229,.42)] dark:border-white/10 dark:bg-stone-950/80">
                    <span className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${top}`} aria-hidden="true" />
                    <div className="flex flex-row items-center justify-between gap-3 px-5 pt-5 sm:px-6">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${tile}`}>
                          <Building2 className="size-5" aria-hidden="true" />
                        </span>
                        <h3 className="truncate text-base font-extrabold tracking-tight text-stone-950 dark:text-white">{branch.name}</h3>
                      </div>
                      <Badge variant={branch.status === "ACTIVE" ? "default" : "secondary"} className={branch.status === "ACTIVE" ? "shrink-0 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm" : "shrink-0 rounded-full"}>
                        {branch.status}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-1.5 px-5 py-5 text-sm font-medium text-stone-600 sm:px-6 dark:text-stone-400">
                      {branch.city && <p className="inline-flex items-center gap-2"><MapPin className="size-4 shrink-0 text-cyan-600" aria-hidden="true" />{[branch.city, branch.country].filter(Boolean).join(", ")}</p>}
                      {branch.phone && <p className="inline-flex items-center gap-2 tabular-nums"><Phone className="size-4 shrink-0 text-cyan-600" aria-hidden="true" />{branch.phone}</p>}
                      {branch.email && <p className="inline-flex min-w-0 items-center gap-2"><Mail className="size-4 shrink-0 text-cyan-600" aria-hidden="true" /><span className="truncate">{branch.email}</span></p>}
                      {!branch.city && !branch.phone && !branch.email && <p className="text-xs">No contact details yet.</p>}
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

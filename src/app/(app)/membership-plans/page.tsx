"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

function CreatePlanDialog() {
  const [open, setOpen] = React.useState(false);
  const createPlan = useCreateMembershipPlan();

  const form = useForm<CreateMembershipPlanInput>({
    resolver: zodResolver(createMembershipPlanSchema),
    defaultValues: { name: "", description: "", durationDays: 30, price: 0, currency: "USD", maxFreezeDays: 0 },
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
        <Button>
          <Plus />
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
            <div className="grid grid-cols-2 gap-4">
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

export default function MembershipPlansPage() {
  const { hasPermission } = useAuth();
  const plansQuery = useMembershipPlans({ pageSize: 50 });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Membership Plans"
        description="Plans members can subscribe to"
        actions={hasPermission("membership_plans.create") && <CreatePlanDialog />}
      />

      {plansQuery.isLoading ? (
        <TableSkeleton />
      ) : plansQuery.isError ? (
        <ErrorState onRetry={() => plansQuery.refetch()} />
      ) : !plansQuery.data || plansQuery.data.items.length === 0 ? (
        <EmptyState title="No membership plans yet" description="Create your first plan to start selling memberships." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plansQuery.data.items.map((plan) => (
            <Card key={plan.id}>
              <CardHeader className="flex flex-row items-start justify-between">
                <CardTitle className="text-base">{plan.name}</CardTitle>
                {!plan.isActive && <Badge variant="secondary">Inactive</Badge>}
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                <p className="text-2xl font-semibold">
                  {plan.currency} {plan.price}
                  <span className="text-sm font-normal text-muted-foreground"> / {plan.durationDays}d</span>
                </p>
                {plan.description && <p className="text-muted-foreground">{plan.description}</p>}
                {plan.maxFreezeDays > 0 && (
                  <p className="text-xs text-muted-foreground">Up to {plan.maxFreezeDays} freeze days</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

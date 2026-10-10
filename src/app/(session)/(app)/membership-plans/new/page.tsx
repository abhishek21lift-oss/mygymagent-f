"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHero } from "@/components/shared/page-hero";
import { useAuth } from "@/lib/auth/auth-context";
import { useCreateMembershipPlan } from "@/lib/hooks/use-membership-plans";
import { ApiError } from "@/lib/api/client";
import { PlanForm, type PlanFormInput } from "../plan-form";

export default function NewMembershipPlanPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const createPlan = useCreateMembershipPlan();

  if (!hasPermission("membership_plans.create")) {
    return (
      <div className="flex flex-col gap-5 pb-4">
        <PageHero id="new-plan-title" icon={Sparkles} title="New membership plan" />
        <EmptyState
          title="Not permitted"
          description="Your account cannot create membership plans. Ask the gym owner for access."
        />
      </div>
    );
  }

  async function handleSubmit(values: PlanFormInput) {
    try {
      await createPlan.mutateAsync({
        name: values.name,
        code: values.code,
        category: values.category,
        description: values.description,
        branchId: values.branchId,
        durationDays: values.durationDays,
        price: values.price,
        currency: values.currency,
        benefits: values.benefits,
        maxFreezeDays: values.maxFreezeDays,
        isFeatured: values.isFeatured,
        isPublic: values.isPublic,
      });
      toast.success("Plan created");
      // The listing invalidates on the same mutation, so it refetches fresh.
      router.push("/membership-plans");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Failed to create plan",
      );
    }
  }

  return (
    <div className="flex flex-col gap-5 pb-4">
      <PageHero
        id="new-plan-title"
        icon={Sparkles}
        title="New membership plan"
        actions={
          <Link
            href="/membership-plans"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Plans
          </Link>
        }
      />
      <div className="mx-auto w-full max-w-2xl">
        <p className="mb-4 text-sm text-muted-foreground">
          Set the name, duration, price and perks. Discounts stay at sale time — editing the plan later never rewrites sold history.
        </p>
        <PlanForm
          pending={createPlan.isPending}
          cancelHref="/membership-plans"
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}

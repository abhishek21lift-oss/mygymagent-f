"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHero } from "@/components/shared/page-hero";
import { useAuth } from "@/lib/auth/auth-context";
import { useMembershipPlan, useUpdateMembershipPlan } from "@/lib/hooks/use-membership-plans";
import { ApiError } from "@/lib/api/client";
import { PlanForm, type PlanFormInput } from "../../plan-form";

export default function EditMembershipPlanPage() {
  const router = useRouter();
  const params = useParams<{ id: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { hasPermission } = useAuth();
  const planQuery = useMembershipPlan(id);
  const updatePlan = useUpdateMembershipPlan(id);

  if (!hasPermission("membership_plans.update")) {
    return (
      <div className="flex flex-col gap-5 pb-4">
        <PageHero id="edit-plan-title" icon={Sparkles} title="Edit membership plan" />
        <EmptyState
          title="Not permitted"
          description="Your account cannot edit membership plans. Ask the gym owner for access."
        />
      </div>
    );
  }

  if (planQuery.isLoading) {
    return (
      <div className="flex flex-col gap-5 pb-4">
        <PageHero id="edit-plan-title" icon={Sparkles} title="Edit membership plan" />
        <p className="text-sm text-muted-foreground">Loading plan…</p>
      </div>
    );
  }

  if (planQuery.isError || !planQuery.data) {
    return (
      <div className="flex flex-col gap-5 pb-4">
        <PageHero
          id="edit-plan-title"
          icon={Sparkles}
          title="Edit membership plan"
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
        <EmptyState
          title="Plan not found"
          description="This membership plan could not be loaded. It may have been removed."
        />
      </div>
    );
  }

  const plan = planQuery.data;

  async function handleSubmit(values: PlanFormInput) {
    try {
      await updatePlan.mutateAsync(values);
      toast.success("Plan updated");
      router.push("/membership-plans");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Failed to update plan",
      );
    }
  }

  return (
    <div className="flex flex-col gap-5 pb-4">
      <PageHero
        id="edit-plan-title"
        icon={Sparkles}
        title={`Edit ${plan.name}`}
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
        <PlanForm
          plan={plan}
          pending={updatePlan.isPending}
          cancelHref="/membership-plans"
          submitLabel="Save changes"
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}

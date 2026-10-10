"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth/auth-context";
import { useUpdateMembershipPlan } from "@/lib/hooks/use-membership-plans";
import type { MembershipPlan } from "@/lib/types/gym";
import { ApiError } from "@/lib/api/client";
import { PlanForm, type PlanFormInput } from "./plan-form";

/**
 * Edit dialog for membership plans. Creating a plan lives on the
 * dedicated `/membership-plans/new` route — a bare `<PlanDialog />`
 * renders a link there instead of opening a floating window.
 */
export function PlanDialog({
  plan,
  trigger,
}: {
  /** Omit to link to the create page; pass to edit in a dialog. */
  plan?: MembershipPlan;
  /** Defaults to the "Edit" button. */
  trigger?: React.ReactNode;
}) {
  const { hasPermission } = useAuth();
  const [open, setOpen] = React.useState(false);
  const updatePlan = useUpdateMembershipPlan(plan?.id ?? "");

  if (!plan) {
    if (!hasPermission("membership_plans.create")) return null;
    return (
      <Button
        className="inline-flex min-h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold"
        asChild
      >
        <Link href="/membership-plans/new">
          <Plus className="size-4" aria-hidden="true" />
          New plan
        </Link>
      </Button>
    );
  }

  if (!hasPermission("membership_plans.update")) return null;

  async function handleSubmit(values: PlanFormInput) {
    try {
      await updatePlan.mutateAsync(values);
      toast.success("Plan updated");
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Failed to update plan",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit plan</DialogTitle>
        </DialogHeader>
        <PlanForm
          plan={plan}
          pending={updatePlan.isPending}
          onCancel={() => setOpen(false)}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}

export function EditPlanButton({ plan }: { plan: MembershipPlan }) {
  return (
    <PlanDialog
      plan={plan}
      trigger={
        <Button
          variant="outline"
          size="sm"
          className="min-h-11 gap-1.5 rounded-xl"
        >
          <Pencil className="size-3.5" aria-hidden="true" />
          Edit
        </Button>
      }
    />
  );
}

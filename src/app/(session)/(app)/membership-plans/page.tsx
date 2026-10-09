"use client";

import Link from "next/link";
import { BadgeCheck, Check, Clock3, Sparkles, Tag } from "lucide-react";

import { GradientIcon } from "@/components/shared/bento";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHero } from "@/components/shared/page-hero";
import { ErrorState } from "@/components/shared/error-state";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/auth-context";
import {
  useMembershipPlans,
  useUpdateMembershipPlan,
} from "@/lib/hooks/use-membership-plans";
import type { MembershipPlan } from "@/lib/types/gym";
import { displayCurrencyAmount } from "@/lib/utils";
import type { Accent } from "@/lib/section-accent";
import { cn } from "@/lib/utils";
import { EditPlanButton, PlanDialog } from "./plan-dialog";

const PLAN_ACCENTS = ["emerald", "amber", "cyan", "violet"] as const satisfies readonly Accent[];

export default function MembershipPlansPage() {
  const { hasPermission } = useAuth();
  const plansQuery = useMembershipPlans({ pageSize: 50 });

  return (
    <div className="pb-6">
      <div className="flex flex-col gap-6">
        <PageHero
          id="plans-title"
          icon={Sparkles}
          title="Membership plans"
          actions={
            <>
              {hasPermission("membership_plans.create") && <PlanDialog />}
              <Link
                href="/memberships"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border/80 bg-card px-4 py-2.5 text-xs font-bold text-foreground shadow-xs transition duration-300 hover:-translate-y-0.5 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Sparkles className="size-4" aria-hidden="true" /> Active Subscriptions
              </Link>
            </>
          }
        />

        <section aria-labelledby="plans-grid-title">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 id="plans-grid-title" className="text-base font-bold text-foreground">
                All Configured Packages
              </h2>
              <p className="text-xs text-muted-foreground">
                Public and private tiers available across your club network
              </p>
            </div>
            {!plansQuery.isLoading && !plansQuery.isError && plansQuery.data && plansQuery.data.items.length > 0 && (
              <Badge variant="outline" className="rounded-full font-mono text-xs font-bold">
                {plansQuery.data.items.length} tiers
              </Badge>
            )}
          </div>

          {plansQuery.isLoading ? (
            <TableSkeleton />
          ) : plansQuery.isError ? (
            <div className="overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
              <ErrorState onRetry={() => plansQuery.refetch()} />
            </div>
          ) : !plansQuery.data || plansQuery.data.items.length === 0 ? (
            <div className="overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
              <EmptyState
                title="No membership plans yet"
                description="Create your first plan to start selling memberships."
              />
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {plansQuery.data.items.map((plan, index) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  accent={PLAN_ACCENTS[index % PLAN_ACCENTS.length]}
                  canEdit={hasPermission("membership_plans.update")}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  accent,
  canEdit,
}: {
  plan: MembershipPlan;
  accent: Accent;
  canEdit: boolean;
}) {
  const updatePlan = useUpdateMembershipPlan(plan.id);

  return (
    <article
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-3xl border bg-card/90 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
        plan.isFeatured
          ? "border-primary/50 ring-2 ring-primary/20 bg-gradient-to-b from-primary/5 via-card to-card"
          : "border-border/80 hover:border-border",
      )}
    >
      {/* Featured Banner */}
      {plan.isFeatured && (
        <div className="absolute -right-12 top-6 rotate-45 bg-gradient-to-r from-amber-500 to-rose-500 px-12 py-1 text-center font-mono text-[10px] font-black uppercase tracking-widest text-white shadow-xs">
          Featured
        </div>
      )}

      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <GradientIcon icon={Tag} accent={accent} />
            <div>
              <h3 className="text-lg font-black tracking-tight text-foreground">
                {plan.name}
              </h3>
              {(plan.code || plan.category) && (
                <p className="mt-0.5 flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                  {plan.code && <span className="font-bold text-foreground">{plan.code}</span>}
                  {plan.category && <span>· {plan.category}</span>}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {!plan.isActive && <Badge variant="secondary" className="rounded-full text-[10px]">Inactive</Badge>}
            {!plan.isPublic && <Badge variant="outline" className="rounded-full text-[10px]">Private</Badge>}
          </div>
        </div>

        {/* Pricing */}
        <div className="my-5 rounded-2xl border border-border/50 bg-muted/20 p-4">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black tracking-tight text-foreground tabular-nums">
              {displayCurrencyAmount(plan.price, plan.currency)}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              / {plan.durationDays} days
            </span>
          </div>
          {plan.description && (
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {plan.description}
            </p>
          )}
        </div>

        {/* Perks Checklist */}
        <div className="space-y-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Included Privileges
          </p>
          <ul className="space-y-2" aria-label="Included perks">
            {plan.benefits.length > 0 ? (
              plan.benefits.slice(0, 5).map((benefit) => (
                <li key={benefit} className="flex items-center gap-2 text-xs text-foreground">
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Check className="size-2.5 stroke-[3]" />
                  </span>
                  <span className="font-medium">{benefit}</span>
                </li>
              ))
            ) : (
              <li className="text-xs text-muted-foreground">Standard gym floor access</li>
            )}
            {plan.benefits.length > 5 && (
              <li className="pl-6 text-xs font-semibold text-muted-foreground">
                +{plan.benefits.length - 5} additional perks
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Footer / Meta & Actions */}
      <div className="mt-6 border-t border-border/50 pt-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 font-semibold text-foreground">
            <Clock3 className="size-3 text-muted-foreground" aria-hidden="true" />
            {plan.durationDays} days validity
          </span>
          {plan.maxFreezeDays > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 font-semibold text-foreground">
              <BadgeCheck className="size-3 text-muted-foreground" aria-hidden="true" />
              {plan.maxFreezeDays}d freeze
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-muted/40 px-2.5 py-1 text-muted-foreground">
              No freeze
            </span>
          )}
        </div>

        {canEdit && (
          <div className="mt-4 flex items-center justify-between gap-2">
            <EditPlanButton plan={plan} />
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl text-xs"
              disabled={updatePlan.isPending}
              onClick={() => updatePlan.mutate({ isActive: !plan.isActive })}
            >
              {plan.isActive ? "Deactivate" : "Activate"}
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}

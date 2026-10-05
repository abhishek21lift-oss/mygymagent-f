"use client";

import Link from "next/link";
import { BadgeCheck, Clock3, Sparkles, Tag, Wallet } from "lucide-react";

import { BentoGrid, GradientIcon } from "@/components/shared/bento";
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
import { accentClass } from "@/lib/design-tokens";
import type { Accent } from "@/lib/section-accent";
import { cn } from "@/lib/utils";
import { EditPlanButton, PlanDialog } from "./plan-dialog";

const PLAN_ACCENTS = ["emerald", "amber", "cyan", "violet"] as const satisfies readonly Accent[];

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
 {hasPermission("membership_plans.create") && <PlanDialog />}
 <Link href="/memberships" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border/80 bg-card px-5 py-3 text-sm font-bold text-foreground shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
 <Sparkles className="size-4" aria-hidden="true" /> Lifecycle
 </Link>
 </>
 }
 />

 <section aria-labelledby="plans-grid-title" className="">
 <div className="mb-4 flex items-end justify-between gap-4">
 <div>
 <h2 id="plans-grid-title" className="section-title">All plans</h2>
 </div>
 {!plansQuery.isLoading && !plansQuery.isError && plansQuery.data && plansQuery.data.items.length > 0 && (
 <span className="rounded-full px-3 py-1 font-mono text-xs font-black tabular-nums" style={{ background: "var(--section-fill)", color: "var(--section-on)" }}>{plansQuery.data.items.length}</span>
 )}
 </div>

 {plansQuery.isLoading ? (
 <TableSkeleton />
 ) : plansQuery.isError ? (
 <div className="overflow-hidden rounded-3xl border border-border bg-card p-4 shadow-sm dark:bg-card">
 <ErrorState onRetry={() => plansQuery.refetch()} />
 </div>
 ) : !plansQuery.data || plansQuery.data.items.length === 0 ? (
 <div className="overflow-hidden rounded-3xl border border-border bg-card p-4 shadow-sm dark:bg-card">
 <EmptyState title="No membership plans yet" description="Create your first plan to start selling memberships." />
 </div>
 ) : (
 <BentoGrid columns={3} label="Membership plans">
 {plansQuery.data.items.map((plan, index) => (
 <PlanCard
 key={plan.id}
 plan={plan}
 accent={PLAN_ACCENTS[index % PLAN_ACCENTS.length]}
 canEdit={hasPermission("membership_plans.update")}
 />
 ))}
 </BentoGrid>
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
 <article className={cn("kpi-card", accentClass[accent], "group flex flex-col")}>
 <div className="flex flex-row items-start justify-between gap-3">
 <div className="flex min-w-0 items-center gap-3">
 <GradientIcon icon={Tag} accent={accent} />
 <div className="min-w-0">
 <h3 className="text-base font-extrabold tracking-tight [overflow-wrap:anywhere] text-foreground">{plan.name}</h3>
 {(plan.code || plan.category) && (
 <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
 {plan.code && <span className="font-mono font-bold">{plan.code}</span>}
 {plan.category && <span>{plan.category}</span>}
 </p>
 )}
 </div>
 </div>
 <div className="flex shrink-0 flex-col items-end gap-1.5">
 {!plan.isActive && <Badge variant="secondary" className="rounded-full">Inactive</Badge>}
 {plan.isFeatured && <Badge variant="warning" className="rounded-full">Featured</Badge>}
 {!plan.isPublic && <Badge variant="outline" className="rounded-full">Hidden</Badge>}
 </div>
 </div>
 <div className="flex flex-1 flex-col gap-2 pt-4 text-sm">
 <p className="flex items-baseline gap-1.5 text-2xl font-black tracking-tight text-foreground tabular-nums">
 <Wallet className="size-5 self-center" style={{ color: "var(--section-ink)" }} aria-hidden="true" />
 {displayCurrencyAmount(plan.price, plan.currency)}
 <span className="text-sm font-bold text-muted-foreground"> / {plan.durationDays}d</span>
 </p>
 {plan.description && <p className="text-sm font-medium leading-6 text-muted-foreground">{plan.description}</p>}
 {plan.benefits.length > 0 && (
 <ul className="flex flex-wrap gap-1.5" aria-label="Included perks">
 {plan.benefits.slice(0, 4).map((benefit) => (
 <li key={benefit} className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold">{benefit}</li>
 ))}
 {plan.benefits.length > 4 && (
 <li className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
 +{plan.benefits.length - 4} more
 </li>
 )}
 </ul>
 )}
 <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
 <span className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-bold">
 <Clock3 className="size-3.5" aria-hidden="true" /> {plan.durationDays} days
 </span>
 {plan.maxFreezeDays > 0 ? (
 <span className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-bold">
 <BadgeCheck className="size-3.5" aria-hidden="true" /> Up to {plan.maxFreezeDays} freeze days
 </span>
 ) : (
 <span className="inline-flex min-h-11 items-center rounded-full bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground">No freeze</span>
 )}
 </div>
 {canEdit && (
 <div className="flex flex-wrap items-center gap-2 pt-3">
 <EditPlanButton plan={plan} />
 <Button
 variant="ghost"
 size="sm"
 className="min-h-11 rounded-xl"
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

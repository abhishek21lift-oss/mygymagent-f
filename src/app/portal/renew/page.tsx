"use client";

import * as React from "react";
import { CheckCircle2, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";

import { PageHero } from "@/components/shared/page-hero";
import { DataState } from "@/components/shared/data-state";
import { Panel } from "@/components/shared/panel";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import {
  usePortalMe,
  usePortalRenewalOptions,
  useRequestPortalRenewal,
} from "@/lib/hooks/use-portal";

function formatPrice(price: string | number, currency: string) {
  const amount = typeof price === "string" ? Number(price) : price;
  if (!Number.isFinite(amount)) return `${currency} ${String(price)}`;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // An unrecognised currency code should show the number, not throw.
    return `${currency} ${amount}`;
  }
}

/**
 * Asking the gym to renew.
 *
 * Deliberately not a card form. Taking money needs a gateway that is
 * actually configured and a webhook that is actually reachable, and a
 * "Pay now" button that silently does neither is worse than no button.
 * This sends the request to the queue staff already work from, and says
 * so plainly rather than implying the payment went through.
 */
export default function PortalRenewPage() {
  const me = usePortalMe();
  const options = usePortalRenewalOptions();
  const request = useRequestPortalRenewal();
  const [requestedPlan, setRequestedPlan] = React.useState<string | null>(null);

  const membership = me.data?.activeMembership;
  const items = options.data?.items ?? [];

  async function handleRequest(planId: string, planName: string) {
    try {
      const result = await request.mutateAsync({ membershipPlanId: planId });
      setRequestedPlan(planName);
      toast.success(
        result.alreadyRequested
          ? "You already have a renewal request open"
          : `${planName} requested — the gym will be in touch`,
      );
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Could not send that request",
      );
    }
  }

  if (requestedPlan) {
    return (
      <Panel title="Renewal" titleId="portal-renew">
        <div className="flex flex-col items-start gap-2">
          <CheckCircle2
            className="size-6 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="text-sm font-semibold">Request sent</p>
          <p className="text-sm text-muted-foreground">
            The gym has your request for {requestedPlan} and will confirm the
            payment with you directly.
          </p>
        </div>
      </Panel>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHero icon={Wallet} title="Renew" description="Choose a plan and ask the gym to renew" />
      <Panel title="Your membership" titleId="portal-renew-current">
        {membership ? (
          <p className="text-sm">
            {membership.membershipPlan?.name ?? "Membership"} — until{" "}
            {new Date(membership.endDate).toLocaleDateString()}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            You do not have an active membership right now.
          </p>
        )}
      </Panel>

      <Panel title="Plans" titleId="portal-renew-plans" flush>
        <div className="p-4 sm:p-5">
          <DataState
            isLoading={options.isPending}
            isError={options.isError}
            onRetry={() => void options.refetch()}
            errorMessage="The plans could not be loaded."
            isEmpty={items.length === 0}
            emptyIcon={Wallet}
            emptyTitle="No plans listed"
            emptyDescription="Ask at the front desk about renewing."
            skeletonRows={3}
          >
            <ul className="divide-y divide-border">
              {items.map((plan) => (
                <li key={plan.id} className="flex flex-col gap-2 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{plan.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {plan.durationDays} days
                        {plan.description ? ` · ${plan.description}` : ""}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold">
                      {formatPrice(plan.price, plan.currency)}
                    </p>
                  </div>
                  {plan.benefits.length > 0 && (
                    <ul className="flex flex-wrap gap-x-3 gap-y-1">
                      {plan.benefits.map((benefit) => (
                        <li
                          key={benefit}
                          className="text-xs text-muted-foreground"
                        >
                          • {benefit}
                        </li>
                      ))}
                    </ul>
                  )}
                  <Button
                    size="sm"
                    disabled={request.isPending}
                    onClick={() => void handleRequest(plan.id, plan.name)}
                    className="ml-auto min-h-11 rounded-lg"
                  >
                    {request.isPending && (
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                    )}
                    Request this plan
                  </Button>
                </li>
              ))}
            </ul>
          </DataState>
        </div>
      </Panel>

      <p className="px-1 text-xs text-muted-foreground">
        Requesting a plan tells the gym what you want. They will confirm the
        payment with you — nothing is charged here.
      </p>
    </div>
  );
}

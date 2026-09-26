"use client";

import * as React from "react";
import { toast } from "sonner";
import { Check, Lightbulb, Loader2, RefreshCw, ShieldAlert, X } from "lucide-react";

import { DataState } from "@/components/shared/data-state";
import { Panel } from "@/components/shared/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import {
  useChurnAssessment,
  useChurnReason,
  useComputeMemberIntelligence,
  useDismissRecommendation,
  useExecuteRecommendation,
  useGenerateRecommendations,
  useMemberIntelligence,
  useMemberRecommendations,
} from "@/lib/hooks/use-member-intelligence";

function fail(error: unknown, fallback: string) {
  toast.error(error instanceof ApiError ? error.message : fallback);
}

/** A 0-100 signal from the risk engine, shown as the number and a bar so
 * the four read against each other at a glance. */
function SignalTile({ label, value }: { label: string; value: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="rounded-lg border border-border px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-bold tabular-nums">{clamped}</p>
      <div
        className="mt-1 h-1 overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`${label}: ${clamped} out of 100`}
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

/**
 * Why this member might leave, and what to do about it.
 *
 * The engine scored them, explained the score and proposed actions, and
 * the app could reach none of it: no recompute, no reason, and no way to
 * execute or dismiss a single proposed action. A recommendation nobody
 * can act on is a row in a table.
 *
 * `members.read` covers the reads and the recompute; executing and
 * dismissing are `members.update`, because both change something.
 */
export function RiskRecommendationsPanel({ memberId }: { memberId: string }) {
  const { hasPermission } = useAuth();
  const canRead = hasPermission("members.read");
  const canUpdate = hasPermission("members.update");
  const canViewReports = hasPermission("reports.view");

  const assessment = useChurnAssessment(canViewReports ? memberId : undefined);
  const reason = useChurnReason(canRead ? memberId : undefined);
  const recommendations = useMemberRecommendations(canRead ? memberId : undefined);
  const intelligence = useMemberIntelligence(canRead ? memberId : undefined);
  const compute = useComputeMemberIntelligence();
  const generate = useGenerateRecommendations(memberId);
  const execute = useExecuteRecommendation(memberId);
  const dismiss = useDismissRecommendation(memberId);

  if (!canRead) return null;

  const reasonText =
    (typeof reason.data?.reason === "string" && reason.data.reason) ||
    (typeof reason.data?.summary === "string" && reason.data.summary) ||
    null;

  return (
    <Panel
      title="Risk and recommendations"
      titleId="risk-recommendations"
      description="Why this member might leave, and the actions the engine proposes."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={compute.isPending}
            onClick={() =>
              void compute
                .mutateAsync(memberId)
                .then(() => toast.success("Risk recomputed"))
                .catch((error) => fail(error, "Could not recompute the score"))
            }
          >
            {compute.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="size-4" aria-hidden="true" />
            )}
            Recompute
          </Button>
          <Button
            size="sm"
            disabled={generate.isPending}
            onClick={() =>
              void generate
                .mutateAsync()
                .then(() => toast.success("Recommendations generated"))
                .catch((error) => fail(error, "Could not generate recommendations"))
            }
          >
            {generate.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Generate
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        {canViewReports && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border px-3 py-2">
            <ShieldAlert className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            {assessment.isPending ? (
              <span className="text-sm text-muted-foreground">Loading assessment…</span>
            ) : assessment.isError ? (
              <span className="text-sm text-muted-foreground">
                Assessment could not be loaded.
              </span>
            ) : (
              <>
                {assessment.data?.riskLevel ? (
                  <Badge
                    variant={
                      assessment.data.riskLevel === "CRITICAL"
                        ? "destructive"
                        : assessment.data.riskLevel === "HIGH"
                          ? "warning"
                          : "secondary"
                    }
                  >
                    {assessment.data.riskLevel}
                  </Badge>
                ) : (
                  <Badge variant="secondary">Not scored</Badge>
                )}
                {assessment.data?.score != null && (
                  <span className="text-sm tabular-nums">Score {assessment.data.score}</span>
                )}
                {reasonText && (
                  <span className="min-w-0 text-sm text-muted-foreground">{reasonText}</span>
                )}
              </>
            )}
          </div>
        )}

        {/* The signals behind the level. A bare "HIGH" tells a trainer to
            worry; these tell them what to do about it. members.read, so
            this shows for staff who cannot open the risk reports. */}
        {intelligence.data && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <SignalTile label="Attendance velocity" value={intelligence.data.attendanceVelocity} />
            <SignalTile label="Payment reliability" value={intelligence.data.paymentReliability} />
            <SignalTile label="Engagement" value={intelligence.data.engagementScore} />
            <div className="rounded-lg border border-border px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Membership
              </p>
              <p className="text-sm font-bold">{intelligence.data.membershipStatus}</p>
              {intelligence.data.daysUntilExpiry !== null && (
                <p className="text-xs text-muted-foreground tabular-nums">
                  {intelligence.data.daysUntilExpiry < 0
                    ? `expired ${Math.abs(intelligence.data.daysUntilExpiry)}d ago`
                    : `${intelligence.data.daysUntilExpiry}d left`}
                </p>
              )}
            </div>
          </div>
        )}

        {(intelligence.data?.riskProfile?.contributingFactors?.length ?? 0) > 0 && (
          <ul className="flex flex-col gap-1.5 rounded-lg border border-border p-3">
            {intelligence.data!.riskProfile!.contributingFactors
              // Biggest mover first: the top line is the one worth acting on.
              .slice()
              .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
              .slice(0, 5)
              .map((factor) => (
                <li key={factor.factor} className="flex items-start gap-2 text-sm">
                  <Badge variant={factor.direction === "NEGATIVE" ? "destructive" : "success"}>
                    {factor.contribution > 0 ? "+" : ""}
                    {Math.round(factor.contribution)}
                  </Badge>
                  <span className="min-w-0 text-muted-foreground">{factor.explanation}</span>
                </li>
              ))}
          </ul>
        )}

        <DataState
          isLoading={recommendations.isPending}
          isError={recommendations.isError}
          onRetry={() => void recommendations.refetch()}
          errorMessage="Could not load recommendations."
          isEmpty={(recommendations.data ?? []).length === 0}
          emptyIcon={Lightbulb}
          emptyTitle="No recommendations"
          emptyDescription="Generate to have the engine propose next actions for this member."
        >
          <div className="flex flex-col gap-2">
            {(recommendations.data ?? []).map((rec) => (
              <div
                key={rec.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {rec.title ?? rec.actionType ?? "Recommended action"}
                  </p>
                  {rec.description && (
                    <p className="text-xs text-muted-foreground">{rec.description}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {rec.status && <Badge variant="secondary">{rec.status}</Badge>}
                  {canUpdate && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={execute.isPending}
                        onClick={() =>
                          void execute
                            .mutateAsync(rec.id)
                            .then(() => toast.success("Action executed"))
                            .catch((error) => fail(error, "Could not execute the action"))
                        }
                      >
                        <Check className="size-4" aria-hidden="true" />
                        Execute
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={dismiss.isPending}
                        onClick={() =>
                          void dismiss
                            .mutateAsync(rec.id)
                            .then(() => toast.success("Dismissed"))
                            .catch((error) => fail(error, "Could not dismiss the action"))
                        }
                      >
                        <X className="size-4" aria-hidden="true" />
                        Dismiss
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DataState>
      </div>
    </Panel>
  );
}

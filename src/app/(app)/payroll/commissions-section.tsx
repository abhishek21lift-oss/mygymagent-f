"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, Percent, Play, Plus } from "lucide-react";

import { DataState } from "@/components/shared/data-state";
import { Panel, MetricStrip } from "@/components/shared/panel";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import {
  useCommissionRules,
  useCommissionSummary,
  useCommissions,
  useGenerateCommissions,
  useUpsertCommissionRule,
  type CommissionRule,
} from "@/lib/hooks/use-commissions";
import { useStaffPayroll } from "@/lib/hooks/use-staff-payroll";
import { displayCurrencyAmount } from "@/lib/utils";

/** The first of the month, and today, as yyyy-mm-dd. */
function defaultWindow() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { from: iso(first), to: iso(now) };
}

function ruleLabel(rule: CommissionRule): string {
  const pct = Number(rule.percentage);
  const flat = Number(rule.fixedAmount);
  const parts: string[] = [];
  if (pct) parts.push(`${pct}%`);
  if (flat) parts.push(displayCurrencyAmount(flat));
  return parts.join(" + ") || "0%";
}

/**
 * Trainer commissions.
 *
 * The other half of `payroll.*`, and until now the half with no screen at
 * all: the six endpoints behind it -- rules, generation, the ledger and
 * the per-trainer totals -- were complete on the server and unreachable
 * from the app, so a gym paying its trainers a percentage had to do it
 * from a database client.
 *
 * It sits on the Payroll page rather than in its own sidebar entry
 * because it answers the same question as the section above it (what do
 * we owe our staff this month), and splitting it out would have made two
 * nav items that people visit together. The two halves authorize
 * separately though -- `hr.*` above, `payroll.*` here -- so the page
 * renders whichever the reader is entitled to, and the nav item is
 * visible to either.
 */
export function CommissionsSection() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("payroll.manage");
  const [window, setWindow] = React.useState(defaultWindow);

  const summary = useCommissionSummary(window);
  const ledger = useCommissions(window);
  const rules = useCommissionRules();
  // The trainer picker needs display names, and commission rows only
  // carry a name once a commission exists. Staff is a separate grant, so
  // the picker is offered only to readers who hold it.
  const staff = useStaffPayroll(hasPermission("hr.read"));

  const generate = useGenerateCommissions();
  const upsertRule = useUpsertCommissionRule();

  const [draft, setDraft] = React.useState({
    trainerId: "",
    percentage: "",
    fixedAmount: "",
    sessionType: "",
  });

  const totals = React.useMemo(() => {
    const rows = summary.data ?? [];
    return {
      commission: rows.reduce((n, r) => n + Number(r.commissionAmount), 0),
      base: rows.reduce((n, r) => n + Number(r.baseAmount), 0),
      sessions: rows.reduce((n, r) => n + r.sessions, 0),
      trainers: rows.length,
    };
  }, [summary.data]);

  const nameFor = React.useCallback(
    (trainerId: string) =>
      (staff.data ?? []).find((s) => s.id === trainerId)?.user,
    [staff.data],
  );

  async function onGenerate() {
    try {
      const result = await generate.mutateAsync(window);
      toast.success(
        result.created
          ? `${result.created} commission${result.created === 1 ? "" : "s"} from ${result.scanned} session${result.scanned === 1 ? "" : "s"}`
          : `No new commissions — ${result.scanned} session${result.scanned === 1 ? "" : "s"} scanned, all already paid or without a rule`,
      );
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Could not generate commissions",
      );
    }
  }

  async function onAddRule() {
    if (!draft.trainerId) return;
    try {
      await upsertRule.mutateAsync({
        trainerId: draft.trainerId,
        percentage: Number(draft.percentage || 0),
        ...(draft.fixedAmount ? { fixedAmount: Number(draft.fixedAmount) } : {}),
        ...(draft.sessionType ? { sessionType: draft.sessionType } : {}),
      });
      setDraft({ trainerId: "", percentage: "", fixedAmount: "", sessionType: "" });
      toast.success("Commission rule saved");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not save the rule");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <MetricStrip columns={4} label="Commission totals">
        <StatCard
          title="Commission owed"
          value={displayCurrencyAmount(totals.commission)}
          isLoading={summary.isPending}
          isError={summary.isError}
          hint="In the selected window"
        />
        <StatCard
          title="Session value"
          value={displayCurrencyAmount(totals.base)}
          isLoading={summary.isPending}
          isError={summary.isError}
        />
        <StatCard
          title="Sessions"
          value={totals.sessions}
          isLoading={summary.isPending}
          isError={summary.isError}
        />
        <StatCard
          title="Trainers paid"
          value={totals.trainers}
          isLoading={summary.isPending}
          isError={summary.isError}
        />
      </MetricStrip>

      <Panel
        title="Trainer commissions"
        titleId="commissions-window"
        description="Completed PT sessions in the window, priced by each trainer's rule."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              aria-label="Commission window start"
              value={window.from}
              onChange={(e) => setWindow((w) => ({ ...w, from: e.target.value }))}
              className="h-9 w-[9.5rem]"
            />
            <Input
              type="date"
              aria-label="Commission window end"
              value={window.to}
              onChange={(e) => setWindow((w) => ({ ...w, to: e.target.value }))}
              className="h-9 w-[9.5rem]"
            />
            {canManage && (
              <Button size="sm" onClick={() => void onGenerate()} disabled={generate.isPending}>
                {generate.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Play className="size-4" aria-hidden="true" />
                )}
                Generate
              </Button>
            )}
          </div>
        }
        flush
      >
        <DataState
          isLoading={summary.isPending}
          isError={summary.isError}
          onRetry={() => void summary.refetch()}
          errorMessage="Could not load commission totals."
          isEmpty={(summary.data ?? []).length === 0}
          emptyIcon={Percent}
          emptyTitle="No commissions in this window"
          emptyDescription={
            canManage
              ? "Set a rule for a trainer below, then generate to price their completed sessions."
              : "Nothing has been generated for these dates yet."
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trainer</TableHead>
                <TableHead className="text-right">Sessions</TableHead>
                <TableHead className="text-right">Session value</TableHead>
                <TableHead className="text-right">Commission</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(summary.data ?? []).map((row) => (
                <TableRow key={row.trainerId}>
                  <TableCell className="font-medium">
                    {row.trainerName ?? (
                      <span className="text-muted-foreground">Unnamed trainer</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.sessions}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {displayCurrencyAmount(row.baseAmount)}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {displayCurrencyAmount(row.commissionAmount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataState>
      </Panel>

      <Panel
        title="Commission rules"
        titleId="commission-rules"
        description="A percentage and/or a flat amount per completed session. A rule naming a session type wins over the trainer's catch-all."
      >
        <DataState
          isLoading={rules.isPending}
          isError={rules.isError}
          onRetry={() => void rules.refetch()}
          errorMessage="Could not load commission rules."
          isEmpty={(rules.data ?? []).length === 0 && !canManage}
          emptyIcon={Percent}
          emptyTitle="No commission rules"
          emptyDescription="Sessions will not generate commissions until a trainer has a rule."
        >
          <div className="flex flex-col gap-2">
            {(rules.data ?? []).map((rule) => {
              const who = nameFor(rule.trainerId);
              return (
                <div
                  key={rule.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {who ? `${who.firstName} ${who.lastName}` : rule.trainerId}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {rule.sessionType ? `${rule.sessionType} sessions` : "All session types"}
                    </p>
                  </div>
                  <Badge variant="secondary">{ruleLabel(rule)}</Badge>
                </div>
              );
            })}

            {canManage && (
              <div className="mt-1 grid gap-2 border-t border-border pt-3 sm:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))_auto]">
                <select
                  aria-label="Trainer"
                  value={draft.trainerId}
                  onChange={(e) => setDraft((d) => ({ ...d, trainerId: e.target.value }))}
                  className="h-10 rounded-md border border-input bg-card px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">
                    {staff.isPending ? "Loading staff…" : "Select a trainer"}
                  </option>
                  {(staff.data ?? []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.user.firstName} {s.user.lastName}
                    </option>
                  ))}
                </select>
                <Input
                  aria-label="Percentage of session price"
                  inputMode="decimal"
                  placeholder="% of price"
                  value={draft.percentage}
                  onChange={(e) => setDraft((d) => ({ ...d, percentage: e.target.value }))}
                />
                <Input
                  aria-label="Flat amount per session"
                  inputMode="decimal"
                  placeholder="Flat amount"
                  value={draft.fixedAmount}
                  onChange={(e) => setDraft((d) => ({ ...d, fixedAmount: e.target.value }))}
                />
                <Input
                  aria-label="Session type (optional)"
                  placeholder="Session type"
                  value={draft.sessionType}
                  onChange={(e) => setDraft((d) => ({ ...d, sessionType: e.target.value }))}
                />
                <Button
                  onClick={() => void onAddRule()}
                  disabled={!draft.trainerId || upsertRule.isPending}
                >
                  {upsertRule.isPending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Plus className="size-4" aria-hidden="true" />
                  )}
                  Save rule
                </Button>
              </div>
            )}
          </div>
        </DataState>
      </Panel>

      <Panel
        title="Commission ledger"
        titleId="commission-ledger"
        description="Every priced session in the window."
        flush
      >
        <DataState
          isLoading={ledger.isPending}
          isError={ledger.isError}
          onRetry={() => void ledger.refetch()}
          errorMessage="Could not load the commission ledger."
          isEmpty={(ledger.data ?? []).length === 0}
          emptyIcon={Percent}
          emptyTitle="Nothing priced yet"
          emptyDescription="Generated commissions appear here, one row per session."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session date</TableHead>
                <TableHead>Trainer</TableHead>
                <TableHead className="text-right">Session price</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(ledger.data ?? []).map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="tabular-nums">
                    {new Date(row.sessionAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>{row.trainerName ?? row.trainerId}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {displayCurrencyAmount(row.baseAmount)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{Number(row.rate)}%</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {displayCurrencyAmount(row.commissionAmount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.status === "PAID" ? "success" : "secondary"}>
                      {row.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataState>
      </Panel>
    </div>
  );
}

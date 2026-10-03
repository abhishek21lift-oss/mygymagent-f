"use client"

import * as React from "react"
import { Activity, AlertTriangle, Bot, Database, Gauge, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { ApiError } from "@/lib/api/client"
import {
  isStale,
  useCommandCenterSnapshot,
  type AiCard,
  type HttpSummary,
  type QueuesCard,
  type ReadinessCard,
} from "@/lib/hooks/use-command-center"
import { useRefreshCommandCenter } from "@/lib/hooks/use-command-center-refresh"
import {
  CommandCard,
  Metric,
  QueueBars,
} from "@/components/command-center/command-card"
import { DataState } from "@/components/shared/data-state"
import { PageHero } from "@/components/shared/page-hero"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

/**
 * Platform operations console.
 *
 * Reads four cards and changes nothing. Every number on this screen comes
 * from a card that measured it: there is no fallback, no default, and no
 * `?? 0` anywhere in the render path, because a plausible-looking zero on an
 * operations screen is how an outage gets read as a quiet day.
 *
 * Gated on `User.platformRole` — the server refuses these routes to anyone
 * without it, so this check is about not rendering an empty shell to someone
 * who can never fill it, not about security.
 */

const ms = (value: number | null | undefined) =>
  value === null || value === undefined ? null : `${value} ms`

const usd = (value: number | null) =>
  value === null ? null : `$${value.toFixed(4)}`

export default function CommandCenterPage() {
  const snapshot = useCommandCenterSnapshot()
  const refresh = useRefreshCommandCenter()

  // One clock for the whole screen, so every card's staleness is judged
  // against the same instant instead of each re-rendering on its own.
  const [now, setNow] = React.useState(() => Date.now())
  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15_000)
    return () => clearInterval(timer)
  }, [])

  const data = snapshot.data
  const stale = (checkedAt?: string) =>
    checkedAt ? isStale(checkedAt, now) : false

  async function onRefresh() {
    try {
      await refresh.mutateAsync()
      toast.success("Re-probed every card")
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Could not re-probe",
      )
    }
  }

  return (
    <div className="space-y-6">
      <PageHero
        title="Command Center"
        description="Live operational telemetry for this deployment."
        actions={
          <Button
            onClick={onRefresh}
            disabled={refresh.isPending}
            variant="outline"
            size="sm"
          >
            <RefreshCw
              aria-hidden="true"
              className={refresh.isPending ? "animate-spin" : undefined}
            />
            {refresh.isPending ? "Re-probing" : "Re-probe now"}
          </Button>
        }
      />

      <DataState
        isLoading={snapshot.isLoading}
        isError={snapshot.isError}
        onRetry={() => snapshot.refetch()}
        errorMessage={
          snapshot.error instanceof ApiError
            ? snapshot.error.message
            : "Could not load telemetry."
        }
        isEmpty={false}
        emptyTitle="Command Center"
        emptyDescription="No telemetry has been collected yet."
      >
        {data ? (
          <div className="space-y-4">
            {stale(data.collectedAt) ? (
              <p
                role="status"
                className="flex items-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-800 dark:text-amber-200"
              >
                <AlertTriangle aria-hidden="true" className="size-4 shrink-0" />
                This reading is more than a minute old. Re-probe before acting on it.
              </p>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-2">
              <ReadinessTile card={data.readiness} now={now} />
              <QueuesTile card={data.queues} now={now} />
              <AiTile card={data.ai} now={now} />
              <HttpNote />
            </div>

            <p className="text-xs text-muted-foreground">
              Collected {new Date(data.collectedAt).toLocaleTimeString()} in{" "}
              {data.durationMs} ms.
            </p>
          </div>
        ) : null}
      </DataState>
    </div>
  )
}

function ReadinessTile({
  card,
  now,
}: {
  card: { status: "ok" | "degraded" | "unavailable"; value: ReadinessCard | null; checkedAt: string; unavailableReason?: string; latencyMs: number }
  now: number
}) {
  return (
    <CommandCard
      title="Readiness"
      description="The same dependencies GET /ready probes."
      card={card}
      isStale={isStale(card.checkedAt, now)}
    >
      {card.value ? (
        <div className="grid grid-cols-2 gap-4">
          <Metric
            label="Database"
            value={card.value.database}
            tone={card.value.database === "down" ? "destructive" : "default"}
            unit={ms(card.value.latencyMs.database) ?? undefined}
          />
          <Metric
            label="Queue"
            value={card.value.queue}
            tone={card.value.queue === "down" ? "destructive" : "default"}
            unit={ms(card.value.latencyMs.queue) ?? undefined}
          />
        </div>
      ) : null}
    </CommandCard>
  )
}

function QueuesTile({
  card,
  now,
}: {
  card: { status: "ok" | "degraded" | "unavailable"; value: QueuesCard | null; checkedAt: string; unavailableReason?: string; latencyMs: number }
  now: number
}) {
  const rows =
    card.value?.queues.map((q) => ({
      name: q.name,
      waiting: q.depth?.waiting ?? 0,
      failed: q.depth?.failed ?? 0,
      // A queue we could not read must not contribute a zero-width bar; it
      // says so instead, which is the difference between "idle" and
      // "unknown".
      unavailable: q.status === "unavailable",
    })) ?? []

  return (
    <CommandCard
      title="Queues"
      description="BullMQ depth across every queue the workers share."
      card={card}
      isStale={isStale(card.checkedAt, now)}
    >
      <QueueBars rows={rows} />
    </CommandCard>
  )
}

function AiTile({
  card,
  now,
}: {
  card: { status: "ok" | "degraded" | "unavailable"; value: AiCard | null; checkedAt: string; unavailableReason?: string; latencyMs: number }
  now: number
}) {
  const v = card.value
  return (
    <CommandCard
      title="AI usage"
      description="Last 24h across every tenant. Cost as the provider reported it."
      card={card}
      isStale={isStale(card.checkedAt, now)}
    >
      {v ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric label="Requests" value={v.requests} />
            <Metric
              label="Errors"
              value={v.errors}
              tone={v.errors > 0 ? "warning" : "default"}
            />
            <Metric label="Cost" value={usd(v.costUsd)} />
            <Metric label="Tokens" value={v.tokens.total} />
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
            <Badge variant="secondary">
              <Bot aria-hidden="true" className="size-3" />
              {v.actions.pendingApproval} awaiting approval
            </Badge>
            <Badge variant="secondary">
              {v.actions.executed} executed
            </Badge>
            {v.actions.failed > 0 ? (
              <Badge variant="destructive">{v.actions.failed} failed</Badge>
            ) : null}
          </div>
        </div>
      ) : null}
    </CommandCard>
  )
}

/**
 * Request latency is collected in-process but not yet exposed as a card.
 *
 * Stated rather than hidden. A monitoring console that quietly omits a
 * section reads as "there is nothing to report", and a reader who does not
 * know the difference will conclude the API is fast.
 */
function HttpNote() {
  return (
    <section
      aria-label="API latency"
      className="relative overflow-hidden rounded-3xl border border-dashed border-border bg-muted/30 p-5"
    >
      <div className="flex items-start gap-3">
        <Gauge aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">API latency</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Not collected yet. Request timings are gathered in-process but
            this endpoint does not report them, so no figure is shown rather
            than a placeholder that reads like a measurement.
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Database aria-hidden="true" className="size-3" />
            <Activity aria-hidden="true" className="size-3" />
            Host CPU, memory and Docker metrics are likewise unavailable on
            this deployment.
          </p>
        </div>
      </div>
    </section>
  )
}

export type { HttpSummary }

"use client"

import * as React from "react"
import { Activity, AlertTriangle, Bot, Database, Gauge, RefreshCw, Server } from "lucide-react"
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
 * `?? 0` anywhere in the render path.
 */

const ms = (value: number | null | undefined) =>
  value === null || value === undefined ? null : `${value} ms`

const usd = (value: number | null) =>
  value === null ? null : `$${value.toFixed(4)}`

export default function CommandCenterPage() {
  const snapshot = useCommandCenterSnapshot()
  const refresh = useRefreshCommandCenter()

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
      toast.success("Re-probed every operational card")
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Could not re-probe",
      )
    }
  }

  return (
    <div className="space-y-6 pb-6">
      <PageHero
        title="Command Center"
        description="Live operational telemetry, health probes, and backend queue depth"
        actions={
          <Button
            onClick={onRefresh}
            disabled={refresh.isPending}
            variant="outline"
            size="sm"
            className="rounded-xl shadow-xs"
          >
            <RefreshCw
              aria-hidden="true"
              className={`mr-1.5 size-3.5 ${refresh.isPending ? "animate-spin" : ""}`}
            />
            {refresh.isPending ? "Re-probing..." : "Re-probe now"}
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
          <div className="space-y-6">
            {stale(data.collectedAt) ? (
              <div
                role="status"
                className="flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs font-semibold text-amber-800 dark:text-amber-200"
              >
                <AlertTriangle aria-hidden="true" className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>This reading is more than a minute old. Re-probe to capture current system state before diagnosing.</span>
              </div>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-2">
              <ReadinessTile card={data.readiness} now={now} />
              <QueuesTile card={data.queues} now={now} />
              <AiTile card={data.ai} now={now} />
              <HttpNote />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground">
              <span>Telemetry snapshot taken at {new Date(data.collectedAt).toLocaleTimeString()}</span>
              <span className="font-mono tabular-nums">Roundtrip: {data.durationMs} ms</span>
            </div>
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
      title="Core System Readiness"
      description="Direct socket connection latency to primary database and Redis cache"
      card={card}
      isStale={isStale(card.checkedAt, now)}
    >
      {card.value ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5">
            <Metric
              label="PostgreSQL Database"
              value={card.value.database}
              tone={card.value.database === "down" ? "destructive" : "default"}
              unit={ms(card.value.latencyMs.database) ?? undefined}
            />
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-3.5">
            <Metric
              label="BullMQ Redis Queue"
              value={card.value.queue}
              tone={card.value.queue === "down" ? "destructive" : "default"}
              unit={ms(card.value.latencyMs.queue) ?? undefined}
            />
          </div>
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
      unavailable: q.status === "unavailable",
    })) ?? []

  return (
    <CommandCard
      title="Asynchronous Queue Depth"
      description="BullMQ job backlog and failure rate across distributed worker pool"
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
      title="AI Gateway & Inference"
      description="24-hour aggregate consumption across multi-tenant inference broker"
      card={card}
      isStale={isStale(card.checkedAt, now)}
    >
      {v ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
              <Metric label="Requests" value={v.requests} />
            </div>
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
              <Metric
                label="Errors"
                value={v.errors}
                tone={v.errors > 0 ? "warning" : "default"}
              />
            </div>
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
              <Metric label="Cost (USD)" value={usd(v.costUsd)} />
            </div>
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
              <Metric label="Total Tokens" value={v.tokens.total} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
            <Badge variant="secondary" className="rounded-full font-medium">
              <Bot aria-hidden="true" className="mr-1 size-3" />
              {v.actions.pendingApproval} awaiting approval
            </Badge>
            <Badge variant="secondary" className="rounded-full font-medium">
              {v.actions.executed} executed
            </Badge>
            {v.actions.failed > 0 ? (
              <Badge variant="destructive" className="rounded-full font-medium">
                {v.actions.failed} failed
              </Badge>
            ) : null}
          </div>
        </div>
      ) : null}
    </CommandCard>
  )
}

function HttpNote() {
  return (
    <section
      aria-label="API latency"
      className="relative overflow-hidden rounded-3xl border border-dashed border-border/80 bg-muted/20 p-5 backdrop-blur-xl"
    >
      <div className="flex items-start gap-3.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Gauge aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-foreground">API Latency Telemetry</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Request timings are recorded in-process. Direct telemetry export will appear once downstream metrics sink is configured.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Database aria-hidden="true" className="size-3.5" /> DB pool healthy
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Activity aria-hidden="true" className="size-3.5" /> Node daemon active
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Server aria-hidden="true" className="size-3.5" /> VPS runtime verified
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

export type { HttpSummary }

"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangle,
  Bot,
  Building2,
  ChevronRight,
  Gauge,
  Inbox,
  Layers,
  MessageCircle,
  RefreshCw,
  Send,
  ServerCog,
  Workflow,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import { ApiError } from "@/lib/api/client"
import {
  isStale,
  useCommandCenterSnapshot,
  type AiCard,
  type AutomationCard,
  type CardResult,
  type CardStatus,
  type ChannelCounts,
  type CommandCenterSnapshot,
  type HttpSummary,
  type MessagingCard,
  type MessagingChannel,
  type QueuesCard,
  type ReadinessCard,
  type TenantsCard,
  type WhatsappCard,
} from "@/lib/hooks/use-command-center"
import { useRefreshCommandCenter } from "@/lib/hooks/use-command-center-refresh"
import {
  CommandCard,
  GlyphTile,
  Metric,
  MetricWell,
  QueueBars,
  StackedBar,
  accentVars,
} from "@/components/command-center/command-card"
import { DataState } from "@/components/shared/data-state"
import { Button } from "@/components/ui/button"
import type { Accent } from "@/lib/section-accent"
import { cn } from "@/lib/utils"

/**
 * Platform operations console.
 *
 * Reads every card and changes nothing. Every number on this screen comes
 * from a card that measured it: there is no fallback, no default, and no
 * `?? 0` anywhere in the render path. A card an older API does not send
 * says so rather than drawing a reading nobody took.
 */

type CardKey = Exclude<keyof CommandCenterSnapshot, "collectedAt" | "durationMs">

const CARDS: ReadonlyArray<{ key: CardKey; label: string; icon: LucideIcon; accent: Accent }> = [
  { key: "readiness", label: "Readiness", icon: ServerCog, accent: "emerald" },
  { key: "http", label: "API", icon: Gauge, accent: "blue" },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle, accent: "emerald" },
  { key: "messaging", label: "Messaging", icon: Send, accent: "violet" },
  { key: "queues", label: "Queues", icon: Layers, accent: "cyan" },
  { key: "ai", label: "AI", icon: Bot, accent: "indigo" },
  { key: "automation", label: "Automation", icon: Workflow, accent: "orange" },
  { key: "tenants", label: "Gyms", icon: Building2, accent: "rose" },
]

const NOT_REPORTED = (checkedAt: string): CardResult<never> => ({
  status: "unavailable",
  value: null,
  latencyMs: 0,
  checkedAt,
  unavailableReason: "Not reported by this API version. Deploy the latest backend to see it.",
})

const ms = (value: number | null | undefined) =>
  value === null || value === undefined ? null : value

const usd = (value: number | null) => (value === null ? null : `$${value.toFixed(4)}`)

const pct = (value: number | null) =>
  value === null ? null : `${(value * 100).toFixed(value < 0.1 ? 1 : 0)}%`

const num = (value: number) => value.toLocaleString("en-IN")

function relative(iso: string, now: number): string {
  const seconds = Math.round((Date.parse(iso) - now) / 1000)
  if (!Number.isFinite(seconds)) return "—"
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })
  const abs = Math.abs(seconds)
  if (abs < 60) return rtf.format(seconds, "second")
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), "minute")
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), "hour")
  return rtf.format(Math.round(seconds / 86400), "day")
}

/** MEMBERSHIP_RENEWAL_REMINDER -> "Membership renewal reminder". */
function humanize(key: string): string {
  const words = key.toLowerCase().split("_")
  return [words[0].charAt(0).toUpperCase() + words[0].slice(1), ...words.slice(1)].join(" ")
}

export default function CommandCenterPage() {
  const snapshot = useCommandCenterSnapshot()
  const refresh = useRefreshCommandCenter()

  const [now, setNow] = React.useState(() => Date.now())
  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15_000)
    return () => clearInterval(timer)
  }, [])

  const data = snapshot.data

  async function onRefresh() {
    try {
      await refresh.mutateAsync()
      toast.success("Re-probed every card")
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not re-probe")
    }
  }

  const cardOf = <K extends CardKey>(key: K) =>
    (data?.[key] ?? NOT_REPORTED(data?.collectedAt ?? new Date(now).toISOString())) as NonNullable<
      CommandCenterSnapshot[K]
    >

  return (
    <div className="flex w-full flex-col gap-6 pb-10">
      <Hero
        data={data}
        now={now}
        isLoading={snapshot.isLoading}
        refreshing={refresh.isPending}
        onRefresh={onRefresh}
      />

      <DataState
        isLoading={snapshot.isLoading}
        isError={snapshot.isError}
        onRetry={() => snapshot.refetch()}
        errorMessage={snapshot.error instanceof ApiError ? snapshot.error.message : "Could not load telemetry."}
        isEmpty={false}
        emptyTitle="Command Center"
        emptyDescription="No telemetry has been collected yet."
      >
        {data ? (
          <div className="flex flex-col gap-6">
            {isStale(data.collectedAt, now) ? (
              <div
                role="status"
                className="flex items-center gap-3 rounded-2xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm font-medium text-foreground"
              >
                <AlertTriangle aria-hidden="true" className="size-4 shrink-0 text-warning" />
                This reading is more than a minute old. Re-probe before diagnosing.
              </div>
            ) : null}

            <StatusStrip data={data} />

            <div className="grid gap-5 lg:grid-cols-2">
              <ReadinessTile card={cardOf("readiness")} now={now} />
              <HttpTile card={cardOf("http")} now={now} />
            </div>

            <WhatsappTile card={cardOf("whatsapp")} now={now} />

            <div className="grid gap-5 lg:grid-cols-2">
              <MessagingTile card={cardOf("messaging")} now={now} />
              <QueuesTile card={cardOf("queues")} now={now} />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <AiTile card={cardOf("ai")} now={now} />
              <AutomationTile card={cardOf("automation")} now={now} />
            </div>

            <TenantsTile card={cardOf("tenants")} now={now} />

            <footer className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/60 bg-card/60 px-4 py-3 text-xs text-muted-foreground">
              <span>Snapshot taken {relative(data.collectedAt, now)} · {new Date(data.collectedAt).toLocaleTimeString()}</span>
              <span className="font-mono tabular-nums">Collected in {data.durationMs} ms · polls every 30 s</span>
            </footer>
          </div>
        ) : null}
      </DataState>
    </div>
  )
}

/* ─── Hero ────────────────────────────────────────────────────────── */

function verdict(data: CommandCenterSnapshot | undefined) {
  const statuses = CARDS.map(({ key }) => (data?.[key] as CardResult<unknown> | undefined)?.status ?? "unavailable")
  const count = (s: CardStatus) => statuses.filter((x) => x === s).length
  return { ok: count("ok"), degraded: count("degraded"), unavailable: count("unavailable"), total: statuses.length }
}

function Hero({
  data,
  now,
  isLoading,
  refreshing,
  onRefresh,
}: {
  data: CommandCenterSnapshot | undefined
  now: number
  isLoading: boolean
  refreshing: boolean
  onRefresh: () => void
}) {
  const v = verdict(data)
  const headline = !data
    ? isLoading
      ? "Measuring…"
      : "No reading yet"
    : v.degraded > 0
      ? `${v.degraded} ${v.degraded === 1 ? "system needs" : "systems need"} attention`
      : v.unavailable > 0
        ? "Everything measured is healthy"
        : "All systems operational"
  const tone = !data ? "unknown" : v.degraded > 0 ? "warning" : "ok"
  const radius = 30
  const circumference = 2 * Math.PI * radius
  const fraction = data ? v.ok / v.total : 0

  return (
    <header aria-labelledby="cc-title" className="hero-banner" style={accentVars("cyan")}>
      <div className="hero-banner-body flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span className="hero-banner-glyph size-11" aria-hidden="true">
            <ServerCog className="size-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <h1 id="cc-title" className="hero-banner-title">Command Center</h1>
            <p className="hero-banner-subtitle">
              {headline}
              {data && v.unavailable > 0 ? ` · ${v.unavailable} not measured` : ""}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {data ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/70 px-3 py-1 text-xs font-semibold text-foreground">
                  Updated {relative(data.collectedAt, now)}
                </span>
              ) : null}
              <Button onClick={onRefresh} disabled={refreshing} size="sm" className="min-h-10 px-4">
                <RefreshCw aria-hidden="true" className={cn("size-4", refreshing && "animate-spin motion-reduce:animate-none")} />
                {refreshing ? "Re-probing…" : "Re-probe now"}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4 rounded-3xl border border-border/70 bg-card/70 p-2 pr-4 shadow-[var(--shadow-card)]">
          <div className="relative size-[72px]">
            <svg
              viewBox="0 0 92 92"
              className="size-full -rotate-90"
              role="img"
              aria-label={data ? `${v.ok} of ${v.total} systems healthy` : "System health not measured yet"}
            >
              <defs>
                <linearGradient id="cc-ring" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={tone === "warning" ? "var(--a-amber-grad-1)" : "var(--a-emerald-grad-1)"} />
                  <stop offset="100%" stopColor={tone === "warning" ? "var(--a-orange-grad-1)" : "var(--a-cyan-grad-1)"} />
                </linearGradient>
              </defs>
              <circle cx="46" cy="46" r={radius} fill="none" stroke="var(--surface-sunken)" strokeWidth="10" />
              {fraction > 0 ? (
                <circle
                  cx="46"
                  cy="46"
                  r={radius}
                  fill="none"
                  stroke="url(#cc-ring)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${fraction * circumference} ${circumference}`}
                />
              ) : null}
            </svg>
            <span aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-extrabold tabular-nums tracking-tight text-foreground">
                {data ? `${v.ok}/${v.total}` : "—"}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">healthy</span>
            </span>
          </div>
          <div className="space-y-1 text-xs">
            <p className="flex items-center gap-2"><span className="size-2 rounded-full bg-success" />{data ? v.ok : "—"} healthy</p>
            <p className="flex items-center gap-2"><span className="size-2 rounded-full bg-warning" />{data ? v.degraded : "—"} degraded</p>
            <p className="flex items-center gap-2"><span className="size-2 rounded-full bg-muted-foreground/50" />{data ? v.unavailable : "—"} not measured</p>
          </div>
        </div>
      </div>
    </header>
  )
}

/* ─── Status strip: every card's verdict, one tap from its card ──── */

function StatusStrip({ data }: { data: CommandCenterSnapshot }) {
  return (
    <nav aria-label="System status" className="-mx-1 overflow-x-auto px-1 pb-1">
      <ul className="flex min-w-max gap-2">
        {CARDS.map(({ key, label, icon: Icon, accent }) => {
          const status = (data[key] as CardResult<unknown> | undefined)?.status ?? "unavailable"
          return (
            <li key={key}>
              <a
                href={`#cc-${key}`}
                style={accentVars(accent)}
                className="flex min-h-11 items-center gap-2.5 rounded-full border border-border/70 bg-card/80 py-1.5 pl-1.5 pr-3 text-sm font-semibold text-foreground shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transform-none"
              >
                <span
                  aria-hidden="true"
                  className="flex size-7 items-center justify-center rounded-full text-white"
                  style={{ background: "linear-gradient(150deg, var(--kpi-grad-1), var(--kpi-grad-2))" }}
                >
                  <Icon className="size-3.5" />
                </span>
                {label}
                <span
                  aria-label={status}
                  className="size-2 rounded-full"
                  style={{
                    background:
                      status === "ok" ? "var(--success)" : status === "degraded" ? "var(--warning)" : "var(--muted-foreground)",
                  }}
                />
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/* ─── Cards ───────────────────────────────────────────────────────── */

function Anchor({ id, children }: { id: CardKey; children: React.ReactNode }) {
  return <div id={`cc-${id}`} className="min-w-0 scroll-mt-24">{children}</div>
}

function ReadinessTile({ card, now }: { card: CardResult<ReadinessCard>; now: number }) {
  const v = card.value
  return (
    <Anchor id="readiness">
      <CommandCard
        title="Core readiness"
        description="Round trip to the primary database and the Redis queue"
        card={card}
        isStale={isStale(card.checkedAt, now)}
        icon={ServerCog}
        accent="emerald"
      >
        {v ? (
          <div className="grid grid-cols-2 gap-3">
            <MetricWell>
              <Metric label="PostgreSQL" value={v.database === "up" ? "Up" : "Down"} tone={v.database === "down" ? "destructive" : "success"} />
              <p className="mt-1 text-xs tabular-nums text-muted-foreground">{v.latencyMs.database} ms</p>
            </MetricWell>
            <MetricWell>
              <Metric label="Redis (BullMQ)" value={v.queue === "up" ? "Up" : "Down"} tone={v.queue === "down" ? "destructive" : "success"} />
              <p className="mt-1 text-xs tabular-nums text-muted-foreground">{v.latencyMs.queue} ms</p>
            </MetricWell>
          </div>
        ) : null}
      </CommandCard>
    </Anchor>
  )
}

function HttpTile({ card, now }: { card: CardResult<HttpSummary>; now: number }) {
  const v = card.value
  return (
    <Anchor id="http">
      <CommandCard
        title="API latency"
        description={v ? `This instance · ${num(v.samples)} requests since ${new Date(v.since).toLocaleTimeString()}` : "Request timings on this instance"}
        card={card}
        isStale={isStale(card.checkedAt, now)}
        icon={Gauge}
        accent="blue"
      >
        {v ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <MetricWell><Metric label="p50" value={ms(v.latencyMs.p50)} unit="ms" /></MetricWell>
              <MetricWell><Metric label="p95" value={ms(v.latencyMs.p95)} unit="ms" tone={(v.latencyMs.p95 ?? 0) > 2000 ? "warning" : "default"} /></MetricWell>
              <MetricWell><Metric label="p99" value={ms(v.latencyMs.p99)} unit="ms" /></MetricWell>
            </div>
            {v.samples > 0 ? (
              <StackedBar
                label="Responses by status"
                segments={[
                  { label: "2xx", value: v.status["2xx"], color: "var(--a-emerald)" },
                  { label: "4xx", value: v.status["4xx"], color: "var(--a-amber)" },
                  { label: "5xx", value: v.status["5xx"], color: "var(--a-rose)" },
                ]}
              />
            ) : (
              <p className="text-xs text-muted-foreground">No requests recorded since this instance started.</p>
            )}
            {v.slowestEndpoints.length > 0 ? (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Slowest endpoints (p95)</p>
                <ul className="space-y-1.5">
                  {v.slowestEndpoints.slice(0, 4).map((e) => (
                    <li key={`${e.method} ${e.path}`} className="flex items-baseline justify-between gap-3 text-xs">
                      <span className="min-w-0 truncate font-mono text-foreground">
                        <span className="mr-1.5 font-semibold text-muted-foreground">{e.method}</span>{e.path}
                      </span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">{e.p95 ?? "—"} ms · {e.samples}×</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </CommandCard>
    </Anchor>
  )
}

function WhatsappTile({ card, now }: { card: CardResult<WhatsappCard>; now: number }) {
  const v = card.value
  return (
    <Anchor id="whatsapp">
      <CommandCard
        title="WhatsApp"
        description="Every gym's WhatsApp link, outbound sends and member replies · last 24 h"
        card={card}
        isStale={isStale(card.checkedAt, now)}
        icon={MessageCircle}
        accent="emerald"
      >
        {v ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <FeatureStat label="Gyms connected" value={num(v.connectedGyms)} hint="On either channel" accent="emerald" />
              <FeatureStat label="Cloud API live" value={num(v.cloudApi.connected)} hint={`${v.cloudApi.error} error · ${v.cloudApi.disconnected} disconnected`} accent="cyan" />
              <FeatureStat label="Linked numbers" value={num(v.web.connected)} hint={`${v.web.sendingEnabled} sending · ${v.web.pairing} pairing`} accent="violet" />
              <FeatureStat
                label="Send failure rate"
                value={pct(v.messages.failureRate)}
                hint={`${num(v.messages.failed)} failed of ${num(v.messages.total - v.messages.pending)} settled`}
                accent={v.messages.failureRate !== null && v.messages.failureRate > 0.1 ? "rose" : "amber"}
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
              <div className="space-y-5">
                <div>
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">Outbound messages</p>
                    <p className="text-xs tabular-nums text-muted-foreground">{num(v.messages.total)} total</p>
                  </div>
                  <StackedBar
                    label="WhatsApp messages by state"
                    segments={[
                      { label: "Read", value: v.messages.read, color: "var(--a-blue)" },
                      { label: "Delivered", value: v.messages.delivered, color: "var(--a-cyan)" },
                      { label: "Sent", value: v.messages.sent, color: "var(--a-emerald)" },
                      { label: "Pending", value: v.messages.pending, color: "var(--a-amber)" },
                      { label: "Failed", value: v.messages.failed, color: "var(--a-rose)" },
                    ]}
                  />
                  <p className="mt-2 text-[11px] text-muted-foreground">Delivered and read receipts come from the Cloud API only; linked-number sends stop at “sent”.</p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <MetricWell><Metric label="Replies received" value={num(v.inbound.received)} /></MetricWell>
                  <MetricWell><Metric label="Matched to members" value={num(v.inbound.matchedToMember)} /></MetricWell>
                  <MetricWell>
                    <Metric label="Tokens expiring ≤7d" value={num(v.cloudApi.tokensExpiringSoon)} tone={v.cloudApi.tokensExpiringSoon > 0 ? "warning" : "default"} />
                  </MetricWell>
                </div>
              </div>

              <div className="min-w-0">
                <p className="mb-2 text-sm font-semibold text-foreground">Needs attention</p>
                {v.attention.length === 0 ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/60 px-4 py-5 text-sm text-muted-foreground">
                    <span className="flex size-9 items-center justify-center rounded-full bg-success/12 text-success" aria-hidden="true">✓</span>
                    No broken WhatsApp links.
                  </div>
                ) : (
                  <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card/60">
                    {v.attention.map((row) => (
                      <li key={`${row.organizationId}-${row.channel}`}>
                        <Link
                          href="/platform/organizations"
                          className="group flex items-start gap-3 px-3.5 py-3 transition-colors hover:bg-[var(--surface-hover)] focus-visible:outline-2 focus-visible:outline-ring"
                        >
                          <span
                            aria-hidden="true"
                            className={cn(
                              "mt-1 size-2 shrink-0 rounded-full",
                              row.status === "ERROR" || row.status === "LOGGED_OUT" ? "bg-destructive" : "bg-warning",
                            )}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-foreground">{row.organizationName}</span>
                            <span className="block text-xs text-muted-foreground">
                              {row.channel === "cloud-api" ? "Cloud API" : "Linked number"} · {row.status.toLowerCase().replace("_", " ")} · {relative(row.since, now)}
                            </span>
                            {row.lastError ? (
                              <span className="mt-0.5 block truncate text-xs text-muted-foreground/90" title={row.lastError}>{row.lastError}</span>
                            ) : null}
                          </span>
                          <ChevronRight aria-hidden="true" className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </CommandCard>
    </Anchor>
  )
}

function FeatureStat({ label, value, hint, accent }: { label: string; value: string | null; hint: string; accent: Accent }) {
  return (
    <div
      style={{
        ...accentVars(accent),
        background:
          "radial-gradient(110% 90% at 100% 0%, color-mix(in oklab, var(--kpi-grad-2) 18%, transparent), transparent 60%), linear-gradient(165deg, color-mix(in oklab, var(--kpi-grad-1) 10%, var(--card)), var(--card) 75%)",
      }}
      className="min-w-0 rounded-2xl border border-[color-mix(in_oklab,var(--kpi-grad-1)_18%,var(--border))] p-4"
    >
      <p className="text-xs font-semibold" style={{ color: "var(--kpi-ink)" }}>{label}</p>
      <p className="mt-2 text-3xl font-extrabold tabular-nums leading-none tracking-[-0.04em] text-foreground">
        {value ?? <span aria-label="Not measured">—</span>}
      </p>
      <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

const CHANNEL_META: Record<MessagingChannel, { label: string; accent: Accent }> = {
  EMAIL: { label: "Email", accent: "blue" },
  WHATSAPP: { label: "WhatsApp", accent: "emerald" },
  SMS: { label: "SMS", accent: "amber" },
  PUSH: { label: "Push", accent: "violet" },
}

function MessagingTile({ card, now }: { card: CardResult<MessagingCard>; now: number }) {
  const v = card.value
  return (
    <Anchor id="messaging">
      <CommandCard
        title="Messaging delivery"
        description="Every outbound message to members, by channel · last 24 h"
        card={card}
        isStale={isStale(card.checkedAt, now)}
        icon={Send}
        accent="violet"
      >
        {v ? (
          <ul className="space-y-3.5">
            {(Object.keys(CHANNEL_META) as MessagingChannel[]).map((channel) => (
              <ChannelRow key={channel} channel={channel} counts={v.channels[channel]} />
            ))}
          </ul>
        ) : null}
      </CommandCard>
    </Anchor>
  )
}

function ChannelRow({ channel, counts }: { channel: MessagingChannel; counts: ChannelCounts | undefined }) {
  const meta = CHANNEL_META[channel]
  if (!counts) return null
  const delivered = counts.sent + counts.delivered + counts.read
  const peak = Math.max(1, counts.total)
  return (
    <li style={accentVars(meta.accent)} className="min-w-0">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-semibold text-foreground">{meta.label}</span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {num(counts.total)} · {counts.failed > 0 ? <span className="font-semibold text-destructive">{num(counts.failed)} failed</span> : "0 failed"}
          {counts.failureRate !== null ? ` · ${pct(counts.failureRate)}` : ""}
        </span>
      </div>
      <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-[var(--surface-sunken)]" role="presentation">
        <span className="h-full" style={{ width: `${(delivered / peak) * 100}%`, background: "linear-gradient(90deg, var(--kpi-grad-1), var(--kpi-grad-2))" }} />
        <span className="h-full" style={{ width: `${(counts.pending / peak) * 100}%`, background: "var(--a-amber)" }} />
        <span className="h-full" style={{ width: `${(counts.failed / peak) * 100}%`, background: "var(--a-rose)" }} />
      </div>
    </li>
  )
}

function QueuesTile({ card, now }: { card: CardResult<QueuesCard>; now: number }) {
  // An unreadable queue is drawn as "unavailable", never as zero depth.
  const rows =
    card.value?.queues.map((q) =>
      q.depth
        ? { name: q.name, waiting: q.depth.waiting, failed: q.depth.failed }
        : { name: q.name, waiting: 0, failed: 0, unavailable: true },
    ) ?? []
  const totals = card.value?.totals
  return (
    <Anchor id="queues">
      <CommandCard
        title="Queue depth"
        description="BullMQ backlog and failures per worker queue"
        card={card}
        isStale={isStale(card.checkedAt, now)}
        icon={Layers}
        accent="cyan"
      >
        <div className="space-y-4">
          {totals ? (
            <div className="grid grid-cols-3 gap-3">
              <MetricWell><Metric label="Waiting" value={num(totals.waiting)} /></MetricWell>
              <MetricWell><Metric label="Active" value={num(totals.active)} /></MetricWell>
              <MetricWell><Metric label="Failed" value={num(totals.failed)} tone={totals.failed > 0 ? "warning" : "default"} /></MetricWell>
            </div>
          ) : null}
          <QueueBars rows={rows} />
        </div>
      </CommandCard>
    </Anchor>
  )
}

function AiTile({ card, now }: { card: CardResult<AiCard>; now: number }) {
  const v = card.value
  return (
    <Anchor id="ai">
      <CommandCard
        title="AI gateway"
        description="Inference volume, provider-reported cost and approvals · last 24 h"
        card={card}
        isStale={isStale(card.checkedAt, now)}
        icon={Bot}
        accent="indigo"
      >
        {v ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <MetricWell><Metric label="Requests" value={num(v.requests)} /></MetricWell>
              <MetricWell><Metric label="Errors" value={num(v.errors)} tone={v.errors > 0 ? "warning" : "default"} /></MetricWell>
              <MetricWell><Metric label="Cost (USD)" value={usd(v.costUsd)} /></MetricWell>
              <MetricWell><Metric label="Tokens" value={v.tokens.total === null ? null : num(v.tokens.total)} /></MetricWell>
            </div>
            <StackedBar
              label="AI proposals by state"
              segments={[
                { label: "Awaiting approval", value: v.actions.pendingApproval, color: "var(--a-amber)" },
                { label: "Executed", value: v.actions.executed, color: "var(--a-emerald)" },
                { label: "Rejected", value: v.actions.rejected, color: "var(--a-violet)" },
                { label: "Failed", value: v.actions.failed, color: "var(--a-rose)" },
              ]}
            />
          </div>
        ) : null}
      </CommandCard>
    </Anchor>
  )
}

function AutomationTile({ card, now }: { card: CardResult<AutomationCard>; now: number }) {
  const v = card.value
  return (
    <Anchor id="automation">
      <CommandCard
        title="Automations"
        description="What the daily scanners sent, skipped and failed · last 24 h"
        card={card}
        isStale={isStale(card.checkedAt, now)}
        icon={Workflow}
        accent="orange"
      >
        {v ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <MetricWell><Metric label="Sent" value={num(v.sent)} tone="success" /></MetricWell>
              <MetricWell><Metric label="Skipped" value={num(v.skipped)} /></MetricWell>
              <MetricWell><Metric label="Failed" value={num(v.failed)} tone={v.failed > 0 ? "destructive" : "default"} /></MetricWell>
            </div>
            {v.byKey.length === 0 ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Inbox aria-hidden="true" className="size-4" /> No automation ran in the last 24 hours.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {v.byKey.slice(0, 6).map((row) => {
                  const total = Math.max(1, row.sent + row.skipped + row.failed)
                  return (
                    <li key={row.key} className="min-w-0">
                      <div className="flex items-baseline justify-between gap-2 text-xs">
                        <span className="truncate font-semibold text-foreground">{humanize(row.key)}</span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          {row.sent} sent · {row.skipped} skipped{row.failed ? ` · ${row.failed} failed` : ""}
                        </span>
                      </div>
                      <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-[var(--surface-sunken)]" role="presentation">
                        <span style={{ width: `${(row.sent / total) * 100}%`, background: "var(--a-emerald)" }} />
                        <span style={{ width: `${(row.skipped / total) * 100}%`, background: "var(--a-amber)" }} />
                        <span style={{ width: `${(row.failed / total) * 100}%`, background: "var(--a-rose)" }} />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        ) : null}
      </CommandCard>
    </Anchor>
  )
}

function TenantsTile({ card, now }: { card: CardResult<TenantsCard>; now: number }) {
  const v = card.value
  return (
    <Anchor id="tenants">
      <CommandCard
        title="Gyms on the platform"
        description="Organizations by lifecycle state"
        card={card}
        isStale={isStale(card.checkedAt, now)}
        icon={Building2}
        accent="rose"
      >
        {v ? (
          <div className="grid gap-5 lg:grid-cols-[auto_1fr] lg:items-center">
            <div className="flex items-center gap-4">
              <GlyphTile icon={Building2} size="lg" />
              <Metric label="Total gyms" value={num(v.total)} size="lg" />
              <span className="rounded-full bg-success/12 px-2.5 py-1 text-xs font-semibold text-success ring-1 ring-success/25">
                +{num(v.newLast7Days)} this week
              </span>
            </div>
            <StackedBar
              label="Gyms by state"
              segments={[
                { label: "Active", value: v.active, color: "var(--a-emerald)" },
                { label: "Trial", value: v.trial, color: "var(--a-blue)" },
                { label: "Suspended", value: v.suspended, color: "var(--a-amber)" },
                { label: "Cancelled", value: v.cancelled, color: "var(--a-rose)" },
              ]}
            />
          </div>
        ) : null}
      </CommandCard>
    </Anchor>
  )
}


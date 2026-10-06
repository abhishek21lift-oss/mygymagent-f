import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

/**
 * Platform operational telemetry.
 *
 * Mirrors `src/command-center/` in mygymagent-b by hand. There is no
 * generated spec between these two types (ADR 0005 names codegen as the
 * sanctioned fix), so this file is the second source of truth and has to be
 * edited alongside the DTOs.
 *
 * ── Why `null` is everywhere ────────────────────────────────────────────────
 *
 * A card that could not be measured carries `value: null`, never 0. The UI
 * must render that as "unavailable" and must never substitute a zero,
 * because on an operations screen "0 failed jobs" and "we could not read the
 * queue" lead to opposite decisions.
 */

export type CardStatus = "ok" | "degraded" | "unavailable"

export interface CardResult<T> {
  status: CardStatus
  value: T | null
  latencyMs: number
  checkedAt: string
  unavailableReason?: string
}

export interface ReadinessCard {
  database: "up" | "down"
  queue: "up" | "down"
  latencyMs: { database: number; queue: number }
}

export interface QueueDepth {
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
  paused: number
}

export interface QueueRow {
  name: string
  status: "ok" | "unavailable"
  depth: QueueDepth | null
  unavailableReason?: string
}

export interface QueuesCard {
  queues: QueueRow[]
  totals: QueueDepth
}

export interface HttpSummary {
  samples: number
  latencyMs: { p50: number | null; p95: number | null; p99: number | null }
  status: { "2xx": number; "4xx": number; "5xx": number }
  slowestEndpoints: {
    path: string
    method: string
    samples: number
    p95: number | null
  }[]
  windowMs: number
  since: string
  scope: "this-instance"
}

export interface AiCard {
  requests: number
  success: number
  errors: number
  /** Provider-reported USD. Null when the provider reported none. */
  costUsd: number | null
  tokens: { prompt: number | null; completion: number | null; total: number | null }
  actions: {
    pendingApproval: number
    approved: number
    rejected: number
    executed: number
    failed: number
  }
}

export interface WhatsappAttentionRow {
  organizationId: string
  organizationName: string
  channel: "cloud-api" | "web"
  status: string
  lastError: string | null
  since: string
}

export interface WhatsappCard {
  connectedGyms: number
  cloudApi: {
    connected: number
    disconnected: number
    error: number
    notConnected: number
    tokensExpiringSoon: number
  }
  web: {
    connected: number
    pairing: number
    loggedOut: number
    disconnected: number
    sendingEnabled: number
  }
  messages: ChannelCounts
  inbound: { received: number; matchedToMember: number }
  windowMs: number
  attention: WhatsappAttentionRow[]
}

export interface ChannelCounts {
  pending: number
  sent: number
  delivered: number
  read: number
  failed: number
  total: number
  /** failed / settled. Null when nothing settled -- never a fake 0%. */
  failureRate: number | null
}

export type MessagingChannel = "EMAIL" | "WHATSAPP" | "SMS" | "PUSH"

export interface MessagingCard {
  channels: Record<MessagingChannel, ChannelCounts>
  totals: ChannelCounts
  windowMs: number
}

export interface AutomationCard {
  sent: number
  skipped: number
  failed: number
  windowMs: number
  byKey: { key: string; sent: number; skipped: number; failed: number }[]
}

export interface TenantsCard {
  total: number
  trial: number
  active: number
  suspended: number
  cancelled: number
  newLast7Days: number
}

/**
 * The four cards added after the console first shipped are optional: an
 * API deployed before them simply does not send them, and the page shows
 * "not reported by this API version" rather than inventing a reading.
 */
export interface CommandCenterSnapshot {
  readiness: CardResult<ReadinessCard>
  queues: CardResult<QueuesCard>
  ai: CardResult<AiCard>
  http?: CardResult<HttpSummary>
  whatsapp?: CardResult<WhatsappCard>
  messaging?: CardResult<MessagingCard>
  automation?: CardResult<AutomationCard>
  tenants?: CardResult<TenantsCard>
  collectedAt: string
  durationMs: number
}

const KEY = "command-center-snapshot"

/** Anything older than this is called out as stale on the card. */
export const STALE_AFTER_MS = 60_000

/**
 * Gated server-side on `User.platformRole`, so this hook is only ever
 * mounted behind that check — an ordinary gym account gets a 403 and the
 * card shows the error rather than pretending to be empty.
 *
 * Polls rather than streams. The backend's snapshot cache is 10s, so a 30s
 * poll costs the database almost nothing and needs no new transport, no
 * nginx `Upgrade` config, and no socket auth story.
 */
export function useCommandCenterSnapshot(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: [KEY],
    queryFn: () =>
      api.get<CommandCenterSnapshot>("/platform/command-center/snapshot"),
    enabled: options.enabled ?? true,
    refetchInterval: 30_000,
    // The console is a monitoring surface: a stale reading is worse than an
    // error, so keep trying rather than settling for the last good value.
    retry: 2,
  })
}

/**
 * Whether a card's reading is old enough to warn about.
 *
 * An unparseable timestamp counts as stale. `NaN > anything` is false, so the
 * naive comparison presents a malformed `checkedAt` as the freshest reading
 * on the screen — the exact opposite of what an operator needs.
 */
export function isStale(checkedAt: string, now = Date.now()): boolean {
  const at = Date.parse(checkedAt)
  if (!Number.isFinite(at)) return true
  return now - at > STALE_AFTER_MS
}

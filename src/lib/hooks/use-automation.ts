import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api/client"

export type AutomationChannel = "email" | "sms" | "none"
export type AutomationRunStatus = "SENT" | "SKIPPED" | "FAILED"

export interface AutomationScanner {
  job: string | null
  key: string | null
  title: string
  description: string
  cadence: string
  channel: AutomationChannel
  /** False when the channel this job sends through cannot deliver, which
   * means it can run exactly on time and reach nobody. */
  channelReady: boolean
  nextRunAt: string | null
  lastRunAt: string | null
  lastRunState: "completed" | "failed" | null
  outcomes: Record<AutomationRunStatus, number>
}

export interface AutomationBlocker {
  reason: string
  count: number
  keys: string[]
}

export interface AutomationRunRow {
  id: string
  key: string
  status: AutomationRunStatus
  detail: Record<string, unknown> | null
  createdAt: string
  subjectId: string
  subjectLabel: string | null
  memberId: string | null
}

export interface AutomationOverview {
  windowDays: number
  channels: { email: boolean; sms: boolean }
  scanners: AutomationScanner[]
  blockers: AutomationBlocker[]
  recent: AutomationRunRow[]
}

/** Everything the automation queue does for this gym, and whether it is
 * reaching anyone. Refreshes on its own: the five-minute lead job means
 * this screen goes stale quickly if left open. */
export function useAutomationOverview(enabled = true) {
  return useQuery({
    queryKey: ["automation-overview"],
    queryFn: () => api.get<AutomationOverview>("/automation"),
    refetchInterval: 60_000,
    enabled,
  })
}

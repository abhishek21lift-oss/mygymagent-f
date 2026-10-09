import "@testing-library/jest-dom"
import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"

import CommandCenterPage from "./page"

jest.mock("next/navigation", () => ({ usePathname: () => "/platform/command-center" }))

const mockGet = jest.fn()
jest.mock("@/lib/api/client", () => ({
  api: { get: (path: string, options?: unknown) => mockGet(path, options) },
  ApiError: class ApiError extends Error {},
}))

const now = new Date().toISOString()
const card = <T,>(value: T, status: "ok" | "degraded" | "unavailable" = "ok") => ({
  status,
  value,
  latencyMs: 3,
  checkedAt: now,
})

const FULL = {
  collectedAt: now,
  durationMs: 41,
  readiness: card({ database: "up", queue: "up", latencyMs: { database: 2, queue: 1 } }),
  queues: card({
    queues: [
      { name: "notifications", status: "ok", depth: { waiting: 3, active: 0, completed: 9, failed: 0, delayed: 0, paused: 0 } },
      { name: "whatsapp-web", status: "unavailable", depth: null, unavailableReason: "boom" },
    ],
    totals: { waiting: 3, active: 0, completed: 9, failed: 0, delayed: 0, paused: 0 },
  }),
  ai: card({
    requests: 12,
    success: 11,
    errors: 1,
    costUsd: null,
    tokens: { prompt: 10, completion: 5, total: 15 },
    actions: { pendingApproval: 2, approved: 0, rejected: 0, executed: 4, failed: 0 },
  }),
  http: card({
    samples: 0,
    latencyMs: { p50: null, p95: null, p99: null },
    status: { "2xx": 0, "4xx": 0, "5xx": 0 },
    slowestEndpoints: [],
    windowMs: 0,
    since: now,
    scope: "this-instance",
  }),
  whatsapp: card(
    {
      connectedGyms: 14,
      cloudApi: { connected: 9, disconnected: 1, error: 1, notConnected: 30, tokensExpiringSoon: 2 },
      web: { connected: 6, pairing: 1, loggedOut: 1, disconnected: 3, sendingEnabled: 5 },
      messages: { pending: 4, sent: 300, delivered: 120, read: 80, failed: 25, total: 529, failureRate: 25 / 525 },
      inbound: { received: 61, matchedToMember: 48 },
      windowMs: 86_400_000,
      attention: [
        {
          organizationId: "o1",
          organizationName: "Iron Temple Gym",
          channel: "web",
          status: "LOGGED_OUT",
          lastError: "Phone unlinked the device",
          since: now,
        },
      ],
    },
    "degraded",
  ),
  messaging: card({
    channels: {
      EMAIL: { pending: 0, sent: 40, delivered: 0, read: 0, failed: 1, total: 41, failureRate: 1 / 41 },
      WHATSAPP: { pending: 4, sent: 300, delivered: 120, read: 80, failed: 25, total: 529, failureRate: 25 / 525 },
      SMS: { pending: 0, sent: 0, delivered: 0, read: 0, failed: 0, total: 0, failureRate: null },
      PUSH: { pending: 0, sent: 7, delivered: 0, read: 0, failed: 0, total: 7, failureRate: 0 },
    },
    totals: { pending: 4, sent: 347, delivered: 120, read: 80, failed: 26, total: 577, failureRate: 26 / 573 },
    windowMs: 86_400_000,
  }),
  automation: card({
    sent: 20,
    skipped: 5,
    failed: 0,
    windowMs: 86_400_000,
    byKey: [{ key: "MEMBERSHIP_RENEWAL_REMINDER", sent: 20, skipped: 5, failed: 0 }],
  }),
  tenants: card({ total: 52, trial: 10, active: 38, suspended: 3, cancelled: 1, newLast7Days: 4 }),
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <CommandCenterPage />
    </QueryClientProvider>,
  )
}

beforeEach(() => mockGet.mockReset())

describe("CommandCenterPage", () => {
  it("shows platform-wide WhatsApp health and the gyms whose link broke", async () => {
    mockGet.mockResolvedValue(FULL)
    renderPage()
    expect(await screen.findByText("Gyms connected")).toBeInTheDocument()
    expect(screen.getByText("14")).toBeInTheDocument()
    expect(screen.getByText("4.8%")).toBeInTheDocument()
    expect(screen.getByText("Iron Temple Gym")).toBeInTheDocument()
    expect(screen.getByText("Phone unlinked the device")).toBeInTheDocument()
    expect(screen.getByText("Replies received")).toBeInTheDocument()
  })

  it("states the overall verdict from the cards themselves", async () => {
    mockGet.mockResolvedValue(FULL)
    renderPage()
    expect(await screen.findByText(/1 system needs attention/)).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "7 of 8 systems healthy" })).toBeInTheDocument()
  })

  it("says a card was not reported by an older API rather than inventing it", async () => {
    const { whatsapp: _w, messaging: _m, ...older } = FULL
    void _w
    void _m
    mockGet.mockResolvedValue(older)
    renderPage()
    expect(await screen.findByText("Core readiness")).toBeInTheDocument()
    expect(screen.getAllByText(/Not reported by this API version/)).toHaveLength(2)
    expect(screen.queryByText("Gyms connected")).not.toBeInTheDocument()
  })

  it("never draws an unreadable queue as zero depth", async () => {
    mockGet.mockResolvedValue(FULL)
    renderPage()
    expect(await screen.findByText("whatsapp-web")).toBeInTheDocument()
    expect(screen.getByText("unavailable")).toBeInTheDocument()
  })

  it("has no status line it did not measure", async () => {
    mockGet.mockResolvedValue(FULL)
    renderPage()
    await screen.findByText("Core readiness")
    expect(screen.queryByText(/DB pool healthy|Node daemon active|VPS runtime verified/)).not.toBeInTheDocument()
    expect(screen.getByText("No requests recorded since this instance started.")).toBeInTheDocument()
  })
})

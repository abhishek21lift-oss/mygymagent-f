import "@testing-library/jest-dom"
import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import CooPage from "./page"

jest.mock("next/navigation", () => ({ usePathname: () => "/coo" }))

const mockPermissions = [
  "ai.generate",
  "ai.approve",
  "reports.view",
  "memberships.read",
  "leads.read",
  "workouts.read",
  "payments.read",
  "members.read",
]
jest.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({
    user: { firstName: "Asha" },
    hasPermission: (key: string | string[]) =>
      (Array.isArray(key) ? key : [key]).some((k) => mockPermissions.includes(k)),
  }),
}))

const mockGet = jest.fn()
jest.mock("@/lib/api/client", () => ({
  api: { get: (path: string, options?: unknown) => mockGet(path, options) },
}))

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <CooPage />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  mockGet.mockReset()
  mockGet.mockImplementation(async (path: string) => {
    if (path === "/analytics/coo-briefing") {
      return {
        computedAt: new Date().toISOString(),
        branchId: null,
        health: {
          score: 82,
          status: "healthy",
          opportunity: "collections",
          components: [],
          branchId: null,
          computedAt: new Date().toISOString(),
          revenueAtRisk: { totalMRR: 0, atRiskMRR: 0, atRiskPercentage: 0, bySegment: [] },
        },
        today: { date: "2026-10-06", revenueNet: "7500.00", collected: "8000.00", checkIns: 12, currency: "INR" },
        deltas: { revenueNetPct: 87.5, collectedPct: 100, checkinsPct: 20 },
        outcomes: { pending: 2, executed: 5, rejected: 1 },
        usage: { requests24h: 9, tokens24h: 1200, costUsd24h: "0.0200", errors24h: 1 },
      }
    }
    if (path === "/briefing/daily") {
      return {
        generatedAt: new Date().toISOString(),
        branchId: null,
        today: { checkIns: 12 },
        revenue: { revenue: [], outstanding: [], notComputable: [] },
        atRiskMembers: { count: 0 },
        lowStock: { count: 0, top: [] },
        pendingAiActions: 2,
        followUpsDue: { count: 0, overdue: 0 },
        expiringSoon: { count: 0, withinDays: 7 },
      }
    }
    if (path === "/branches") return { items: [] }
    if (path === "/analytics/memberships/renewal-pipeline") {
      return { upcoming: [], overdue: [], highValue: [], counts: { upcoming: 0, overdue: 0 } }
    }
    if (path === "/analytics/sales/priority") {
      return { items: [], counts: { hot: 0, warm: 0, watch: 0 } }
    }
    if (path === "/analytics/trainers/pt-opportunities") {
      return { expiring: [], neverStarted: [], counts: { expiring: 0, neverStarted: 0, activePackages: 0 } }
    }
    if (path === "/ai-actions?status=PENDING_APPROVAL") return { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 }
    if (path === "/ai-actions?status=EXECUTED") return { items: [], total: 5, page: 1, pageSize: 1, totalPages: 5 }
    if (path === "/ai-actions?status=REJECTED") return { items: [], total: 1, page: 1, pageSize: 1, totalPages: 1 }
    throw new Error(`unexpected GET ${path}`)
  })
})

describe("CooPage", () => {
  it("renders the briefing hero with health, deltas and outcomes", async () => {
    renderPage()
    expect(await screen.findByRole("heading", { name: "Morning briefing" })).toBeInTheDocument()
    expect(
      await screen.findByRole("img", { name: "Gym health 82 out of 100, Healthy" }),
    ).toBeInTheDocument()
    expect(screen.getByText("Executed")).toBeInTheDocument()
    expect(screen.getByText("$0.0200")).toBeInTheDocument()
    expect(
      await screen.findByText(/Outcomes so far/),
    ).toBeInTheDocument()
    const calls = mockGet.mock.calls.filter(([p]) => p === "/analytics/coo-briefing")
    expect(calls).toHaveLength(1)
  })

  it("shows pending approvals with review actions", async () => {
    mockGet.mockImplementation(async (path: string) => {
      if (path === "/ai-actions?status=PENDING_APPROVAL") {
        return {
          items: [{ id: "a1", type: "ASSIGN_WORKOUT_PLAN", reasoning: "Gap in program.", status: "PENDING_APPROVAL", payload: {} }],
          total: 1,
          page: 1,
          pageSize: 20,
          totalPages: 1,
        }
      }
      if (path === "/branches") return { items: [] }
      throw new Error(`unexpected GET ${path}`)
    })
    renderPage()
    expect(await screen.findByText("Pending approvals")).toBeInTheDocument()
    expect(await screen.findByText("Review & decide")).toBeInTheDocument()
  })
})

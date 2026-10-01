import "@testing-library/jest-dom"
import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"

import DashboardPage from "./page"

jest.mock("next/navigation", () => ({ usePathname: () => "/dashboard" }))

let mockPermissions: string[] = []
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

const ALL = ["reports.view", "organizations.read", "members.create", "leads.manage"]

const BRIEFING = {
  generatedAt: "2026-10-02T04:00:00.000Z",
  branchId: null,
  today: { checkIns: 12, deniedCheckIns: 3 },
  revenue: {
    period: { from: "", to: "" },
    branchId: null,
    revenue: [{ currency: "INR", paymentCount: 4, grossRevenue: "8000.00", membershipRevenue: "8000.00", otherRevenue: "0.00", refunded: "0.00", netRevenue: "8000.00" }],
    outstanding: [],
    notComputable: [],
  },
  atRiskMembers: { count: 0, top: [] },
  // A busy month's follow-up total that is *not* what is due.
  salesFunnel: { totalLeads: 9, wonLeads: 2, conversionRatePct: "22.22", averageDaysToConversion: 3, followUps: { total: 40, completed: 38, completionRatePct: "95.00" } },
  lowStock: { count: 0, top: [] },
  trainerWorkload: { trainerCount: 0, top: [], notComputable: [] },
  pendingAiActions: 0,
  followUpsDue: { count: 2, overdue: 1 },
}

function routes(overrides: Record<string, unknown> = {}) {
  const table: Record<string, unknown> = {
    "/briefing/daily": BRIEFING,
    "/organizations/current": { name: "619 Fitness Studio", currency: "INR" },
    "/analytics/revenue/trend": [
      { month: "2026-05", revenue: [] },
      { month: "2026-06", revenue: [] },
      { month: "2026-07", revenue: [] },
      { month: "2026-08", revenue: [] },
      { month: "2026-09", revenue: [] },
      { month: "2026-10", revenue: [{ currency: "INR", grossRevenue: "8000.00", productRevenue: "0.00", refunded: "0.00", netRevenue: "8000.00" }] },
    ],
    "/analytics/members/status-breakdown": [
      { status: "ACTIVE", count: 30 },
      { status: "EXPIRED", count: 7 },
      { status: "NO_MEMBERSHIP", count: 2 },
    ],
    ...overrides,
  }
  mockGet.mockImplementation(async (path: string) => {
    if (!(path in table)) throw new Error(`unexpected GET ${path}`)
    return table[path]
  })
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <DashboardPage />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  mockGet.mockReset()
  mockPermissions = [...ALL]
  routes()
})

describe("DashboardPage", () => {
  it("gives staff without reports.view a working home, and asks the API for nothing it would refuse", async () => {
    mockPermissions = ["members.create"]
    renderPage()

    expect(await screen.findByRole("heading", { name: "Welcome, Asha" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /add a member/i })).toBeInTheDocument()
    expect(screen.queryByText(/could not load/i)).not.toBeInTheDocument()
    // Before: four requests, four 403s.
    expect(mockGet).not.toHaveBeenCalled()
  })

  it("shows follow-ups that are due today, not every follow-up on this month's leads", async () => {
    renderPage()
    expect(await screen.findByText("2 lead follow-ups due today")).toBeInTheDocument()
    expect(screen.getByText("1 overdue — call those first.")).toBeInTheDocument()
    expect(screen.queryByText(/40 follow-ups/)).not.toBeInTheDocument()
  })

  it("raises no follow-up alert when nothing is due, however many follow-ups exist", async () => {
    routes({ "/briefing/daily": { ...BRIEFING, followUpsDue: { count: 0, overdue: 0 } } })
    renderPage()
    expect(await screen.findByText("12")).toBeInTheDocument()
    expect(screen.queryByText(/follow-ups?\b.*\bdue/i)).not.toBeInTheDocument()
  })

  it("says how many members were turned away beside today's check-ins", async () => {
    renderPage()
    expect(await screen.findByText("3 turned away at the door")).toBeInTheDocument()
  })

  it("draws this month's revenue for a gym with no older months", async () => {
    renderPage()
    expect(await screen.findByText(/Peak/)).toBeInTheDocument()
    expect(screen.queryByText("No revenue yet")).not.toBeInTheDocument()
    expect(screen.getByRole("img", { name: /Oct 8000/ })).toBeInTheDocument()
  })

  it("names member statuses in words", async () => {
    renderPage()
    // Once on the bar, once in the screen-reader table.
    expect(await screen.findAllByText("Lapsed")).toHaveLength(2)
    expect(screen.getAllByText("No membership")).toHaveLength(2)
    expect(screen.queryByText("EXPIRED")).not.toBeInTheDocument()
  })
})

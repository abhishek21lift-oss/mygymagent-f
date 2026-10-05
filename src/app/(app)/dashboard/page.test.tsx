import "@testing-library/jest-dom"
import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"

import DashboardPage from "./page"
import { fireEvent } from "@testing-library/react"

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

const ALL = [
  "reports.view",
  "organizations.read",
  "branches.read",
  "members.create",
  "members.read",
  "memberships.read",
  "leads.read",
  "leads.manage",
  "inventory.read",
  "payments.read",
]

const BRIEFING = {
  generatedAt: "2026-10-02T04:00:00.000Z",
  branchId: null,
  today: { checkIns: 12, deniedCheckIns: 3 },
  revenue: {
    period: { from: "", to: "" },
    branchId: null,
    revenue: [{ currency: "INR", paymentCount: 4, grossRevenue: "8000.00", membershipRevenue: "8000.00", otherRevenue: "0.00", refunded: "0.00", netRevenue: "8000.00" }],
    outstanding: [{ currency: "INR", membershipsWithBalance: 3, outstandingBalance: "4500.00" }],
    notComputable: [],
  },
  atRiskMembers: { count: 0, top: [] },
  // A busy month's follow-up total that is *not* what is due.
  salesFunnel: { totalLeads: 9, wonLeads: 2, conversionRatePct: "22.22", averageDaysToConversion: 3, followUps: { total: 40, completed: 38, completionRatePct: "95.00" } },
  lowStock: { count: 1, top: [{ productId: "p1", sku: "W1", name: "Whey 1kg", quantityOnHand: 1, reorderLevel: 5, daysUntilStockout: 2 }] },
  trainerWorkload: { trainerCount: 0, top: [], notComputable: [] },
  pendingAiActions: 4,
  followUpsDue: { count: 2, overdue: 1 },
  expiringSoon: { count: 5, withinDays: 7 },
}

const BRANCH_A = "11111111-1111-4111-8111-111111111111"
const BRANCH_B = "22222222-2222-4222-8222-222222222222"

function routes(overrides: Record<string, unknown> = {}) {
  const table: Record<string, unknown> = {
    "/briefing/daily": BRIEFING,
    "/organizations/current": { name: "619 Fitness Studio", currency: "INR", timezone: "Asia/Kolkata" },
    "/branches": { items: [{ id: BRANCH_A, name: "Indiranagar" }, { id: BRANCH_B, name: "Koramangala" }] },
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
    "/analytics/revenue": {
      period: { from: "", to: "" },
      branchId: null,
      revenue: [{ currency: "INR", paymentCount: 4, grossRevenue: "8000.00", membershipRevenue: "8000.00", otherRevenue: "0.00", productRevenue: "500.00", refunded: "0.00", netRevenue: "8000.00" }],
      outstanding: [{ currency: "INR", membershipsWithBalance: 3, outstandingBalance: "4500.00" }],
      notComputable: [],
    },
    "/members": { items: [], total: 3, page: 1, pageSize: 1, totalPages: 3 },
    "/memberships": {
      items: [
        { id: "m1", previousMembershipId: "m0" },
        { id: "m2", previousMembershipId: null },
      ],
      total: 2,
      page: 1,
      pageSize: 100,
      totalPages: 1,
    },
    "/leads": { items: [], total: 5, page: 1, pageSize: 1, totalPages: 5 },
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

function callsTo(path: string) {
  return mockGet.mock.calls.filter(([p]) => p === path).map(([, options]) => options as { query?: Record<string, unknown> } | undefined)
}

beforeEach(() => {
  window.localStorage.clear()
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

  it("shows the four period-driven finance KPIs from the revenue summary", async () => {
    renderPage()
    expect(await screen.findByText("Net revenue")).toBeInTheDocument()
    expect(screen.getByText("Collected amount")).toBeInTheDocument()
    expect(screen.getByText("Outstanding amount")).toBeInTheDocument()
    expect(screen.getByText("Inventory sale")).toBeInTheDocument()
    expect(await screen.findByText("On 3 memberships · live balance")).toBeInTheDocument()
  })

  it("shows the six Today KPIs from their authoritative sources", async () => {
    renderPage()
    expect(await screen.findByText("Net revenue")).toBeInTheDocument()
    for (const title of ["Check In", "Collection", "New Members", "Renewals", "Leads"]) {
      expect(screen.getByText(title)).toBeInTheDocument()
    }
    // Renewals counts only rows linked to a previous membership.
    expect(await screen.findByText("Of 2 started today")).toBeInTheDocument()
    // PT Sessions needs workouts.read, which this permission set lacks.
    expect(screen.queryByText("PT Sessions")).not.toBeInTheDocument()
    const memberCalls = callsTo("/members").filter((options) => options?.query?.joinedFrom)
    expect(memberCalls).toHaveLength(1)
    expect(memberCalls[0]?.query).toMatchObject({ pageSize: 1 })
    // joinedTo is lte-start-of-day server-side, so the window ends tomorrow.
    // Computed in the org timezone, exactly like the page under test.
    const inKolkata = (d: Date) =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(d);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    expect(memberCalls[0]?.query?.joinedFrom).toBe(inKolkata(now))
    expect(memberCalls[0]?.query?.joinedTo).toBe(inKolkata(tomorrow))
    const leadCalls = callsTo("/leads")
    expect(leadCalls).toHaveLength(1)
    expect(leadCalls[0]?.query).toMatchObject({ pageSize: 1 })
    expect(leadCalls[0]?.query?.createdFrom).toBe(leadCalls[0]?.query?.createdTo)
    const membershipCalls = callsTo("/memberships")
    expect(membershipCalls).toHaveLength(1)
    expect(membershipCalls[0]?.query?.createdFrom).toBe(membershipCalls[0]?.query?.createdTo)
    const summaries = callsTo("/analytics/revenue")
    expect(summaries.length).toBeGreaterThanOrEqual(2)
    expect(summaries).toContainEqual(
      expect.objectContaining({ query: expect.objectContaining({ from: summaries[0]?.query?.from }) }),
    )
  })

  it("shows PT Sessions for someone who can read workouts", async () => {
    mockPermissions = [...ALL, "workouts.read"]
    renderPage()
    expect(await screen.findByText("PT Sessions")).toBeInTheDocument()
  })

  it("asks the revenue summary for the default 30-day period", async () => {
    renderPage()
    expect(await screen.findByText("Net revenue")).toBeInTheDocument()
    const [call] = callsTo("/analytics/revenue")
    expect(call?.query?.from).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(call?.query?.to).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    const span =
      (new Date(`${call?.query?.to}T12:00:00Z`).getTime() -
        new Date(`${call?.query?.from}T12:00:00Z`).getTime()) /
      86400000
    expect(span).toBe(29)
  })

  it("re-queries when a preset is picked", async () => {
    renderPage()
    expect(await screen.findByText("Net revenue")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "7D" }))
    expect(
      await screen.findByText((_, el) => (el?.textContent ?? "").startsWith("Last 7 days")),
    ).toBeInTheDocument()
    const last = callsTo("/analytics/revenue").at(-1)
    const span =
      (new Date(`${last?.query?.to}T12:00:00Z`).getTime() -
        new Date(`${last?.query?.from}T12:00:00Z`).getTime()) /
      86400000
    expect(span).toBe(6)
  })

  it("applies a custom range and resets to the default", async () => {
    renderPage()
    expect(await screen.findByText("Net revenue")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Custom" }))
    fireEvent.change(await screen.findByLabelText("Start date"), {
      target: { value: "2026-09-01" },
    })
    fireEvent.change(screen.getByLabelText("End date"), {
      target: { value: "2026-09-15" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Apply" }))
    expect(
      await screen.findByText((_, el) => (el?.textContent ?? "").startsWith("Custom")),
    ).toBeInTheDocument()
    expect(callsTo("/analytics/revenue").at(-1)?.query).toMatchObject({
      from: "2026-09-01",
      to: "2026-09-15",
    })
    fireEvent.click(screen.getByRole("button", { name: /Sep/ }))
    fireEvent.click(screen.getByRole("button", { name: "Reset" }))
    const last = callsTo("/analytics/revenue").at(-1)
    const span =
      (new Date(`${last?.query?.to}T12:00:00Z`).getTime() -
        new Date(`${last?.query?.from}T12:00:00Z`).getTime()) /
      86400000
    expect(span).toBe(29)
  })

  it("brings Owner OS's renewal alert home, and only for someone who can act on it", async () => {
    renderPage()
    expect(await screen.findByText("5 memberships end within 7 days")).toBeInTheDocument()
  })

  it("shows each priority only to someone who can act on it", async () => {
    // No ai.approve, no inventory.read, no leads.read in this set.
    mockPermissions = ["reports.view", "members.read"]
    renderPage()
    expect(await screen.findByText("12")).toBeInTheDocument()
    expect(screen.queryByText(/AI proposals?/)).not.toBeInTheDocument()
    expect(screen.queryByText(/reorder level/)).not.toBeInTheDocument()
    expect(screen.queryByText(/follow-ups? due/)).not.toBeInTheDocument()
    expect(screen.queryByText(/end within/)).not.toBeInTheDocument()
  })

  it("lists AI proposals for an approver, and low stock by name", async () => {
    mockPermissions = [...ALL, "ai.approve"]
    renderPage()
    expect(await screen.findByText("4 AI proposals awaiting approval")).toBeInTheDocument()
    expect(screen.getByText("Whey 1kg")).toBeInTheDocument()
  })

  it("asks for the branch remembered on this device, and keys the cache on it", async () => {
    window.localStorage.setItem("mygymagent:dashboard-branch", BRANCH_B)
    renderPage()
    expect(await screen.findByText("12")).toBeInTheDocument()
    expect(callsTo("/briefing/daily")[0]?.query).toEqual({ branchId: BRANCH_B })
    expect(callsTo("/analytics/revenue/trend")[0]?.query).toMatchObject({ branchId: BRANCH_B })
    expect(callsTo("/analytics/members/status-breakdown")[0]?.query).toEqual({ branchId: BRANCH_B })
  })

  it("asks for the whole gym by default", async () => {
    renderPage()
    expect(await screen.findByText("12")).toBeInTheDocument()
    expect(callsTo("/briefing/daily")[0]?.query).toEqual({ branchId: undefined })
    expect(screen.getByRole("combobox", { name: "Branch" })).toBeInTheDocument()
  })

  it("scopes a restricted manager without showing a picker or a location line", async () => {
    routes({ "/briefing/daily": { ...BRIEFING, branchId: BRANCH_A } })
    renderPage()
    expect(await screen.findByText("12")).toBeInTheDocument()
    expect(screen.queryByRole("combobox", { name: "Branch" })).not.toBeInTheDocument()
    expect(screen.queryByText("Indiranagar")).not.toBeInTheDocument()
    expect(callsTo("/briefing/daily")[0]?.query).toEqual({ branchId: undefined })
  })

  it("has retired the duplicate panels and pages", async () => {
    renderPage()
    expect(await screen.findByText("12")).toBeInTheDocument()
    expect(screen.queryByText("AI briefing")).not.toBeInTheDocument()
    expect(screen.queryByText(/Today.s activity/)).not.toBeInTheDocument()
    for (const link of screen.getAllByRole("link")) {
      expect(link.getAttribute("href")).not.toMatch(/command-center|owner-os/)
    }
  })
})

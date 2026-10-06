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
    "/analytics/memberships/renewal-pipeline": {
      upcoming: [{ membershipId: "ms1", memberId: "mem1", firstName: "Ravi", lastName: "K", planName: "Monthly", price: "5000.00", currency: "INR", endDate: new Date(Date.now() + 5 * 86400000).toISOString(), daysUntilExpiry: 5 }],
      overdue: [],
      highValue: [{ membershipId: "ms1", memberId: "mem1", firstName: "Ravi", lastName: "K", planName: "Monthly", price: "5000.00", currency: "INR", endDate: new Date(Date.now() + 5 * 86400000).toISOString(), daysUntilExpiry: 5 }],
      counts: { upcoming: 1, overdue: 0 },
    },
    "/analytics/sales/priority": {
      items: [{ leadId: "l1", firstName: "Sana", lastName: "P", source: "Walk-in", status: "NEW", severity: "hot", reasons: ["Follow-up overdue by 2 days"], followUpDueAt: new Date(Date.now() - 2 * 86400000).toISOString(), overdueFollowUps: 1 }],
      counts: { hot: 1, warm: 0, watch: 0 },
    },
    "/analytics/trainers/pt-opportunities": {
      expiring: [{ packageId: "p1", memberId: "mem2", firstName: "Dev", lastName: "M", packageName: "PT-10", sessionsRemaining: 6, daysLeft: 5, reason: "EXPIRING_WITH_SESSIONS" }],
      neverStarted: [],
      counts: { expiring: 1, neverStarted: 0, activePackages: 4 },
    },
    "/analytics/members/win-back": {
      items: [{ memberId: "mem9", firstName: "Ex", lastName: "Member", daysSinceExpiry: 60, lifetimePaid: "45000.00", currency: "INR", tenureDays: 210, lastVisitAt: null, priorPtPackages: 0, tier: "HIGH", reasons: ["Paid 45,000 INR over 210 days"] }],
      counts: { high: 1, medium: 0, low: 0 },
    },
    "/ai-actions/effectiveness": { total: 7, pending: 4, approved: 0, executed: 2, rejected: 1, failed: 0, acceptanceRate: 0.67, executionRate: 1 },
    "/analytics/gym-health": {
      score: 82,
      status: "healthy",
      opportunity: "collections",
      components: [
        { key: "revenue", label: "Revenue", score: 92, weight: 30, value: "Net vs gross", explanation: "Kept after refunds.", source: "GET /analytics/revenue" },
        { key: "collections", label: "Collections", score: 72, weight: 25, value: "Outstanding share", explanation: "Money in hand.", source: "GET /analytics/revenue" },
        { key: "retention", label: "Retention", score: 78, weight: 20, value: "10 of 100 at risk", explanation: "No visit in 14 days.", source: "GET /analytics/members/at-risk" },
        { key: "sales", label: "Sales", score: 86, weight: 15, value: "40 leads", explanation: "Conversion rate.", source: "GET /analytics/sales/funnel" },
        { key: "inventory", label: "Inventory", score: 90, weight: 10, value: "2 of 20 low", explanation: "Share of products with healthy stock levels.", source: "GET /analytics/inventory/forecast" },
      ],
      branchId: null,
      computedAt: "2026-10-06T04:00:00.000Z",
      revenueAtRisk: {
        totalMRR: 100000,
        atRiskMRR: 8420,
        atRiskPercentage: 8.42,
        bySegment: [{ riskLevel: "HIGH", mrr: 8420, memberCount: 3 }],
      },
    },
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

  it("shows hot leads with evidence", async () => {
    renderPage()
    expect(await screen.findByText("Sana P — Follow-up overdue by 2 days")).toBeInTheDocument()
    expect(screen.getByText("via Walk-in")).toBeInTheDocument()
  })

  it("shows no lead rows when nothing is hot", async () => {
    routes({
      "/analytics/sales/priority": { items: [], counts: { hot: 0, warm: 0, watch: 2 } },
    })
    renderPage()
    expect(await screen.findByText("12")).toBeInTheDocument()
    expect(screen.queryByText("Sana P")).not.toBeInTheDocument()
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
    // Workouts needs workouts.read, which this permission set lacks.
    expect(screen.queryByText("Workouts")).not.toBeInTheDocument()
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

  it("shows today's workouts for someone who can read workouts, narrowed to the picked branch", async () => {
    mockPermissions = [...ALL, "workouts.read"]
    window.localStorage.setItem("mygymagent:dashboard-branch", BRANCH_B)
    routes({ "/workout-sessions/today": [{ id: "s1" }, { id: "s2" }] })
    renderPage()
    expect(await screen.findByText("Workouts")).toBeInTheDocument()
    expect(await screen.findByText("Training sessions today")).toBeInTheDocument()
    expect(callsTo("/workout-sessions/today")[0]?.query).toEqual({ branchId: BRANCH_B })
  })

  it("shows the slim gym health hero with brand, ring and no alert copy", async () => {
    renderPage()
    // Brand only in the hero eyebrow — no "MyGymAgent ·" prefix, no visible title.
    expect(await screen.findByText("619 Fitness Studio")).toBeInTheDocument()
    // Data-driven wait: the ring only carries the score once resolved.
    expect(await screen.findByRole("img", { name: "Gym health 82 out of 100, Healthy" })).toBeInTheDocument()
    // Alert copy lives in the breakdown card now, not the hero.
    expect(screen.queryByText("82 · Healthy")).not.toBeInTheDocument()
    expect(screen.queryByText(/biggest opportunity today/)).not.toBeInTheDocument()
    expect(screen.getByText("Why this score")).toBeInTheDocument()
    expect(screen.getByText(/Kept after refunds/)).toBeInTheDocument()
    expect(screen.getByText("Revenue at risk")).toBeInTheDocument()
    expect(screen.getByText("At-risk MRR")).toBeInTheDocument()
    const healthCalls = callsTo("/analytics/gym-health")
    expect(healthCalls).toHaveLength(1)
  })

  it("asks the revenue summary for the default 30-day period", async () => {
    renderPage()
    // Data-driven hint: proves the summary resolved, not just rendered.
    await screen.findByText("Across 4 payments + product sales")
    const spans = callsTo("/analytics/revenue").map((options) => {
      const query = options?.query as { from?: string; to?: string } | undefined;
      if (!query?.from || !query?.to) return -1;
      return (
        (new Date(`${query.to}T12:00:00Z`).getTime() -
          new Date(`${query.from}T12:00:00Z`).getTime()) /
        86400000
      );
    })
    expect(spans).toContain(29)
    const call = callsTo("/analytics/revenue").find((options) => {
      const query = options?.query as { from?: string; to?: string } | undefined;
      return query?.from && query?.to && /^\d{4}-\d{2}-\d{2}$/.test(query.from) && /^\d{4}-\d{2}-\d{2}$/.test(query.to);
    })
    expect(call?.query?.from).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(call?.query?.to).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it("re-queries when a preset is picked", async () => {
    renderPage()
    expect(await screen.findByText("Net revenue")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "7D" }))
    expect(
      await screen.findByText((_, el) => (el?.textContent ?? "").startsWith("Last 7 days")),
    ).toBeInTheDocument()
    const spans = callsTo("/analytics/revenue").map((options) => {
      const query = options?.query as { from?: string; to?: string } | undefined;
      if (!query?.from || !query?.to) return -1;
      return (
        (new Date(`${query.to}T12:00:00Z`).getTime() -
          new Date(`${query.from}T12:00:00Z`).getTime()) /
        86400000
      );
    })
    expect(spans).toContain(6)
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

  it("brings renewals home with evidence, only for someone who can act on it", async () => {
    mockPermissions = [...ALL, "workouts.read"]
    renderPage()
    expect(await screen.findByText("Ravi K — Monthly ends in 5d")).toBeInTheDocument()
    expect(screen.getByText(/at stake/)).toBeInTheDocument()
    expect(await screen.findByText("Dev M — 6 sessions, 5d left")).toBeInTheDocument()
  })

  it("shows each priority only to someone who can act on it", async () => {
    // members.read only: at-risk members stay, everything gated disappears.
    mockPermissions = ["reports.view", "members.read"]
    routes({
      "/briefing/daily": {
        ...BRIEFING,
        atRiskMembers: { count: 2, top: [] },
      },
    })
    renderPage()
    expect(await screen.findByText("12")).toBeInTheDocument()
    expect(screen.getByText("Review risk")).toBeInTheDocument()
    expect(screen.queryByText(/AI proposals?/)).not.toBeInTheDocument()
    expect(screen.queryByText("Ravi K")).not.toBeInTheDocument()
    expect(screen.queryByText("Sana P")).not.toBeInTheDocument()
    expect(screen.queryByText("Dev M")).not.toBeInTheDocument()
    expect(screen.queryByText("Collect")).not.toBeInTheDocument()
  })

  it("surfaces high-value win-back candidates with evidence", async () => {
    renderPage()
    expect(await screen.findByText("1 high-value win-back")).toBeInTheDocument()
    expect(screen.getByText(/Paid 45,000 INR over 210 days/)).toBeInTheDocument()
  })

  it("lists AI proposals and outcome counts for an approver", async () => {
    mockPermissions = [...ALL, "ai.approve"]
    renderPage()
    expect(await screen.findByText("4 AI proposals awaiting approval")).toBeInTheDocument()
    expect(await screen.findByText(/2 AI actions executed/)).toBeInTheDocument()
    expect(screen.getByText("Action history")).toBeInTheDocument()
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

  it("keeps the priority list when the AI outcome counts fail to load", async () => {
    mockPermissions = [...ALL, "ai.approve"]
    const base = mockGet.getMockImplementation()!
    mockGet.mockImplementation(async (path: string, options?: unknown) => {
      if (path === "/ai-actions/effectiveness") throw new Error("boom")
      return base(path, options)
    })
    renderPage()
    expect(await screen.findByText("4 AI proposals awaiting approval")).toBeInTheDocument()
    expect(screen.queryByText(/Outcomes so far/)).not.toBeInTheDocument()
  })

  it("says when a priority source failed instead of claiming all caught up", async () => {
    routes({
      "/briefing/daily": { ...BRIEFING, pendingAiActions: 0 },
      "/analytics/revenue": {
        period: { from: "", to: "" }, branchId: null, revenue: [], outstanding: [], notComputable: [],
      },
      "/analytics/sales/priority": { items: [], counts: { hot: 0, warm: 0, watch: 0 } },
      "/analytics/trainers/pt-opportunities": { expiring: [], neverStarted: [], counts: { expiring: 0, neverStarted: 0, activePackages: 0 } },
      "/analytics/members/win-back": { items: [], counts: { high: 0, medium: 0, low: 0 } },
    })
    const base = mockGet.getMockImplementation()!
    mockGet.mockImplementation(async (path: string, options?: unknown) => {
      if (path === "/analytics/memberships/renewal-pipeline") throw new Error("boom")
      return base(path, options)
    })
    renderPage()
    expect(await screen.findByText(/Some priorities could not be loaded/)).toBeInTheDocument()
    expect(screen.queryByText(/all caught up/i)).not.toBeInTheDocument()
  })

  it("ignores a remembered branch for someone who cannot pick branches", async () => {
    mockPermissions = ALL.filter((p) => p !== "branches.read")
    window.localStorage.setItem("mygymagent:dashboard-branch", BRANCH_B)
    renderPage()
    expect(await screen.findByText("12")).toBeInTheDocument()
    expect(callsTo("/branches")).toHaveLength(0)
    expect(callsTo("/briefing/daily")[0]?.query).toEqual({ branchId: undefined })
  })

  it("drops a remembered branch that no longer exists", async () => {
    window.localStorage.setItem("mygymagent:dashboard-branch", "33333333-3333-4333-8333-333333333333")
    renderPage()
    expect(await screen.findByText("12")).toBeInTheDocument()
    for (const options of callsTo("/briefing/daily")) {
      expect(options?.query).toEqual({ branchId: undefined })
    }
  })

  it("narrows every Today figure to the picked branch", async () => {
    window.localStorage.setItem("mygymagent:dashboard-branch", BRANCH_A)
    renderPage()
    expect(await screen.findByText("Of 2 started today")).toBeInTheDocument()
    expect(callsTo("/memberships")[0]?.query).toMatchObject({ branchId: BRANCH_A })
    expect(callsTo("/leads")[0]?.query).toMatchObject({ branchId: BRANCH_A })
    // Members narrows through the branch option (sent as a header), not the query.
    const memberCall = callsTo("/members").find((o) => o?.query?.joinedFrom) as { branchId?: string[] } | undefined
    expect(memberCall?.branchId).toEqual([BRANCH_A])
  })

  it("never draws a missing health score as a zero", async () => {
    routes({
      "/analytics/gym-health": {
        score: null, status: "unknown", opportunity: null, components: [], branchId: null,
        computedAt: "2026-10-06T04:00:00.000Z", mixedCurrencies: false,
        revenueAtRisk: { totalMRR: 0, atRiskMRR: 0, atRiskPercentage: 0, bySegment: [], byCurrency: [], mixed: false },
      },
    })
    renderPage()
    expect(await screen.findByRole("img", { name: "Gym health unavailable" })).toBeInTheDocument()
    expect(screen.queryByText("0%")).not.toBeInTheDocument()
    expect(screen.queryByText(/GET \/analytics/)).not.toBeInTheDocument()
  })
})

import "@testing-library/jest-dom"
import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen } from "@testing-library/react"

import { TodayList } from "./today-list"
import type { TodayMetric } from "./metrics"

const mockReplace = jest.fn()
jest.mock("next/navigation", () => ({ useRouter: () => ({ replace: mockReplace }), usePathname: () => "/dashboard/today/x" }))

let mockPermissions: string[] = []
jest.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({
    hasPermission: (key: string | string[]) => (Array.isArray(key) ? key : [key]).some((k) => mockPermissions.includes(k)),
  }),
}))

const mockGet = jest.fn()
jest.mock("@/lib/api/client", () => ({
  api: { get: (path: string, options?: unknown) => mockGet(path, options) },
}))

const DAY = "2026-10-08"
const BRANCH = "11111111-1111-4111-8111-111111111111"
const page = <T,>(items: T[]) => ({ items, page: 1, pageSize: 100, total: items.length, totalPages: 1 })

function routes(table: Record<string, unknown>) {
  mockGet.mockImplementation(async (path: string) => {
    if (path === "/organizations/current") return { id: "o1", name: "619 Fitness Studio", timezone: "Asia/Kolkata", currency: "INR" }
    if (path === "/branches") return page([{ id: BRANCH, name: "Kanpur" }])
    if (!(path in table)) throw new Error(`unexpected GET ${path}`)
    return table[path]
  })
}

function renderList(metric: TodayMetric, branchId?: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <TodayList metric={metric} date={DAY} branchId={branchId} />
    </QueryClientProvider>,
  )
}

function queryFor(path: string) {
  return (mockGet.mock.calls.find(([p]) => p === path)?.[1] as { query?: Record<string, unknown> } | undefined)?.query
}

const member = (id: string, firstName: string) => ({ id, firstName, lastName: "K" })

beforeEach(() => {
  mockGet.mockReset()
  mockReplace.mockReset()
  mockPermissions = ["organizations.read", "branches.read", "attendance.read", "payments.read", "members.read", "memberships.read", "leads.read"]
})

describe("Today drill-down", () => {
  it("lists the day's member check-ins for the branch, and says who was turned away", async () => {
    routes({
      "/attendance": page([
        { id: "a1", memberId: "m1", member: member("m1", "Ravi"), checkInAt: "2026-10-08T01:30:00.000Z", method: "QR", deniedReason: null, branch: { id: BRANCH, name: "Kanpur" } },
        { id: "a2", memberId: "m2", member: member("m2", "Sana"), checkInAt: "2026-10-08T02:00:00.000Z", method: "KIOSK", deniedReason: "Membership expired", branch: null },
        // A staff check-in is not on the tile, and not in the list.
        { id: "a3", memberId: null, member: null, staffUser: member("u1", "Coach"), checkInAt: "2026-10-08T02:10:00.000Z", method: "STAFF", deniedReason: null },
      ]),
    })
    renderList("check-ins", BRANCH)
    expect(await screen.findByText("1 check-in · 1 turned away at the door")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Ravi K" })).toHaveAttribute("href", "/members/m1")
    expect(screen.getByText("Membership expired")).toBeInTheDocument()
    expect(screen.queryByText("Coach K")).not.toBeInTheDocument()
    expect(queryFor("/attendance")).toMatchObject({ date: DAY, branchId: BRANCH, pageSize: 100 })
    expect(await screen.findByText("Thursday, 8 October · Kanpur")).toBeInTheDocument()
  })

  it("totals the day's collection without failed payments", async () => {
    routes({
      "/payments": page([
        { id: "p1", memberId: "m1", member: member("m1", "Ravi"), amount: "2500", currency: "INR", method: "UPI", status: "COMPLETED", membershipId: "ms1", note: null, createdAt: "2026-10-08T05:00:00.000Z" },
        { id: "p2", memberId: "m2", member: member("m2", "Sana"), amount: "1000", currency: "INR", method: "CASH", status: "FAILED", membershipId: null, note: null, createdAt: "2026-10-08T06:00:00.000Z" },
      ]),
    })
    renderList("collection")
    expect(await screen.findByText(/from 1 payment$/)).toBeInTheDocument()
    expect(screen.getByText(/2,500/, { selector: "p" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Sana K" })).not.toBeInTheDocument()
    expect(queryFor("/payments")).toMatchObject({ date: DAY })
  })

  it("lists only renewals among the memberships started that day", async () => {
    routes({
      "/memberships": page([
        { id: "ms1", memberId: "m1", member: member("m1", "Ravi"), previousMembershipId: "old", membershipPlan: { name: "Quarterly" }, startDate: "2026-10-08T00:00:00.000Z", endDate: "2027-01-06T00:00:00.000Z", price: "6000", currency: "INR" },
        { id: "ms2", memberId: "m2", member: member("m2", "Sana"), previousMembershipId: null, membershipPlan: { name: "Monthly" }, startDate: "2026-10-08T00:00:00.000Z", endDate: "2026-11-07T00:00:00.000Z", price: "2000", currency: "INR" },
      ]),
    })
    renderList("renewals")
    expect(await screen.findByText("1 renewal of 2 memberships started")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Ravi K" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Sana K" })).not.toBeInTheDocument()
    expect(queryFor("/memberships")).toMatchObject({ createdFrom: DAY, createdTo: DAY })
  })

  it("moves to the previous day, keeping the branch", async () => {
    routes({ "/leads": page([]) })
    renderList("leads", BRANCH)
    expect(await screen.findByText("No leads")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Previous day" }))
    expect(mockReplace).toHaveBeenCalledWith(`/dashboard/today/leads?date=2026-10-07&branch=${BRANCH}`)
  })

  it("says so instead of loading a list the role cannot read", async () => {
    mockPermissions = ["organizations.read"]
    routes({})
    renderList("collection")
    expect(await screen.findByText(/can.t see this list/)).toBeInTheDocument()
    expect(mockGet.mock.calls.some(([p]) => p === "/payments")).toBe(false)
  })
})

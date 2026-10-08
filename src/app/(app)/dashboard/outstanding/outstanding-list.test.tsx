import "@testing-library/jest-dom"
import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"

import { OutstandingList, outstandingHref } from "./outstanding-list"

jest.mock("next/navigation", () => ({ usePathname: () => "/dashboard/outstanding" }))

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

const BRANCH = "11111111-1111-4111-8111-111111111111"
const row = (id: string, firstName: string, outstanding: string, paid: string, price: string) => ({
  membershipId: `ms-${id}`,
  status: "ACTIVE",
  member: { id, firstName, lastName: "K", phone: "9876543210" },
  planName: "Quarterly",
  branch: { id: BRANCH, name: "Kanpur" },
  startDate: "2026-09-01T00:00:00.000Z",
  endDate: "2026-11-30T00:00:00.000Z",
  currency: "INR",
  price,
  paid,
  outstanding,
})

function renderList(branchId?: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <OutstandingList branchId={branchId} />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  mockGet.mockReset()
  mockPermissions = ["reports.view", "branches.read"]
  mockGet.mockImplementation(async (path: string) => {
    if (path === "/analytics/outstanding") return [row("m1", "Ravi", "4000.00", "2000.00", "6000.00"), row("m2", "Sana", "500.00", "1500.00", "2000.00")]
    if (path === "/branches") return { items: [{ id: BRANCH, name: "Kanpur" }], page: 1, pageSize: 100, total: 1, totalPages: 1 }
    throw new Error(`unexpected GET ${path}`)
  })
})

describe("Outstanding list", () => {
  it("lists who owes with the total, linking each member", async () => {
    renderList()
    expect(await screen.findByText(/outstanding on 2 memberships · largest first/)).toBeInTheDocument()
    expect(screen.getByText(/4,500/)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Ravi K" })).toHaveAttribute("href", "/members/m1")
    expect(screen.getByText(/paid ₹\s?2,000\.00 of ₹\s?6,000\.00/)).toBeInTheDocument()
  })

  it("asks for the dashboard's branch", async () => {
    renderList(BRANCH)
    await screen.findByRole("link", { name: "Ravi K" })
    const call = mockGet.mock.calls.find(([p]) => p === "/analytics/outstanding")
    expect(call?.[1]).toEqual({ query: { branchId: BRANCH } })
    expect(await screen.findByText(/Kanpur$/)).toBeInTheDocument()
  })

  it("says so, without asking, when the role cannot see reports", async () => {
    mockPermissions = []
    renderList()
    expect(screen.getByText(/can.t see this list/)).toBeInTheDocument()
    expect(mockGet).not.toHaveBeenCalledWith("/analytics/outstanding", expect.anything())
  })

  it("builds the dashboard's link", () => {
    expect(outstandingHref()).toBe("/dashboard/outstanding")
    expect(outstandingHref(BRANCH)).toBe(`/dashboard/outstanding?branch=${BRANCH}`)
  })
})

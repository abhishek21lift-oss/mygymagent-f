import * as React from "react"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { api } from "@/lib/api/client"
import PlatformBillingPage from "./page"

jest.mock("next/navigation", () => ({ usePathname: () => "/settings/billing" }))
jest.mock("@/lib/api/client", () => {
  const actual = jest.requireActual("@/lib/api/client")
  return { ...actual, api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() } }
})

const plans = [
  { id: "1", key: "starter", name: "Starter", priceMinor: 99900, currency: "INR", maxMembers: 500, maxBranches: 2, maxStaff: 10, aiMonthlyRequests: 5000 },
  { id: "2", key: "business", name: "Business", priceMinor: 499900, currency: "INR", maxMembers: 10000, maxBranches: 20, maxStaff: 100, aiMonthlyRequests: 100000 },
]

describe("Platform billing page", () => {
  beforeEach(() => {
    ;(api.get as jest.Mock).mockImplementation(async (url: string) => {
      if (url === "/platform-billing/plans") return plans
      if (url === "/platform-billing/usage")
        return { plan: { ...plans[0], planKey: "starter", status: "ACTIVE", currentPeriodEnd: "2026-12-30T00:00:00.000Z" }, usage: { members: 12, branches: 1, staff: 3 } }
      return []
    })
  })

  it("shows plans to compare but offers no way to switch without paying", async () => {
    // "Choose plan" used to move the gym onto any plan for free.
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <PlatformBillingPage />
      </QueryClientProvider>,
    )
    expect(await screen.findByText("Business")).toBeTruthy()
    expect(screen.queryByRole("button", { name: /choose plan/i })).toBeNull()
    expect(screen.getByText("Current")).toBeTruthy()
    expect(screen.getByRole("link", { name: /talk to us/i })).toBeTruthy()
    expect(api.post).not.toHaveBeenCalled()
  })
})

import "@testing-library/jest-dom"
import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { RenewalsSection } from "./renewals-section"
import { WinbackSection } from "./winback-section"

const hooks = jest.requireActual("@/lib/hooks/use-analytics") as Record<string, unknown>

jest.mock("@/lib/hooks/use-analytics", () => ({
  ...(jest.requireActual("@/lib/hooks/use-analytics") as Record<string, unknown>),
  useRenewalPipeline: jest.fn(),
  useWinBack: jest.fn(),
}))

import { useRenewalPipeline, useWinBack } from "@/lib/hooks/use-analytics"

const mockedRenewals = useRenewalPipeline as jest.Mock
const mockedWinBack = useWinBack as jest.Mock
void hooks

function renderSections() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <RenewalsSection />
      <WinbackSection />
    </QueryClientProvider>,
  )
}

const renewalsFixture = {
  upcoming: [
    {
      membershipId: "ms1",
      memberId: "mem1",
      firstName: "Ravi",
      lastName: "K",
      planName: "Monthly",
      price: "5000.00",
      currency: "INR",
      endDate: new Date(Date.now() + 5 * 86400000).toISOString(),
      daysUntilExpiry: 5,
    },
  ],
  overdue: [
    {
      membershipId: "ms2",
      memberId: "mem2",
      firstName: "Asha",
      lastName: "D",
      planName: "Yearly",
      price: "48000.00",
      currency: "INR",
      endDate: new Date(Date.now() - 10 * 86400000).toISOString(),
      daysUntilExpiry: 0,
    },
  ],
  highValue: [],
  counts: { upcoming: 1, overdue: 1 },
}

const winbackFixture = {
  items: [
    {
      memberId: "mem9",
      firstName: "Ex",
      lastName: "Member",
      daysSinceExpiry: 60,
      lifetimePaid: "45000.00",
      currency: "INR",
      tenureDays: 210,
      lastVisitAt: null,
      priorPtPackages: 2,
      tier: "HIGH",
      reasons: ["Paid 45,000 INR over 210 days", "2 prior PT packages"],
    },
  ],
  counts: { high: 1, medium: 0, low: 0 },
}

describe("RenewalsSection", () => {
  it("shows upcoming, overdue and high-value renewals with actions", () => {
    mockedRenewals.mockReturnValue({ data: renewalsFixture, isLoading: false, isError: false, refetch: jest.fn() })
    mockedWinBack.mockReturnValue({ data: undefined, isLoading: false, isError: false, refetch: jest.fn() })
    renderSections()
    expect(screen.getByText("Renewals")).toBeInTheDocument()
    expect(screen.getByText("Ravi K")).toBeInTheDocument()
    expect(screen.getByText("Asha D")).toBeInTheDocument()
    expect(screen.getByText("5d")).toBeInTheDocument()
    expect(screen.getAllByText("Renew")).toHaveLength(1)
    expect(screen.getByText("Win back")).toBeInTheDocument()
  })

  it("shows an empty state when nothing is due", () => {
    mockedRenewals.mockReturnValue({
      data: { upcoming: [], overdue: [], highValue: [], counts: { upcoming: 0, overdue: 0 } },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    })
    mockedWinBack.mockReturnValue({ data: undefined, isLoading: false, isError: false, refetch: jest.fn() })
    renderSections()
    expect(screen.getByText("No renewals on the horizon")).toBeInTheDocument()
  })
})

describe("WinbackSection", () => {
  it("ranks win-back candidates with evidence and tiers", () => {
    mockedRenewals.mockReturnValue({ data: undefined, isLoading: false, isError: false, refetch: jest.fn() })
    mockedWinBack.mockReturnValue({ data: winbackFixture, isLoading: false, isError: false, refetch: jest.fn() })
    renderSections()
    expect(screen.getByText("Win-back")).toBeInTheDocument()
    expect(screen.getByText("Ex Member")).toBeInTheDocument()
    expect(screen.getByText("HIGH")).toBeInTheDocument()
    expect(screen.getByText(/Paid 45,000 INR over 210 days/)).toBeInTheDocument()
    expect(screen.getByText("Contact")).toBeInTheDocument()
  })

  it("shows an empty state when nobody lapsed", () => {
    mockedRenewals.mockReturnValue({ data: undefined, isLoading: false, isError: false, refetch: jest.fn() })
    mockedWinBack.mockReturnValue({
      data: { items: [], counts: { high: 0, medium: 0, low: 0 } },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    })
    renderSections()
    expect(screen.getByText("Nobody to win back")).toBeInTheDocument()
  })
})

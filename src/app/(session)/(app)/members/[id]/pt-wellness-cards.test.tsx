import "@testing-library/jest-dom"
import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { PtAdherenceStrip, PtWalletCard } from "./pt-wellness-cards"

jest.mock("@/lib/hooks/use-pt-packages", () => ({
  usePtPackages: jest.fn(),
  usePtWallet: jest.fn(),
}))
jest.mock("@/lib/hooks/use-analytics", () => ({
  usePtAdherence: jest.fn(),
}))

import { usePtPackages, usePtWallet } from "@/lib/hooks/use-pt-packages"
import { usePtAdherence } from "@/lib/hooks/use-analytics"

const mockedPackages = usePtPackages as jest.Mock
const mockedWallet = usePtWallet as jest.Mock
const mockedAdherence = usePtAdherence as jest.Mock

function renderCards() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <PtWalletCard memberId="mem-1" />
      <PtAdherenceStrip memberId="mem-1" />
    </QueryClientProvider>,
  )
}

const walletFixture = {
  package: { id: "pkg-1", name: "PT-24", endDate: new Date(Date.now() + 18 * 86400000).toISOString() },
  totals: { total: 24, used: 16, remaining: 8, scheduled: 2, completed: 9, cancelled: 1, noShow: 1 },
  ledger: [],
}

describe("PtWalletCard", () => {
  it("shows remaining, counts and expiry from the ledger-backed wallet", () => {
    mockedPackages.mockReturnValue({
      data: [{ id: "pkg-1", status: "ACTIVE", name: "PT-24", endDate: walletFixture.package.endDate }],
      isLoading: false,
      isError: false,
    })
    mockedWallet.mockReturnValue({ data: walletFixture, isLoading: false, isError: false })
    mockedAdherence.mockReturnValue({ data: undefined, isLoading: false, isError: false })
    renderCards()
    expect(screen.getByLabelText("Session wallet")).toBeInTheDocument()
    expect(screen.getByText("PT-24")).toBeInTheDocument()
    expect(screen.getByText((_, el) => el?.tagName === "P" && (el?.textContent ?? "").includes("8 / 24 left"))).toBeInTheDocument()
    expect(screen.getByText(/Expires in/)).toBeInTheDocument()
  })

  it("renders nothing without a package", () => {
    mockedPackages.mockReturnValue({ data: [], isLoading: false, isError: false })
    mockedWallet.mockReturnValue({ data: undefined, isLoading: false, isError: false })
    mockedAdherence.mockReturnValue({ data: undefined, isLoading: false, isError: false })
    renderCards()
    expect(screen.queryByLabelText("Session wallet")).not.toBeInTheDocument()
  })
})

describe("PtAdherenceStrip", () => {
  it("shows the ring, counts and streak", () => {
    mockedPackages.mockReturnValue({ data: [], isLoading: false, isError: false })
    mockedWallet.mockReturnValue({ data: undefined, isLoading: false, isError: false })
    mockedAdherence.mockReturnValue({
      data: {
        memberId: "mem-1",
        windowDays: 30,
        ptAdherencePct: 86,
        workoutsCompleted30d: 4,
        visits30d: 6,
        weeklyStreak: 3,
        insufficientData: false,
      },
      isLoading: false,
      isError: false,
    })
    renderCards()
    expect(screen.getByLabelText("Program adherence")).toBeInTheDocument()
    expect(screen.getByText((_, el) => el?.tagName === "P" && (el?.textContent ?? "").includes("86%"))).toBeInTheDocument()
    expect(screen.getByText(/3-week streak/)).toBeInTheDocument()
  })

  it("says insufficient data instead of a noisy percentage", () => {
    mockedPackages.mockReturnValue({ data: [], isLoading: false, isError: false })
    mockedWallet.mockReturnValue({ data: undefined, isLoading: false, isError: false })
    mockedAdherence.mockReturnValue({
      data: {
        memberId: "mem-1",
        windowDays: 30,
        ptAdherencePct: null,
        workoutsCompleted30d: 0,
        visits30d: 0,
        weeklyStreak: 0,
        insufficientData: true,
      },
      isLoading: false,
      isError: false,
    })
    renderCards()
    expect(screen.getByText(/Not enough training history/)).toBeInTheDocument()
    expect(screen.queryByLabelText("Program adherence")).not.toBeInTheDocument()
  })
})

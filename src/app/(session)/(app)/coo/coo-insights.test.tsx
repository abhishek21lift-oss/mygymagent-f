import "@testing-library/jest-dom"
import * as React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import {
  EffectivenessStrip,
  ForecastScenario,
  TrendsStrip,
} from "./coo-insights"

const noop = () => undefined

describe("TrendsStrip", () => {
  const trends = [
    {
      metric: "revenue",
      label: "Net revenue (INR)",
      current: 99000,
      previous: 90000,
      deltaPct: 10,
      direction: "up",
      currency: "INR",
      insufficientData: false,
    },
    {
      metric: "risk",
      label: "Average member risk score",
      current: 45,
      previous: 40,
      deltaPct: null,
      direction: "up",
      currency: null,
      insufficientData: false,
    },
  ] as const

  it("shows direction, deltas and ask-links with context", () => {
    render(<TrendsStrip trends={[...trends]} isLoading={false} isError={false} onRetry={noop} />)
    expect(screen.getByText("Net revenue (INR)")).toBeInTheDocument()
    expect(screen.getByText(/\+10%/)).toBeInTheDocument()
    const ask = screen.getAllByText("Ask about this")[0].closest("a")
    expect(ask?.getAttribute("href")).toMatch(/^\/ai\?q=/)
  })

  it("says insufficient instead of a trend off thin history", () => {
    render(<TrendsStrip trends={[]} isLoading={false} isError={false} onRetry={noop} />)
    expect(screen.getByText(/Not enough history yet/)).toBeInTheDocument()
  })
})

describe("ForecastScenario", () => {
  const forecast = {
    revenueNextMonth: {
      low: "80000.00",
      high: "100000.00",
      point: "90000.00",
      currency: "INR",
      basedOnMonths: 4,
      confidence: "moderate",
      method: "Moving average with min-max band over complete calendar months",
    },
    insufficientData: false,
    computedAt: new Date().toISOString(),
  } as const
  const renewals = {
    upcoming: [
      { membershipId: "a", memberId: "m1", firstName: "R", lastName: "K", planName: "M", price: "10000.00", currency: "INR", endDate: "", daysUntilExpiry: 5 },
      { membershipId: "b", memberId: "m2", firstName: "S", lastName: "P", planName: "M", price: "10000.00", currency: "INR", endDate: "", daysUntilExpiry: 6 },
    ],
    overdue: [],
    highValue: [],
    counts: { upcoming: 2, overdue: 0 },
  }

  it("labels the estimate and keeps scenarios hypothetical", () => {
    render(
      <ForecastScenario
        forecast={{ ...forecast }}
        isLoading={false}
        isError={false}
        onRetry={noop}
        renewals={renewals}
        renewalsLoading={false}
      />,
    )
    expect(screen.getByText(/Estimate · moderate confidence/)).toBeInTheDocument()
    expect(screen.getByText(/based on 4 months/)).toBeInTheDocument()
    // 2 upcoming × 10% = 0.2 renewals × ₹10,000 avg = ₹2,000 hypothetical.
    expect(screen.getByText(/2,000/)).toBeInTheDocument()
    expect(screen.getByText(/Hypothetical/)).toBeInTheDocument()
    expect(screen.getByText(/Not a forecast/)).toBeInTheDocument()
  })

  it("changes the math transparently with the uplift input", () => {
    render(
      <ForecastScenario
        forecast={{ ...forecast }}
        isLoading={false}
        isError={false}
        onRetry={noop}
        renewals={renewals}
        renewalsLoading={false}
      />,
    )
    fireEvent.change(screen.getByLabelText(/Improve renewals by/), { target: { value: "50" } })
    // 2 × 50% = 1.0 × ₹10,000 = ₹10,000.
    expect(screen.getByText(/10,000/)).toBeInTheDocument()
  })

  it("declines the forecast honestly under 3 months", () => {
    render(
      <ForecastScenario
        forecast={{ revenueNextMonth: null, insufficientData: true, computedAt: "" }}
        isLoading={false}
        isError={false}
        onRetry={noop}
        renewals={undefined}
        renewalsLoading={false}
      />,
    )
    expect(screen.getByText(/Insufficient data/)).toBeInTheDocument()
  })
})

describe("EffectivenessStrip", () => {
  it("shows rates and separates AI metrics from business KPIs", () => {
    render(
      <EffectivenessStrip
        effectiveness={{
          total: 15,
          pending: 5,
          approved: 0,
          executed: 8,
          rejected: 2,
          failed: 0,
          acceptanceRate: 80,
          executionRate: 100,
        }}
        isLoading={false}
        isError={false}
      />,
    )
    expect(screen.getByText("80%")).toBeInTheDocument()
    expect(screen.getByText(/Associated outcomes only/)).toBeInTheDocument()
  })

  it("says insufficient instead of 0% with no decided actions", () => {
    render(
      <EffectivenessStrip
        effectiveness={{
          total: 0,
          pending: 0,
          approved: 0,
          executed: 0,
          rejected: 0,
          failed: 0,
          acceptanceRate: null,
          executionRate: null,
        }}
        isLoading={false}
        isError={false}
      />,
    )
    expect(screen.getAllByText("insufficient data")).toHaveLength(2)
  })
})

import "@testing-library/jest-dom"
import * as React from "react"
import { render, screen } from "@testing-library/react"
import {
  CapacityBoard,
  ConflictsList,
  OperationsHealthPanels,
  OperationsHero,
} from "./operations-sections"

const noop = () => undefined

const healthFixture = {
  score: 86,
  status: "healthy" as const,
  opportunity: "scheduling",
  components: [
    { key: "classes", label: "Classes", score: 92, weight: 30, value: "92% avg fill · 4 sessions", explanation: "Mean booked-over-capacity across the next 7 days.", source: "GET /analytics/classes/capacity" },
    { key: "scheduling", label: "Scheduling", score: 55, weight: 25, value: "2 double-bookings", explanation: "Instructor overlaps.", source: "GET /analytics/scheduling/conflicts" },
    { key: "attendance", label: "Attendance", score: null, weight: 20, value: "No check-ins yet", explanation: "Nobody yet.", source: "Gate log" },
    { key: "tasks", label: "Tasks", score: null, weight: 0, value: "No data model", explanation: "Gap.", source: "Missing" },
  ],
  staffAway: [{ name: "Asha K", type: "Sick leave" }],
  branchId: null,
  computedAt: new Date().toISOString(),
}

describe("OperationsHero", () => {
  it("shows score, status and the top issue", () => {
    render(
      <OperationsHero health={healthFixture} isLoading={false} isError={false} onRetry={noop} />,
    )
    expect(screen.getByRole("heading", { name: "Operations" })).toBeInTheDocument()
    expect(
      screen.getByRole("img", { name: "Operations health 86 out of 100, Healthy" }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Scheduling: 2 double-bookings/)).toBeInTheDocument()
    expect(screen.getByText("View schedule")).toBeInTheDocument()
  })

  it("shows unknown instead of a fake score", () => {
    render(
      <OperationsHero
        health={{ ...healthFixture, score: null, status: "unknown" }}
        isLoading={false}
        isError={false}
        onRetry={noop}
      />,
    )
    expect(screen.getByText(/Not enough operational data yet/)).toBeInTheDocument()
  })
})

describe("OperationsHealthPanels", () => {
  it("explains every dimension and lists staff away", () => {
    render(
      <OperationsHealthPanels health={healthFixture} isLoading={false} isError={false} onRetry={noop} />,
    )
    expect(screen.getByText("Why this score")).toBeInTheDocument()
    expect(screen.getByText(/Mean booked-over-capacity/)).toBeInTheDocument()
    expect(screen.getByText("Asha K")).toBeInTheDocument()
  })
})

describe("CapacityBoard", () => {
  const capacity = {
    upcoming: [
      {
        sessionId: "s1",
        programName: "Yoga",
        startTime: new Date().toISOString(),
        capacity: 20,
        booked: 20,
        waitlisted: 3,
        utilizationPct: 100,
        band: "OVERBOOKED_RISK" as const,
      },
    ],
    demand: [
      { programId: "p1", programName: "Yoga", avgUtilizationPct: 70, sessionsCount: 12 },
    ],
  }

  it("shows bands, counts and demand", () => {
    render(
      <CapacityBoard capacity={capacity} isLoading={false} isError={false} onRetry={noop} />,
    )
    expect(screen.getAllByText("Yoga")).toHaveLength(2)
    expect(screen.getByText("OVERBOOKED RISK")).toBeInTheDocument()
    expect(screen.getByText(/20 \/ 20/)).toBeInTheDocument()
    expect(screen.getByText(/3 waiting/)).toBeInTheDocument()
    expect(screen.getByText(/70% avg/)).toBeInTheDocument()
  })

  it("handles no sessions honestly", () => {
    render(
      <CapacityBoard capacity={{ upcoming: [], demand: [] }} isLoading={false} isError={false} onRetry={noop} />,
    )
    expect(screen.getByText(/No sessions scheduled/)).toBeInTheDocument()
  })
})

describe("ConflictsList", () => {
  it("names the instructor and both overlapping items", () => {
    render(
      <ConflictsList
        conflicts={[
          {
            type: "INSTRUCTOR_DOUBLE_BOOKING",
            userId: "u1",
            name: "T R",
            items: [
              { kind: "CLASS", id: "c1", title: "Yoga", startTime: new Date().toISOString(), endTime: new Date().toISOString() },
              { kind: "PT", id: "pt1", title: "PT session", startTime: new Date().toISOString(), endTime: new Date().toISOString() },
            ],
          },
        ]}
        isLoading={false}
        isError={false}
        onRetry={noop}
      />,
    )
    expect(screen.getByText("T R is double-booked")).toBeInTheDocument()
    expect(screen.getByText("Open schedule")).toBeInTheDocument()
  })

  it("says so when the week is clean", () => {
    render(
      <ConflictsList conflicts={[]} isLoading={false} isError={false} onRetry={noop} />,
    )
    expect(screen.getByText(/No double-bookings/)).toBeInTheDocument()
  })
})

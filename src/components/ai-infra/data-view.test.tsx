import "@testing-library/jest-dom"
import * as React from "react"
import { render, screen } from "@testing-library/react"

import { DataView, humanize, toneOf } from "./data-view"

describe("DataView", () => {
  it("renders an object as labelled tiles, not JSON", () => {
    render(<DataView value={{ totalRequests: 1240, successRate: "ok", lastError: null }} />)
    expect(screen.getByText("Total requests")).toBeInTheDocument()
    expect(screen.getByText("1,240")).toBeInTheDocument()
    expect(screen.getByText("Not reported")).toBeInTheDocument()
  })

  it("renders a list of records as a table with readable headers", () => {
    render(
      <DataView
        value={[
          { platform: "openai", status: "rate_limited", requests: 4 },
          { platform: "groq", status: "ok", requests: 9 },
        ]}
      />,
    )
    expect(screen.getAllByText("Platform").length).toBeGreaterThan(0)
    expect(screen.getAllByText("rate_limited").length).toBeGreaterThan(0)
  })

  it("keeps the raw response folded away", () => {
    render(<DataView value={{ a: 1 }} />)
    expect(screen.getByText("Raw response").closest("details")).not.toHaveAttribute("open")
  })
})

describe("helpers", () => {
  it("humanizes camel and snake case", () => {
    expect(humanize("rateLimitedUntil")).toBe("Rate limited until")
    expect(humanize("token_hash")).toBe("Token hash")
  })

  it("maps status words to tones", () => {
    expect(toneOf("healthy")).toBe("success")
    expect(toneOf("rate_limited")).toBe("warning")
    expect(toneOf("unavailable")).toBe("danger")
    expect(toneOf("gpt-4o")).toBeNull()
  })
})

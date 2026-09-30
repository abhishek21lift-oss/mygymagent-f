import { render, screen } from "@testing-library/react"
import { Phone } from "lucide-react"

import { QuickAction, TermRing } from "./member-profile-parts"

describe("QuickAction", () => {
  it("is a real link when there is somewhere to go", () => {
    render(<QuickAction accent="emerald" icon={Phone} label="Call" href="tel:+15550100001" />)
    expect(screen.getByRole("link", { name: "Call" }).getAttribute("href")).toBe("tel:+15550100001")
  })

  it("stays in the row but cannot be activated when the member has no number", () => {
    render(<QuickAction accent="emerald" icon={Phone} label="Call" disabled disabledReason="no phone number" />)
    const action = screen.getByRole("link", { name: "Call (no phone number)" })
    expect(action.getAttribute("aria-disabled")).toBe("true")
    expect(action.hasAttribute("href")).toBe(false)
    expect(action.tagName).toBe("SPAN")
  })
})

describe("TermRing", () => {
  it("says how many days are left, singular for one", () => {
    const { rerender } = render(<TermRing accent="emerald" remaining={0.5} daysLeft={15} />)
    expect(screen.getByText("15")).toBeTruthy()
    expect(screen.getByText("days left")).toBeTruthy()
    rerender(<TermRing accent="amber" remaining={0.03} daysLeft={1} />)
    expect(screen.getByText("day left")).toBeTruthy()
  })
})

import * as React from "react"
import { render, screen } from "@testing-library/react"
import { MfaGraceBanner } from "./mfa-grace-banner"
import { useAuth } from "@/lib/auth/auth-context"

jest.mock("@/lib/auth/auth-context", () => ({ useAuth: jest.fn() }))
const mockPathname = jest.fn<string, []>()
jest.mock("next/navigation", () => ({ usePathname: () => mockPathname() }))

const mockUseAuth = useAuth as unknown as jest.Mock

function withState(
  state: string | null,
  deadline: string | null = "2026-10-07T00:00:00.000Z",
) {
  mockUseAuth.mockReturnValue({
    mfaEnrolment: state === null ? null : { state, deadline },
  })
}

describe("MfaGraceBanner", () => {
  beforeEach(() => mockPathname.mockReturnValue("/dashboard"))

  it("warns with the deadline while the organization is in its grace period", () => {
    withState("GRACE")
    render(<MfaGraceBanner />)
    const banner = screen.getByRole("status")
    expect(banner.textContent).toMatch(
      /Two-step verification is required for your role/i,
    )
    // The date is the whole point of the banner.
    expect(banner.textContent).toMatch(/October 7, 2026/)
    expect(
      screen.getByRole("link", { name: /set it up/i }).getAttribute("href"),
    ).toBe("/settings/security")
  })

  it("stays silent when nothing is required", () => {
    withState("NOT_REQUIRED")
    const { container } = render(<MfaGraceBanner />)
    expect(container.firstChild).toBeNull()
  })

  it("stays silent once enforcement has begun", () => {
    // At that point the layout has already replaced the whole app with the
    // enrolment gate; a banner as well would be noise.
    withState("ENFORCED", null)
    const { container } = render(<MfaGraceBanner />)
    expect(container.firstChild).toBeNull()
  })

  it("stays silent before /auth/me has answered", () => {
    withState(null)
    const { container } = render(<MfaGraceBanner />)
    expect(container.firstChild).toBeNull()
  })

  it("does not nag on the page that fixes it", () => {
    withState("GRACE")
    mockPathname.mockReturnValue("/settings/security")
    const { container } = render(<MfaGraceBanner />)
    expect(container.firstChild).toBeNull()
  })

  it("still warns when no deadline is set", () => {
    withState("GRACE", null)
    render(<MfaGraceBanner />)
    expect(screen.getByRole("status").textContent).toMatch(/keep full access/i)
  })
})

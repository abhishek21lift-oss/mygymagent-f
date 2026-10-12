import "@testing-library/jest-dom"
import * as React from "react"
import { render, screen } from "@testing-library/react"
import { WhatsAppShellNav } from "./layout"
import { useAuth } from "@/lib/auth/auth-context"

jest.mock("@/lib/auth/auth-context", () => ({
  useAuth: jest.fn(),
}))

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/whatsapp"),
}))

const mockUseAuth = useAuth as jest.Mock

describe("WhatsAppShellNav", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: { id: "u1" },
      hasPermission: () => true,
    })
  })

  it("links every entry at a real destination", () => {
    render(<WhatsAppShellNav />)

    for (const href of [
      "/whatsapp",
      "/settings/whatsapp",
      "/inbox",
      "/broadcasts",
      "/whatsapp#contacts",
      "/settings/whatsapp#auto-replies",
      "/settings/whatsapp#bot-automation",
      "/settings/whatsapp#webhooks",
      "/settings/messages",
    ]) {
      expect(document.querySelector(`a[href="${href}"]`)).not.toBeNull()
    }
  })

  it("marks the dashboard entry active", () => {
    render(<WhatsAppShellNav />)

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    )
  })

  it("hides entries without permission", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "u1" },
      hasPermission: () => false,
    })

    render(<WhatsAppShellNav />)

    expect(screen.queryByRole("navigation")).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Dashboard" })).not.toBeInTheDocument()
  })
})

import "@testing-library/jest-dom"
import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { TextEncoder } from "util"

import { EntryAccessCard } from "./entry-access-card"

// jsdom has no TextEncoder, which the QR encoder needs.
Object.assign(globalThis, { TextEncoder })

jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }))

let mockPermissions: string[] = []
jest.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({
    hasPermission: (key: string | string[]) => (Array.isArray(key) ? key : [key]).some((k) => mockPermissions.includes(k)),
  }),
}))

const mockGet = jest.fn()
const mockPost = jest.fn()
jest.mock("@/lib/api/client", () => ({
  api: {
    get: (path: string, options?: unknown) => mockGet(path, options),
    post: (path: string, body?: unknown) => mockPost(path, body),
  },
  ApiError: class ApiError extends Error {},
}))

const MEMBER = "member-1"
const CURRENT = "a".repeat(64)
const ROTATED = "b".repeat(64)

function renderCard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <EntryAccessCard memberId={MEMBER} memberName="Ravi Kumar" branchId="branch-1" />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  mockGet.mockReset()
  mockPost.mockReset()
  mockPermissions = ["attendance.read", "attendance.create"]
  mockGet.mockImplementation(async (path: string) => {
    if (path === `/attendance/qr-token/${MEMBER}`) return { token: CURRENT, rotatesAt: "2026-11-07T10:00:00.000Z" }
    if (path === "/attendance/enrolments") return []
    throw new Error(`unexpected GET ${path}`)
  })
  mockPost.mockImplementation(async (path: string) => {
    if (path === `/attendance/qr-token/${MEMBER}/rotate`) return { token: ROTATED, rotatesAt: "2026-12-07T10:00:00.000Z" }
    throw new Error(`unexpected POST ${path}`)
  })
})

describe("Entry access card", () => {
  it("shows the member's current code as a QR, with a plain date", async () => {
    renderCard()
    expect(await screen.findByRole("img", { name: "Entry QR code for Ravi Kumar" })).toBeInTheDocument()
    expect(screen.getByText(/Valid till 7 Nov 2026/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Download/ })).toBeInTheDocument()
    // Reading the code never rotates it.
    expect(mockPost).not.toHaveBeenCalled()
  })

  it("rotates only after the change is confirmed", async () => {
    renderCard()
    await screen.findByRole("img", { name: "Entry QR code for Ravi Kumar" })
    fireEvent.click(screen.getByRole("button", { name: "Rotate" }))
    expect(mockPost).not.toHaveBeenCalled()
    expect(screen.getByText(/stops working straight away/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Rotate code" }))
    await waitFor(() => expect(mockPost).toHaveBeenCalledWith(`/attendance/qr-token/${MEMBER}/rotate`, undefined))
    expect(await screen.findByText(/Valid till 7 Dec 2026/)).toBeInTheDocument()
  })

  it("does not ask for the code for a role that cannot check people in", async () => {
    mockPermissions = ["attendance.read"]
    renderCard()
    expect(await screen.findByText(/Only roles that check members in/)).toBeInTheDocument()
    expect(mockGet).not.toHaveBeenCalledWith(`/attendance/qr-token/${MEMBER}`, undefined)
    expect(screen.queryByRole("button", { name: "Rotate" })).not.toBeInTheDocument()
  })
})

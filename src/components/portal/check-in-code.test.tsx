import "@testing-library/jest-dom"
import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { TextEncoder } from "util"

import { CheckInCode } from "./check-in-code"

// jsdom has no TextEncoder, which the QR encoder needs.
Object.assign(globalThis, { TextEncoder })

jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }))

const mockGet = jest.fn()
const mockPost = jest.fn()
jest.mock("@/lib/api/client", () => ({
  api: {
    get: (path: string) => mockGet(path),
    post: (path: string) => mockPost(path),
  },
}))

function renderPass() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <CheckInCode />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  mockGet.mockReset()
  mockPost.mockReset()
  mockGet.mockResolvedValue({ token: "a".repeat(64), rotatesAt: "2026-11-07T10:00:00.000Z" })
  mockPost.mockResolvedValue({ token: "b".repeat(64), rotatesAt: "2026-12-07T10:00:00.000Z" })
})

describe("Portal check-in pass", () => {
  it("shows the member's code straight away, without replacing it", async () => {
    renderPass()
    expect(await screen.findByRole("img", { name: "Your check-in QR code" })).toBeInTheDocument()
    expect(mockGet).toHaveBeenCalledWith("/portal/check-in-code")
    expect(mockPost).not.toHaveBeenCalled()
    expect(screen.getByText("Valid till 7 Nov 2026")).toBeInTheDocument()
  })

  it("replaces the code only when the member confirms", async () => {
    renderPass()
    await screen.findByRole("img", { name: "Your check-in QR code" })
    fireEvent.click(screen.getByRole("button", { name: "Get a new code" }))
    expect(mockPost).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole("button", { name: "Replace code" }))
    await waitFor(() => expect(mockPost).toHaveBeenCalledWith("/portal/check-in-code"))
    expect(await screen.findByText("Valid till 7 Dec 2026")).toBeInTheDocument()
  })
})

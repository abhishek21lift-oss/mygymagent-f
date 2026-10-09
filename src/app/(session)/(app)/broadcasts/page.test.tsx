import "@testing-library/jest-dom"
import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import BroadcastsPage from "./page"

jest.mock("next/navigation", () => ({ usePathname: () => "/broadcasts" }))
jest.mock("@/lib/auth/auth-context", () => ({ useAuth: () => ({ hasPermission: () => true }) }))
jest.mock("@/lib/api/client", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
  ApiError: class ApiError extends Error {},
}))
jest.mock("@/lib/hooks/use-member-intelligence", () => ({
  useSegments: () => ({ data: [], isPending: false }),
}))

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return { Wrapper }
}

describe("BroadcastsPage", () => {
  it("shows the composer gated behind whatsapp.manage", () => {
    const { Wrapper } = wrapper()
    render(<BroadcastsPage />, { wrapper: Wrapper })
    expect(screen.getByText("New broadcast")).toBeInTheDocument()
    expect(screen.getByLabelText(/segment/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument()
  })

  it("shows DONE broadcasts at 100%", async () => {
    const { api } = jest.requireMock("@/lib/api/client") as { api: { get: jest.Mock } }
    api.get.mockImplementation((path: string) =>
      path === "/whatsapp/broadcasts"
        ? Promise.resolve([
            {
              id: "b1",
              segmentId: "s1",
              body: "Hi",
              mediaFileId: null,
              sendAt: null,
              status: "DONE",
              total: 2,
              queued: 2,
              sent: 2,
              failed: 0,
              skipped: 0,
              createdAt: "2026-10-08T10:00:00Z",
            },
          ])
        : Promise.resolve(null),
    )
    const { Wrapper } = wrapper()
    const { unmount } = render(<BroadcastsPage />, { wrapper: Wrapper })
    expect(await screen.findByText(/2\/2 sent/)).toBeInTheDocument()
    unmount()
  })
})

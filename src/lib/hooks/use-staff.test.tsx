import * as React from "react"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import { useStaff } from "@/lib/hooks/use-staff"

jest.mock("@/lib/api/client", () => {
  const actual = jest.requireActual("@/lib/api/client")
  return { ...actual, api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() } }
})

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return { client, Wrapper }
}

/**
 * A trainer holds no `users.read`, so the PT sessions page fetched
 * `/users` for a 403 and painted an empty trainer picker. The hook now
 * takes the same `{ enabled }` option as `useBranches`, so a caller who
 * can never read staff keeps the request from firing at all.
 */
describe("useStaff", () => {
  it("does not fetch /users when disabled", async () => {
    const { Wrapper } = wrapper()
    const { result } = renderHook(() => useStaff({ page: 1 }, { enabled: false }), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"))
    expect(api.get).not.toHaveBeenCalled()
  })

  it("fetches /users by default", async () => {
    ;(api.get as jest.Mock).mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 })
    const { Wrapper } = wrapper()
    const { result } = renderHook(() => useStaff(), { wrapper: Wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith("/users", { query: {} })
  })
})

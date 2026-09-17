import * as React from "react"
import { act, render, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { api, ApiError } from "@/lib/api/client"
import { AuthProvider, useAuth } from "@/lib/auth/auth-context"

jest.mock("@/lib/api/client", () => {
  const actual = jest.requireActual("@/lib/api/client")
  return {
    ...actual,
    api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
  }
})

const mockGet = api.get as jest.Mock
const mockPost = api.post as jest.Mock

type Ctx = ReturnType<typeof useAuth>

function Probe({ onRender }: { onRender: (value: Ctx) => void }) {
  const value = useAuth()
  onRender(value)
  return null
}

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  let latest: Ctx | null = null
  render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <Probe onRender={(value) => { latest = value }} />
      </AuthProvider>
    </QueryClientProvider>,
  )
  return { latest: () => latest as Ctx }
}

const userA = {
  id: "user-a",
  organizationId: "org-a",
  email: "a@example.com",
  firstName: "Ada",
  lastName: "A",
  status: "ACTIVE",
  primaryBranchId: null,
  emailVerified: true,
}

const userB = {
  id: "user-b",
  organizationId: "org-b",
  email: "b@example.com",
  firstName: "Bea",
  lastName: "B",
  status: "ACTIVE",
  primaryBranchId: null,
  emailVerified: true,
}

describe("AuthProvider session handling", () => {
  it("discards a stale /auth/me response after an account switch", async () => {
    let resolveBootstrap!: (value: unknown) => void
    mockGet.mockImplementationOnce(
      () => new Promise((resolve) => { resolveBootstrap = resolve }),
    )
    const ctx = setup()

    // Log in as B while the bootstrap /auth/me for the previous (empty)
    // session is still in flight.
    mockPost.mockResolvedValueOnce({ accessToken: "tok-b", user: userB })
    mockGet.mockImplementationOnce(async () => ({ user: userB, permissions: ["members.read"] }))
    await act(async () => {
      await ctx.latest().login({ email: "b@example.com", password: "password123" })
    })
    // Let login's follow-up loadMe settle.
    await act(async () => {})

    // The stale bootstrap response arrives late with A's data.
    await act(async () => {
      resolveBootstrap({ user: userA, permissions: [] })
    })

    await waitFor(() => expect(ctx.latest().user?.id).toBe("user-b"))
    expect(ctx.latest().permissions).toEqual(["members.read"])
  })

  it("clears a dead session on 401 instead of staying authenticated", async () => {
    mockGet.mockRejectedValueOnce(
      new ApiError(401, { error: { code: "UNAUTHORIZED", message: "gone" } }),
    )
    const ctx = setup()

    await waitFor(() => expect(ctx.latest().isLoading).toBe(false))
    expect(ctx.latest().user).toBeNull()
    expect(ctx.latest().isAuthenticated).toBe(false)
  })
})

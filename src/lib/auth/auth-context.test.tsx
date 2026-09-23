import * as React from "react"
import { act, render, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { api, ApiError } from "@/lib/api/client"
import { getAccessToken } from "@/lib/api/token-store"
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

describe("AuthProvider MFA login", () => {
 beforeEach(() => {
 // Every case below starts from a settled, logged-out bootstrap.
 mockGet.mockRejectedValueOnce(
 new ApiError(401, { error: { code: "UNAUTHORIZED", message: "no session" } }),
 )
 })

 it("establishes no session when the password is right but a second factor is owed", async () => {
 const ctx = setup()
 await waitFor(() => expect(ctx.latest().isLoading).toBe(false))

 mockPost.mockResolvedValueOnce({
 mfaRequired: true,
 mfaToken: "challenge-token",
 expiresIn: 300,
 })

 let result: Awaited<ReturnType<Ctx["login"]>> | undefined
 await act(async () => {
 result = await ctx.latest().login({ email: "a@example.com", password: "password123" })
 })

 expect(result).toEqual({
 mfaRequired: true,
 mfaToken: "challenge-token",
 expiresIn: 300,
 })
 // The important half: a correct password alone buys nothing.
 expect(ctx.latest().user).toBeNull()
 expect(ctx.latest().isAuthenticated).toBe(false)
 expect(getAccessToken()).toBeNull()
 // /auth/me must not have been called off the back of a half-login.
 expect(mockGet).toHaveBeenCalledTimes(1)
 })

 it("adopts the session once the challenge is answered", async () => {
 const ctx = setup()
 await waitFor(() => expect(ctx.latest().isLoading).toBe(false))

 mockPost.mockResolvedValueOnce({
 mfaRequired: true,
 mfaToken: "challenge-token",
 expiresIn: 300,
 })
 await act(async () => {
 await ctx.latest().login({ email: "a@example.com", password: "password123" })
 })

 mockPost.mockResolvedValueOnce({ accessToken: "tok-a", user: userA })
 mockGet.mockImplementationOnce(async () => ({ user: userA, permissions: ["members.read"] }))
 await act(async () => {
 await ctx.latest().completeMfaLogin("challenge-token", "123456")
 })
 await act(async () => {})

 expect(mockPost).toHaveBeenLastCalledWith("/auth/mfa/verify", {
 mfaToken: "challenge-token",
 code: "123456",
 })
 await waitFor(() => expect(ctx.latest().user?.id).toBe("user-a"))
 expect(getAccessToken()).toBe("tok-a")
 expect(ctx.latest().permissions).toEqual(["members.read"])
 })

 it("leaves the user signed out when the code is rejected", async () => {
 const ctx = setup()
 await waitFor(() => expect(ctx.latest().isLoading).toBe(false))

 mockPost.mockResolvedValueOnce({
 mfaRequired: true,
 mfaToken: "challenge-token",
 expiresIn: 300,
 })
 await act(async () => {
 await ctx.latest().login({ email: "a@example.com", password: "password123" })
 })

 mockPost.mockRejectedValueOnce(
 new ApiError(401, { error: { code: "UNAUTHORIZED", message: "Invalid code" } }),
 )
 await act(async () => {
 await expect(
 ctx.latest().completeMfaLogin("challenge-token", "000000"),
 ).rejects.toBeInstanceOf(ApiError)
 })

 expect(ctx.latest().user).toBeNull()
 expect(getAccessToken()).toBeNull()
 })

 it("still signs straight in for a user with no second factor", async () => {
 const ctx = setup()
 await waitFor(() => expect(ctx.latest().isLoading).toBe(false))

 mockPost.mockResolvedValueOnce({ mfaRequired: false, accessToken: "tok-a", user: userA })
 mockGet.mockImplementationOnce(async () => ({ user: userA, permissions: [] }))
 await act(async () => {
 const result = await ctx.latest().login({ email: "a@example.com", password: "password123" })
 expect(result.mfaRequired).toBe(false)
 })
 await act(async () => {})

 await waitFor(() => expect(ctx.latest().user?.id).toBe("user-a"))
 expect(getAccessToken()).toBe("tok-a")
 })
})

describe("AuthProvider MFA policy state", () => {
 it("takes the enforced state straight from the login response", async () => {
 mockGet.mockRejectedValueOnce(
 new ApiError(401, { error: { code: "UNAUTHORIZED", message: "no session" } }),
 )
 const ctx = setup()
 await waitFor(() => expect(ctx.latest().isLoading).toBe(false))

 mockPost.mockResolvedValueOnce({
 mfaRequired: false,
 accessToken: "tok-a",
 user: userA,
 mfaEnrolment: { state: "ENFORCED", deadline: null },
 })
 // The follow-up /auth/me agrees; the point of reading it from the login
 // response is that the gate engages without waiting for this.
 mockGet.mockImplementationOnce(async () => ({
 user: userA,
 permissions: [],
 mfaEnrolment: { state: "ENFORCED", deadline: null },
 }))
 await act(async () => {
 await ctx.latest().login({ email: "a@example.com", password: "password123" })
 })

 expect(ctx.latest().mfaEnrolment).toEqual({
 state: "ENFORCED",
 deadline: null,
 })
 })

 it("carries the grace deadline through /auth/me, so a reload keeps it", async () => {
 const deadline = "2026-10-07T00:00:00.000Z"
 mockGet.mockImplementationOnce(async () => ({
 user: userA,
 permissions: ["members.read"],
 mfaEnrolment: { state: "GRACE", deadline },
 }))
 const ctx = setup()

 await waitFor(() => expect(ctx.latest().user?.id).toBe("user-a"))
 expect(ctx.latest().mfaEnrolment).toEqual({ state: "GRACE", deadline })
 })

 it("clears the enrolment state on logout", async () => {
 mockGet.mockImplementationOnce(async () => ({
 user: userA,
 permissions: [],
 mfaEnrolment: { state: "GRACE", deadline: "2026-10-07T00:00:00.000Z" },
 }))
 const ctx = setup()
 await waitFor(() => expect(ctx.latest().mfaEnrolment?.state).toBe("GRACE"))

 mockPost.mockResolvedValueOnce(undefined)
 await act(async () => {
 await ctx.latest().logout()
 })

 // Left behind, it would gate or nag the next account to sign in here.
 expect(ctx.latest().mfaEnrolment).toBeNull()
 })
})

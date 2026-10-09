import * as React from "react"
import { renderHook } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { api, ApiError } from "@/lib/api/client"
import { useAddMember, type AddMemberInput } from "@/lib/hooks/use-add-member"

jest.mock("@/lib/api/client", () => {
  const actual = jest.requireActual("@/lib/api/client")
  return { ...actual, api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() } }
})

const post = api.post as jest.Mock
const patch = api.patch as jest.Mock

function render() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return renderHook(() => useAddMember(), { wrapper: Wrapper }).result
}

const BASE: AddMemberInput = {
  primaryBranchId: "b1",
  firstName: "Rahul",
  lastName: "Sharma",
  phone: "9876543210",
  waiverConsent: true,
}

beforeEach(() => {
  post.mockReset()
  patch.mockReset()
})

describe("useAddMember", () => {
  it("creates the member, then the membership with what was paid at the desk", async () => {
    post.mockImplementation(async (path: string) => (path === "/members" ? { id: "m1", firstName: "Rahul" } : {}))
    const result = render()
    const out = await result.current.mutateAsync({
      ...BASE,
      membership: { planId: "p1", startDate: "2026-10-09", discount: 200, amountPaid: 1000, paymentMethod: "UPI" },
    })
    expect(out.problems).toEqual([])
    expect(post).toHaveBeenNthCalledWith(1, "/members", expect.objectContaining({ firstName: "Rahul", email: null }))
    expect(post).toHaveBeenLastCalledWith("/memberships", {
      memberId: "m1",
      membershipPlanId: "p1",
      startDate: "2026-10-09",
      discount: 200,
      initialPayment: 1000,
      paymentMethod: "UPI",
    })
    // Nothing ticked on the health questions: no screening is saved.
    expect(post).not.toHaveBeenCalledWith("/members/m1/screenings", expect.anything())
  })

  it("leaves the payment off when nothing was paid", async () => {
    post.mockImplementation(async (path: string) => (path === "/members" ? { id: "m1" } : {}))
    const result = render()
    await result.current.mutateAsync({
      ...BASE,
      membership: { planId: "p1", startDate: "2026-10-09", discount: 0, amountPaid: 0, paymentMethod: "CASH" },
    })
    expect(post).toHaveBeenLastCalledWith("/memberships", { memberId: "m1", membershipPlanId: "p1", startDate: "2026-10-09" })
  })

  it("converts the enquiry instead of creating a second person", async () => {
    post.mockResolvedValueOnce({ lead: { id: "l1" }, member: { id: "m9" } })
    patch.mockResolvedValue({ id: "m9", firstName: "Rahul" })
    const result = render()
    const out = await result.current.mutateAsync({ ...BASE, leadId: "l1" })
    expect(post).toHaveBeenCalledWith("/leads/l1/convert", { branchId: "b1" })
    expect(post).not.toHaveBeenCalledWith("/members", expect.anything())
    expect(patch).toHaveBeenCalledWith("/members/m9", expect.objectContaining({ phone: "9876543210", waiverConsent: true }))
    expect(out.member.id).toBe("m9")
  })

  it("reports a step that failed after the member was saved, without throwing", async () => {
    post.mockImplementation(async (path: string) => {
      if (path === "/members") return { id: "m1" }
      if (path === "/memberships") throw new ApiError(400, { error: { code: "BAD_REQUEST", message: "Plan is inactive" } })
      return {}
    })
    const result = render()
    const out = await result.current.mutateAsync({
      ...BASE,
      parq: {
        heartCondition: true,
        chestPain: false,
        dizziness: false,
        jointProblems: false,
        onMedication: false,
        pregnant: false,
        otherConcerns: false,
      },
      membership: { planId: "p1", startDate: "2026-10-09", discount: 0, amountPaid: 500, paymentMethod: "CASH" },
    })
    expect(out.member.id).toBe("m1")
    expect(out.problems).toEqual(["membership (Plan is inactive)"])
    expect(post).toHaveBeenCalledWith(
      "/members/m1/screenings",
      expect.objectContaining({ flaggedForMedicalClearance: true }),
    )
  })

  it("fails outright when the member itself can't be saved", async () => {
    post.mockRejectedValue(new ApiError(409, { error: { code: "LIMIT", message: "Member limit reached" } }))
    const result = render()
    await expect(result.current.mutateAsync(BASE)).rejects.toThrow("Member limit reached")
  })
})

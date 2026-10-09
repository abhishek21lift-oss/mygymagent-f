import "@testing-library/jest-dom"
import * as React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { AddMemberForm, planLength } from "./add-member-form"

// Radix's checkbox measures itself with ResizeObserver; jsdom has none.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver

// jsdom doesn't scroll.
Element.prototype.scrollIntoView = jest.fn()

const push = jest.fn()
const mutateAsync = jest.fn()

jest.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))
jest.mock("sonner", () => ({ toast: { success: jest.fn(), warning: jest.fn(), error: jest.fn() } }))
jest.mock("@/lib/branch-context", () => ({ getCurrentBranchId: () => undefined, setCurrentBranchId: jest.fn() }))
jest.mock("@/lib/hooks/use-branches", () => ({
  useBranches: () => ({ data: { items: [{ id: "b1", name: "Main" }] } }),
}))
jest.mock("@/lib/hooks/use-membership-plans", () => ({
  useMembershipPlans: () => ({
    isLoading: false,
    data: {
      items: [
        { id: "p1", name: "Monthly", price: "1500", currency: "INR", durationDays: 30, isActive: true, branchId: null },
        { id: "p2", name: "Old plan", price: "999", currency: "INR", durationDays: 30, isActive: false, branchId: null },
      ],
    },
  }),
}))
jest.mock("@/lib/hooks/use-members", () => ({
  useAssignableTrainers: () => ({ data: [] }),
  useMembers: () => ({ data: { items: [] } }),
}))
jest.mock("@/lib/hooks/use-leads", () => ({ useLeads: () => ({ data: { items: [] }, isLoading: false }) }))
jest.mock("@/lib/hooks/use-add-member", () => ({ useAddMember: () => ({ mutateAsync, isPending: false }) }))

beforeEach(() => {
  push.mockReset()
  mutateAsync.mockReset()
})

function type(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

describe("AddMemberForm", () => {
  it("says what's missing instead of saving", async () => {
    render(<AddMemberForm />)
    fireEvent.click(screen.getAllByRole("button", { name: "Add member" })[0])
    expect(await screen.findByText("Enter the first name.")).toBeInTheDocument()
    expect(screen.getByText("Enter a 10-digit mobile number.")).toBeInTheDocument()
    expect(screen.getByText("The member needs to agree to the terms.")).toBeInTheDocument()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  it("adds a member on a plan with the fee collected, then opens the profile", async () => {
    mutateAsync.mockResolvedValue({ member: { id: "m1", firstName: "Rahul" }, problems: [] })
    render(<AddMemberForm />)
    type("First name", "Rahul")
    type("Last name", "Sharma")
    type("Mobile", "98765 43210")
    // Only active plans are offered.
    expect(screen.queryByRole("radio", { name: /Old plan/ })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("radio", { name: /Monthly/ }))
    expect(screen.getByLabelText("Paid now (₹)")).toHaveValue(1500)
    type("Discount (₹)", "300")
    expect(screen.getByLabelText("Paid now (₹)")).toHaveValue(1200)
    fireEvent.click(screen.getByRole("radio", { name: "UPI" }))
    fireEvent.click(screen.getByRole("checkbox", { name: /agrees to the gym/ }))
    fireEvent.click(screen.getAllByRole("button", { name: /Add & collect/ })[0])

    await waitFor(() => expect(push).toHaveBeenCalledWith("/members/m1"))
    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        primaryBranchId: "b1",
        firstName: "Rahul",
        phone: "98765 43210",
        memberType: "GYM",
        waiverConsent: true,
        parq: undefined,
        membership: expect.objectContaining({ planId: "p1", discount: 300, amountPaid: 1200, paymentMethod: "UPI" }),
      }),
    )
  })

  it("starts from an enquiry", () => {
    render(
      <AddMemberForm
        initialLead={{
          id: "l1",
          firstName: "Priya",
          lastName: "Verma",
          phone: "9811100001",
          email: null,
          source: "INSTAGRAM",
          branchId: "b1",
        } as never}
      />,
    )
    expect(screen.getByLabelText("First name")).toHaveValue("Priya")
    expect(screen.getByLabelText("Mobile")).toHaveValue("9811100001")
    expect(screen.getByText(/From enquiry:/)).toBeInTheDocument()
  })
})

describe("planLength", () => {
  it("reads like the desk says it", () => {
    expect(planLength(30)).toBe("1 month")
    expect(planLength(90)).toBe("3 months")
    expect(planLength(365)).toBe("1 year")
    expect(planLength(45)).toBe("45 days")
  })
})

import "@testing-library/jest-dom"
import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"

import NewMembershipPlanPage from "./page"

const push = jest.fn()
jest.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))
// Radix's select measures itself; jsdom has no ResizeObserver.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

jest.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({ hasPermission: () => true }),
}))

const mutateAsync = jest.fn()
jest.mock("@/lib/hooks/use-membership-plans", () => ({
  useCreateMembershipPlan: () => ({ mutateAsync, isPending: false }),
  useMembershipPlans: () => ({ data: null, isLoading: false, isError: false }),
  useUpdateMembershipPlan: () => ({ mutateAsync: jest.fn(), isPending: false }),
  usePriceEstimate: () => ({
    mutate: jest.fn(),
    data: undefined,
    isPending: false,
    isError: false,
  }),
}))
jest.mock("@/lib/hooks/use-branches", () => ({
  useBranches: () => ({ data: { items: [] }, isLoading: false, isError: false }),
}))

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <NewMembershipPlanPage />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  push.mockReset()
  mutateAsync.mockReset().mockResolvedValue({ id: "plan-1" })
})

describe("NewMembershipPlanPage", () => {
  it("renders the form with back navigation and cancel", () => {
    renderPage()
    expect(screen.getByRole("heading", { name: "New membership plan" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /plans/i })).toHaveAttribute("href", "/membership-plans")
    expect(screen.getByRole("link", { name: /cancel/i })).toHaveAttribute("href", "/membership-plans")
    expect(screen.getByLabelText(/plan name/i)).toBeInTheDocument()
  })

  it("blocks an unnamed plan and creates a valid one, then returns to the list", async () => {
    renderPage()
    fireEvent.click(screen.getByRole("button", { name: /create plan/i }))
    expect(await screen.findByText(/name.*required|required.*name/i)).toBeInTheDocument()
    expect(mutateAsync).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText(/plan name/i), { target: { value: "Monthly" } })
    fireEvent.change(screen.getByLabelText(/base price/i), { target: { value: "2000" } })
    fireEvent.click(screen.getByRole("button", { name: /create plan/i }))
    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ name: "Monthly" })),
    )
    expect(push).toHaveBeenCalledWith("/membership-plans")
  })

  it("sends offer, fee, tax, limit and trial fields when filled", async () => {
    renderPage()
    fireEvent.change(screen.getByLabelText(/plan name/i), { target: { value: "Quarterly" } })
    fireEvent.change(screen.getByLabelText(/base price/i), { target: { value: "5000" } })
    fireEvent.change(screen.getByLabelText(/offer was-price/i), { target: { value: "6000" } })
    fireEvent.change(screen.getByLabelText(/joining fee/i), { target: { value: "500" } })
    fireEvent.change(screen.getByLabelText(/weekly class limit/i), { target: { value: "3" } })
    fireEvent.change(screen.getByLabelText(/free trial days/i), { target: { value: "7" } })
    fireEvent.click(screen.getByRole("button", { name: /create plan/i }))
    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          compareAtPrice: 6000,
          joiningFee: 500,
          weeklyClassLimit: 3,
          trialDays: 7,
        }),
      ),
    )
  })

  it("rejects a zero weekly limit with an unlimited hint", async () => {
    renderPage()
    fireEvent.change(screen.getByLabelText(/plan name/i), { target: { value: "Monthly" } })
    fireEvent.change(screen.getByLabelText(/base price/i), { target: { value: "2000" } })
    fireEvent.change(screen.getByLabelText(/weekly class limit/i), { target: { value: "0" } })
    fireEvent.click(screen.getByRole("button", { name: /create plan/i }))
    expect(await screen.findByText(/unlimited/i)).toBeInTheDocument()
    expect(mutateAsync).not.toHaveBeenCalled()
  })
})

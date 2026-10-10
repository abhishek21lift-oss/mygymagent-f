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
})

import "@testing-library/jest-dom"
import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"

import NewStaffPage from "./page"

const push = jest.fn()
jest.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))

jest.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({ hasPermission: (key: string) => key === "users.create" || key === "hr.manage" }),
}))
jest.mock("@/lib/hooks/use-branches", () => ({
  useBranches: () => ({ data: { items: [{ id: "b1", name: "Main" }] }, isLoading: false, isError: false }),
}))
jest.mock("@/lib/hooks/use-staff", () => ({
  useAssignableRoles: () => ({
    data: [{ key: "RECEPTIONIST", name: "Receptionist", description: null, isSystem: true, isOrganizationSpecific: false, permissions: [] }],
    isLoading: false,
    isError: false,
  }),
  useAddStaff: () => ({ mutateAsync: jest.fn().mockResolvedValue({ id: "u1", firstName: "A", lastName: "B" }), isPending: false }),
}))
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }))
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <NewStaffPage />
    </QueryClientProvider>,
  )
}

describe("NewStaffPage", () => {
  it("renders the wizard on a dedicated route with back navigation", () => {
    renderPage()
    expect(screen.getByRole("heading", { name: "Add staff" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /staff/i })).toHaveAttribute("href", "/staff")
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
  })

  it("walks to review without a dialog", async () => {
    renderPage()
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: "Kamla" } })
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: "Devi" } })
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }))
    expect(await screen.findByText("What will they do?")).toBeInTheDocument()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    await waitFor(() => expect(push).not.toHaveBeenCalled())
  })
})

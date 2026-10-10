import "@testing-library/jest-dom"
import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"

import EditMemberPage from "./page"

const push = jest.fn()
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useParams: () => ({ id: "mem-1" }),
}))

jest.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({ hasPermission: () => true }),
}))

const MEMBER = {
  id: "mem-1",
  firstName: "Priya",
  lastName: "Sharma",
  memberCode: "M-1",
  status: "ACTIVE",
  email: null,
  phone: null,
  dateOfBirth: null,
  gender: null,
  addressLine1: null,
  addressLine2: null,
  city: null,
  state: null,
  postalCode: null,
  country: null,
  emergencyContactName: null,
  emergencyContactPhone: null,
  memberType: null,
  assignedTrainerId: null,
  primaryBranchId: "b1",
  notes: null,
  assignedTrainer: null,
  memberships: [],
}

const patch = jest.fn()
jest.mock("@/lib/hooks/use-members", () => ({
  useMember: () => ({ data: MEMBER, isLoading: false, isError: false, refetch: jest.fn() }),
  useUpdateMember: () => ({ mutateAsync: patch, isPending: false }),
  useAssignableTrainers: () => ({ data: [], isLoading: false, isError: false }),
}))
jest.mock("@/lib/hooks/use-member-documents", () => ({
  useMemberDocuments: () => ({ data: [], isLoading: false, isError: false }),
  useUploadMemberDocument: () => ({ mutateAsync: jest.fn(), isPending: false }),
}))
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }))

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <EditMemberPage />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  push.mockReset()
  patch.mockReset().mockResolvedValue({ ...MEMBER, firstName: "Priya Rani" })
})

describe("EditMemberPage", () => {
  it("loads the member into a dedicated form with photo and back navigation", async () => {
    renderPage()
    expect(await screen.findByDisplayValue("Priya")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Edit member" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /profile/i })).toHaveAttribute("href", "/members/mem-1")
    expect(screen.getByRole("link", { name: /cancel/i })).toHaveAttribute("href", "/members/mem-1")
    expect(screen.getByText("Profile photo")).toBeInTheDocument()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("saves through the member endpoint and returns to the profile", async () => {
    renderPage()
    fireEvent.change(await screen.findByDisplayValue("Priya"), { target: { value: "Priya Rani" } })
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }))
    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith(expect.objectContaining({ firstName: "Priya Rani" })),
    )
    expect(push).toHaveBeenCalledWith("/members/mem-1")
  })
})

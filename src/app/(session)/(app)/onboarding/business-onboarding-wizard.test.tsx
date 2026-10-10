import "@testing-library/jest-dom"
import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"

import { BusinessOnboardingWizard } from "./business-onboarding-wizard"

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }))

jest.mock("@/lib/auth/auth-context", () => ({
 useAuth: () => ({
 user: { firstName: "Asha", lastName: "Owner", email: "asha@example.com" },
 }),
}))

const updateOrg = jest.fn()
const updateBranch = jest.fn()
const ORG = { name: "619 Fitness Studio", timezone: "Asia/Kolkata", currency: "INR" }
const BRANCH = { id: "branch-1", name: "Indiranagar", addressLine1: "", city: "", state: "", postalCode: "", country: "", phone: "", email: "" }
jest.mock("@/lib/hooks/use-organization", () => ({
 useOrganization: () => ({ data: ORG, isLoading: false }),
 useUpdateOrganization: () => ({ mutateAsync: updateOrg }),
}))
jest.mock("@/lib/hooks/use-branches", () => ({
 useBranches: () => ({ data: { items: [BRANCH] } }),
 useUpdateBranch: () => ({ mutateAsync: updateBranch }),
}))

const toastSuccess = jest.fn()
const toastError = jest.fn()
jest.mock("sonner", () => ({
 toast: {
  success: (...args: unknown[]) => toastSuccess(...args),
  error: (...args: unknown[]) => toastError(...args),
 },
}))

function renderWizard() {
 const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
 return render(
 <QueryClientProvider client={client}>
 <BusinessOnboardingWizard />
 </QueryClientProvider>,
 )
}

beforeEach(() => {
 updateOrg.mockReset().mockResolvedValue({})
 updateBranch.mockReset().mockResolvedValue({})
})

describe("BusinessOnboardingWizard", () => {
 it("starts the onboarding flow when Let's Get Started is clicked", async () => {
 renderWizard()
 fireEvent.click(screen.getByRole("button", { name: /let's get started/i }))
 // Business step: asks for the gym's details.
 expect(await screen.findByLabelText(/business name/i)).toBeInTheDocument()
 })

 it("goes back to welcome without losing entered data", async () => {
 renderWizard()
 fireEvent.click(screen.getByRole("button", { name: /let's get started/i }))
 const name = await screen.findByLabelText(/business name/i)
 fireEvent.change(name, { target: { value: "Power House" } })
 fireEvent.click(screen.getByRole("button", { name: /^back$/i }))
 expect(await screen.findByRole("button", { name: /let's get started/i })).toBeInTheDocument()
 fireEvent.click(screen.getByRole("button", { name: /let's get started/i }))
 expect(await screen.findByDisplayValue("Power House")).toBeInTheDocument()
 })

 it("persists setup through the backend and shows the completion step", async () => {
 renderWizard()
 fireEvent.click(screen.getByRole("button", { name: /let's get started/i }))
 await screen.findByLabelText(/business name/i)
 // Business -> Branch -> Config -> Team via Continue.
 for (let i = 0; i < 3; i += 1) {
 fireEvent.click(screen.getByRole("button", { name: /^continue$/i }))
 }
 // Team step review: finish setup.
 fireEvent.click(await screen.findByRole("button", { name: /launch dashboard/i }))
 await waitFor(() => expect(updateOrg).toHaveBeenCalledTimes(1))
 expect(updateOrg).toHaveBeenCalledWith(
 expect.objectContaining({ name: "619 Fitness Studio", timezone: "Asia/Kolkata", currency: "INR" }),
 )
 expect(updateBranch).toHaveBeenCalledTimes(1)
 expect(await screen.findByText("Your Gym is Ready!")).toBeInTheDocument()
 })

 it("saves and completes when the team invite step is skipped", async () => {
 renderWizard()
 fireEvent.click(screen.getByRole("button", { name: /let's get started/i }))
 await screen.findByLabelText(/business name/i)
 for (let i = 0; i < 3; i += 1) {
 fireEvent.click(screen.getByRole("button", { name: /^continue$/i }))
 }
 fireEvent.click(await screen.findByRole("button", { name: /skip for now/i }))
 await waitFor(() => expect(updateOrg).toHaveBeenCalledTimes(1))
 expect(updateOrg).toHaveBeenCalledWith(
 expect.objectContaining({ name: "619 Fitness Studio", timezone: "Asia/Kolkata", currency: "INR" }),
 )
 expect(updateBranch).toHaveBeenCalledTimes(1)
 expect(await screen.findByText("Your Gym is Ready!")).toBeInTheDocument()
 })

 it("stays on review and reports when saving fails", async () => {
 updateOrg.mockRejectedValueOnce(new Error("boom"))
 renderWizard()
 fireEvent.click(screen.getByRole("button", { name: /let's get started/i }))
 await screen.findByLabelText(/business name/i)
 for (let i = 0; i < 3; i += 1) {
 fireEvent.click(screen.getByRole("button", { name: /^continue$/i }))
 }
 fireEvent.click(await screen.findByRole("button", { name: /launch dashboard/i }))
 await waitFor(() => expect(updateOrg).toHaveBeenCalledTimes(1))
 expect(toastError).toHaveBeenCalledWith("Failed to save settings")
 expect(screen.getByRole("button", { name: /launch dashboard/i })).toBeInTheDocument()
 expect(screen.queryByText("Your Gym is Ready!")).not.toBeInTheDocument()
 })
})

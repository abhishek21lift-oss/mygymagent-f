import "@testing-library/jest-dom"
import * as React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ImportantSettingsCard } from "./important-settings-card"
import { SalutationCard } from "./salutation-card"
import { IrregularMembersCard } from "./irregular-members-card"
import { api } from "@/lib/api/client"

jest.mock("@/lib/api/client", () => {
  const actual = jest.requireActual("@/lib/api/client")
  return { ...actual, api: { get: jest.fn(), patch: jest.fn(), post: jest.fn() } }
})

const mockApi = api as jest.Mocked<typeof api>

function wrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

const profile = {
  organizationId: "org1",
  salutation: "Hello" as const,
  autoResend: true,
  maxResendAttempts: 8,
  defaultCountryCode: "91",
  customBillMessage: null,
  irregularThresholdDays: 7,
  irregularCustomDays: null,
  timezone: "Asia/Kolkata",
  updatedAt: null,
}

const report = {
  thresholdDays: 7,
  generatedAt: "2026-10-12T09:00:00.000Z",
  members: [
    {
      id: "m1",
      name: "Asha Rao",
      phone: "919876543210",
      email: "a@x.com",
      lastCheckInAt: "2026-09-01T00:00:00.000Z",
      daysInactive: 41,
      subscriptionStatus: "ACTIVE" as const,
      membershipEndDate: "2026-12-01T00:00:00.000Z",
    },
    {
      id: "m2",
      name: "Vikram Shah",
      phone: null,
      email: "v@x.com",
      lastCheckInAt: null,
      daysInactive: 200,
      subscriptionStatus: "INACTIVE" as const,
      membershipEndDate: "2026-08-01T00:00:00.000Z",
    },
  ],
}

describe("ImportantSettingsCard", () => {
  beforeEach(() => jest.clearAllMocks())

  it("loads the saved preferences into the form", async () => {
    mockApi.get.mockResolvedValueOnce(profile as never)
    render(<ImportantSettingsCard canManage />, { wrapper: wrapper() })

    await waitFor(() => expect(screen.getByLabelText(/default country code/i)).toHaveValue("91"))
    expect(screen.getByLabelText(/maximum attempts/i)).toHaveValue(8)
  })

  it("saves the edited settings in one partial update", async () => {
    mockApi.get.mockResolvedValueOnce(profile as never)
    mockApi.patch.mockResolvedValueOnce({ ...profile, autoResend: false } as never)
    const user = userEvent.setup()
    render(<ImportantSettingsCard canManage />, { wrapper: wrapper() })

    await user.click(await screen.findByLabelText("Auto resend"))
    await user.clear(screen.getByLabelText(/default country code/i))
    await user.type(screen.getByLabelText(/default country code/i), "44")
    await user.click(screen.getByRole("button", { name: /save settings/i }))

    await waitFor(() =>
      expect(mockApi.patch).toHaveBeenCalledWith("/automation/whatsapp-profile", {
        autoResend: false,
        maxResendAttempts: 8,
        defaultCountryCode: "44",
        customBillMessage: null,
      }),
    )
  })

  it("blocks save on an invalid country code", async () => {
    mockApi.get.mockResolvedValueOnce(profile as never)
    const user = userEvent.setup()
    render(<ImportantSettingsCard canManage />, { wrapper: wrapper() })

    await user.clear(await screen.findByLabelText(/default country code/i))
    await user.type(screen.getByLabelText(/default country code/i), "abc")
    await user.click(screen.getByRole("button", { name: /save settings/i }))

    expect(mockApi.patch).not.toHaveBeenCalled()
  })
})

describe("SalutationCard", () => {
  beforeEach(() => jest.clearAllMocks())

  it("shows the saved salutation selected", async () => {
    mockApi.get.mockResolvedValueOnce(profile as never)
    render(<SalutationCard canManage />, { wrapper: wrapper() })
    await waitFor(() =>
      expect(screen.getByRole("radio", { name: "Hello" })).toBeChecked(),
    )
  })

  it("saves a newly chosen salutation", async () => {
    mockApi.get.mockResolvedValueOnce(profile as never)
    mockApi.patch.mockResolvedValueOnce({ ...profile, salutation: "Dear" } as never)
    const user = userEvent.setup()
    render(<SalutationCard canManage />, { wrapper: wrapper() })

    await user.click(await screen.findByRole("radio", { name: "Dear" }))

    await waitFor(() =>
      expect(mockApi.patch).toHaveBeenCalledWith("/automation/whatsapp-profile", { salutation: "Dear" }),
    )
  })
})

describe("IrregularMembersCard", () => {
  beforeEach(() => jest.clearAllMocks())

  it("previews members with their inactivity and subscription state", async () => {
    mockApi.get.mockResolvedValue(report as never)
    render(<IrregularMembersCard />, { wrapper: wrapper() })

    expect(await screen.findByText("Asha Rao")).toBeInTheDocument()
    expect(screen.getByText("Vikram Shah")).toBeInTheDocument()
    expect(screen.getByText("41 days")).toBeInTheDocument()
    expect(screen.getByText("Never")).toBeInTheDocument()
    // Subscription: one row Active, one lapsed Inactive.
    expect(screen.getByRole("row", { name: /Asha Rao/ })).toHaveTextContent("Active")
    expect(screen.getByRole("row", { name: /Vikram Shah/ })).toHaveTextContent("Inactive")
  })

  it("never sends anything while previewing", async () => {
    mockApi.get.mockResolvedValue(report as never)
    const user = userEvent.setup()
    render(<IrregularMembersCard />, { wrapper: wrapper() })

    await user.click(await screen.findByRole("button", { name: "Last 30 days" }))

    await waitFor(() =>
      expect(mockApi.get).toHaveBeenCalledWith(
        "/automation/irregular-members",
        expect.objectContaining({ query: { rangeDays: 30 } }),
      ),
    )
    // Read-only: no write path is ever taken just by looking.
    expect(mockApi.patch).not.toHaveBeenCalled()
    expect(mockApi.post).not.toHaveBeenCalled()
  })

  it("shows the empty state when nobody is irregular", async () => {
    mockApi.get.mockResolvedValue({ ...report, members: [] } as never)
    render(<IrregularMembersCard />, { wrapper: wrapper() })
    expect(await screen.findByText("No irregular members")).toBeInTheDocument()
  })
})
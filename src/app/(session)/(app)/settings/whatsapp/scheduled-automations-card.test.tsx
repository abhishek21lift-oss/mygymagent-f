import "@testing-library/jest-dom"
import * as React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ScheduledAutomationsCard } from "./scheduled-automations-card"
import { EventTriggersCard } from "./event-triggers-card"
import { api } from "@/lib/api/client"

jest.mock("@/lib/api/client", () => {
  const actual = jest.requireActual("@/lib/api/client")
  return { ...actual, api: { get: jest.fn(), patch: jest.fn() } }
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

/** The settings list the API returns: every key present, defaults inline. */
function settings(overrides: Record<string, Partial<{ enabled: boolean; runAt: string | null }>> = {}) {
  return [
    { key: "BIRTHDAY_WISH", enabled: true, runAt: null, channelOverride: null, cooldownDays: null, quietHoursStart: null, quietHoursEnd: null, updatedAt: null },
    { key: "PAYMENT_OVERDUE_REMINDER", enabled: true, runAt: null, channelOverride: null, cooldownDays: null, quietHoursStart: null, quietHoursEnd: null, updatedAt: null },
    { key: "MEMBERSHIP_RENEWAL_REMINDER", enabled: true, runAt: null, channelOverride: null, cooldownDays: null, quietHoursStart: null, quietHoursEnd: null, updatedAt: null },
    { key: "MEMBERSHIP_POST_EXPIRY", enabled: true, runAt: null, channelOverride: null, cooldownDays: null, quietHoursStart: null, quietHoursEnd: null, updatedAt: null },
    { key: "MEMBERSHIP_EXPIRY_ON_DAY", enabled: true, runAt: null, channelOverride: null, cooldownDays: null, quietHoursStart: null, quietHoursEnd: null, updatedAt: null },
    { key: "MEMBER_INACTIVE_RECOVERY", enabled: true, runAt: null, channelOverride: null, cooldownDays: null, quietHoursStart: null, quietHoursEnd: null, updatedAt: null },
    { key: "LEAD_FIRST_TOUCH", enabled: true, runAt: null, channelOverride: null, cooldownDays: null, quietHoursStart: null, quietHoursEnd: null, updatedAt: null },
    { key: "INVOICE_DUE_REMINDER", enabled: true, runAt: null, channelOverride: null, cooldownDays: null, quietHoursStart: null, quietHoursEnd: null, updatedAt: null },
    { key: "PAYMENT_RECEIPT", enabled: true, runAt: null, channelOverride: null, cooldownDays: null, quietHoursStart: null, quietHoursEnd: null, updatedAt: null },
  ].map((row) => ({ ...row, ...(overrides[row.key] ?? {}) }))
}

describe("ScheduledAutomationsCard", () => {
  beforeEach(() => jest.clearAllMocks())

  it("shows all six scheduled rows with the server time when one is saved", async () => {
    mockApi.get.mockResolvedValueOnce(settings({ BIRTHDAY_WISH: { runAt: "04:30" } }) as never)
    render(<ScheduledAutomationsCard canManage />, { wrapper: wrapper() })

    expect(await screen.findByText("Birthday")).toBeInTheDocument()
    expect(screen.getByText("Balance Due")).toBeInTheDocument()
    expect(screen.getByText("On Expiry")).toBeInTheDocument()
    expect(screen.getByText("Irregular Members")).toBeInTheDocument()
    // Saved run time is reflected; defaults fill the rest.
    await waitFor(() =>
      expect((screen.getByLabelText("Birthday automation").closest("li")!.querySelector("input[type=time]") as HTMLInputElement).value).toBe("04:30"),
    )
  })

  it("writes only the toggled key, leaving the rest alone", async () => {
    mockApi.get.mockResolvedValueOnce(settings() as never)
    mockApi.patch.mockResolvedValueOnce({} as never)
    const user = userEvent.setup()
    render(<ScheduledAutomationsCard canManage />, { wrapper: wrapper() })

    await user.click(await screen.findByLabelText("Birthday automation"))

    expect(mockApi.patch).toHaveBeenCalledWith("/automation/settings/BIRTHDAY_WISH", { enabled: false })
  })

  it("saves an edited time for that row only", async () => {
    mockApi.get.mockResolvedValue(settings() as never)
    mockApi.patch.mockResolvedValue({} as never)
    const user = userEvent.setup()
    render(<ScheduledAutomationsCard canManage />, { wrapper: wrapper() })

    const timeInput = (await screen.findByLabelText("Birthday automation")).closest("li")!.querySelector("input[type=time]") as HTMLInputElement
    await user.clear(timeInput)
    await user.type(timeInput, "09:15")
    await user.tab()

    await waitFor(() =>
      expect(mockApi.patch).toHaveBeenCalledWith("/automation/settings/BIRTHDAY_WISH", { runAt: "09:15" }),
    )
  })

  it("disables every control without permission", async () => {
    mockApi.get.mockResolvedValueOnce(settings() as never)
    render(<ScheduledAutomationsCard canManage={false} />, { wrapper: wrapper() })

    expect(await screen.findByLabelText("Birthday automation")).toBeDisabled()
  })

  it("surfaces a load failure", async () => {
    mockApi.get.mockRejectedValueOnce(new Error("boom"))
    render(<ScheduledAutomationsCard canManage />, { wrapper: wrapper() })
    expect(await screen.findByText("Something went wrong loading this data.")).toBeInTheDocument()
  })
})

describe("EventTriggersCard", () => {
  beforeEach(() => jest.clearAllMocks())

  it("toggles the enquiry trigger under its listener key", async () => {
    mockApi.get.mockResolvedValueOnce(settings() as never)
    mockApi.patch.mockResolvedValueOnce({} as never)
    const user = userEvent.setup()
    render(<EventTriggersCard canManage />, { wrapper: wrapper() })

    await user.click(await screen.findByLabelText("Enquiry trigger"))

    expect(mockApi.patch).toHaveBeenCalledWith("/automation/settings/LEAD_FIRST_TOUCH", { enabled: false })
  })

  it("toggles the paid-balance trigger under PAYMENT_RECEIPT", async () => {
    mockApi.get.mockResolvedValueOnce(settings() as never)
    mockApi.patch.mockResolvedValueOnce({} as never)
    const user = userEvent.setup()
    render(<EventTriggersCard canManage />, { wrapper: wrapper() })

    await user.click(await screen.findByLabelText("Paid Balance trigger"))

    expect(mockApi.patch).toHaveBeenCalledWith("/automation/settings/PAYMENT_RECEIPT", { enabled: false })
  })
})
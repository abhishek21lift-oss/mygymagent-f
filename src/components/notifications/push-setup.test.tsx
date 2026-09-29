import "@testing-library/jest-dom"
import * as React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { PushSetup } from "@/components/notifications/push-setup"
import * as push from "@/lib/push/web-push"

jest.mock("@/lib/push/web-push", () => {
  const actual = jest.requireActual("@/lib/push/web-push")
  return {
    ...actual,
    webPushSupport: jest.fn(),
    notificationPermission: jest.fn(),
    storedPushToken: jest.fn(),
    storedPushDeviceId: jest.fn(),
    getPushStatus: jest.fn(),
    listPushDevices: jest.fn(),
    enableWebPush: jest.fn(),
    disableWebPush: jest.fn(),
    sendTestPush: jest.fn(),
    removePushDevice: jest.fn(),
  }
})

const mocked = push as jest.Mocked<typeof push>

function given(opts: {
  configured?: boolean
  support?: push.WebPushSupport
  permission?: NotificationPermission
  token?: string | null
  devices?: push.PushDevice[]
}) {
  mocked.getPushStatus.mockResolvedValue({ configured: opts.configured ?? true })
  mocked.webPushSupport.mockReturnValue(opts.support ?? "supported")
  mocked.notificationPermission.mockReturnValue(opts.permission ?? "default")
  mocked.storedPushToken.mockReturnValue(opts.token ?? null)
  mocked.storedPushDeviceId.mockReturnValue(opts.token ? "device-here" : null)
  mocked.listPushDevices.mockResolvedValue(opts.devices ?? [])
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <PushSetup />
    </QueryClientProvider>,
  )
}

describe("PushSetup", () => {
  it("offers nothing to click when the server has no Firebase key", async () => {
    given({ configured: false })
    expect(await screen.findByText("Not set up")).toBeInTheDocument()
    expect(screen.getByText(/owner needs to add the Firebase key/)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /turn on/i })).not.toBeInTheDocument()
  })

  it("says the Android app and unsupported browsers can't receive push", async () => {
    given({ support: "unsupported" })
    expect(await screen.findByText("Unavailable here")).toBeInTheDocument()
    expect(screen.getByText(/Android app doesn't support push yet/)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /turn on/i })).not.toBeInTheDocument()
  })

  it("points to browser settings when notifications are blocked", async () => {
    given({ permission: "denied" })
    expect(await screen.findByText("Blocked")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /turn on/i })).not.toBeInTheDocument()
  })

  it("asks for permission only when the button is pressed", async () => {
    given({})
    mocked.enableWebPush.mockResolvedValue("fcm-token")
    const button = await screen.findByRole("button", { name: "Turn on for this device" })
    expect(mocked.enableWebPush).not.toHaveBeenCalled()
    await userEvent.click(button)
    await waitFor(() => expect(mocked.enableWebPush).toHaveBeenCalledTimes(1))
  })

  it("marks this device in the list and turns it off properly when removed", async () => {
    given({
      permission: "granted",
      token: "fcm-token",
      devices: [
        { id: "device-here", active: true, createdAt: "2026-09-29T10:00:00.000Z" },
        { id: "device-other", active: true, createdAt: "2026-09-01T10:00:00.000Z" },
      ],
    })
    mocked.disableWebPush.mockResolvedValue(undefined)
    expect(await screen.findByText("On for this device")).toBeInTheDocument()
    expect(await screen.findByText(/This device ·/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Send test" })).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Turn push off for this device" }))
    // Through the full turn-off, not a bare row delete that would leave
    // this browser believing it is still on.
    await waitFor(() => expect(mocked.disableWebPush).toHaveBeenCalled())
    expect(mocked.removePushDevice).not.toHaveBeenCalled()
  })
})

describe("PushSetup when the status check fails", () => {
  it("says so instead of inviting a turn-on it cannot offer", async () => {
    mocked.getPushStatus.mockRejectedValue(new Error("404"))
    mocked.webPushSupport.mockReturnValue("supported")
    mocked.notificationPermission.mockReturnValue("default")
    mocked.storedPushToken.mockReturnValue(null)
    mocked.storedPushDeviceId.mockReturnValue(null)
    mocked.listPushDevices.mockResolvedValue([])
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <PushSetup />
      </QueryClientProvider>,
    )
    expect(await screen.findByText("Unavailable")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /turn on/i })).not.toBeInTheDocument()
  })
})

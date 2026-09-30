import * as React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { api } from "@/lib/api/client"
import type { WhatsAppWebSession } from "@/lib/types/whatsapp"
import { WhatsAppWebCard } from "./whatsapp-web-card"

jest.mock("@/lib/api/client", () => {
  const actual = jest.requireActual("@/lib/api/client")
  return { ...actual, api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() } }
})

const base: WhatsAppWebSession = {
  available: true,
  status: "DISCONNECTED",
  phoneNumber: null,
  useForSending: false,
  dailyLimit: 200,
  sentLast24h: 0,
  riskAcceptedAt: null,
  connectedAt: null,
  lastError: null,
  qrDataUrl: null,
  pairingCode: null,
}

function renderWith(session: WhatsAppWebSession, canManage = true) {
  ;(api.get as jest.Mock).mockResolvedValue(session)
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <WhatsAppWebCard canManage={canManage} />
    </QueryClientProvider>,
  )
}

describe("WhatsAppWebCard", () => {
  beforeEach(() => jest.clearAllMocks())

  it("says when the deployment has it switched off", async () => {
    renderWith({ ...base, available: false })
    expect(await screen.findByText(/Not switched on on the server yet/)).toBeTruthy()
    expect(screen.getByText("WHATSAPP_WEB_ENABLED=true")).toBeTruthy()
    expect(screen.queryByRole("button", { name: /link my whatsapp/i })).toBeNull()
  })

  it("says exactly which server setting is wrong", async () => {
    const { unmount } = renderWith({ ...base, available: false, unavailableReason: "KEY_MISSING" })
    expect(await screen.findByText("WHATSAPP_TOKEN_KEY is not set")).toBeTruthy()
    unmount()
    renderWith({ ...base, available: false, unavailableReason: "KEY_INVALID" })
    expect(await screen.findByText("WHATSAPP_TOKEN_KEY is not a valid key")).toBeTruthy()
    expect(screen.getByText(/not the <64 hex characters> placeholder/)).toBeTruthy()
    expect(screen.getByText("openssl rand -hex 32")).toBeTruthy()
  })

  it("while linking, says it is connecting and shows why an attempt failed", async () => {
    renderWith({ ...base, status: "PAIRING", lastError: "Connecting to WhatsApp failed (code 405: Connection Failure). Retrying…" })
    expect(await screen.findByText(/can take up to 45 seconds/)).toBeTruthy()
    expect(screen.getByRole("alert").textContent).toMatch(/code 405/)
  })

  it("will not link until the ban risk is accepted, and then sends that acceptance", async () => {
    renderWith(base)
    const link = await screen.findByRole("button", { name: /link my whatsapp/i })
    expect(screen.getByText(/permanently ban/)).toBeTruthy()
    expect((link as HTMLButtonElement).disabled).toBe(true)

    ;(api.post as jest.Mock).mockResolvedValue({ ...base, status: "PAIRING" })
    fireEvent.click(screen.getByRole("checkbox"))
    expect((link as HTMLButtonElement).disabled).toBe(false)
    fireEvent.click(link)
    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/whatsapp-web/connect", { acceptRisk: true }))
  })

  it("asks for a number when linking by code, and sends it as digits", async () => {
    renderWith(base)
    fireEvent.click(await screen.findByRole("checkbox"))
    fireEvent.click(screen.getByRole("switch", { name: /code instead of a qr/i }))
    const link = screen.getByRole("button", { name: /link my whatsapp/i }) as HTMLButtonElement
    expect(link.disabled).toBe(true)
    fireEvent.change(screen.getByLabelText("WhatsApp number, with country code"), { target: { value: "+91 98765 43210" } })
    ;(api.post as jest.Mock).mockResolvedValue({ ...base, status: "PAIRING" })
    fireEvent.click(link)
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/whatsapp-web/connect", { acceptRisk: true, phoneNumber: "919876543210" }),
    )
  })

  it("shows the QR while pairing, or the code when there is one", async () => {
    const { unmount } = renderWith({ ...base, status: "PAIRING", qrDataUrl: "data:image/png;base64,AAAA" })
    expect(((await screen.findByAltText(/qr code/i)) as HTMLImageElement).src).toContain("data:image/png")
    unmount()
    renderWith({ ...base, status: "PAIRING", pairingCode: "ABCD1234" })
    expect(await screen.findByText("ABCD-1234")).toBeTruthy()
  })

  it("shows the linked number and how much of the day's limit is used", async () => {
    renderWith({ ...base, status: "CONNECTED", phoneNumber: "919876543210", sentLast24h: 150, dailyLimit: 200 })
    expect(await screen.findByText("+91 98765 43210")).toBeTruthy()
    expect(screen.getByText("150 / 200")).toBeTruthy()
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("75")
  })

  it("shows why a number was unlinked", async () => {
    renderWith({ ...base, status: "LOGGED_OUT", lastError: "WhatsApp blocked or restricted this number." })
    expect((await screen.findByRole("alert")).textContent).toMatch(/blocked or restricted/)
  })
})

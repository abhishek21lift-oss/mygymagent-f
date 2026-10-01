import "@testing-library/jest-dom"
import * as React from "react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"

import { KIOSK_DEVICE_KEY_STORAGE } from "@/lib/kiosk/kiosk-storage"
import { KioskApp } from "./kiosk-app"

const mockAuth = {
  user: null as null | { firstName: string },
  isLoading: false,
  hasPermission: jest.fn(() => false),
  logout: jest.fn(() => Promise.resolve()),
}
jest.mock("@/lib/auth/auth-context", () => ({ useAuth: () => mockAuth }))

const mockRegister = jest.fn()
jest.mock("@/lib/hooks/use-devices", () => ({
  useRegisterDevice: () => ({ mutateAsync: mockRegister }),
}))
jest.mock("@/lib/hooks/use-branches", () => ({
  useBranches: () => ({
    isLoading: false,
    isError: false,
    data: { items: [{ id: "branch-1", name: "Indiranagar" }] },
  }),
}))

const DEVICE_KEY = "k".repeat(64)
const QR = "a1".repeat(32)
const SESSION = {
  device: { id: "dev-1", name: "Lobby Kiosk" },
  branch: { id: "branch-1", name: "Indiranagar", timezone: "Asia/Kolkata" },
  organization: { name: "619 Fitness Studio", logoUrl: null },
}
const TIMINGS = { successMs: 400, deniedMs: 400, errorMs: 400, slowMs: 60, idleMs: 60_000, duplicateMs: 5_000 }

type Handler = (body: Record<string, unknown>) => { status: number; body?: unknown } | Promise<never>

let sessionHandler: Handler
let checkInHandlers: Handler[]
let healthOk: boolean
const fetchMock = jest.fn()

function json(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) } as Response
}

beforeEach(() => {
  window.localStorage.clear()
  mockAuth.user = null
  mockAuth.hasPermission.mockReturnValue(false)
  mockAuth.logout.mockClear()
  mockRegister.mockReset()
  healthOk = true
  sessionHandler = (body) =>
    body.deviceKey === DEVICE_KEY || body.deviceKey === "issued-key"
      ? { status: 200, body: { data: SESSION } }
      : { status: 401, body: { error: { code: "UNAUTHORIZED", message: "Invalid device key" } } }
  checkInHandlers = []
  fetchMock.mockReset()
  fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
    const path = new URL(url).pathname
    if (path === "/health") {
      if (!healthOk) throw new TypeError("Failed to fetch")
      return json(200, { data: { status: "ok" } })
    }
    const body = init?.body ? JSON.parse(String(init.body)) : {}
    const handler = path === "/kiosk/session" ? sessionHandler : checkInHandlers.shift()
    if (!handler) throw new Error(`unexpected request to ${path}`)
    const result = await handler(body)
    return json(result.status, result.body)
  })
  global.fetch = fetchMock as unknown as typeof fetch
})

function checkInCalls() {
  return fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/kiosk/check-in"))
}

function allowed(firstName = "Sela") {
  return () => ({
    status: 200,
    body: {
      data: {
        allowed: true,
        attendanceId: "att-1",
        checkedInAt: "2026-10-01T06:00:00.000Z",
        member: { id: "m-1", firstName, lastName: "Service" },
      },
    },
  })
}

async function renderReady() {
  window.localStorage.setItem(KIOSK_DEVICE_KEY_STORAGE, DEVICE_KEY)
  const view = render(<KioskApp timings={TIMINGS} />)
  await screen.findByRole("button", { name: /scan qr to check in/i })
  return view
}

async function typeMemberId(digits: string) {
  fireEvent.click(screen.getByRole("button", { name: /enter member id/i }))
  for (const digit of digits) fireEvent.click(screen.getByRole("button", { name: digit }))
  fireEvent.click(screen.getByRole("button", { name: "Check in" }))
}

describe("kiosk setup", () => {
  it("starts in setup when the screen has no key", async () => {
    render(<KioskApp timings={TIMINGS} />)
    expect(await screen.findByRole("heading", { name: /set up this check-in screen/i })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /scan qr/i })).not.toBeInTheDocument()
  })

  it("refuses a key the API does not recognise, and keeps nothing", async () => {
    render(<KioskApp timings={TIMINGS} />)
    fireEvent.change(await screen.findByLabelText(/device key/i), { target: { value: "wrong-key" } })
    fireEvent.click(screen.getByRole("button", { name: "Connect" }))
    expect(await screen.findByRole("alert")).toHaveTextContent(/isn.t recognised/i)
    expect(window.localStorage.getItem(KIOSK_DEVICE_KEY_STORAGE)).toBeNull()
  })

  it("keeps a verified key and then never shows it", async () => {
    const { container } = render(<KioskApp timings={TIMINGS} />)
    fireEvent.change(await screen.findByLabelText(/device key/i), { target: { value: DEVICE_KEY } })
    fireEvent.click(screen.getByRole("button", { name: "Connect" }))

    await screen.findByRole("button", { name: /scan qr to check in/i })
    expect(window.localStorage.getItem(KIOSK_DEVICE_KEY_STORAGE)).toBe(DEVICE_KEY)
    expect(screen.getByText("619 Fitness Studio")).toBeInTheDocument()
    expect(screen.getAllByText("Indiranagar").length).toBeGreaterThan(0)
    expect(screen.getByText("Lobby Kiosk")).toBeInTheDocument()
    expect(container.innerHTML).not.toContain(DEVICE_KEY)
  })

  it("lets signed-in staff register this screen, then signs them out", async () => {
    mockAuth.user = { firstName: "Abhi" }
    mockAuth.hasPermission.mockReturnValue(true)
    mockRegister.mockResolvedValue({ id: "dev-9", key: "issued-key", name: "Lobby check-in", kind: "KIOSK" })

    const { container } = render(<KioskApp timings={TIMINGS} />)
    fireEvent.click(await screen.findByRole("button", { name: /register and start kiosk/i }))

    await screen.findByRole("button", { name: /scan qr to check in/i })
    expect(mockRegister).toHaveBeenCalledWith({ branchId: "branch-1", name: "Lobby check-in", kind: "KIOSK" })
    expect(mockAuth.logout).toHaveBeenCalledTimes(1)
    expect(window.localStorage.getItem(KIOSK_DEVICE_KEY_STORAGE)).toBe("issued-key")
    expect(container.innerHTML).not.toContain("issued-key")
  })

  it("returns to setup, saying why, when the key has been revoked", async () => {
    window.localStorage.setItem(KIOSK_DEVICE_KEY_STORAGE, "revoked-key")
    render(<KioskApp timings={TIMINGS} />)
    expect(await screen.findByText(/this screen was disconnected/i)).toBeInTheDocument()
    expect(window.localStorage.getItem(KIOSK_DEVICE_KEY_STORAGE)).toBeNull()
  })

  it("keeps the key and waits when the API cannot be reached", async () => {
    window.localStorage.setItem(KIOSK_DEVICE_KEY_STORAGE, DEVICE_KEY)
    sessionHandler = () => Promise.reject(new TypeError("Failed to fetch"))
    render(<KioskApp timings={TIMINGS} />)
    expect(await screen.findByText(/connecting to the gym/i)).toBeInTheDocument()
    expect(window.localStorage.getItem(KIOSK_DEVICE_KEY_STORAGE)).toBe(DEVICE_KEY)
  })
})

describe("kiosk check-in", () => {
  it("checks a member in by member ID and welcomes them by first name", async () => {
    await renderReady()
    checkInHandlers.push(allowed())
    await typeMemberId("123")

    expect(await screen.findByRole("heading", { name: /welcome, sela/i })).toBeInTheDocument()
    expect(screen.getByText("Check-in successful")).toBeInTheDocument()
    expect(screen.queryByText(/service/i)).not.toBeInTheDocument() // no surname on a lobby screen
    expect(JSON.parse(String(checkInCalls()[0][1].body))).toEqual({ deviceKey: DEVICE_KEY, memberCode: "123" })

    // …and goes back to READY on its own.
    await screen.findByRole("button", { name: /scan qr to check in/i }, { timeout: 2_000 })
  })

  it("explains a denial in plain words, without the server's reason", async () => {
    await renderReady()
    checkInHandlers.push(() => ({
      status: 200,
      body: { data: { allowed: false, reason: "unpaid invoice INV-0042", code: "PAYMENT_DUE", attendanceId: "x" } },
    }))
    await typeMemberId("77")

    expect(await screen.findByRole("heading", { name: /a payment is pending/i })).toBeInTheDocument()
    expect(screen.getByText("Need help? Please contact reception.")).toBeInTheDocument()
    expect(document.body.textContent).not.toContain("INV-0042")
    await screen.findByRole("button", { name: /scan qr to check in/i }, { timeout: 2_000 })
  })

  it("retries once when the request never left, then succeeds", async () => {
    await renderReady()
    checkInHandlers.push(() => Promise.reject(new TypeError("Failed to fetch")), allowed())
    await typeMemberId("5")
    expect(await screen.findByRole("heading", { name: /welcome, sela/i }, { timeout: 3_000 })).toBeInTheDocument()
    expect(checkInCalls()).toHaveLength(2)
  })

  it("shows a calm error, not a stack trace, when the system fails", async () => {
    await renderReady()
    checkInHandlers.push(() => ({ status: 500, body: { error: { code: "INTERNAL", message: "PrismaClientKnownRequestError" } } }))
    await typeMemberId("5")
    expect(await screen.findByRole("heading", { name: /something went wrong/i })).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/prisma|internal/i)
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument()
  })

  it("sends one request however fast the button is tapped", async () => {
    await renderReady()
    let release!: () => void
    checkInHandlers.push(
      () => new Promise<never>((resolve) => (release = () => resolve(allowed()() as never))),
    )
    fireEvent.click(screen.getByRole("button", { name: /enter member id/i }))
    fireEvent.click(screen.getByRole("button", { name: "9" }))
    const submit = screen.getByRole("button", { name: "Check in" })
    fireEvent.click(submit)
    fireEvent.click(submit)
    fireEvent.click(submit)
    expect(await screen.findByRole("heading", { name: /checking you in/i })).toBeInTheDocument()
    await act(async () => release())
    await screen.findByRole("heading", { name: /welcome/i })
    expect(checkInCalls()).toHaveLength(1)
  })

  it("says it is still working when the answer is slow", async () => {
    await renderReady()
    let release!: () => void
    checkInHandlers.push(() => new Promise<never>((resolve) => (release = () => resolve(allowed()() as never))))
    await typeMemberId("4")
    await waitFor(() => expect(screen.getByText(/hang tight/i)).toHaveClass("opacity-100"))
    await act(async () => release())
    await screen.findByRole("heading", { name: /welcome/i })
  })

  it("accepts a USB QR scanner on the home screen", async () => {
    await renderReady()
    checkInHandlers.push(allowed("Ravi"))
    for (const key of [...QR, "Enter"]) fireEvent.keyDown(window, { key })
    expect(await screen.findByRole("heading", { name: /welcome, ravi/i })).toBeInTheDocument()
    expect(JSON.parse(String(checkInCalls()[0][1].body))).toEqual({ deviceKey: DEVICE_KEY, qrToken: QR })
  })

  it("ignores the same scan arriving twice", async () => {
    await renderReady()
    checkInHandlers.push(allowed("Ravi"))
    for (const key of [...QR, "Enter"]) fireEvent.keyDown(window, { key })
    await screen.findByRole("heading", { name: /welcome, ravi/i })
    fireEvent.click(screen.getByRole("button", { name: "Done" }))
    await screen.findByRole("button", { name: /scan qr to check in/i })
    for (const key of [...QR, "Enter"]) fireEvent.keyDown(window, { key })
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(checkInCalls()).toHaveLength(1)
  })

  it("turns the screen back to setup when its key is revoked mid-use", async () => {
    await renderReady()
    checkInHandlers.push(() => ({ status: 401, body: { error: { code: "UNAUTHORIZED", message: "Invalid device key" } } }))
    await typeMemberId("1")
    expect(await screen.findByText(/this screen was disconnected/i)).toBeInTheDocument()
    expect(window.localStorage.getItem(KIOSK_DEVICE_KEY_STORAGE)).toBeNull()
  })

  it("falls back to the keypad when there is no camera", async () => {
    await renderReady()
    fireEvent.click(screen.getByRole("button", { name: /scan qr to check in/i }))
    expect(await screen.findByRole("heading", { name: /camera isn.t available/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /enter member id/i }))
    expect(screen.getByRole("heading", { name: /enter your member id/i })).toBeInTheDocument()
  })

  it("pauses check-in while offline", async () => {
    healthOk = false
    window.localStorage.setItem(KIOSK_DEVICE_KEY_STORAGE, DEVICE_KEY)
    render(<KioskApp timings={TIMINGS} />)
    await waitFor(() => expect(screen.getByRole("button", { name: /scan qr to check in/i })).toBeDisabled())
    expect(screen.getByText(/paused while this screen reconnects/i)).toBeInTheDocument()
    expect(screen.getByText("Offline")).toBeInTheDocument()
  })

  it("hides the disconnect control behind a staff gesture, and never shows the key there", async () => {
    const { container } = await renderReady()
    expect(screen.queryByText(/disconnect this screen/i)).not.toBeInTheDocument()
    fireEvent.keyDown(window, { key: "k", ctrlKey: true, altKey: true })
    fireEvent.click(await screen.findByRole("button", { name: /disconnect this screen/i }))
    expect(container.innerHTML).not.toContain(DEVICE_KEY)
    fireEvent.click(screen.getByRole("button", { name: "Disconnect" }))
    expect(await screen.findByRole("heading", { name: /set up this check-in screen/i })).toBeInTheDocument()
    expect(window.localStorage.getItem(KIOSK_DEVICE_KEY_STORAGE)).toBeNull()
  })
})

import { refreshSession } from "@/lib/api/client"
import { getAccessToken, setAccessToken } from "@/lib/api/token-store"

// jsdom has no Response; refreshSession reads only these two members.
const okRefresh = { ok: true, json: async () => ({ data: { accessToken: "fresh" } }) }

describe("refreshSession", () => {
  const originalFetch = global.fetch
  const originalLocks = Object.getOwnPropertyDescriptor(navigator, "locks")

  afterEach(() => {
    global.fetch = originalFetch
    if (originalLocks) Object.defineProperty(navigator, "locks", originalLocks)
    else delete (navigator as { locks?: unknown }).locks
    setAccessToken(null)
  })

  it("waits for the cross-tab lock before sending the refresh cookie", async () => {
    // Another tab holds the lock: the refresh must not leave until it is released.
    let release!: () => void
    const held = new Promise<void>((resolve) => (release = resolve))
    const request = jest.fn(async (_name: string, fn: () => Promise<unknown>) => {
      await held
      return fn()
    })
    Object.defineProperty(navigator, "locks", { configurable: true, value: { request } })
    const fetchMock = jest.fn(async () => okRefresh)
    global.fetch = fetchMock as unknown as typeof fetch

    const refreshed = refreshSession()
    await Promise.resolve()
    expect(request).toHaveBeenCalledWith("auth-refresh", expect.any(Function))
    expect(fetchMock).not.toHaveBeenCalled()

    release()
    await expect(refreshed).resolves.toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(getAccessToken()).toBe("fresh")
  })

  it("still refreshes where the browser has no Web Locks", async () => {
    Object.defineProperty(navigator, "locks", { configurable: true, value: undefined })
    global.fetch = jest.fn(async () => okRefresh) as unknown as typeof fetch

    await expect(refreshSession()).resolves.toBe(true)
    expect(getAccessToken()).toBe("fresh")
  })
})

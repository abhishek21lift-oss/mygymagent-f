import { setAccessToken } from "@/lib/api/token-store"
import { fetchKioskSession, KioskRequestError, pingApi, postKioskCheckIn } from "./kiosk-api"

function respond(status: number, body: unknown) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response)
}

describe("kiosk API", () => {
  const fetchMock = jest.fn()
  beforeEach(() => {
    fetchMock.mockReset()
    global.fetch = fetchMock as unknown as typeof fetch
  })
  afterEach(() => setAccessToken(null))

  it("sends the device key in the body, with no staff token and no cookies", async () => {
    // A staff session left in memory on this browser must not ride along.
    setAccessToken("staff-access-token")
    fetchMock.mockReturnValueOnce(respond(200, { data: { allowed: true, attendanceId: "a", member: {} } }))

    await postKioskCheckIn("device-key", { qrToken: "t".repeat(64) })

    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toMatch(/\/kiosk\/check-in$/)
    expect(init.credentials).toBe("omit")
    expect(init.headers).toEqual({ "Content-Type": "application/json" })
    expect(JSON.parse(init.body)).toEqual({ deviceKey: "device-key", qrToken: "t".repeat(64) })
  })

  it("does not put the key in the URL", async () => {
    fetchMock.mockReturnValueOnce(respond(200, { data: { device: {}, branch: {}, organization: {} } }))
    await fetchKioskSession("secret-key")
    expect(String(fetchMock.mock.calls[0][0])).not.toContain("secret-key")
  })

  it.each([
    [401, "unauthorized"],
    [429, "rate_limited"],
    [400, "bad_request"],
    [500, "server"],
    [503, "server"],
  ])("maps HTTP %i to %s", async (status, failure) => {
    fetchMock.mockReturnValueOnce(respond(status, { error: { code: "X", message: "internal detail" } }))
    await expect(postKioskCheckIn("k", { memberCode: "1" })).rejects.toMatchObject({ failure })
  })

  it("treats a request that never left as a network failure", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"))
    await expect(postKioskCheckIn("k", { memberCode: "1" })).rejects.toEqual(new KioskRequestError("network"))
  })

  it("times out a hung request", async () => {
    jest.useFakeTimers()
    try {
      fetchMock.mockImplementationOnce(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")))
          }),
      )
      const pending = postKioskCheckIn("k", { memberCode: "1" })
      jest.advanceTimersByTime(10_001)
      await expect(pending).rejects.toMatchObject({ failure: "timeout" })
    } finally {
      jest.useRealTimers()
    }
  })

  it("pings health without credentials, and reports failure as offline", async () => {
    fetchMock.mockReturnValueOnce(respond(200, { data: { status: "ok" } }))
    await expect(pingApi()).resolves.toBe(true)
    expect(fetchMock.mock.calls[0][1].credentials).toBe("omit")

    fetchMock.mockRejectedValueOnce(new TypeError("offline"))
    await expect(pingApi()).resolves.toBe(false)
  })
})

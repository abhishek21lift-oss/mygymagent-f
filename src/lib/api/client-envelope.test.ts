import { api, ApiError } from "./client"

/** Regression: `{ data: null }` must unwrap to null, not the raw envelope.
 * The old guard required non-null data, so nullable single-resource GETs
 * (unconnected WhatsApp integration, missing bot config) resolved to a
 * truthy `{ data: null, meta }` object and crashed renderers downstream
 * (`s.status.replace` on undefined in the WhatsApp overview). */

function mockFetch(body: string, init: { status?: number; statusText?: string } = {}) {
  const status = init.status ?? 200
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: init.statusText ?? (status === 200 ? "OK" : "Error"),
    text: () => Promise.resolve(body),
  }) as unknown as typeof fetch
}

afterEach(() => {
  jest.restoreAllMocks()
})

describe("apiFetch envelope unwrapping", () => {
  it("unwraps { data: null } to null", async () => {
    mockFetch(JSON.stringify({ data: null, meta: { requestId: "r1" } }))
    await expect(api.get<null>("/whatsapp/integration")).resolves.toBeNull()
  })

  it("still unwraps populated envelopes", async () => {
    mockFetch(JSON.stringify({ data: { items: [1, 2] }, meta: {} }))
    await expect(api.get<{ items: number[] }>("/x")).resolves.toEqual({ items: [1, 2] })
  })

  it("still throws ApiError on error envelopes", async () => {
    mockFetch(JSON.stringify({ error: { code: "NOT_FOUND", message: "Missing" } }), { status: 404, statusText: "Not Found" })
    const err = await api.get("/x").catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect((err as ApiError).code).toBe("NOT_FOUND")
  })
})

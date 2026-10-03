/**
 * @jest-environment node
 *
 * The BFF is the one place the two repos' auth contracts meet, so it gets
 * tested at the boundary that matters: what the backend actually receives.
 *
 * `POST /auth/logout-all` is the reason this file exists. That route is not
 * `@Public()` -- it reads `@CurrentUser()`, so the backend needs the caller's
 * bearer token. This handler forwards the refresh cookie but not
 * `Authorization`, so every "sign out everywhere" reached the backend
 * unauthenticated, came back 401, and left every other device's refresh
 * token alive while the UI showed an error.
 */

type CookieOptions = {
  name: string
  value: string
  path?: string
  maxAge?: number
  expires?: Date
  httpOnly?: boolean
  secure?: boolean
  sameSite?: string
}

// Declared inside the factory so jest's hoisting of `jest.mock` cannot hit a
// temporal-dead-zone error on a module-scope binding.
jest.mock("next/headers", () => {
  const jar = new Map<string, string>()
  const writes: CookieOptions[] = []
  return {
    __jar: jar,
    __writes: writes,
    cookies: async () => ({
      get: (name: string) =>
        jar.has(name) ? { name, value: jar.get(name) as string } : undefined,
      set: (options: CookieOptions) => {
        writes.push(options)
        if (options.maxAge === 0) jar.delete(options.name)
        else jar.set(options.name, options.value)
      },
    }),
  }
})

import * as nextHeaders from "next/headers"
import { POST } from "./route"

const { __jar: cookieJar, __writes: cookieWrites } =
  nextHeaders as unknown as {
    __jar: Map<string, string>
    __writes: CookieOptions[]
  }

const REFRESH_TOKEN = "r".repeat(64)
const ACCESS_TOKEN = "a".repeat(43)

function paramsFor(...action: string[]) {
  return { params: Promise.resolve({ action }) }
}

function post(action: string[], init: RequestInit = {}) {
  return POST(
    new Request(`https://app.example.com/api/auth/${action.join("/")}`, {
      method: "POST",
      ...init,
    }),
    paramsFor(...action),
  )
}

/** The headers the backend received on its last call. */
function upstreamHeaders(): Headers {
  const [, init] = (global.fetch as jest.Mock).mock.calls.at(-1) as [
    string,
    RequestInit,
  ]
  return new Headers(init.headers as HeadersInit)
}

let fetchMock: jest.Mock

beforeEach(() => {
  fetchMock = jest.fn().mockResolvedValue(
    new Response(null, { status: 204 }),
  )
  global.fetch = fetchMock as unknown as typeof fetch
  cookieJar.clear()
  cookieWrites.length = 0
})

describe("POST /api/auth/logout-all", () => {
  it("forwards the caller's bearer token so the backend can identify the session", async () => {
    await post(["logout-all"], {
      headers: { authorization: `Bearer ${ACCESS_TOKEN}` },
    })

    expect(upstreamHeaders().get("authorization")).toBe(
      `Bearer ${ACCESS_TOKEN}`,
    )
  })

  it("reaches the backend without a bearer token only if the caller sent none", async () => {
    await post(["logout-all"])

    expect(upstreamHeaders().has("authorization")).toBe(false)
  })

  it("drops the local refresh cookie once the backend confirms", async () => {
    cookieJar.set("refresh_token", REFRESH_TOKEN)

    await post(["logout-all"], {
      headers: { authorization: `Bearer ${ACCESS_TOKEN}` },
    })

    expect(cookieJar.has("refresh_token")).toBe(false)
  })
})

describe("POST /api/auth header forwarding", () => {
  it("forwards the refresh cookie so cookie-authenticated actions work", async () => {
    cookieJar.set("refresh_token", REFRESH_TOKEN)

    await post(["refresh"])

    expect(upstreamHeaders().get("cookie")).toBe(
      `refresh_token=${REFRESH_TOKEN}`,
    )
  })

  it("never forwards the browser Origin or Referer to the backend", async () => {
    await post(["login"], {
      headers: {
        origin: "https://app.example.com",
        referer: "https://app.example.com/login",
      },
    })

    const forwarded = upstreamHeaders()
    expect(forwarded.has("origin")).toBe(false)
    expect(forwarded.has("referer")).toBe(false)
  })

  it("preserves the client IP for the backend's throttler and audit log", async () => {
    await post(["login"], {
      headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" },
    })

    expect(upstreamHeaders().get("x-forwarded-for")).toBe(
      "203.0.113.7, 10.0.0.1",
    )
  })
})

describe("POST /api/auth access control", () => {
  it("rejects a cross-origin browser post", async () => {
    const response = await post(["refresh"], {
      headers: { origin: "https://evil.example" },
    })

    expect(response.status).toBe(403)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("rejects an action outside the allowlist without calling the backend", async () => {
    const response = await post(["mfa/disable"])

    expect(response.status).toBe(404)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("names the missing variable when no backend URL is configured in production", async () => {
    const env = process.env as Record<string, string | undefined>
    const saved = { ...env }
    env.NODE_ENV = "production"
    delete env.MYGYMAGENT_API_URL
    delete env.NEXT_PUBLIC_API_URL

    try {
      const response = await post(["refresh"])

      expect(response.status).toBe(503)
      await expect(response.json()).resolves.toMatchObject({
        error: { code: "AUTH_BACKEND_UNCONFIGURED" },
      })
      // Must not silently proxy to the development default.
      expect(fetchMock).not.toHaveBeenCalled()
    } finally {
      for (const key of Object.keys(env)) delete env[key]
      Object.assign(env, saved)
    }
  })

  it("passes the backend's status and body straight through", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { code: "X", message: "y" } }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    )

    const response = await post(["logout-all"], {
      headers: { authorization: `Bearer ${ACCESS_TOKEN}` },
    })

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: { code: "X", message: "y" },
    })
  })
})
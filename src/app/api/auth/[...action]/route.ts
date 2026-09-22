import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const BACKEND_URL =
  process.env.MYGYMAGENT_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "https://mygymagent-b.onrender.com"

// `mfa/verify` is two segments, which is why this route is a catch-all:
// it completes a login and sets the same refresh cookie /auth/login does,
// so it has to come back through this BFF rather than go direct.
const ALLOWED_ACTIONS = new Set(["login", "register", "refresh", "logout", "mfa/verify"])
const REFRESH_COOKIE_PATH = "/api/auth"

function extractRefreshToken(setCookie: string | null): string | null {
  if (!setCookie) return null
  const match = setCookie.match(/(?:^|,\s*)refresh_token=([^;]+)/)
  return match?.[1] ?? null
}

function extractMaxAge(setCookie: string | null): number | undefined {
  if (!setCookie) return null as unknown as number | undefined
  const match = setCookie.match(/(?:^|;)\s*Max-Age=(\d+)/i)
  return match ? Number(match[1]) : undefined
}

function extractExpires(setCookie: string | null): Date | undefined {
  if (!setCookie) return undefined
  const match = setCookie.match(/(?:^|;)\s*Expires=([^;]+)/i)
  if (!match) return undefined
  const timestamp = Date.parse(match[1])
  return Number.isFinite(timestamp) ? new Date(timestamp) : undefined
}

async function copyRefreshCookie(setCookie: string | null) {
  const token = extractRefreshToken(setCookie)
  if (!token) return

  const store = await cookies()
  const maxAge = extractMaxAge(setCookie)
  const expires = extractExpires(setCookie)

  store.set({
    name: "refresh_token",
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    // Scope to the BFF auth routes only -- never attach the long-lived
    // refresh token to every frontend request.
    path: REFRESH_COOKIE_PATH,
    ...(maxAge !== undefined ? { maxAge } : {}),
    ...(expires ? { expires } : {}),
  })
}

async function clearRefreshCookie() {
  const store = await cookies()
  store.set({
    name: "refresh_token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: REFRESH_COOKIE_PATH,
    maxAge: 0,
    expires: new Date(0),
  })
}

function assertSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin")
  if (!origin) return true // non-browser client
  try {
    return origin === new URL(request.url).origin
  } catch {
    return false
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ action: string[] }> },
) {
  const { action: segments } = await context.params
  const action = (segments ?? []).join("/")
  if (!ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Unsupported auth action" } },
      { status: 404 },
    )
  }

  // CSRF: reject cross-origin browser posts to this cookie-authenticated BFF.
  if (!assertSameOrigin(request)) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Cross-origin request not allowed" } },
      { status: 403 },
    )
  }

  const store = await cookies()
  const refreshToken = store.get("refresh_token")?.value

  const headers = new Headers()
  const contentType = request.headers.get("content-type")
  if (contentType) headers.set("content-type", contentType)

  // Never forward the browser Origin/Referer to the backend. The BFF is the
  // trusted same-origin boundary and forwards the refresh cookie server-side.
  if (refreshToken) headers.set("cookie", "refresh_token=" + refreshToken)
  // Preserve real client IP for backend throttler/audit (trust proxy).
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) headers.set("x-forwarded-for", forwarded)
  const realIp = request.headers.get("x-real-ip")
  if (realIp) headers.set("x-real-ip", realIp)

  const body =
    action === "refresh" || action === "logout" ? undefined : await request.text()

  if (action === "logout") {
    // Clear the cookie unconditionally first so a backend outage can never
    // leave a live refresh session behind after the UI shows "logged out".
    await clearRefreshCookie()
  }

  let upstream: Response
  try {
    upstream = await fetch(BACKEND_URL + "/auth/" + action, {
      method: "POST",
      headers,
      body,
      cache: "no-store",
    })
  } catch {
    if (action === "logout") {
      // Local logout already succeeded; backend revocation is best-effort.
      return new NextResponse(null, { status: 204 })
    }
    return NextResponse.json(
      {
        error: {
          code: "AUTH_BACKEND_UNAVAILABLE",
          message: "Authentication service unavailable",
        },
      },
      { status: 503 },
    )
  }

  if (action !== "logout" && upstream.ok) {
    await copyRefreshCookie(upstream.headers.get("set-cookie"))
  }
  // A 401 from mfa/verify means the *challenge* was wrong or expired; it
  // says nothing about a refresh cookie this browser may already hold for
  // another account, so it must not clear one.
  if (action !== "logout" && action !== "mfa/verify" && upstream.status === 401) {
    // Server says the session is dead — drop the local cookie too.
    await clearRefreshCookie()
  }

  const responseBody = await upstream.text()
  return new NextResponse(responseBody || null, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") ?? "application/json",
    },
  })
}

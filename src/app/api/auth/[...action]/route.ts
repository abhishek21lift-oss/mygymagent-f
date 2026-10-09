import { cookies } from "next/headers"
import { NextResponse } from "next/server"

/** The backend origin, or null when unconfigured. Read live rather than
 * captured in a module constant so the production guard below reports the
 * environment as it actually is when a request arrives. */
function configuredBackendUrl(): string | null {
  return process.env.MYGYMAGENT_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? null
}

// No production fallback. This used to resolve to a hardcoded host, so a
// deployment missing its env var proxied every login somewhere plausible
// and silently authenticated against the wrong backend -- while
// `src/lib/api/client.ts`, the other half of this request path, refused to
// guess at all. They now agree: no guessing, ever.
//
// Unlike client.ts this is a per-request 503 rather than a throw at module
// load. Both files' constants are evaluated during `next build`, and a build
// runs without NEXT_PUBLIC_API_URL set (it is inlined into the client bundle
// instead), so throwing here failed the entire build over a variable only
// this handler needs. A 503 naming the missing variable keeps the rest of the
// app serving and points at the actual misconfiguration.
const BACKEND_URL = configuredBackendUrl() ?? "http://localhost:4000"

// `mfa/verify` is two segments, which is why this route is a catch-all:
// it completes a login and sets the same refresh cookie /auth/login does,
// so it has to come back through this BFF rather than go direct.
const ALLOWED_ACTIONS = new Set(["login", "register", "refresh", "logout", "logout-all", "mfa/verify", "otp/request", "otp/verify"])
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

  let originHost: string
  try {
    originHost = new URL(origin).host
  } catch {
    return false
  }

  // The host the browser addressed. Behind the VPS proxy that is the
  // Host / X-Forwarded-Host header: since Next 16.3.6 `request.url` is
  // built from the server's own listen address (https://localhost:3200),
  // never from Host, so comparing against it refused every real login.
  // A cross-site page can set neither header -- the browser sends this
  // site's host with the attacker's Origin, and the two differ.
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim()
  const hosts = [
    forwardedHost,
    request.headers.get("host"),
    hostOf(process.env.APP_URL),
    hostOf(process.env.NEXT_PUBLIC_SITE_URL),
    hostOf(request.url),
  ]
  return hosts.some((host) => host && host === originHost)
}

function hostOf(url: string | undefined): string | null {
  if (!url) return null
  try {
    return new URL(url).host
  } catch {
    return null
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

  // Forward the caller's access token. `logout-all` is the reason this is
  // here: it is not `@Public()`, it reads `@CurrentUser()`, so without a
  // bearer token the backend 401s and revokes nothing -- "sign out
  // everywhere" silently signed the caller out of their own browser and
  // left every other device signed in. The token goes to the same backend
  // the browser would have called directly; the allowlist above and the
  // same-origin check decide what can be proxied at all.
  const authorization = request.headers.get("authorization")
  if (authorization) headers.set("authorization", authorization)

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
    if (!configuredBackendUrl() && process.env.NODE_ENV === "production") {
      // Named explicitly rather than falling through to the 503 below,
      // which would report the backend as down when it is simply
      // unconfigured.
      return NextResponse.json(
        {
          error: {
            code: "AUTH_BACKEND_UNCONFIGURED",
            message:
              "Authentication service is not configured: set MYGYMAGENT_API_URL (or NEXT_PUBLIC_API_URL).",
          },
        },
        { status: 503 },
      )
    }
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
    // `logout-all` revoked every refresh token this account holds,
    // including this browser's, and the backend's clearing Set-Cookie
    // carries an empty value that `copyRefreshCookie` cannot extract. Drop
    // the local copy here so the next bootstrap does not present a dead
    // token and eat a pointless 401.
    if (action === "logout-all") {
      await clearRefreshCookie()
    } else {
      await copyRefreshCookie(upstream.headers.get("set-cookie"))
    }
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

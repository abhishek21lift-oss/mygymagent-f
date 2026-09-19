import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const BACKEND_URL =
  process.env.MYGYMAGENT_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "https://mygymagent-b.onrender.com"

const ALLOWED_ACTIONS = new Set(["login", "register", "refresh", "logout"])

function extractRefreshToken(setCookie: string | null): string | null {
  if (!setCookie) return null
  const match = setCookie.match(/(?:^|,\s*)refresh_token=([^;]+)/)
  return match?.[1] ?? null
}

function extractMaxAge(setCookie: string | null): number | undefined {
  if (!setCookie) return undefined
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
    path: "/",
    ...(maxAge !== undefined ? { maxAge } : {}),
    ...(expires ? { expires } : {}),
  })
}

export async function POST(
  request: Request,
  context: { params: Promise<{ action: string }> },
) {
  const { action } = await context.params
  if (!ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Unsupported auth action" } },
      { status: 404 },
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

  const body =
    action === "refresh" || action === "logout" ? undefined : await request.text()

  let upstream: Response
  try {
    upstream = await fetch(BACKEND_URL + "/auth/" + action, {
      method: "POST",
      headers,
      body,
      cache: "no-store",
    })
  } catch {
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

  if (action === "logout") {
    store.delete("refresh_token")
  } else if (upstream.ok) {
    await copyRefreshCookie(upstream.headers.get("set-cookie"))
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

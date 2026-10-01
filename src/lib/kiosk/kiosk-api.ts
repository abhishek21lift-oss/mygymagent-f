import { API_BASE_URL } from "@/lib/api/client"

/**
 * The self-service kiosk's only network surface.
 *
 * Deliberately not `apiFetch`: the kiosk's credential is its device key,
 * sent in the body. `apiFetch` attaches whatever staff access token is in
 * memory and answers a 401 by trying a staff refresh -- on a kiosk a 401
 * means "this device was revoked", and the right response is to stop, not
 * to go looking for a session. `credentials: "omit"` keeps any cookie on
 * this browser out of the requests too.
 */

export type KioskDenialCode =
  | "MEMBERSHIP_EXPIRED"
  | "NO_ACTIVE_MEMBERSHIP"
  | "PAYMENT_DUE"
  | "MEMBER_NOT_FOUND"
  | "WRONG_BRANCH"
  | "QR_INVALID"

export interface KioskSession {
  device: { id: string; name: string }
  branch: { id: string; name: string; timezone: string | null }
  organization: { name: string; logoUrl: string | null }
}

export type KioskCheckInResult =
  | {
      allowed: true
      attendanceId: string
      checkedInAt?: string
      repeat?: boolean
      member: { id: string; firstName: string; lastName: string }
    }
  | {
      allowed: false
      reason: string
      code?: KioskDenialCode
      attendanceId?: string
    }

/** How the member named themselves. Exactly one is sent. */
export type KioskIdentifier =
  | { qrToken: string }
  | { memberCode: string }
  | { memberId: string }

/** Why a request did not produce a decision. Never shown verbatim. */
export type KioskFailure =
  | "unauthorized" // the device key is unknown or revoked
  | "rate_limited"
  | "bad_request"
  | "timeout"
  | "network"
  | "server"

export class KioskRequestError extends Error {
  constructor(readonly failure: KioskFailure, readonly status?: number) {
    super(failure)
    this.name = "KioskRequestError"
  }
}

export const CHECK_IN_TIMEOUT_MS = 10_000
const SESSION_TIMEOUT_MS = 8_000
const HEALTH_TIMEOUT_MS = 5_000

function url(path: string) {
  return new URL(path.replace(/^\//, ""), `${API_BASE_URL.replace(/\/$/, "")}/`).toString()
}

async function post<T>(path: string, body: unknown, timeoutMs: number): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  let res: Response
  try {
    res = await fetch(url(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      cache: "no-store",
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new KioskRequestError("timeout")
    }
    throw new KioskRequestError("network")
  } finally {
    clearTimeout(timer)
  }

  if (!res.ok) {
    const failure: KioskFailure =
      res.status === 401
        ? "unauthorized"
        : res.status === 429
          ? "rate_limited"
          : res.status >= 400 && res.status < 500
            ? "bad_request"
            : "server"
    throw new KioskRequestError(failure, res.status)
  }
  const json = (await res.json().catch(() => null)) as { data?: T } | null
  if (!json || json.data === undefined || json.data === null) {
    throw new KioskRequestError("server", res.status)
  }
  return json.data
}

export function fetchKioskSession(deviceKey: string) {
  return post<KioskSession>("/kiosk/session", { deviceKey }, SESSION_TIMEOUT_MS)
}

export function postKioskCheckIn(deviceKey: string, identifier: KioskIdentifier) {
  return post<KioskCheckInResult>(
    "/kiosk/check-in",
    { deviceKey, ...identifier },
    CHECK_IN_TIMEOUT_MS,
  )
}

/** Liveness of the API from this screen: `/health` is public and touches
 * no database, so pinging it costs the server nothing. */
export async function pingApi(): Promise<boolean> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS)
  try {
    const res = await fetch(url("/health"), {
      credentials: "omit",
      cache: "no-store",
      signal: controller.signal,
    })
    return res.ok
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

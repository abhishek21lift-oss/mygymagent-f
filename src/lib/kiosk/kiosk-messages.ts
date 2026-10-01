import type { KioskDenialCode, KioskFailure, KioskIdentifier } from "./kiosk-api"

/**
 * Everything a member reads on the kiosk, in one place.
 *
 * The server's `reason` is written for staff ("unpaid invoice INV-0042",
 * "membership expired 2026-09-01") and is never shown here: a kiosk stands
 * in a lobby, and the person reading it may not be the member whose code
 * was entered. Each denial gets a sentence that says what happened in
 * plain words and what to do next -- always reception -- and nothing a
 * stranger could learn about someone else's account from.
 */
export type KioskDenial = KioskDenialCode | "UNREADABLE"

export interface KioskCopy {
  title: string
  body: string
}

const DENIALS: Record<KioskDenial, KioskCopy> = {
  MEMBERSHIP_EXPIRED: {
    title: "Your membership has ended",
    body: "Renew at reception and you'll be training again in a minute.",
  },
  NO_ACTIVE_MEMBERSHIP: {
    title: "No active membership",
    body: "Reception can get you set up — it only takes a moment.",
  },
  PAYMENT_DUE: {
    title: "A payment is pending",
    body: "Please see reception to settle up before your workout.",
  },
  WRONG_BRANCH: {
    title: "This isn't your home branch",
    body: "Please check in at reception today.",
  },
  MEMBER_NOT_FOUND: {
    title: "We couldn't find that member",
    body: "Check your member ID and try again, or ask reception.",
  },
  QR_INVALID: {
    title: "That code has expired",
    body: "Open the member app and tap Show check-in code to get a fresh one.",
  },
  UNREADABLE: {
    title: "That isn't a check-in code",
    body: "Show the check-in QR from the member app, or enter your member ID.",
  },
}

export function denialCopy(code: KioskDenial): KioskCopy {
  return DENIALS[code]
}

/**
 * The code for a denial, from a server that may predate `code`. The
 * frontend and the API deploy separately, so for one release window the
 * kiosk can be talking to an API that only sends `reason`; the prefixes
 * below are that API's fixed strings. Anything unrecognised is treated as
 * "no active membership" -- the safest thing to tell a stranger.
 */
export function denialFromResult(result: { reason?: string; code?: string }): KioskDenial {
  if (result.code && result.code in DENIALS) return result.code as KioskDenial
  const reason = (result.reason ?? "").toLowerCase()
  if (reason.startsWith("membership expired")) return "MEMBERSHIP_EXPIRED"
  if (reason.startsWith("unpaid invoice")) return "PAYMENT_DUE"
  if (reason === "member not found") return "MEMBER_NOT_FOUND"
  if (reason.includes("different branch")) return "WRONG_BRANCH"
  if (reason.includes("qr")) return "QR_INVALID"
  return "NO_ACTIVE_MEMBERSHIP"
}

export function failureCopy(failure: KioskFailure): KioskCopy {
  switch (failure) {
    case "rate_limited":
      return {
        title: "Lots of check-ins right now",
        body: "Please wait a few seconds and try again.",
      }
    case "timeout":
      return {
        title: "This is taking too long",
        body: "Please try again, or check in at reception.",
      }
    case "network":
      return {
        title: "We can't reach the gym system",
        body: "The connection dropped. Please try again, or check in at reception.",
      }
    default:
      return {
        title: "Something went wrong",
        body: "Please try again, or check in at reception.",
      }
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
/** A portal check-in token is 32 random bytes in hex. Accepting a little
 * either side of that keeps the kiosk working if the format grows, while
 * a URL or a product barcode is turned away before it costs a request. */
const QR_TOKEN = /^[A-Za-z0-9_-]{16,256}$/

/** What a scanned QR names, or null when it is plainly not ours. */
export function identifierFromScan(raw: string): KioskIdentifier | null {
  const text = raw.trim()
  if (!text || !QR_TOKEN.test(text)) return null
  return { qrToken: text }
}

/** What the member typed. Their member code is the normal answer; a pasted
 * member UUID still works, because the old kiosk took exactly that. */
export function identifierFromTyped(raw: string): KioskIdentifier | null {
  const text = raw.trim()
  if (!text || text.length > 64) return null
  if (UUID.test(text)) return { memberId: text }
  return { memberCode: text.toUpperCase() }
}

/** A stable string for a request, for de-duplicating repeated scans. */
export function identifierKey(identifier: KioskIdentifier): string {
  if ("qrToken" in identifier) return `qr:${identifier.qrToken}`
  if ("memberCode" in identifier) return `code:${identifier.memberCode}`
  return `id:${identifier.memberId.toLowerCase()}`
}

import { INITIAL_PHASE, isResultPhase, kioskReducer, resultDelay, DEFAULT_KIOSK_TIMINGS, type KioskPhase } from "./kiosk-machine"
import {
  denialCopy,
  denialFromResult,
  failureCopy,
  identifierFromScan,
  identifierFromTyped,
  identifierKey,
  type KioskDenial,
} from "./kiosk-messages"
import { WedgeBuffer } from "./wedge-scanner"

const TOKEN = "a".repeat(64)

describe("kioskReducer", () => {
  const verifying = (requestId = 1): KioskPhase => ({ name: "verifying", requestId, slow: false })

  it("walks READY → SCANNING → VERIFYING → SUCCESS → READY", () => {
    let phase = kioskReducer(INITIAL_PHASE, { type: "START_SCAN" })
    expect(phase).toEqual({ name: "scanning" })
    phase = kioskReducer(phase, { type: "SUBMIT", requestId: 7 })
    expect(phase).toEqual(verifying(7))
    phase = kioskReducer(phase, {
      type: "RESOLVED",
      requestId: 7,
      result: {
        allowed: true,
        attendanceId: "a1",
        checkedInAt: "2026-10-01T06:00:00.000Z",
        member: { id: "m1", firstName: "Sela", lastName: "Service" },
      },
    })
    expect(phase).toEqual({
      name: "success",
      firstName: "Sela",
      checkedInAt: "2026-10-01T06:00:00.000Z",
      repeat: false,
    })
    expect(kioskReducer(phase, { type: "RESET" })).toEqual(INITIAL_PHASE)
  })

  it("never starts a second request while one is verifying", () => {
    const phase = verifying(1)
    expect(kioskReducer(phase, { type: "SUBMIT", requestId: 2 })).toBe(phase)
    expect(kioskReducer(phase, { type: "START_SCAN" })).toBe(phase)
    expect(kioskReducer(phase, { type: "START_ENTRY" })).toBe(phase)
    expect(kioskReducer(phase, { type: "CANCEL" })).toBe(phase)
  })

  it("ignores an answer to a request the screen has moved on from", () => {
    // Reset while verifying, then the old response lands.
    const late = kioskReducer(INITIAL_PHASE, {
      type: "RESOLVED",
      requestId: 1,
      result: { allowed: false, reason: "no active membership" },
    })
    expect(late).toEqual(INITIAL_PHASE)
    // Or a different request's answer.
    const phase = verifying(2)
    expect(kioskReducer(phase, { type: "FAILED", requestId: 1, failure: "network" })).toBe(phase)
    expect(kioskReducer(phase, { type: "SLOW", requestId: 1 })).toBe(phase)
  })

  it("marks a slow request without leaving VERIFYING", () => {
    expect(kioskReducer(verifying(3), { type: "SLOW", requestId: 3 })).toEqual({
      name: "verifying",
      requestId: 3,
      slow: true,
    })
  })

  it("turns a denial into a code, never carrying the server's reason", () => {
    const phase = kioskReducer(verifying(1), {
      type: "RESOLVED",
      requestId: 1,
      result: { allowed: false, reason: "unpaid invoice INV-0042", code: "PAYMENT_DUE" },
    })
    expect(phase).toEqual({ name: "denied", denial: "PAYMENT_DUE" })
    expect(JSON.stringify(phase)).not.toContain("INV-0042")
  })

  it("records a repeat scan as success, flagged", () => {
    const phase = kioskReducer(verifying(1), {
      type: "RESOLVED",
      requestId: 1,
      result: { allowed: true, attendanceId: "a", repeat: true, member: { id: "m", firstName: "A", lastName: "B" } },
    })
    expect(phase).toMatchObject({ name: "success", repeat: true, checkedInAt: null })
  })

  it("only rejects locally from a screen that could have submitted", () => {
    expect(kioskReducer({ name: "scanning" }, { type: "REJECTED_LOCALLY", denial: "UNREADABLE" })).toEqual({
      name: "denied",
      denial: "UNREADABLE",
    })
    const phase = verifying(1)
    expect(kioskReducer(phase, { type: "REJECTED_LOCALLY", denial: "UNREADABLE" })).toBe(phase)
  })

  it("lets the member switch between camera and keypad, and cancel either", () => {
    expect(kioskReducer({ name: "scanning" }, { type: "START_ENTRY" })).toEqual({ name: "entering" })
    expect(kioskReducer({ name: "entering" }, { type: "START_SCAN" })).toEqual({ name: "scanning" })
    expect(kioskReducer({ name: "entering" }, { type: "CANCEL" })).toEqual(INITIAL_PHASE)
  })

  it("gives every outcome a delay back to READY, and nothing else one", () => {
    expect(resultDelay({ name: "success", firstName: "A", checkedInAt: null, repeat: false }, DEFAULT_KIOSK_TIMINGS)).toBe(
      DEFAULT_KIOSK_TIMINGS.successMs,
    )
    expect(resultDelay({ name: "denied", denial: "PAYMENT_DUE" }, DEFAULT_KIOSK_TIMINGS)).toBe(DEFAULT_KIOSK_TIMINGS.deniedMs)
    expect(resultDelay({ name: "error", failure: "network" }, DEFAULT_KIOSK_TIMINGS)).toBe(DEFAULT_KIOSK_TIMINGS.errorMs)
    expect(resultDelay(INITIAL_PHASE, DEFAULT_KIOSK_TIMINGS)).toBeNull()
    expect(resultDelay(verifying(), DEFAULT_KIOSK_TIMINGS)).toBeNull()
    expect(isResultPhase({ name: "error", failure: "server" })).toBe(true)
    expect(isResultPhase(verifying())).toBe(false)
  })
})

describe("denialFromResult", () => {
  it("prefers the server's code", () => {
    expect(denialFromResult({ reason: "anything", code: "WRONG_BRANCH" })).toBe("WRONG_BRANCH")
  })

  it("understands an API that predates codes", () => {
    expect(denialFromResult({ reason: "membership expired 2026-09-01" })).toBe("MEMBERSHIP_EXPIRED")
    expect(denialFromResult({ reason: "unpaid invoice INV-1" })).toBe("PAYMENT_DUE")
    expect(denialFromResult({ reason: "member not found" })).toBe("MEMBER_NOT_FOUND")
    expect(denialFromResult({ reason: "member is assigned to a different branch" })).toBe("WRONG_BRANCH")
    expect(denialFromResult({ reason: "no active membership" })).toBe("NO_ACTIVE_MEMBERSHIP")
  })

  it("falls back to the least revealing message for anything unknown", () => {
    expect(denialFromResult({ reason: "some new internal reason" })).toBe("NO_ACTIVE_MEMBERSHIP")
    expect(denialFromResult({ code: "SOMETHING_NEW" })).toBe("NO_ACTIVE_MEMBERSHIP")
  })
})

describe("member-facing copy", () => {
  const denials: KioskDenial[] = [
    "MEMBERSHIP_EXPIRED",
    "NO_ACTIVE_MEMBERSHIP",
    "PAYMENT_DUE",
    "WRONG_BRANCH",
    "MEMBER_NOT_FOUND",
    "QR_INVALID",
    "UNREADABLE",
  ]

  it.each(denials)("%s has a friendly title and next step", (denial) => {
    const copy = denialCopy(denial)
    expect(copy.title.length).toBeGreaterThan(5)
    expect(copy.body.length).toBeGreaterThan(10)
    // Nothing that reads like a system message.
    expect(`${copy.title} ${copy.body}`).not.toMatch(/error|invoice|uuid|null|undefined|exception|\d{4}-\d{2}/i)
  })

  it("never shows the HTTP layer to a member", () => {
    for (const failure of ["rate_limited", "timeout", "network", "server", "bad_request", "unauthorized"] as const) {
      const copy = failureCopy(failure)
      expect(`${copy.title} ${copy.body}`).not.toMatch(/\b(401|404|429|500|http|fetch|api)\b/i)
    }
  })
})

describe("identifiers", () => {
  it("reads a portal QR token, and turns away anything that is not one", () => {
    expect(identifierFromScan(` ${TOKEN}\n`)).toEqual({ qrToken: TOKEN })
    expect(identifierFromScan("https://example.com/promo")).toBeNull()
    expect(identifierFromScan("8901234567890")).toBeNull() // a product barcode
    expect(identifierFromScan("")).toBeNull()
  })

  it("treats typed text as a member code, upper-cased", () => {
    expect(identifierFromTyped(" m-000123 ")).toEqual({ memberCode: "M-000123" })
    expect(identifierFromTyped("123")).toEqual({ memberCode: "123" })
  })

  it("still accepts a member UUID, as the old kiosk did", () => {
    const id = "3f2c1a4e-9b7d-4c3e-8a1f-2b3c4d5e6f70"
    expect(identifierFromTyped(id)).toEqual({ memberId: id })
  })

  it("refuses empty and oversized input", () => {
    expect(identifierFromTyped("   ")).toBeNull()
    expect(identifierFromTyped("x".repeat(65))).toBeNull()
  })

  it("keys each identifier distinctly for de-duplication", () => {
    expect(identifierKey({ qrToken: "abc" })).not.toBe(identifierKey({ memberCode: "abc" }))
    expect(identifierKey({ memberId: "ABC" })).toBe(identifierKey({ memberId: "abc" }))
  })
})

describe("WedgeBuffer", () => {
  const type = (buffer: WedgeBuffer, text: string, start: number, gap: number) => {
    let at = start
    for (const ch of text) {
      buffer.push(ch, at)
      at += gap
    }
    return buffer.push("Enter", at)
  }

  it("recognises a scanner by its speed", () => {
    expect(type(new WedgeBuffer(), TOKEN, 0, 8)).toBe(TOKEN)
  })

  it("ignores a person typing", () => {
    expect(type(new WedgeBuffer(), TOKEN, 0, 180)).toBeNull()
  })

  it("ignores a short burst, like a fast Enter on a form", () => {
    expect(type(new WedgeBuffer(), "12", 0, 5)).toBeNull()
  })

  it("starts over after a pause, keeping only the fast run", () => {
    const buffer = new WedgeBuffer()
    buffer.push("x", 0)
    buffer.push("y", 500) // a pause: "x" is dropped
    let at = 501
    for (const ch of TOKEN.slice(1)) buffer.push(ch, (at += 5))
    expect(buffer.push("Enter", at + 5)).toBe(`y${TOKEN.slice(1)}`)
  })

  it("ignores modifier and navigation keys", () => {
    const buffer = new WedgeBuffer()
    expect(buffer.push("Shift", 0)).toBeNull()
    expect(type(buffer, TOKEN, 1, 5)).toBe(TOKEN)
  })
})

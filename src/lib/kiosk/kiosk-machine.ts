import type { KioskCheckInResult, KioskFailure } from "./kiosk-api"
import { denialFromResult, type KioskDenial } from "./kiosk-messages"

/**
 * The kiosk's check-in flow as a pure state machine:
 *
 *   READY ─▶ SCANNING / ENTERING ─▶ VERIFYING ─▶ SUCCESS | DENIED | ERROR ─▶ READY
 *
 * Kept free of React and timers so every transition, and every transition
 * that must NOT happen, is a plain unit test. The guards are the point:
 * a second submit while one is verifying, a late response arriving after
 * the screen already reset, a "slow" tick after the answer came back --
 * each is ignored here rather than at every call site.
 */
export type KioskPhase =
  | { name: "ready" }
  | { name: "scanning" }
  | { name: "entering" }
  | { name: "verifying"; requestId: number; slow: boolean }
  | {
      name: "success"
      firstName: string
      checkedInAt: string | null
      repeat: boolean
    }
  | { name: "denied"; denial: KioskDenial }
  | { name: "error"; failure: KioskFailure }

export type KioskAction =
  | { type: "START_SCAN" }
  | { type: "START_ENTRY" }
  | { type: "CANCEL" }
  | { type: "SUBMIT"; requestId: number }
  | { type: "SLOW"; requestId: number }
  | { type: "RESOLVED"; requestId: number; result: KioskCheckInResult }
  | { type: "REJECTED_LOCALLY"; denial: KioskDenial }
  | { type: "FAILED"; requestId: number; failure: KioskFailure }
  | { type: "RESET" }

export const INITIAL_PHASE: KioskPhase = { name: "ready" }

const CAN_SUBMIT = new Set<KioskPhase["name"]>(["ready", "scanning", "entering"])
const IS_RESULT = new Set<KioskPhase["name"]>(["success", "denied", "error"])

export function isResultPhase(phase: KioskPhase): boolean {
  return IS_RESULT.has(phase.name)
}

export function kioskReducer(phase: KioskPhase, action: KioskAction): KioskPhase {
  switch (action.type) {
    case "START_SCAN":
      return phase.name === "ready" || phase.name === "entering" ? { name: "scanning" } : phase
    case "START_ENTRY":
      return phase.name === "ready" || phase.name === "scanning" ? { name: "entering" } : phase
    case "CANCEL":
      return phase.name === "scanning" || phase.name === "entering" ? INITIAL_PHASE : phase
    case "SUBMIT":
      return CAN_SUBMIT.has(phase.name)
        ? { name: "verifying", requestId: action.requestId, slow: false }
        : phase
    case "SLOW":
      return phase.name === "verifying" && phase.requestId === action.requestId
        ? { ...phase, slow: true }
        : phase
    case "RESOLVED": {
      if (phase.name !== "verifying" || phase.requestId !== action.requestId) return phase
      const { result } = action
      if (result.allowed) {
        return {
          name: "success",
          firstName: result.member.firstName,
          checkedInAt: result.checkedInAt ?? null,
          repeat: !!result.repeat,
        }
      }
      return { name: "denied", denial: denialFromResult(result) }
    }
    case "REJECTED_LOCALLY":
      return CAN_SUBMIT.has(phase.name) ? { name: "denied", denial: action.denial } : phase
    case "FAILED":
      return phase.name === "verifying" && phase.requestId === action.requestId
        ? { name: "error", failure: action.failure }
        : phase
    case "RESET":
      return INITIAL_PHASE
  }
}

/** How long each result stays up before the screen is READY again. */
export interface KioskTimings {
  successMs: number
  deniedMs: number
  errorMs: number
  /** SCANNING / ENTERING with no activity for this long go back to READY,
   * releasing the camera. */
  idleMs: number
  /** VERIFYING longer than this shows a "still checking" line. */
  slowMs: number
  /** The same code again inside this window is a duplicate frame or a
   * double tap, not a new check-in. */
  duplicateMs: number
}

export const DEFAULT_KIOSK_TIMINGS: KioskTimings = {
  successMs: 4_500,
  deniedMs: 8_000,
  errorMs: 6_000,
  idleMs: 45_000,
  slowMs: 2_500,
  duplicateMs: 5_000,
}

export function resultDelay(phase: KioskPhase, timings: KioskTimings): number | null {
  if (phase.name === "success") return timings.successMs
  if (phase.name === "denied") return timings.deniedMs
  if (phase.name === "error") return timings.errorMs
  return null
}

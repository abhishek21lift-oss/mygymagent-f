"use client"

import * as React from "react"

import { ScanDeduper } from "@/lib/scan-dedupe"
import {
  KioskRequestError,
  postKioskCheckIn,
  type KioskFailure,
  type KioskIdentifier,
} from "./kiosk-api"
import {
  DEFAULT_KIOSK_TIMINGS,
  INITIAL_PHASE,
  kioskReducer,
  resultDelay,
  type KioskTimings,
} from "./kiosk-machine"
import { identifierKey, type KioskDenial } from "./kiosk-messages"

const NETWORK_RETRY_DELAY_MS = 800

/**
 * Drives the check-in state machine against the API.
 *
 * Duplicate protection is layered, because each layer catches a
 * different duplicate:
 *  - one request at a time (`inFlight`): a second tap or a second camera
 *    frame while one is verifying is dropped, not queued;
 *  - the same code inside `duplicateMs` is dropped even after the first
 *    answer came back -- a phone still held up to the camera;
 *  - the API itself answers a repeat allowed check-in on the same device
 *    within a minute with the first record, so a retry can never write a
 *    second visit.
 *
 * Retry is limited to the one case where it is known to be safe and
 * useful: the request never left (`network`). A timeout may have reached
 * the server, so it is reported, not silently repeated -- the member
 * tries again and the server-side repeat window absorbs it.
 */
export function useKioskCheckIn({
  deviceKey,
  onUnauthorized,
  timings: timingOverrides,
}: {
  deviceKey: string
  onUnauthorized: () => void
  timings?: Partial<KioskTimings>
}) {
  // Fixed for the life of the screen: an inline object from the caller
  // would otherwise restart every timer on every render.
  const [timings] = React.useState<KioskTimings>(() => ({
    ...DEFAULT_KIOSK_TIMINGS,
    ...timingOverrides,
  }))
  const [phase, dispatch] = React.useReducer(kioskReducer, INITIAL_PHASE)
  const inFlight = React.useRef(false)
  const requestSeq = React.useRef(0)
  const deduper = React.useRef(new ScanDeduper(timings.duplicateMs))
  const [idleTick, setIdleTick] = React.useState(0)
  const onUnauthorizedRef = React.useRef(onUnauthorized)
  React.useEffect(() => {
    onUnauthorizedRef.current = onUnauthorized
  }, [onUnauthorized])

  // Results return to READY on their own.
  React.useEffect(() => {
    const delay = resultDelay(phase, timings)
    if (delay === null) return
    const timer = setTimeout(() => dispatch({ type: "RESET" }), delay)
    return () => clearTimeout(timer)
  }, [phase, timings])

  // An abandoned scan or keypad goes back to READY, freeing the camera.
  React.useEffect(() => {
    if (phase.name !== "scanning" && phase.name !== "entering") return
    const timer = setTimeout(() => dispatch({ type: "CANCEL" }), timings.idleMs)
    return () => clearTimeout(timer)
  }, [phase.name, timings.idleMs, idleTick])

  // "Still checking" once a response is slow.
  const verifyingId = phase.name === "verifying" ? phase.requestId : null
  React.useEffect(() => {
    if (verifyingId === null) return
    const timer = setTimeout(
      () => dispatch({ type: "SLOW", requestId: verifyingId }),
      timings.slowMs,
    )
    return () => clearTimeout(timer)
  }, [verifyingId, timings.slowMs])

  const submit = React.useCallback(
    async (identifier: KioskIdentifier) => {
      if (inFlight.current) return
      if (!deduper.current.accept(identifierKey(identifier), Date.now())) return
      inFlight.current = true
      const requestId = ++requestSeq.current
      dispatch({ type: "SUBMIT", requestId })
      try {
        let attempt = 0
        for (;;) {
          try {
            const result = await postKioskCheckIn(deviceKey, identifier)
            dispatch({ type: "RESOLVED", requestId, result })
            return
          } catch (error) {
            const failure: KioskFailure =
              error instanceof KioskRequestError ? error.failure : "server"
            if (failure === "network" && attempt === 0) {
              attempt++
              await new Promise((resolve) => setTimeout(resolve, NETWORK_RETRY_DELAY_MS))
              continue
            }
            if (failure === "unauthorized") {
              dispatch({ type: "RESET" })
              onUnauthorizedRef.current()
              return
            }
            if (failure === "bad_request") {
              // The API refused the shape of what was entered -- say so as
              // a member-facing denial, not as a system error.
              dispatch({
                type: "RESOLVED",
                requestId,
                result: { allowed: false, reason: "member not found", code: "MEMBER_NOT_FOUND" },
              })
              return
            }
            dispatch({ type: "FAILED", requestId, failure })
            return
          }
        }
      } finally {
        inFlight.current = false
      }
    },
    [deviceKey],
  )

  const rejectLocally = React.useCallback((denial: KioskDenial, key: string) => {
    if (inFlight.current) return
    if (!deduper.current.accept(key, Date.now())) return
    dispatch({ type: "REJECTED_LOCALLY", denial })
  }, [])

  const startScan = React.useCallback(() => dispatch({ type: "START_SCAN" }), [])
  const startEntry = React.useCallback(() => dispatch({ type: "START_ENTRY" }), [])
  const cancel = React.useCallback(() => dispatch({ type: "CANCEL" }), [])
  const reset = React.useCallback(() => dispatch({ type: "RESET" }), [])
  /** Keeps SCANNING / ENTERING alive while the member is using it. */
  const touch = React.useCallback(() => setIdleTick((n) => n + 1), [])

  return { phase, submit, rejectLocally, startScan, startEntry, cancel, reset, touch, timings }
}

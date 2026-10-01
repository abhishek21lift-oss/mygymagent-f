"use client"

import * as React from "react"

import { fetchKioskSession, KioskRequestError, pingApi, type KioskSession } from "./kiosk-api"
import { clearDeviceKey, readDeviceKey, writeDeviceKey } from "./kiosk-storage"

/** Why the setup screen is showing, when it is not simply a fresh device. */
export type SetupNotice = "revoked" | null

export type KioskDeviceState =
  | { status: "loading" }
  | { status: "setup"; notice: SetupNotice }
  | { status: "connecting" }
  | { status: "ready"; deviceKey: string; session: KioskSession }

const REVALIDATE_MS = 5 * 60_000
const RECONNECT_MS = 10_000

/**
 * The kiosk's identity lifecycle: read the stored key, ask the API who
 * that key is, and keep asking.
 *
 * Re-checking every few minutes is how a kiosk notices it was revoked
 * from Branches without waiting for a member to be turned away by a 401.
 * A network failure is never treated as revocation: a kiosk that cannot
 * reach the API keeps its key and shows "connecting" until it can.
 */
export function useKioskDevice() {
  const [state, setState] = React.useState<KioskDeviceState>({ status: "loading" })
  const keyRef = React.useRef<string | null>(null)

  const disconnect = React.useCallback((notice: SetupNotice) => {
    clearDeviceKey()
    keyRef.current = null
    setState({ status: "setup", notice })
  }, [])

  const resolve = React.useCallback(
    async (key: string, { quiet }: { quiet: boolean }) => {
      try {
        const session = await fetchKioskSession(key)
        if (keyRef.current !== key) return
        setState({ status: "ready", deviceKey: key, session })
      } catch (error) {
        if (keyRef.current !== key) return
        if (error instanceof KioskRequestError && error.failure === "unauthorized") {
          disconnect("revoked")
          return
        }
        // Unreachable or rate-limited: keep the key. A screen already in
        // use stays in use (check-in failures are handled per attempt);
        // one still starting up says it is connecting.
        if (!quiet) setState({ status: "connecting" })
      }
    },
    [disconnect],
  )

  // Storage is read after mount, not during render: the page is
  // prerendered without it, and reading it in render would make the
  // server and the first client render disagree.
  React.useEffect(() => {
    let cancelled = false
    void Promise.resolve().then(() => {
      if (cancelled) return
      const key = readDeviceKey()
      keyRef.current = key
      if (!key) setState({ status: "setup", notice: null })
      else void resolve(key, { quiet: false })
    })
    return () => {
      cancelled = true
    }
  }, [resolve])

  // Retry while connecting; re-validate while ready.
  React.useEffect(() => {
    if (state.status !== "connecting" && state.status !== "ready") return
    const timer = setInterval(
      () => {
        const key = keyRef.current
        if (key) void resolve(key, { quiet: state.status === "ready" })
      },
      state.status === "connecting" ? RECONNECT_MS : REVALIDATE_MS,
    )
    return () => clearInterval(timer)
  }, [state.status, resolve])

  /** Verifies a key with the API before keeping it. */
  const connect = React.useCallback(async (key: string): Promise<"ok" | "invalid" | "unreachable"> => {
    const trimmed = key.trim()
    if (!trimmed) return "invalid"
    try {
      const session = await fetchKioskSession(trimmed)
      writeDeviceKey(trimmed)
      keyRef.current = trimmed
      setState({ status: "ready", deviceKey: trimmed, session })
      return "ok"
    } catch (error) {
      if (error instanceof KioskRequestError && (error.failure === "unauthorized" || error.failure === "bad_request")) {
        return "invalid"
      }
      return "unreachable"
    }
  }, [])

  /**
   * Keeps a key the API has just issued to this screen, even if it cannot
   * be verified this second: the key exists only here, so dropping it on
   * a network blip would strand a registered device with no way back.
   */
  const adopt = React.useCallback(
    (key: string) => {
      writeDeviceKey(key)
      keyRef.current = key
      setState({ status: "connecting" })
      void resolve(key, { quiet: false })
    },
    [resolve],
  )

  return { state, connect, adopt, disconnect }
}

export type KioskHealth = "online" | "offline"

/**
 * Online/offline as the member would experience it: the browser's own
 * signal for an obvious drop, plus a periodic `/health` ping for the case
 * the browser cannot see -- Wi-Fi up, API down.
 */
export function useKioskHealth(enabled: boolean): KioskHealth {
  const [health, setHealth] = React.useState<KioskHealth>("online")

  React.useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const check = async () => {
      const ok = typeof navigator !== "undefined" && navigator.onLine === false ? false : await pingApi()
      if (!cancelled) setHealth(ok ? "online" : "offline")
    }
    const goOffline = () => setHealth("offline")
    const goOnline = () => void check()
    window.addEventListener("offline", goOffline)
    window.addEventListener("online", goOnline)
    void check()
    return () => {
      cancelled = true
      window.removeEventListener("offline", goOffline)
      window.removeEventListener("online", goOnline)
    }
  }, [enabled])

  React.useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const timer = setInterval(
      async () => {
        const ok = await pingApi()
        if (!cancelled) setHealth(ok ? "online" : "offline")
      },
      health === "offline" ? 10_000 : 30_000,
    )
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [enabled, health])

  return health
}

/**
 * Keeps the display awake while the kiosk is showing, where the browser
 * supports it. A kiosk that dims to black looks broken. Re-acquired when
 * the page becomes visible again, since browsers drop the lock on hide.
 */
export function useScreenWakeLock(enabled: boolean) {
  React.useEffect(() => {
    if (!enabled) return
    type WakeLockSentinel = { release: () => Promise<void> }
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinel> }
    }
    if (!nav.wakeLock) return
    let sentinel: WakeLockSentinel | null = null
    let cancelled = false
    const acquire = async () => {
      try {
        const lock = await nav.wakeLock!.request("screen")
        if (cancelled) void lock.release().catch(() => {})
        else sentinel = lock
      } catch {
        // Denied or unsupported here: the screen just follows its own settings.
      }
    }
    const onVisible = () => {
      if (document.visibilityState === "visible") void acquire()
    }
    void acquire()
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      cancelled = true
      document.removeEventListener("visibilitychange", onVisible)
      void sentinel?.release().catch(() => {})
    }
  }, [enabled])
}

"use client"

import * as React from "react"
import { Loader2, WifiOff } from "lucide-react"

import { BrandLogo } from "@/components/shared/brand-logo"
import type { KioskSession } from "@/lib/kiosk/kiosk-api"
import { isResultPhase, resultDelay, type KioskPhase, type KioskTimings } from "@/lib/kiosk/kiosk-machine"
import { denialCopy, failureCopy, identifierFromScan, identifierFromTyped } from "@/lib/kiosk/kiosk-messages"
import { useKioskCheckIn } from "@/lib/kiosk/use-kiosk-check-in"
import {
  useKioskDevice,
  useKioskHealth,
  useScreenWakeLock,
  type KioskHealth,
} from "@/lib/kiosk/use-kiosk-device"
import { WedgeBuffer } from "@/lib/kiosk/wedge-scanner"
import { KioskHeader, KioskHome } from "./kiosk-home"
import { KioskKeypad } from "./kiosk-keypad"
import { KioskResult } from "./kiosk-result"
import { KioskScanner } from "./kiosk-scanner"
import { KioskSetup } from "./kiosk-setup"
import { KioskStatus } from "./kiosk-status"

function Aurora({ tone }: { tone: "success" | "denied" | "error" | null }) {
  return (
    <>
      <div className="kiosk-aurora" aria-hidden>
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="kiosk-wash" data-tone={tone ?? undefined} aria-hidden />
    </>
  )
}

function announce(phase: KioskPhase): string {
  switch (phase.name) {
    case "ready":
      return ""
    case "scanning":
      return "Camera on. Hold your QR code up to the screen."
    case "entering":
      return "Enter your member ID."
    case "verifying":
      return "Checking you in."
    case "success":
      return `Welcome, ${phase.firstName}. ${phase.repeat ? "You’re already checked in." : "Check-in successful."}`
    case "denied": {
      const copy = denialCopy(phase.denial)
      return `${copy.title}. ${copy.body} Please contact reception.`
    }
    case "error": {
      const copy = failureCopy(phase.failure)
      return `${copy.title}. ${copy.body}`
    }
  }
}

/**
 * `/kiosk`: a self-service check-in screen.
 *
 * Starts in setup until the screen holds a working kiosk key, then runs
 * the check-in loop for as long as that key stays valid. If the key is
 * revoked from Branches, the next session check or check-in attempt
 * returns the screen to setup with a note saying so.
 */
export function KioskApp({ timings }: { timings?: Partial<KioskTimings> }) {
  const { state, connect, adopt, disconnect } = useKioskDevice()
  const health = useKioskHealth(state.status === "ready")
  useScreenWakeLock(state.status === "ready")

  return (
    <main className="kiosk-root flex min-h-svh flex-col">
      {state.status === "ready" ? (
        <KioskTerminal
          key={state.deviceKey}
          deviceKey={state.deviceKey}
          session={state.session}
          health={health}
          timings={timings}
          onUnauthorized={() => disconnect("revoked")}
          onDisconnect={() => disconnect(null)}
        />
      ) : (
        <>
          <Aurora tone={null} />
          <div className="flex flex-1 flex-col px-4 sm:px-8">
            {state.status === "setup" ? (
              <KioskSetup notice={state.notice} connect={connect} adopt={adopt} />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
                <BrandLogo className="h-14" priority />
                {state.status === "connecting" ? (
                  <>
                    <span className="kiosk-glass flex size-20 items-center justify-center rounded-full text-indigo-500">
                      <WifiOff className="size-9" aria-hidden />
                    </span>
                    <div role="status">
                      <p className="text-2xl font-semibold">Connecting to the gym…</p>
                      <p className="mt-2 text-lg text-[var(--kiosk-ink-soft)]">
                        This screen will be ready as soon as it’s back online.
                      </p>
                    </div>
                  </>
                ) : (
                  <Loader2 className="kiosk-spinner size-10 text-violet-600" aria-label="Loading" />
                )}
              </div>
            )}
          </div>
        </>
      )}
    </main>
  )
}

function KioskTerminal({
  deviceKey,
  session,
  health,
  timings,
  onUnauthorized,
  onDisconnect,
}: {
  deviceKey: string
  session: KioskSession
  health: KioskHealth
  timings?: Partial<KioskTimings>
  onUnauthorized: () => void
  onDisconnect: () => void
}) {
  const machine = useKioskCheckIn({ deviceKey, onUnauthorized, timings })
  const { phase, submit, rejectLocally, startScan, startEntry, cancel, reset, touch } = machine

  const handleScan = React.useCallback(
    (text: string) => {
      const identifier = identifierFromScan(text)
      if (identifier) void submit(identifier)
      else rejectLocally("UNREADABLE", `raw:${text.trim()}`)
    },
    [submit, rejectLocally],
  )

  const handleTyped = React.useCallback(
    (text: string) => {
      const identifier = identifierFromTyped(text)
      if (identifier) void submit(identifier)
    },
    [submit],
  )

  // A USB / Bluetooth QR reader types its code; accept it on READY and
  // while the camera is open, never over the keypad (where typing is
  // the member's own).
  const wedgeActive = (phase.name === "ready" || phase.name === "scanning") && health === "online"
  React.useEffect(() => {
    if (!wedgeActive) return
    const buffer = new WedgeBuffer()
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return
      const code = buffer.push(event.key, event.timeStamp || performance.now())
      if (code) {
        event.preventDefault()
        handleScan(code)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [wedgeActive, handleScan])

  // Hide the browser's chrome once someone touches the screen. The
  // Fullscreen API needs a user gesture, so it cannot happen on load;
  // a browser launched in its own kiosk mode is already there.
  React.useEffect(() => {
    const onFirstTouch = () => {
      const root = document.documentElement
      if (!document.fullscreenElement && root.requestFullscreen) {
        root.requestFullscreen({ navigationUI: "hide" }).catch(() => {})
      }
    }
    window.addEventListener("pointerdown", onFirstTouch, { once: true })
    return () => window.removeEventListener("pointerdown", onFirstTouch)
  }, [])

  const tone =
    phase.name === "success" ? "success" : phase.name === "denied" ? "denied" : phase.name === "error" ? "error" : null

  return (
    <>
      <Aurora tone={tone} />
      <div
        className="flex flex-1 flex-col px-4 pb-5 pt-5 sm:px-10 sm:pt-8"
        onContextMenu={(event) => event.preventDefault()}
      >
        <KioskHeader session={session} />

        <section className="flex flex-1 items-center justify-center py-[clamp(1rem,3vh,2rem)]" aria-label="Check in">
          {phase.name === "ready" && (
            <KioskHome session={session} health={health} onScan={startScan} onEnterId={startEntry} />
          )}
          {phase.name === "scanning" && (
            <KioskScanner onDetected={handleScan} onCancel={cancel} onUseKeypad={startEntry} />
          )}
          {phase.name === "entering" && (
            <KioskKeypad onSubmit={handleTyped} onCancel={cancel} onScanInstead={startScan} onActivity={touch} />
          )}
          {(phase.name === "verifying" || isResultPhase(phase)) && (
            <KioskResult
              phase={phase as Extract<KioskPhase, { name: "verifying" | "success" | "denied" | "error" }>}
              branchName={session.branch.name}
              timeZone={session.branch.timezone}
              delayMs={resultDelay(phase, machine.timings)}
              onDone={reset}
              onRetry={reset}
            />
          )}
        </section>

        <footer className="flex items-center justify-between gap-4">
          <KioskStatus session={session} health={health} onDisconnect={onDisconnect} />
          <span className="hidden items-center gap-2 text-sm text-[var(--kiosk-ink-faint)] sm:flex">
            Powered by
            <BrandLogo className="h-5 opacity-80" decorative />
          </span>
        </footer>
      </div>
      <p className="sr-only" aria-live="assertive" aria-atomic="true">
        {announce(phase)}
      </p>
    </>
  )
}

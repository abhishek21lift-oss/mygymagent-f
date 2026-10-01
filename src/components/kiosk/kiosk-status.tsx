"use client"

import * as React from "react"
import { MonitorSmartphone, Unplug, X } from "lucide-react"

import type { KioskSession } from "@/lib/kiosk/kiosk-api"
import type { KioskHealth } from "@/lib/kiosk/use-kiosk-device"

const HOLD_MS = 3_000

/**
 * The small device-health chip in the corner, and the staff panel behind
 * it.
 *
 * The chip is all a member sees: a dot and a word. Holding it for three
 * seconds (or Ctrl+Alt+K on a keyboard) opens the staff panel -- which
 * device this is, and Disconnect. The panel never shows the device key;
 * there is nothing on this screen that can. Disconnecting only forgets
 * the key on this screen; revoking it for good is done from Branches.
 */
export function KioskStatus({
  session,
  health,
  onDisconnect,
}: {
  session: KioskSession
  health: KioskHealth
  onDisconnect: () => void
}) {
  const [panelOpen, setPanelOpen] = React.useState(false)
  const [confirming, setConfirming] = React.useState(false)
  const holdTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const startHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current)
    holdTimer.current = setTimeout(() => setPanelOpen(true), HOLD_MS)
  }
  const endHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current)
    holdTimer.current = null
  }
  React.useEffect(() => endHold, [])

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.altKey && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setPanelOpen(true)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const close = () => {
    setPanelOpen(false)
    setConfirming(false)
  }

  // Close the panel on its own after a while, so a member never finds it
  // left open.
  React.useEffect(() => {
    if (!panelOpen) return
    const timer = setTimeout(close, 30_000)
    return () => clearTimeout(timer)
  }, [panelOpen])

  const online = health === "online"

  return (
    <>
      <button
        type="button"
        onPointerDown={startHold}
        onPointerUp={endHold}
        onPointerLeave={endHold}
        onPointerCancel={endHold}
        onContextMenu={(event) => event.preventDefault()}
        aria-label={`${online ? "Online" : "Offline"} · ${session.device.name}`}
        className="kiosk-glass inline-flex h-10 items-center gap-2.5 rounded-full px-4 text-sm font-medium text-[var(--kiosk-ink-soft)]"
      >
        <span
          className={`size-2.5 rounded-full ${online ? "kiosk-dot-online bg-emerald-500" : "kiosk-dot-offline bg-rose-500"}`}
          aria-hidden
        />
        <span>{online ? "Online" : "Offline"}</span>
        <span aria-hidden className="text-[var(--kiosk-ink-faint)]">
          ·
        </span>
        <span className="max-w-[10rem] truncate">{session.device.name}</span>
      </button>

      {panelOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="kiosk-staff-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 p-4 backdrop-blur-sm"
          onClick={close}
        >
          <div
            className="kiosk-rise kiosk-glass-strong w-full max-w-md rounded-3xl p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-[image:var(--kiosk-primary)] text-white">
                  <MonitorSmartphone className="size-5" aria-hidden />
                </span>
                <h2 id="kiosk-staff-title" className="text-lg font-semibold">
                  Staff · this screen
                </h2>
              </div>
              <button
                type="button"
                onClick={close}
                className="kiosk-press flex size-10 items-center justify-center rounded-full bg-white/80"
                aria-label="Close"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>

            <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[0.95rem]">
              <dt className="text-[var(--kiosk-ink-faint)]">Gym</dt>
              <dd className="font-medium">{session.organization.name}</dd>
              <dt className="text-[var(--kiosk-ink-faint)]">Branch</dt>
              <dd className="font-medium">{session.branch.name}</dd>
              <dt className="text-[var(--kiosk-ink-faint)]">Device</dt>
              <dd className="font-medium">{session.device.name}</dd>
              <dt className="text-[var(--kiosk-ink-faint)]">Connection</dt>
              <dd className={`font-medium ${online ? "text-emerald-700" : "text-rose-600"}`}>
                {online ? "Connected" : "Can't reach the gym system"}
              </dd>
            </dl>

            {confirming ? (
              <div className="mt-6 rounded-2xl bg-rose-50 p-4">
                <p className="font-semibold text-rose-700">Disconnect this screen?</p>
                <p className="mt-1 text-sm text-rose-700/80">
                  It will stop checking members in until a staff member sets it up again. To block its key
                  everywhere, revoke the device from Branches.
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={onDisconnect}
                    className="kiosk-press h-11 flex-1 rounded-xl bg-rose-600 font-semibold text-white"
                  >
                    Disconnect
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    className="kiosk-press h-11 flex-1 rounded-xl bg-white font-semibold"
                  >
                    Keep
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="kiosk-press mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white/90 font-semibold text-rose-600"
              >
                <Unplug className="size-5" aria-hidden />
                Disconnect this screen
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}

"use client"

import * as React from "react"
import { Keyboard, QrCode, ScanLine } from "lucide-react"

import { BrandLogo } from "@/components/shared/brand-logo"
import type { KioskSession } from "@/lib/kiosk/kiosk-api"
import type { KioskHealth } from "@/lib/kiosk/use-kiosk-device"

const CLOCK_STEP_MS = 15_000

function subscribeClock(onChange: () => void) {
  const timer = setInterval(onChange, CLOCK_STEP_MS)
  return () => clearInterval(timer)
}

/** The wall clock, in the branch's timezone. Empty on the server, so the
 * prerendered page never carries a stale time. */
function useClock(timeZone: string | null) {
  const tick = React.useSyncExternalStore(
    subscribeClock,
    () => Math.floor(Date.now() / CLOCK_STEP_MS),
    () => 0,
  )
  return React.useMemo(() => {
    if (!tick) return { time: "", date: "" }
    const now = new Date()
    const zone = timeZone ? { timeZone } : {}
    try {
      return {
        time: new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", ...zone }).format(now),
        date: new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long", ...zone }).format(now),
      }
    } catch {
      return {
        time: new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(now),
        date: new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" }).format(now),
      }
    }
  }, [tick, timeZone])
}

/** The gym's own logo when it has one, the product mark otherwise. */
export function GymMark({ session, className }: { session: KioskSession; className?: string }) {
  const [broken, setBroken] = React.useState(false)
  if (session.organization.logoUrl && !broken) {
    return (
      // A signed object-storage URL: not a next/image domain.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={session.organization.logoUrl}
        alt={session.organization.name}
        className={className ?? "h-9 w-auto max-w-[9rem] object-contain sm:h-12 sm:max-w-[12rem]"}
        onError={() => setBroken(true)}
        draggable={false}
      />
    )
  }
  return <BrandLogo className={className ?? "h-9 sm:h-12"} priority />
}

export function KioskHeader({ session }: { session: KioskSession }) {
  const clock = useClock(session.branch.timezone)
  return (
    <header className="flex items-center justify-between gap-4 sm:gap-6">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <div className="kiosk-glass flex h-12 shrink-0 items-center rounded-2xl px-3 sm:h-16 sm:px-4">
          <GymMark session={session} />
        </div>
        <div className="min-w-0">
          <p className="line-clamp-2 text-[clamp(1rem,2.6vmin,1.5rem)] font-semibold leading-tight tracking-tight">
            {session.organization.name}
          </p>
          <p className="truncate text-[clamp(0.9rem,2vmin,1.15rem)] text-[var(--kiosk-ink-soft)]">
            {session.branch.name}
          </p>
        </div>
      </div>
      <div className="shrink-0 text-right" aria-hidden={!clock.time}>
        <p className="whitespace-nowrap text-[clamp(1.4rem,4.6vmin,2.75rem)] font-semibold leading-none tracking-tight tabular-nums">
          {clock.time}
        </p>
        <p className="mt-1 hidden whitespace-nowrap text-[clamp(0.9rem,1.9vmin,1.1rem)] text-[var(--kiosk-ink-soft)] sm:block">
          {clock.date}
        </p>
      </div>
    </header>
  )
}

/**
 * READY: one thing to do, readable from across the lobby. The QR button
 * dominates because it is the fast path; member ID sits under it as the
 * fallback. Both pause while the screen is offline, with one calm line
 * saying why -- the check-in would fail anyway, and failing after a tap
 * is worse than not offering it.
 */
export function KioskHome({
  session,
  health,
  onScan,
  onEnterId,
}: {
  session: KioskSession
  health: KioskHealth
  onScan: () => void
  onEnterId: () => void
}) {
  const offline = health === "offline"
  return (
    <div className="flex w-full max-w-3xl flex-col items-center text-center">
      <p className="kiosk-rise inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-[clamp(0.9rem,2vmin,1.05rem)] font-semibold text-violet-700 shadow-sm">
        <ScanLine className="size-4" aria-hidden />
        Self check-in
      </p>
      <h1 className="kiosk-rise kiosk-rise-2 mt-[clamp(1rem,3vh,1.5rem)] text-[clamp(2.4rem,8.5vmin,5.75rem)] font-bold leading-[1.02] tracking-[-0.03em]">
        Ready to{" "}
        <span className="bg-[image:var(--kiosk-primary)] bg-clip-text text-transparent">train?</span>
      </h1>
      <p className="kiosk-rise kiosk-rise-3 mt-[clamp(0.5rem,2vh,1rem)] text-[clamp(1.05rem,2.8vmin,1.65rem)] text-[var(--kiosk-ink-soft)]">
        Check in at {session.branch.name} in seconds.
      </p>

      <div className="kiosk-rise kiosk-rise-4 mt-[clamp(1.5rem,6vh,3.25rem)] flex w-full flex-col items-center gap-[clamp(0.75rem,2vh,1rem)]">
        <button
          type="button"
          onClick={onScan}
          disabled={offline}
          className="kiosk-press kiosk-primary relative flex h-[clamp(5.25rem,14vmin,9rem)] w-full max-w-[42rem] items-center justify-center gap-[clamp(0.75rem,2.5vmin,1.25rem)] rounded-[2rem] px-5 text-[clamp(1.3rem,4.4vmin,2.6rem)] font-semibold tracking-tight"
        >
          {!offline && <span className="kiosk-primary-glow" aria-hidden />}
          <span className="flex size-[clamp(2.75rem,8.5vmin,4.75rem)] shrink-0 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/40">
            <QrCode className="size-[60%]" aria-hidden />
          </span>
          Scan QR to Check In
        </button>
        <button
          type="button"
          onClick={onEnterId}
          disabled={offline}
          className="kiosk-press kiosk-glass flex h-[clamp(4rem,10vmin,5.5rem)] w-full max-w-[42rem] items-center justify-center gap-3 rounded-[1.6rem] text-[clamp(1.1rem,3vmin,1.6rem)] font-semibold text-[var(--kiosk-ink)]"
        >
          <Keyboard className="size-[clamp(1.5rem,3.4vmin,2rem)] text-violet-600" aria-hidden />
          Enter Member ID
        </button>
      </div>

      <p
        role="status"
        className={`mt-[clamp(1rem,4vh,2rem)] text-[clamp(0.95rem,2.2vmin,1.25rem)] transition-opacity duration-300 ${
          offline ? "font-semibold text-rose-600 opacity-100" : "text-[var(--kiosk-ink-faint)] opacity-100"
        }`}
      >
        {offline
          ? "Check-in is paused while this screen reconnects. Reception can check you in."
          : "Open the member app and tap Show check-in code."}
      </p>
    </div>
  )
}

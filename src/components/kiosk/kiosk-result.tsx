"use client"

import * as React from "react"
import { Hand, RotateCcw, ShieldAlert, WifiOff } from "lucide-react"

import type { KioskPhase } from "@/lib/kiosk/kiosk-machine"
import { denialCopy, failureCopy } from "@/lib/kiosk/kiosk-messages"

function formatTime(iso: string | null, timeZone: string | null) {
  const date = iso ? new Date(iso) : new Date()
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
      ...(timeZone ? { timeZone } : {}),
    }).format(date)
  } catch {
    // An unknown zone name in branch settings: fall back to the screen's.
    return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date)
  }
}

function Countdown({ ms, tone }: { ms: number; tone: string }) {
  return (
    <div className="mt-[clamp(1rem,4vh,2.5rem)] h-1.5 w-56 overflow-hidden rounded-full bg-white/70" aria-hidden>
      <div className={`kiosk-countdown h-full rounded-full ${tone}`} style={{ animationDuration: `${ms}ms` }} />
    </div>
  )
}

function SuccessMark() {
  return (
    <div className="kiosk-mark relative size-[clamp(6rem,17vmin,12rem)] shrink-0">
      <span className="kiosk-mark-ring bg-emerald-400/40" />
      <span className="kiosk-mark-ring bg-cyan-400/30 [animation-delay:420ms]" />
      <div className="relative flex size-full items-center justify-center rounded-full bg-[image:var(--kiosk-success)] shadow-[0_30px_60px_-20px_rgba(16,185,129,0.65)]">
        <svg viewBox="0 0 52 52" className="size-1/2" aria-hidden>
          <path
            className="kiosk-check-path"
            d="M14 27.5 L22.5 36 L39 18"
            fill="none"
            stroke="white"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  )
}

function IconMark({ tone, children }: { tone: "denied" | "error"; children: React.ReactNode }) {
  return (
    <div className="kiosk-mark relative size-[clamp(5.5rem,14vmin,10rem)] shrink-0">
      <span className={`kiosk-mark-ring ${tone === "denied" ? "bg-amber-300/40" : "bg-indigo-300/40"}`} />
      <div
        className={`relative flex size-full items-center justify-center rounded-full text-white ${
          tone === "denied"
            ? "bg-[image:var(--kiosk-denied)] shadow-[0_30px_60px_-20px_rgba(244,63,94,0.55)]"
            : "bg-[image:var(--kiosk-error)] shadow-[0_30px_60px_-20px_rgba(99,102,241,0.55)]"
        }`}
      >
        {children}
      </div>
    </div>
  )
}

/**
 * VERIFYING and the three outcomes. Each outcome is one glanceable mark,
 * one headline, one line of what to do -- and returns to READY on its
 * own, with a bar showing how long until it does. Tapping Done returns
 * early, so the next member is never kept waiting by the last one's
 * message.
 */
export function KioskResult({
  phase,
  branchName,
  timeZone,
  delayMs,
  onDone,
  onRetry,
}: {
  phase: Extract<KioskPhase, { name: "verifying" | "success" | "denied" | "error" }>
  branchName: string
  timeZone: string | null
  delayMs: number | null
  onDone: () => void
  onRetry: () => void
}) {
  const headingRef = React.useRef<HTMLHeadingElement | null>(null)
  React.useEffect(() => {
    if (phase.name !== "verifying") headingRef.current?.focus()
  }, [phase.name])

  if (phase.name === "verifying") {
    return (
      <div className="kiosk-rise flex flex-col items-center text-center" aria-busy="true">
        <div className="relative size-32">
          <span className="kiosk-spinner absolute inset-0 rounded-full border-[6px] border-violet-200/80 border-t-violet-600 border-r-fuchsia-500" />
        </div>
        <h2 className="mt-[clamp(1.25rem,5vh,2.5rem)] text-[clamp(1.9rem,6vmin,3.5rem)] font-semibold tracking-tight">Checking you in…</h2>
        <p
          className={`mt-3 text-[clamp(1.05rem,2.6vmin,1.4rem)] text-[var(--kiosk-ink-soft)] transition-opacity duration-500 ${
            phase.slow ? "opacity-100" : "opacity-0"
          }`}
        >
          Still working on it — hang tight.
        </p>
      </div>
    )
  }

  if (phase.name === "success") {
    return (
      <div className="flex flex-col items-center text-center">
        <SuccessMark />
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="kiosk-rise kiosk-rise-2 mt-[clamp(1.25rem,5vh,2.5rem)] text-[clamp(2.2rem,7.5vmin,5rem)] font-bold leading-[1.05] tracking-tight outline-none"
        >
          Welcome, {phase.firstName} <span aria-hidden>👋</span>
        </h2>
        <p className="kiosk-rise kiosk-rise-3 mt-[clamp(0.5rem,2vh,1rem)] text-[clamp(1.2rem,3.4vmin,1.9rem)] font-medium text-emerald-700">
          {phase.repeat ? "You’re already checked in" : "Check-in successful"}
        </p>
        <p className="kiosk-rise kiosk-rise-4 mt-2 text-[clamp(1rem,2.4vmin,1.3rem)] text-[var(--kiosk-ink-soft)]">
          {formatTime(phase.checkedInAt, timeZone)} · {branchName} · Have a great workout!
        </p>
        {delayMs !== null && <Countdown ms={delayMs} tone="bg-[image:var(--kiosk-success)]" />}
        <button
          type="button"
          onClick={onDone}
          className="kiosk-press kiosk-glass mt-[clamp(0.75rem,3vh,2rem)] h-14 rounded-2xl px-10 text-lg font-semibold text-[var(--kiosk-ink)]"
        >
          Done
        </button>
      </div>
    )
  }

  const isDenied = phase.name === "denied"
  const copy = isDenied ? denialCopy(phase.denial) : failureCopy(phase.failure)
  const offline = !isDenied && (phase.failure === "network" || phase.failure === "timeout")

  return (
    <div className="flex max-w-2xl flex-col items-center text-center">
      <IconMark tone={isDenied ? "denied" : "error"}>
        {isDenied ? (
          <Hand className="size-1/2" aria-hidden />
        ) : offline ? (
          <WifiOff className="size-1/2" aria-hidden />
        ) : (
          <ShieldAlert className="size-1/2" aria-hidden />
        )}
      </IconMark>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="kiosk-rise kiosk-rise-2 mt-[clamp(1.25rem,5vh,2.5rem)] text-[clamp(1.9rem,6vmin,3.5rem)] font-bold leading-tight tracking-tight outline-none"
      >
        {copy.title}
      </h2>
      <p className="kiosk-rise kiosk-rise-3 mt-[clamp(0.5rem,2vh,1rem)] text-[clamp(1.05rem,2.8vmin,1.5rem)] text-[var(--kiosk-ink-soft)]">{copy.body}</p>
      <p className="kiosk-rise kiosk-rise-4 kiosk-glass mt-[clamp(1rem,3.5vh,1.75rem)] rounded-full px-6 py-3 text-[clamp(1rem,2.2vmin,1.2rem)] font-semibold text-[var(--kiosk-ink)]">
        Need help? Please contact reception.
      </p>
      {delayMs !== null && (
        <Countdown
          ms={delayMs}
          tone={isDenied ? "bg-[image:var(--kiosk-denied)]" : "bg-[image:var(--kiosk-error)]"}
        />
      )}
      <div className="mt-[clamp(0.75rem,3vh,2rem)] flex gap-3">
        {!isDenied && (
          <button
            type="button"
            onClick={onRetry}
            className="kiosk-press kiosk-primary flex h-14 items-center gap-2 rounded-2xl px-8 text-lg font-semibold"
          >
            <RotateCcw className="size-5" aria-hidden />
            Try again
          </button>
        )}
        <button
          type="button"
          onClick={onDone}
          className="kiosk-press kiosk-glass h-14 rounded-2xl px-10 text-lg font-semibold text-[var(--kiosk-ink)]"
        >
          {isDenied ? "OK" : "Done"}
        </button>
      </div>
    </div>
  )
}

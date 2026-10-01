"use client"

import * as React from "react"
import { ArrowRight, CaseSensitive, Delete, Grid3x3, QrCode } from "lucide-react"

const MAX_LENGTH = 24
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const

/**
 * Member ID entry -- the fallback when a member has no phone to hand.
 *
 * The number on a member card (`M-000123`) works typed as just its digits
 * (`123`): the API tries the issued shape after an exact match. So the
 * default is a large number pad, and "Letters" swaps in a real text field
 * (the system keyboard, or a physical one) for gyms whose imported codes
 * carry letters. A physical keyboard also works on the number pad, for
 * kiosks with one attached.
 */
export function KioskKeypad({
  onSubmit,
  onCancel,
  onScanInstead,
  onActivity,
}: {
  onSubmit: (value: string) => void
  onCancel: () => void
  onScanInstead: () => void
  onActivity: () => void
}) {
  const [value, setValue] = React.useState("")
  const [letters, setLetters] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  const update = React.useCallback(
    (next: string) => {
      setValue(next.slice(0, MAX_LENGTH))
      onActivity()
    },
    [onActivity],
  )

  const submit = React.useCallback(() => {
    const trimmed = value.trim()
    if (trimmed) onSubmit(trimmed)
  }, [onSubmit, value])

  React.useEffect(() => {
    if (letters) inputRef.current?.focus()
  }, [letters])

  // Physical keyboard on the number pad.
  React.useEffect(() => {
    if (letters) return
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (/^[0-9a-zA-Z-]$/.test(event.key)) {
        event.preventDefault()
        update(value + event.key.toUpperCase())
      } else if (event.key === "Backspace") {
        event.preventDefault()
        update(value.slice(0, -1))
      } else if (event.key === "Enter") {
        event.preventDefault()
        submit()
      } else if (event.key === "Escape") {
        event.preventDefault()
        onCancel()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [letters, value, update, submit, onCancel])

  const keyClass =
    "kiosk-press kiosk-glass flex h-[clamp(3.75rem,10.5vmin,5.75rem)] items-center justify-center rounded-3xl text-[clamp(1.6rem,4.6vmin,2.5rem)] font-medium tabular-nums text-[var(--kiosk-ink)]"
  const chipClass =
    "kiosk-press kiosk-glass flex h-14 items-center gap-2 rounded-2xl px-5 text-base font-semibold text-[var(--kiosk-ink-soft)]"

  // One column on phones and portrait screens; on a wide landscape kiosk
  // the pad sits beside the field so nothing is pushed off the bottom.
  return (
    <form
      className="kiosk-rise grid w-full max-w-md items-center gap-[clamp(1rem,3vh,1.5rem)] lg:landscape:max-w-5xl lg:landscape:grid-cols-2 lg:landscape:gap-12"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <div className="flex flex-col items-center gap-[clamp(1rem,3vh,1.5rem)]">
        <div className="text-center">
          <h2 className="text-[clamp(1.6rem,5vmin,2.75rem)] font-semibold tracking-tight">Enter your member ID</h2>
          <p className="mt-2 text-[clamp(1rem,2.4vmin,1.25rem)] text-[var(--kiosk-ink-soft)]">
            It’s on your membership card — just the numbers is fine.
          </p>
        </div>

        <label htmlFor="kiosk-member-id" className="sr-only">
          Member ID
        </label>
        <div className="kiosk-glass-strong flex h-[clamp(4.25rem,12vmin,6rem)] w-full items-center justify-center rounded-3xl px-6">
          {letters ? (
            <input
              id="kiosk-member-id"
              ref={inputRef}
              value={value}
              onChange={(event) => update(event.target.value.toUpperCase())}
              onKeyDown={(event) => {
                if (event.key === "Escape") onCancel()
              }}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="characters"
              spellCheck={false}
              enterKeyHint="go"
              maxLength={MAX_LENGTH}
              placeholder="e.g. M-000123"
              className="w-full bg-transparent text-center text-[clamp(1.75rem,5vmin,3rem)] font-semibold tracking-[0.12em] text-[var(--kiosk-ink)] outline-none placeholder:text-2xl placeholder:font-normal placeholder:tracking-normal placeholder:text-[var(--kiosk-ink-faint)]"
            />
          ) : (
            <output
              id="kiosk-member-id"
              aria-live="polite"
              className={`truncate text-[clamp(1.75rem,5vmin,3rem)] font-semibold tabular-nums tracking-[0.16em] ${
                value ? "text-[var(--kiosk-ink)]" : "text-[var(--kiosk-ink-faint)]"
              }`}
            >
              {value || "• • • • • •"}
            </output>
          )}
        </div>

        <div className="flex w-full flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setLetters((on) => !on)
              onActivity()
            }}
            className={chipClass}
          >
            {letters ? <Grid3x3 className="size-5" aria-hidden /> : <CaseSensitive className="size-5" aria-hidden />}
            {letters ? "Number pad" : "Letters"}
          </button>
          <button type="button" onClick={onScanInstead} className={chipClass}>
            <QrCode className="size-5" aria-hidden />
            Scan QR instead
          </button>
          <button type="button" onClick={onCancel} className={chipClass}>
            Cancel
          </button>
        </div>
      </div>

      {letters ? (
        <button
          type="submit"
          disabled={!value.trim()}
          className="kiosk-press kiosk-primary flex h-20 w-full items-center justify-center gap-3 rounded-3xl text-2xl font-semibold"
        >
          Check in
          <ArrowRight className="size-7" aria-hidden />
        </button>
      ) : (
        <div className="grid w-full grid-cols-3 gap-3" role="group" aria-label="Number pad">
          {KEYS.map((key) => (
            <button key={key} type="button" className={keyClass} onClick={() => update(value + key)}>
              {key}
            </button>
          ))}
          <button
            type="button"
            className={keyClass}
            onClick={() => update(value.slice(0, -1))}
            disabled={!value}
            aria-label="Delete last digit"
          >
            <Delete className="size-8" aria-hidden />
          </button>
          <button type="button" className={keyClass} onClick={() => update(value + "0")}>
            0
          </button>
          <button
            type="submit"
            className="kiosk-press kiosk-primary flex h-[clamp(3.75rem,10.5vmin,5.75rem)] items-center justify-center rounded-3xl"
            disabled={!value.trim()}
            aria-label="Check in"
          >
            <ArrowRight className="size-9" aria-hidden />
          </button>
        </div>
      )}
    </form>
  )
}

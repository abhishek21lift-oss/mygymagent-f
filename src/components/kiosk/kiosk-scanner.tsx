"use client"

import * as React from "react"
import type { IScannerControls } from "@zxing/browser"
import { CameraOff, Keyboard, VideoOff, X } from "lucide-react"

type CameraState = "starting" | "scanning" | "denied" | "unavailable" | "unsupported"

/**
 * The camera view for SCANNING.
 *
 * QR only (`BrowserQRCodeReader`) -- a kiosk has no use for product
 * barcodes, and decoding one format is faster per frame. It prefers the
 * front camera, because a member holds their phone up to the screen, and
 * mirrors that preview so moving the phone left moves it left on screen.
 * The camera is released on unmount, which is every way out of SCANNING:
 * a detection, Cancel, or the idle timeout.
 *
 * Every camera failure becomes a sentence and a way forward -- the member
 * ID keypad -- never the browser's own error text.
 */
export function KioskScanner({
  onDetected,
  onCancel,
  onUseKeypad,
}: {
  onDetected: (text: string) => void
  onCancel: () => void
  onUseKeypad: () => void
}) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  // Mounted only after a tap, so this runs in the browser, never on the server.
  const [camera, setCamera] = React.useState<CameraState>(() =>
    typeof navigator !== "undefined" && typeof navigator.mediaDevices?.getUserMedia === "function" ? "starting" : "unsupported",
  )
  const [mirrored, setMirrored] = React.useState(true)
  const onDetectedRef = React.useRef(onDetected)
  React.useEffect(() => {
    onDetectedRef.current = onDetected
  }, [onDetected])

  React.useEffect(() => {
    let controls: IScannerControls | null = null
    let cancelled = false

    if (typeof navigator === "undefined" || typeof navigator.mediaDevices?.getUserMedia !== "function") return

    void (async () => {
      try {
        const { BrowserQRCodeReader } = await import("@zxing/browser")
        if (cancelled || !videoRef.current) return
        const reader = new BrowserQRCodeReader(undefined, { delayBetweenScanAttempts: 120 })
        const started = await reader.decodeFromConstraints(
          { audio: false, video: { facingMode: { ideal: "user" } } },
          videoRef.current,
          (result) => {
            // A null result is zxing's "nothing in this frame".
            const text = result?.getText()
            if (text) onDetectedRef.current(text)
          },
        )
        if (cancelled) {
          started.stop()
          return
        }
        controls = started
        const track = (videoRef.current?.srcObject as MediaStream | null)?.getVideoTracks?.()[0]
        const facing = track?.getSettings?.().facingMode
        // Only a rear camera is shown unmirrored; unknown (most USB
        // webcams) is treated as facing the member.
        setMirrored(facing !== "environment")
        setCamera("scanning")
      } catch (error) {
        if (cancelled) return
        const name = error instanceof Error ? error.name : ""
        setCamera(
          name === "NotAllowedError" || name === "SecurityError" ? "denied" : "unavailable",
        )
      }
    })()

    return () => {
      cancelled = true
      controls?.stop()
    }
  }, [])

  const failed = camera === "denied" || camera === "unavailable" || camera === "unsupported"

  return (
    <div className="kiosk-rise flex w-full max-w-4xl flex-col items-center gap-[clamp(1rem,3vh,1.5rem)]">
      <div className="text-center">
        <h2 className="text-[clamp(1.6rem,5vmin,2.75rem)] font-semibold tracking-tight">
          {failed ? "The camera isn't available" : "Hold your QR code up to the screen"}
        </h2>
        <p className="mt-2 text-[clamp(1rem,2.4vmin,1.25rem)] text-[var(--kiosk-ink-soft)]">
          {camera === "denied"
            ? "This screen isn't allowed to use its camera. You can enter your member ID instead."
            : failed
              ? "You can enter your member ID instead."
              : "Open the member app and tap Show check-in code."}
        </p>
      </div>

      <div className="kiosk-glass-strong relative aspect-[4/3] w-[min(42rem,100%,calc(42svh*4/3))] overflow-hidden rounded-[2rem]">
        <video
          ref={videoRef}
          aria-hidden
          muted
          playsInline
          className="absolute inset-0 size-full object-cover transition-opacity duration-500"
          style={{
            opacity: camera === "scanning" ? 1 : 0,
            transform: mirrored ? "scaleX(-1)" : undefined,
          }}
        />
        {camera === "scanning" && (
          <div aria-hidden className="absolute inset-0">
            <div className="kiosk-scan-frame">
              <span className="kiosk-scan-corner left-0 top-0 rounded-tl-[28px] border-l-[5px] border-t-[5px]" />
              <span className="kiosk-scan-corner right-0 top-0 rounded-tr-[28px] border-r-[5px] border-t-[5px]" />
              <span className="kiosk-scan-corner bottom-0 left-0 rounded-bl-[28px] border-b-[5px] border-l-[5px]" />
              <span className="kiosk-scan-corner bottom-0 right-0 rounded-br-[28px] border-b-[5px] border-r-[5px]" />
              <span className="kiosk-scan-line" />
            </div>
          </div>
        )}
        {camera === "starting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <span className="kiosk-spinner size-12 rounded-full border-4 border-violet-200 border-t-violet-600" />
            <p className="text-lg text-[var(--kiosk-ink-soft)]">Starting camera…</p>
          </div>
        )}
        {failed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <span className="flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-100 to-indigo-100 text-indigo-500">
              {camera === "denied" ? <CameraOff className="size-10" aria-hidden /> : <VideoOff className="size-10" aria-hidden />}
            </span>
          </div>
        )}
      </div>

      <div className="flex w-full max-w-xl flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onUseKeypad}
          className={`kiosk-press flex h-16 flex-1 items-center justify-center gap-3 rounded-2xl text-lg font-semibold ${
            failed ? "kiosk-primary" : "kiosk-glass text-[var(--kiosk-ink)]"
          }`}
        >
          <Keyboard className="size-6" aria-hidden />
          Enter Member ID
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="kiosk-press kiosk-glass flex h-16 flex-1 items-center justify-center gap-3 rounded-2xl text-lg font-semibold text-[var(--kiosk-ink)]"
        >
          <X className="size-6" aria-hidden />
          Cancel
        </button>
      </div>
    </div>
  )
}

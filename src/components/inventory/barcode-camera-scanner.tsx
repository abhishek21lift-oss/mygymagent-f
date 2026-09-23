"use client"

import * as React from "react"
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser"
import { AlertTriangle, Camera, CameraOff, RefreshCw, ScanLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface BarcodeCameraScannerProps {
 onCodeDetected: (code: string) => void
}

export function BarcodeCameraScanner({ onCodeDetected }: BarcodeCameraScannerProps) {
 const videoRef = React.useRef<HTMLVideoElement | null>(null)
 const readerRef = React.useRef<BrowserMultiFormatReader | null>(null)
 const controlsRef = React.useRef<IScannerControls | null>(null)
 const resolvingRef = React.useRef(false)
 const [state, setState] = React.useState<"idle" | "requesting" | "scanning" | "denied" | "unavailable">("idle")
 const [error, setError] = React.useState<string | null>(null)
 const [manualCode, setManualCode] = React.useState("")

 const stop = React.useCallback(() => {
 controlsRef.current?.stop()
 controlsRef.current = null
 setState("idle")
 }, [])

 React.useEffect(() => () => {
 controlsRef.current?.stop()
 controlsRef.current = null
 }, [])

 const detect = React.useCallback((code: string) => {
 const normalized = code.trim()
 if (!normalized || resolvingRef.current) return
 resolvingRef.current = true
 stop()
 onCodeDetected(normalized)
 window.setTimeout(() => {
 resolvingRef.current = false
 }, 500)
 }, [onCodeDetected, stop])

 const start = React.useCallback(async () => {
 if (!videoRef.current) return
 setError(null)
 setState("requesting")
 try {
 readerRef.current ??= new BrowserMultiFormatReader()
 const controls = await readerRef.current.decodeFromVideoDevice(
 undefined,
 videoRef.current,
 (result) => detect(result?.getText() ?? ""),
 )
 controlsRef.current = controls
 setState("scanning")
 } catch (err) {
 setState("idle")
 const name = err instanceof Error ? err.name : ""
 if (name === "NotAllowedError") {
 setState("denied")
 setError("Camera permission was denied. Allow camera access and try again.")
 } else if (name === "NotFoundError" || name === "OverconstrainedError" || name === "NotReadableError") {
 setState("unavailable")
 setError("No usable camera was found on this device.")
 } else {
 setError(err instanceof Error ? err.message : "Could not start the camera.")
 }
 }
 }, [detect])

 const supportsCamera =
 typeof window !== "undefined" &&
 !!navigator.mediaDevices?.getUserMedia

 function submitManual(event: React.FormEvent) {
 event.preventDefault()
 const code = manualCode.trim()
 if (!code) return
 setManualCode("")
 detect(code)
 }

 return (
 <div className="grid gap-4">
 <div className="relative overflow-hidden rounded-lg border bg-stone-950">
 <video
 ref={videoRef}
 muted
 playsInline
 className="aspect-[4/3] w-full object-cover"
 style={{ opacity: state === "scanning" ? 1 : 0 }}
 aria-label="Barcode camera preview"
 />
 {state !== "scanning" && (
 <div className="absolute inset-0 flex min-h-64 flex-col items-center justify-center gap-3 p-6 text-center text-white">
 {state === "denied" || state === "unavailable" ? (
 <CameraOff className="size-10 opacity-70" aria-hidden="true" />
 ) : (
 <ScanLine className="size-10 opacity-70" aria-hidden="true" />
 )}
 <p className="max-w-sm text-sm text-white/75">
 {error ?? (state === "requesting" ? "Starting camera…" : "Point the camera at the product barcode.")}
 </p>
 </div>
 )}
 {state === "scanning" && (
 <div aria-hidden="true" className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 animate-pulse rounded bg-amber-400" />
 )}
 </div>

 {!supportsCamera && (
 <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
 <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
 Camera scanning is not available in this browser. You can enter the barcode manually below.
 </div>
 )}

 <div className="flex flex-wrap gap-2">
 {state === "scanning" ? (
 <Button type="button" variant="outline" onClick={stop}>
 <CameraOff className="size-4" aria-hidden="true" />
 Stop camera
 </Button>
 ) : (
 <Button type="button" onClick={start} disabled={!supportsCamera || state === "requesting"}>
 {state === "requesting" ? <RefreshCw className="size-4 animate-spin" aria-hidden="true" /> : <Camera className="size-4" aria-hidden="true" />}
 {state === "denied" ? "Retry camera" : "Start camera"}
 </Button>
 )}
 </div>

 <form onSubmit={submitManual} className="flex gap-2">
 <Input
 value={manualCode}
 onChange={(event) => setManualCode(event.target.value)}
 placeholder="Or enter barcode manually"
 inputMode="numeric"
 autoComplete="off"
 aria-label="Manual barcode"
 />
 <Button type="submit" variant="secondary" disabled={!manualCode.trim()}>
 Use code
 </Button>
 </form>
 </div>
 )
}

"use client"

import * as React from "react"
import { Camera, ImagePlus, RefreshCw, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type Facing = "user" | "environment"

/**
 * The member's photo: taken on the spot with the device camera, or
 * picked from the gallery. Shows as a round avatar with the initials
 * until there is one.
 */
export function PhotoPicker({
  photo,
  onChange,
  initials,
}: {
  photo: File | null
  onChange: (photo: File | null) => void
  initials: string
}) {
  const [cameraOpen, setCameraOpen] = React.useState(false)
  const [facing, setFacing] = React.useState<Facing>("user")
  const [error, setError] = React.useState<string | null>(null)
  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const streamRef = React.useRef<MediaStream | null>(null)
  const fileRef = React.useRef<HTMLInputElement | null>(null)

  const preview = React.useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo])
  React.useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview)
    },
    [preview],
  )

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }

  React.useEffect(() => stopCamera, [])

  async function startCamera(next: Facing = facing) {
    setError(null)
    stopCamera()
    setCameraOpen(true)
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser can't open the camera. Choose a photo from the gallery instead.")
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: next }, width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      })
      streamRef.current = stream
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          void videoRef.current.play()
        }
      })
    } catch {
      setError("Couldn't open the camera. Allow camera access, or choose a photo from the gallery.")
    }
  }

  function closeCamera() {
    stopCamera()
    setCameraOpen(false)
    setError(null)
  }

  function capture() {
    const video = videoRef.current
    if (!video?.videoWidth || !video.videoHeight) return
    const scale = Math.min(1, 1000 / Math.max(video.videoWidth, video.videoHeight))
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    const context = canvas.getContext("2d")
    if (!context) return
    // Mirror the front camera so the photo matches what was on screen.
    if (facing === "user") {
      context.translate(canvas.width, 0)
      context.scale(-1, 1)
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        onChange(new File([blob], `member-photo-${Date.now()}.jpg`, { type: "image/jpeg" }))
        closeCamera()
      },
      "image/jpeg",
      0.88,
    )
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- a local blob URL
          <img src={preview} alt="Member photo" className="size-20 rounded-full object-cover ring-2 ring-border" />
        ) : (
          <span
            aria-hidden="true"
            className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary ring-2 ring-border"
          >
            {initials || <Camera className="size-7" />}
          </span>
        )}
        {photo ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Remove photo"
            className="absolute -right-1 -top-1 flex size-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:text-foreground"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => void startCamera()}>
          <Camera aria-hidden="true" />
          Take photo
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
          <ImagePlus aria-hidden="true" />
          Gallery
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          aria-label="Choose a photo"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onChange(file)
            e.target.value = ""
          }}
        />
      </div>

      {cameraOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Take the member's photo"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="font-semibold">Take photo</p>
              <Button type="button" variant="ghost" size="icon" onClick={closeCamera} aria-label="Close camera">
                <X aria-hidden="true" />
              </Button>
            </div>
            <div className="relative aspect-square bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`size-full object-cover ${facing === "user" ? "-scale-x-100" : ""}`}
              />
              <div className="pointer-events-none absolute inset-10 rounded-full border-2 border-white/70" aria-hidden="true" />
            </div>
            {error ? (
              <p role="alert" className="mx-4 mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <div className="flex items-center justify-center gap-3 p-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const next: Facing = facing === "user" ? "environment" : "user"
                  setFacing(next)
                  void startCamera(next)
                }}
              >
                <RefreshCw aria-hidden="true" />
                Flip
              </Button>
              <Button type="button" onClick={capture} disabled={Boolean(error)}>
                <Camera aria-hidden="true" />
                Capture
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

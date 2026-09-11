"use client"

import * as React from "react"
import { Camera, RefreshCw, Upload, X, UserRound } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PersonalInfoData {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: "MALE" | "FEMALE" | "OTHER" | "UNDISCLOSED" | ""
  profilePhoto: File | null
}

interface PersonalInfoStepProps {
  defaultValues?: Partial<PersonalInfoData>
  onUpdate: (data: PersonalInfoData) => void
  onContinue: () => void
}

type CameraFacing = "user" | "environment"

export function PersonalInfoStep({ defaultValues, onUpdate, onContinue }: PersonalInfoStepProps) {
  const [form, setForm] = React.useState<PersonalInfoData>({
    firstName: defaultValues?.firstName || "",
    lastName: defaultValues?.lastName || "",
    email: defaultValues?.email || "",
    phone: defaultValues?.phone || "",
    dateOfBirth: defaultValues?.dateOfBirth || "",
    gender: defaultValues?.gender || "",
    profilePhoto: defaultValues?.profilePhoto || null,
  })
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null)
  const [cameraOpen, setCameraOpen] = React.useState(false)
  const [cameraFacing, setCameraFacing] = React.useState<CameraFacing>("environment")
  const [cameraError, setCameraError] = React.useState<string | null>(null)
  const [cameraLoading, setCameraLoading] = React.useState(false)
  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const streamRef = React.useRef<MediaStream | null>(null)

  function updateField<K extends keyof PersonalInfoData>(key: K, value: PersonalInfoData[K]) {
    const updated = { ...form, [key]: value }
    setForm(updated)
    onUpdate(updated)
  }

  function setPhoto(file: File, previewUrl?: string) {
    updateField("profilePhoto", file)
    if (previewUrl) {
      setPhotoPreview(previewUrl)
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPhoto(file)
    e.target.value = ""
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }

  React.useEffect(() => {
    return () => stopCamera()
  }, [])

  async function startCamera(facing: CameraFacing = cameraFacing) {
    setCameraError(null)
    setCameraLoading(true)
    stopCamera()

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera access is not supported by this browser. Please use Upload Photo instead.")
      setCameraLoading(false)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
        audio: false,
      })

      streamRef.current = stream
      setCameraOpen(true)

      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          void videoRef.current.play()
        }
      })
    } catch {
      setCameraError(
        "Unable to access the camera. Please allow camera permission and make sure a camera is connected."
      )
      stopCamera()
    } finally {
      setCameraLoading(false)
    }
  }

  async function switchCamera() {
    const nextFacing: CameraFacing = cameraFacing === "environment" ? "user" : "environment"
    setCameraFacing(nextFacing)
    await startCamera(nextFacing)
  }

  function capturePhoto() {
    const video = videoRef.current
    if (!video || !video.videoWidth || !video.videoHeight) return

    const maxSize = 1000
    const scale = Math.min(1, maxSize / Math.max(video.videoWidth, video.videoHeight))
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)

    const context = canvas.getContext("2d")
    if (!context) return

    // Mirror the front camera so the captured photo matches the preview.
    if (cameraFacing === "user") {
      context.translate(canvas.width, 0)
      context.scale(-1, 1)
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const file = new File([blob], `member-photo-${Date.now()}.jpg`, {
          type: "image/jpeg",
        })
        setPhoto(file, canvas.toDataURL("image/jpeg", 0.88))
        stopCamera()
        setCameraOpen(false)
      },
      "image/jpeg",
      0.88
    )
  }

  function closeCamera() {
    stopCamera()
    setCameraOpen(false)
    setCameraError(null)
  }

  const isValid = form.firstName && form.lastName && form.phone

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-4 rounded-[22px] border border-violet-100/70 bg-gradient-to-br from-violet-50/70 via-white to-cyan-50/60 p-6">
        <div className="relative">
          {photoPreview ? (
            <img
              src={photoPreview}
              alt="Profile"
              className="size-24 rounded-[28px] border-2 border-white object-cover shadow-lg shadow-violet-500/25 ring-2 ring-violet-200"
            />
          ) : (
            <div className="flex size-24 items-center justify-center rounded-[28px] border-2 border-dashed border-violet-200 bg-white/80 shadow-sm">
              <Camera className="size-8 text-stone-400" aria-hidden="true" />
            </div>
          )}
          <button
            type="button"
            onClick={() => void startCamera()}
            disabled={cameraLoading}
            aria-label="Take profile photo with camera"
            className="absolute -bottom-1 -right-1 flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30 transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:opacity-60"
          >
            <Camera className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button type="button" size="sm" className="min-h-11 rounded-2xl bg-[linear-gradient(105deg,#4338ca,#7c3aed_52%,#c026d3)]" onClick={() => void startCamera()} disabled={cameraLoading}>
            <Camera className="mr-2 size-4" aria-hidden="true" />
            {cameraLoading ? "Opening camera..." : "Take Photo"}
          </Button>
          <label>
            <Button type="button" variant="outline" size="sm" className="min-h-11 rounded-2xl" asChild>
              <span className="cursor-pointer">
                <Upload className="mr-2 size-4" aria-hidden="true" />
                Upload Photo
              </span>
            </Button>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoChange}
              aria-label="Upload profile photo"
            />
          </label>
        </div>
        <p className="flex items-center gap-1.5 text-xs font-medium text-stone-600"><UserRound className="size-3.5" aria-hidden="true" /> Profile photo (optional)</p>
      </div>

      {cameraOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Take member profile photo"
        >
          <div className="w-full max-w-lg overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 bg-gradient-to-r from-violet-50 to-cyan-50 px-4 py-3">
              <div>
                <h2 className="font-serif font-semibold text-stone-950">Take Profile Photo</h2>
                <p className="text-xs font-medium text-stone-600">Position the member inside the frame</p>
              </div>
              <Button type="button" variant="ghost" size="icon" className="min-h-11 min-w-11 rounded-xl" onClick={closeCamera} aria-label="Close camera">
                <X className="size-5" aria-hidden="true" />
              </Button>
            </div>

            <div className="relative aspect-square bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full object-cover ${cameraFacing === "user" ? "-scale-x-100" : ""}`}
              />
              <div className="pointer-events-none absolute inset-8 rounded-[28%] border-2 border-white/70" aria-hidden="true" />
            </div>

            {cameraError && (
              <div className="mx-4 mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700" role="alert">
                {cameraError}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 p-4">
              <Button type="button" variant="outline" className="min-h-11 rounded-2xl" onClick={() => void switchCamera()}>
                <RefreshCw className="mr-2 size-4" aria-hidden="true" />
                Switch Camera
              </Button>
              <Button type="button" size="lg" className="min-h-11 rounded-2xl" onClick={capturePhoto} disabled={!!cameraError}>
                <Camera className="mr-2 size-5" aria-hidden="true" />
                Capture
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First name *</Label>
          <Input
            id="firstName"
            value={form.firstName}
            onChange={(e) => updateField("firstName", e.target.value)}
            placeholder="John"
            className="h-11 rounded-2xl border-stone-200/80 bg-white/80 focus-visible:ring-violet-500/20"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last name *</Label>
          <Input
            id="lastName"
            value={form.lastName}
            onChange={(e) => updateField("lastName", e.target.value)}
            placeholder="Doe"
            className="h-11 rounded-2xl border-stone-200/80 bg-white/80 focus-visible:ring-violet-500/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder="+91 98765 43210"
            className="h-11 rounded-2xl border-stone-200/80 bg-white/80 focus-visible:ring-violet-500/20"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="john@example.com"
            className="h-11 rounded-2xl border-stone-200/80 bg-white/80 focus-visible:ring-violet-500/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of birth</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => updateField("dateOfBirth", e.target.value)}
            className="h-11 rounded-2xl border-stone-200/80 bg-white/80 focus-visible:ring-violet-500/20"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select value={form.gender} onValueChange={(v) => updateField("gender", v as PersonalInfoData["gender"])}>
            <SelectTrigger id="gender" className="h-11 rounded-2xl border-stone-200/80 bg-white/80">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">Male</SelectItem>
              <SelectItem value="FEMALE">Female</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
              <SelectItem value="UNDISCLOSED">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end border-t border-stone-100 pt-5">
        <Button onClick={onContinue} disabled={!isValid} className="min-h-11 rounded-2xl bg-[linear-gradient(105deg,#4338ca,#7c3aed_52%,#c026d3)] px-6 font-extrabold shadow-lg shadow-violet-500/25 disabled:opacity-50">Continue</Button>
      </div>
    </div>
  )
}

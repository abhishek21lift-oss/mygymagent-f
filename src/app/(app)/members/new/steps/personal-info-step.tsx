"use client"

import * as React from "react"
import { Camera, RefreshCw, Upload, X } from "lucide-react"
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
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {photoPreview ? (
            <img
              src={photoPreview}
              alt="Profile"
              className="size-24 rounded-full object-cover border-2 border-primary"
            />
          ) : (
            <div className="size-24 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground">
              <Camera className="size-8 text-muted-foreground" />
            </div>
          )}
          <button
            type="button"
            onClick={() => void startCamera()}
            disabled={cameraLoading}
            aria-label="Take profile photo with camera"
            className="absolute bottom-0 right-0 size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm disabled:opacity-60"
          >
            <Camera className="size-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button type="button" size="sm" onClick={() => void startCamera()} disabled={cameraLoading}>
            <Camera className="mr-2 size-4" />
            {cameraLoading ? "Opening camera..." : "Take Photo"}
          </Button>
          <label>
            <Button type="button" variant="outline" size="sm" asChild>
              <span className="cursor-pointer">
                <Upload className="mr-2 size-4" />
                Upload Photo
              </span>
            </Button>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </label>
        </div>
        <p className="text-sm text-muted-foreground">Profile photo (optional)</p>
      </div>

      {cameraOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Take member profile photo"
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <h2 className="font-semibold">Take Profile Photo</h2>
                <p className="text-xs text-muted-foreground">Position the member inside the frame</p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={closeCamera} aria-label="Close camera">
                <X className="size-5" />
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
              <div className="pointer-events-none absolute inset-8 rounded-[28%] border-2 border-white/70" />
            </div>

            {cameraError && (
              <div className="mx-4 mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {cameraError}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 p-4">
              <Button type="button" variant="outline" onClick={() => void switchCamera()}>
                <RefreshCw className="mr-2 size-4" />
                Switch Camera
              </Button>
              <Button type="button" size="lg" onClick={capturePhoto} disabled={!!cameraError}>
                <Camera className="mr-2 size-5" />
                Capture
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First name *</Label>
          <Input
            id="firstName"
            value={form.firstName}
            onChange={(e) => updateField("firstName", e.target.value)}
            placeholder="John"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last name *</Label>
          <Input
            id="lastName"
            value={form.lastName}
            onChange={(e) => updateField("lastName", e.target.value)}
            placeholder="Doe"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder="+91 98765 43210"
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
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of birth</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => updateField("dateOfBirth", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select value={form.gender} onValueChange={(v) => updateField("gender", v as PersonalInfoData["gender"])}>
            <SelectTrigger>
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

      <div className="flex justify-end">
        <Button onClick={onContinue} disabled={!isValid}>Continue</Button>
      </div>
    </div>
  )
}

"use client"

import * as React from "react"
import { AlertTriangle, Heart, Ruler, ShieldCheck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FitnessHealthData {
  heightCm: string
  weightKg: string
  fitnessExperience: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | ""
  injuries: string
  allergies: string
  medicalNotes: string
  parqHeartCondition: boolean
  parqChestPain: boolean
  parqDizziness: boolean
  parqJointProblems: boolean
  parqMedication: boolean
  parqPregnant: boolean
  parqOtherConcerns: boolean
  waiverConsent: boolean
}

interface FitnessHealthStepProps {
  data: FitnessHealthData
  onUpdate: (data: FitnessHealthData) => void
  onContinue: () => void
  onBack: () => void
}

const PARQ_QUESTIONS = [
  { key: "parqHeartCondition", label: "Do you have any heart condition?" },
  { key: "parqChestPain", label: "Do you experience chest pain during physical activity?" },
  { key: "parqDizziness", label: "Do you often feel dizzy or have fainted?" },
  { key: "parqJointProblems", label: "Do you have any joint problems or pain?" },
  { key: "parqMedication", label: "Are you currently taking any medication?" },
  { key: "parqPregnant", label: "Are you pregnant?" },
  { key: "parqOtherConcerns", label: "Do you have any other health concerns?" },
]

const inputClass = "rounded-2xl border-stone-200/80 bg-white/80 focus-visible:ring-violet-500/20"

export function FitnessHealthStep({ data, onUpdate, onContinue, onBack }: FitnessHealthStepProps) {
  const [form, setForm] = React.useState<FitnessHealthData>(data)

  function updateField<K extends keyof FitnessHealthData>(key: K, value: FitnessHealthData[K]) {
    const updated = { ...form, [key]: value }
    setForm(updated)
    onUpdate(updated)
  }

  const anyParqYes = form.parqHeartCondition || form.parqChestPain || form.parqDizziness ||
    form.parqJointProblems || form.parqMedication || form.parqPregnant || form.parqOtherConcerns

  const isValid = form.waiverConsent

  return (
    <div className="flex flex-col gap-5">
      {/* Basic Measurements */}
      <section aria-labelledby="fitness-measure-heading" className="rounded-[22px] border border-cyan-100/70 bg-white/60 p-5">
        <h3 id="fitness-measure-heading" className="flex items-center gap-2.5 font-serif text-lg font-semibold tracking-tight text-stone-950">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25">
            <Ruler className="size-4" aria-hidden="true" />
          </span>
          Baseline measurements
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="heightCm">Height (cm)</Label>
            <Input
              id="heightCm"
              type="number"
              value={form.heightCm}
              onChange={(e) => updateField("heightCm", e.target.value)}
              placeholder="175"
              className={`h-11 ${inputClass}`}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weightKg">Weight (kg)</Label>
            <Input
              id="weightKg"
              type="number"
              value={form.weightKg}
              onChange={(e) => updateField("weightKg", e.target.value)}
              placeholder="70"
              className={`h-11 ${inputClass}`}
            />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <Label htmlFor="fitnessExperience">Fitness Experience</Label>
          <Select
            value={form.fitnessExperience}
            onValueChange={(v) => updateField("fitnessExperience", v as FitnessHealthData["fitnessExperience"])}
          >
            <SelectTrigger id="fitnessExperience" className={`h-11 ${inputClass}`}>
              <SelectValue placeholder="Select experience level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BEGINNER">Beginner - Just starting</SelectItem>
              <SelectItem value="INTERMEDIATE">Intermediate - 6+ months experience</SelectItem>
              <SelectItem value="ADVANCED">Advanced - 2+ years experience</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Health Info */}
      <section aria-labelledby="fitness-health-heading" className="rounded-[22px] border border-violet-100/70 bg-white/60 p-5">
        <h3 id="fitness-health-heading" className="flex items-center gap-2.5 font-serif text-lg font-semibold tracking-tight text-stone-950">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/25">
            <Heart className="size-4" aria-hidden="true" />
          </span>
          Health background
        </h3>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="injuries">Injuries / Limitations</Label>
            <Textarea
              id="injuries"
              value={form.injuries}
              onChange={(e) => updateField("injuries", e.target.value)}
              placeholder="Any past injuries or physical limitations..."
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="allergies">Allergies</Label>
            <Textarea
              id="allergies"
              value={form.allergies}
              onChange={(e) => updateField("allergies", e.target.value)}
              placeholder="Any allergies (food, environmental, etc.)..."
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="medicalNotes">Medical Notes</Label>
            <Textarea
              id="medicalNotes"
              value={form.medicalNotes}
              onChange={(e) => updateField("medicalNotes", e.target.value)}
              placeholder="Any other medical notes or conditions we should know about..."
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* PAR-Q Section */}
      <section aria-labelledby="fitness-parq-heading" className="rounded-[22px] border border-amber-100/70 bg-white/60 p-5">
        <div className="flex items-center gap-2.5">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/25">
            <ShieldCheck className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h3 id="fitness-parq-heading" className="font-serif text-lg font-semibold tracking-tight text-stone-950">PAR-Q Health Questionnaire</h3>
            <p className="text-xs font-medium text-stone-600">
              Please answer the following questions about your health
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {PARQ_QUESTIONS.map((q) => (
            <div key={q.key} className="flex min-h-11 items-start gap-3 rounded-2xl border border-stone-200/60 bg-white/70 px-3 py-2.5 transition hover:border-violet-200">
              <Checkbox
                id={q.key}
                checked={form[q.key as keyof FitnessHealthData] as boolean}
                onCheckedChange={(checked: boolean | "indeterminate") =>
                  updateField(q.key as keyof FitnessHealthData, checked as boolean)
                }
                className="mt-0.5"
              />
              <Label htmlFor={q.key} className="cursor-pointer text-sm font-medium leading-5">
                {q.label}
              </Label>
            </div>
          ))}
        </div>

        {anyParqYes && (
          <Alert variant="warning" className="mt-4 rounded-2xl border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
            <AlertTriangle className="size-4" aria-hidden="true" />
            <AlertDescription className="font-medium">
              Some health concerns noted. A medical clearance may be required before starting.
            </AlertDescription>
          </Alert>
        )}
      </section>

      {/* Waiver Consent */}
      <div className="flex items-start gap-3 rounded-[22px] border border-emerald-200/70 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 p-5">
        <Checkbox
          id="waiverConsent"
          checked={form.waiverConsent}
          onCheckedChange={(checked: boolean | "indeterminate") => updateField("waiverConsent", checked as boolean)}
          className="mt-0.5"
        />
        <Label htmlFor="waiverConsent" className="cursor-pointer text-sm font-medium leading-5">
          I confirm that the information provided is accurate. I have read and agree to the
          gym&apos;s waiver and liability terms. *
        </Label>
      </div>

      <div className="flex justify-between border-t border-stone-100 pt-5">
        <Button variant="outline" onClick={onBack} className="min-h-11 rounded-2xl px-5">Back</Button>
        <Button onClick={onContinue} disabled={!isValid} className="min-h-11 rounded-2xl bg-[linear-gradient(105deg,#4338ca,#7c3aed_52%,#c026d3)] px-6 font-extrabold shadow-lg shadow-violet-500/25 disabled:opacity-50">Continue</Button>
      </div>
    </div>
  )
}

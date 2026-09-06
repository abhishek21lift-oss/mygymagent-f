"use client"

import * as React from "react"
import { AlertTriangle, Check } from "lucide-react"
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
    <div className="flex flex-col gap-6">
      {/* Basic Measurements */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="heightCm">Height (cm)</Label>
          <Input
            id="heightCm"
            type="number"
            value={form.heightCm}
            onChange={(e) => updateField("heightCm", e.target.value)}
            placeholder="175"
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
          />
        </div>
      </div>

      {/* Fitness Experience */}
      <div className="space-y-2">
        <Label htmlFor="fitnessExperience">Fitness Experience</Label>
        <Select
          value={form.fitnessExperience}
          onValueChange={(v) => updateField("fitnessExperience", v as FitnessHealthData["fitnessExperience"])}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select experience level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BEGINNER">Beginner - Just starting</SelectItem>
            <SelectItem value="INTERMEDIATE">Intermediate - 6+ months experience</SelectItem>
            <SelectItem value="ADVANCED">Advanced - 2+ years experience</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Health Info */}
      <div className="space-y-2">
        <Label htmlFor="injuries">Injuries / Limitations</Label>
        <Textarea
          id="injuries"
          value={form.injuries}
          onChange={(e) => updateField("injuries", e.target.value)}
          placeholder="Any past injuries or physical limitations..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="allergies">Allergies</Label>
        <Textarea
          id="allergies"
          value={form.allergies}
          onChange={(e) => updateField("allergies", e.target.value)}
          placeholder="Any allergies (food, environmental, etc.)..."
        />
      </div>

      {/* PAR-Q Section */}
      <div className="space-y-4">
        <div>
          <h3 className="font-medium">PAR-Q Health Questionnaire</h3>
          <p className="text-sm text-muted-foreground">
            Please answer the following questions about your health
          </p>
        </div>

        {PARQ_QUESTIONS.map((q) => (
          <div key={q.key} className="flex items-start gap-3">
            <Checkbox
              id={q.key}
              checked={form[q.key as keyof FitnessHealthData] as boolean}
              onCheckedChange={(checked: boolean | "indeterminate") =>
                updateField(q.key as keyof FitnessHealthData, checked as boolean)
              }
            />
            <Label htmlFor={q.key} className="text-sm cursor-pointer">
              {q.label}
            </Label>
          </div>
        ))}

        {anyParqYes && (
          <Alert variant="warning">
            <AlertTriangle className="size-4" />
            <AlertDescription>
              Some health concerns noted. A medical clearance may be required before starting.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Waiver Consent */}
      <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/50">
        <Checkbox
          id="waiverConsent"
          checked={form.waiverConsent}
          onCheckedChange={(checked: boolean | "indeterminate") => updateField("waiverConsent", checked as boolean)}
        />
        <Label htmlFor="waiverConsent" className="text-sm cursor-pointer">
          I confirm that the information provided is accurate. I have read and agree to the
          gym&apos;s waiver and liability terms. *
        </Label>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onContinue} disabled={!isValid}>Continue</Button>
      </div>
    </div>
  )
}
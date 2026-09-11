"use client"

import * as React from "react"
import { Building2, Dumbbell, UserRound, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BranchSelect } from "@/components/shared/branch-select"
import { UserSelect } from "@/components/shared/user-select"

interface GymSetupData {
  primaryBranchId: string
  assignedTrainerId: string
  memberType: "GYM" | "PT" | "GYM_PT" | ""
  fitnessGoal: string
  leadSource: string
}

interface GymSetupStepProps {
  data: GymSetupData
  onUpdate: (data: GymSetupData) => void
  onContinue: () => void
  onBack: () => void
}

const MEMBER_TYPES = [
  { value: "GYM", label: "Gym Only", description: "Access to gym facilities", tile: "from-cyan-500 to-blue-600" },
  { value: "PT", label: "Personal Training", description: "1-on-1 trainer sessions", tile: "from-violet-600 to-fuchsia-600" },
  { value: "GYM_PT", label: "Gym + PT", description: "Full gym access + trainer sessions", tile: "from-fuchsia-600 to-violet-600" },
]

const FITNESS_GOALS = [
  { value: "WEIGHT_LOSS", label: "Weight Loss" },
  { value: "MUSCLE_GAIN", label: "Muscle Gain" },
  { value: "STRENGTH", label: "Strength" },
  { value: "ENDURANCE", label: "Endurance" },
  { value: "GENERAL_FITNESS", label: "General Fitness" },
  { value: "OTHER", label: "Other" },
]

export function GymSetupStep({ data, onUpdate, onContinue, onBack }: GymSetupStepProps) {
  const [form, setForm] = React.useState<GymSetupData>(data)

  function updateField<K extends keyof GymSetupData>(key: K, value: GymSetupData[K]) {
    const updated = { ...form, [key]: value }
    setForm(updated)
    onUpdate(updated)
  }

  const isValid = form.primaryBranchId && form.memberType

  return (
    <div className="flex flex-col gap-5">
      {/* Branch Selection */}
      <section aria-labelledby="gym-branch-heading" className="rounded-[22px] border border-violet-100/70 bg-white/60 p-5">
        <h3 id="gym-branch-heading" className="flex items-center gap-2.5 font-serif text-lg font-semibold tracking-tight text-stone-950">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-md shadow-violet-500/25">
            <Building2 className="size-4" aria-hidden="true" />
          </span>
          Home branch
        </h3>
        <div className="mt-4 space-y-2">
          <Label>Branch *</Label>
          <BranchSelect
            value={form.primaryBranchId}
            onChange={(v) => updateField("primaryBranchId", v)}
            placeholder="Select branch"
          />
        </div>
      </section>

      {/* Trainer Assignment */}
      <section aria-labelledby="gym-trainer-heading" className="rounded-[22px] border border-cyan-100/70 bg-white/60 p-5">
        <h3 id="gym-trainer-heading" className="flex items-center gap-2.5 font-serif text-lg font-semibold tracking-tight text-stone-950">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25">
            <UserRound className="size-4" aria-hidden="true" />
          </span>
          Coach assignment
        </h3>
        <div className="mt-4 space-y-2">
          <Label>Assign Trainer (optional)</Label>
          <UserSelect
            value={form.assignedTrainerId}
            onChange={(v) => updateField("assignedTrainerId", v)}
            placeholder="Select trainer"
          />
          <p className="text-xs font-medium text-stone-600">PT and hybrid members should leave with a named coach.</p>
        </div>
      </section>

      {/* Member Type */}
      <section aria-labelledby="gym-type-heading" className="rounded-[22px] border border-fuchsia-100/70 bg-white/60 p-5">
        <h3 id="gym-type-heading" className="flex items-center gap-2.5 font-serif text-lg font-semibold tracking-tight text-stone-950">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-600 to-violet-600 text-white shadow-md shadow-fuchsia-500/25">
            <Dumbbell className="size-4" aria-hidden="true" />
          </span>
          Member type *
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Member type">
          {MEMBER_TYPES.map((type) => {
            const selected = form.memberType === type.value
            return (
              <Card
                key={type.value}
                role="radio"
                aria-checked={selected}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    updateField("memberType", type.value as GymSetupData["memberType"])
                  }
                }}
                className={`cursor-pointer transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 ${
                  selected
                    ? "border-violet-300 bg-gradient-to-br from-violet-50 to-cyan-50 shadow-md"
                    : "border-stone-200/70 bg-white/80 hover:border-violet-200 hover:shadow-md"
                }`}
                onClick={() => updateField("memberType", type.value as GymSetupData["memberType"])}
              >
                <CardContent className="p-4 text-center">
                  <span className={`mx-auto flex size-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md ${type.tile}`} aria-hidden="true">
                    <Dumbbell className="size-4" />
                  </span>
                  <p className="mt-2 text-sm font-extrabold text-stone-900">{type.label}</p>
                  <p className="mt-1 text-xs font-medium text-stone-600">{type.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Fitness Goal */}
      <section aria-labelledby="gym-goal-heading" className="rounded-[22px] border border-emerald-100/70 bg-white/60 p-5">
        <h3 id="gym-goal-heading" className="flex items-center gap-2.5 font-serif text-lg font-semibold tracking-tight text-stone-950">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25">
            <Target className="size-4" aria-hidden="true" />
          </span>
          Goals & source
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Fitness Goal</Label>
            <Select value={form.fitnessGoal} onValueChange={(v) => updateField("fitnessGoal", v)}>
              <SelectTrigger className="h-11 rounded-2xl border-stone-200/80 bg-white/80">
                <SelectValue placeholder="Select goal" />
              </SelectTrigger>
              <SelectContent>
                {FITNESS_GOALS.map((goal) => (
                  <SelectItem key={goal.value} value={goal.value}>{goal.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Lead Source</Label>
            <Select value={form.leadSource} onValueChange={(v) => updateField("leadSource", v)}>
              <SelectTrigger className="h-11 rounded-2xl border-stone-200/80 bg-white/80">
                <SelectValue placeholder="How did they hear about us?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WALK_IN">Walk-in</SelectItem>
                <SelectItem value="REFERRAL">Referral</SelectItem>
                <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                <SelectItem value="FACEBOOK">Facebook</SelectItem>
                <SelectItem value="GOOGLE">Google</SelectItem>
                <SelectItem value="WEBSITE">Website</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <div className="flex justify-between border-t border-stone-100 pt-5">
        <Button variant="outline" onClick={onBack} className="min-h-11 rounded-2xl px-5">Back</Button>
        <Button onClick={onContinue} disabled={!isValid} className="min-h-11 rounded-2xl bg-[linear-gradient(105deg,#4338ca,#7c3aed_52%,#c026d3)] px-6 font-extrabold shadow-lg shadow-violet-500/25 disabled:opacity-50">Continue</Button>
      </div>
    </div>
  )
}

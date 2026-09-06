"use client"

import * as React from "react"
import { Building2, User, Target, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  { value: "GYM", label: "Gym Only", description: "Access to gym facilities" },
  { value: "PT", label: "Personal Training", description: "1-on-1 trainer sessions" },
  { value: "GYM_PT", label: "Gym + PT", description: "Full gym access + trainer sessions" },
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
    <div className="flex flex-col gap-6">
      {/* Branch Selection */}
      <div className="space-y-2">
        <Label>Branch *</Label>
        <BranchSelect
          value={form.primaryBranchId}
          onChange={(v) => updateField("primaryBranchId", v)}
          placeholder="Select branch"
        />
      </div>

      {/* Trainer Assignment */}
      <div className="space-y-2">
        <Label>Assign Trainer (optional)</Label>
        <UserSelect
          value={form.assignedTrainerId}
          onChange={(v) => updateField("assignedTrainerId", v)}
          placeholder="Select trainer"
        />
      </div>

      {/* Member Type */}
      <div className="space-y-3">
        <Label>Member Type *</Label>
        <div className="grid grid-cols-3 gap-3">
          {MEMBER_TYPES.map((type) => (
            <Card
              key={type.value}
              className={`cursor-pointer transition-all ${
                form.memberType === type.value
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary/50"
              }`}
              onClick={() => updateField("memberType", type.value as GymSetupData["memberType"])}
            >
              <CardContent className="p-3 text-center">
                <p className="font-medium text-sm">{type.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Fitness Goal */}
      <div className="space-y-2">
        <Label>Fitness Goal</Label>
        <Select value={form.fitnessGoal} onValueChange={(v) => updateField("fitnessGoal", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select goal" />
          </SelectTrigger>
          <SelectContent>
            {FITNESS_GOALS.map((goal) => (
              <SelectItem key={goal.value} value={goal.value}>{goal.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lead Source */}
      <div className="space-y-2">
        <Label>Lead Source</Label>
        <Select value={form.leadSource} onValueChange={(v) => updateField("leadSource", v)}>
          <SelectTrigger>
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

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onContinue} disabled={!isValid}>Continue</Button>
      </div>
    </div>
  )
}
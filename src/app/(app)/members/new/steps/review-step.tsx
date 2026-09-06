"use client"

import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { Edit2, User, MapPin, Building2, Heart, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ReviewStepProps {
  data: {
    lead?: { firstName: string; lastName: string; email: string; phone: string }
    personal: { firstName: string; lastName: string; email: string; phone: string; dateOfBirth: string; gender: string }
    contact: { addressLine1: string; city: string; state: string; postalCode: string; emergencyContactName: string; emergencyContactPhone: string }
    gym: { primaryBranchId: string; memberType: string; fitnessGoal: string; assignedTrainerId: string }
    fitness: { heightCm: string; weightKg: string; parqHeartCondition: boolean; waiverConsent: boolean }
  }
  onEdit: (step: number) => void
  onSubmit: () => void
  isSubmitting: boolean
}

function SectionCard({ icon: Icon, title, onEdit, children }: {
  icon: LucideIcon
  title: string
  onEdit: () => void
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="size-4 text-primary" />
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit2 className="size-3 mr-1" /> Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm">
        {children}
      </CardContent>
    </Card>
  )
}

export function ReviewStep({ data, onEdit, onSubmit, isSubmitting }: ReviewStepProps) {
  const p = data.personal
  const c = data.contact
  const g = data.gym
  const f = data.fitness

  const memberTypeLabels: Record<string, string> = {
    GYM: "Gym Only",
    PT: "Personal Training",
    GYM_PT: "Gym + PT",
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center mb-4">
        <h2 className="text-xl font-semibold">Review & Create Member</h2>
        <p className="text-muted-foreground">Please review all details before creating</p>
      </div>

      <div className="grid gap-4">
        <SectionCard icon={User} title="Personal Information" onEdit={() => onEdit(1)}>
          <div className="grid grid-cols-2 gap-x-8">
            <div>
              <span className="text-muted-foreground">Name:</span> {p.firstName} {p.lastName}
            </div>
            <div>
              <span className="text-muted-foreground">Phone:</span> {p.phone}
            </div>
            <div>
              <span className="text-muted-foreground">Email:</span> {p.email || "—"}
            </div>
            <div>
              <span className="text-muted-foreground">DOB:</span> {p.dateOfBirth || "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Gender:</span> {p.gender || "—"}
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={MapPin} title="Contact & Emergency" onEdit={() => onEdit(2)}>
          <div className="grid grid-cols-2 gap-x-8">
            <div>
              <span className="text-muted-foreground">Address:</span> {c.addressLine1 || "—"}
            </div>
            <div>
              <span className="text-muted-foreground">City:</span> {c.city || "—"}, {c.state || "—"} {c.postalCode || ""}
            </div>
            <div>
              <span className="text-muted-foreground">Emergency:</span> {c.emergencyContactName || "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Emergency Phone:</span> {c.emergencyContactPhone || "—"}
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={Building2} title="Gym Setup" onEdit={() => onEdit(3)}>
          <div className="grid grid-cols-2 gap-x-8">
            <div>
              <span className="text-muted-foreground">Branch:</span> {g.primaryBranchId || "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Member Type:</span>{" "}
              <Badge variant="secondary">{memberTypeLabels[g.memberType] || g.memberType || "—"}</Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Goal:</span> {g.fitnessGoal || "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Trainer:</span> {g.assignedTrainerId || "None"}
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={Heart} title="Fitness & Health" onEdit={() => onEdit(4)}>
          <div className="grid grid-cols-2 gap-x-8">
            <div>
              <span className="text-muted-foreground">Height:</span> {f.heightCm ? `${f.heightCm} cm` : "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Weight:</span> {f.weightKg ? `${f.weightKg} kg` : "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Heart Condition:</span>{" "}
              {f.parqHeartCondition ? (
                <Badge variant="destructive">Yes</Badge>
              ) : (
                <Badge variant="success">No</Badge>
              )}
            </div>
            <div>
              <span className="text-muted-foreground">Waiver:</span>{" "}
              {f.waiverConsent ? (
                <Badge variant="success">Signed</Badge>
              ) : (
                <Badge variant="destructive">Not Signed</Badge>
              )}
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={() => onEdit(4)}>Back</Button>
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>Creating Member...</>
          ) : (
            <>
              <CheckCircle2 className="size-4 mr-2" />
              Create Member
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

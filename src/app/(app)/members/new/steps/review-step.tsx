"use client"

import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { Edit2, User, MapPin, Building2, Heart, CheckCircle2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Lead } from "@/lib/types/gym"

interface ReviewStepProps {
  data: {
    lead?: Lead
    personal: { firstName: string; lastName: string; email: string; phone: string; dateOfBirth: string; gender: string }
    contact: { addressLine1: string; city: string; state: string; postalCode: string; emergencyContactName: string; emergencyContactPhone: string }
    gym: { primaryBranchId: string; memberType: string; fitnessGoal: string; assignedTrainerId: string }
    fitness: { heightCm: string; weightKg: string; parqHeartCondition: boolean; waiverConsent: boolean }
  }
  onEdit: (step: number) => void
  onSubmit: () => void
  isSubmitting: boolean
}

function SectionCard({ icon: Icon, title, tint, onEdit, children }: {
  icon: LucideIcon
  title: string
  tint: string
  onEdit: () => void
  children: React.ReactNode
}) {
  return (
    <Card className="overflow-hidden border-white/90 bg-white/80 shadow-sm backdrop-blur">
      <CardHeader className={`border-b border-stone-100/80 bg-gradient-to-r px-5 py-4 ${tint}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-md shadow-violet-500/20">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <CardTitle className="font-serif text-base tracking-tight text-stone-950">{title}</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onEdit} className="min-h-11 rounded-xl font-bold text-stone-600 hover:text-stone-950">
            <Edit2 className="mr-1 size-3" aria-hidden="true" /> Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-2 p-5 text-sm">
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
    <div className="flex flex-col gap-5">
      <div className="rounded-[22px] border border-violet-100/70 bg-gradient-to-br from-violet-50/70 via-white to-cyan-50/60 p-5 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25">
          <Sparkles className="size-5" aria-hidden="true" />
        </span>
        <h2 className="mt-3 font-serif text-2xl font-semibold tracking-tight text-stone-950">Review & Create Member</h2>
        <p className="mt-1 text-xs font-medium text-stone-600">Please review all details before creating</p>
      </div>

      <div className="grid gap-4">
        <SectionCard icon={User} title="Personal Information" tint="from-violet-50/80 via-white to-white" onEdit={() => onEdit(1)}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-x-8">
            <div className="font-medium text-stone-900">
              <span className="font-bold text-stone-500">Name:</span> {p.firstName} {p.lastName}
            </div>
            <div className="font-medium text-stone-900">
              <span className="font-bold text-stone-500">Phone:</span> <span className="tabular-nums">{p.phone}</span>
            </div>
            <div className="font-medium text-stone-900">
              <span className="font-bold text-stone-500">Email:</span> {p.email || "—"}
            </div>
            <div className="font-medium text-stone-900">
              <span className="font-bold text-stone-500">DOB:</span> {p.dateOfBirth || "—"}
            </div>
            <div className="font-medium text-stone-900">
              <span className="font-bold text-stone-500">Gender:</span> {p.gender || "—"}
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={MapPin} title="Contact & Emergency" tint="from-cyan-50/80 via-white to-white" onEdit={() => onEdit(2)}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-x-8">
            <div className="font-medium text-stone-900">
              <span className="font-bold text-stone-500">Address:</span> {c.addressLine1 || "—"}
            </div>
            <div className="font-medium text-stone-900">
              <span className="font-bold text-stone-500">City:</span> {c.city || "—"}, {c.state || "—"} {c.postalCode || ""}
            </div>
            <div className="font-medium text-stone-900">
              <span className="font-bold text-stone-500">Emergency:</span> {c.emergencyContactName || "—"}
            </div>
            <div className="font-medium text-stone-900">
              <span className="font-bold text-stone-500">Emergency Phone:</span> <span className="tabular-nums">{c.emergencyContactPhone || "—"}</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={Building2} title="Gym Setup" tint="from-fuchsia-50/80 via-white to-white" onEdit={() => onEdit(3)}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-x-8">
            <div className="font-medium text-stone-900">
              <span className="font-bold text-stone-500">Branch:</span> {g.primaryBranchId || "—"}
            </div>
            <div className="font-medium text-stone-900">
              <span className="font-bold text-stone-500">Member Type:</span>{" "}
              <Badge variant="secondary" className="rounded-full bg-violet-500/10 text-violet-700 ring-1 ring-violet-200/60">{memberTypeLabels[g.memberType] || g.memberType || "—"}</Badge>
            </div>
            <div className="font-medium text-stone-900">
              <span className="font-bold text-stone-500">Goal:</span> {g.fitnessGoal || "—"}
            </div>
            <div className="font-medium text-stone-900">
              <span className="font-bold text-stone-500">Trainer:</span> {g.assignedTrainerId || "None"}
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={Heart} title="Fitness & Health" tint="from-emerald-50/80 via-white to-white" onEdit={() => onEdit(4)}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-x-8">
            <div className="font-medium text-stone-900">
              <span className="font-bold text-stone-500">Height:</span> <span className="tabular-nums">{f.heightCm ? `${f.heightCm} cm` : "—"}</span>
            </div>
            <div className="font-medium text-stone-900">
              <span className="font-bold text-stone-500">Weight:</span> <span className="tabular-nums">{f.weightKg ? `${f.weightKg} kg` : "—"}</span>
            </div>
            <div className="font-medium text-stone-900">
              <span className="font-bold text-stone-500">Heart Condition:</span>{" "}
              {f.parqHeartCondition ? (
                <Badge variant="destructive" className="rounded-full bg-rose-500/10 text-rose-700 ring-1 ring-rose-200/70">Yes</Badge>
              ) : (
                <Badge variant="success" className="rounded-full bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-200/70">No</Badge>
              )}
            </div>
            <div className="font-medium text-stone-900">
              <span className="font-bold text-stone-500">Waiver:</span>{" "}
              {f.waiverConsent ? (
                <Badge variant="success" className="rounded-full bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-200/70">Signed</Badge>
              ) : (
                <Badge variant="destructive" className="rounded-full bg-rose-500/10 text-rose-700 ring-1 ring-rose-200/70">Not Signed</Badge>
              )}
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="flex justify-between border-t border-stone-100 pt-5">
        <Button variant="outline" onClick={() => onEdit(4)} className="min-h-11 rounded-2xl px-5">Back</Button>
        <Button onClick={onSubmit} disabled={isSubmitting} className="min-h-11 rounded-2xl bg-[linear-gradient(105deg,#4338ca,#7c3aed_52%,#c026d3)] px-6 font-extrabold shadow-lg shadow-violet-500/25 disabled:opacity-60">
          {isSubmitting ? (
            <>Creating Member...</>
          ) : (
            <>
              <CheckCircle2 className="mr-2 size-4" aria-hidden="true" />
              Create Member
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

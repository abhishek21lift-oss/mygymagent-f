"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check, Sparkles } from "lucide-react"

import { LeadSelectionStep } from "./steps/lead-selection-step"
import { PersonalInfoStep } from "./steps/personal-info-step"
import { ContactEmergencyStep } from "./steps/contact-emergency-step"
import { GymSetupStep } from "./steps/gym-setup-step"
import { FitnessHealthStep } from "./steps/fitness-health-step"
import { ReviewStep } from "./steps/review-step"
import { useCompleteOnboarding } from "@/lib/hooks/use-onboarding"
import type { Lead } from "@/lib/types/gym"

const STEPS = [
  { id: 0, label: "Lead" },
  { id: 1, label: "Personal" },
  { id: 2, label: "Contact" },
  { id: 3, label: "Gym" },
  { id: 4, label: "Health" },
  { id: 5, label: "Review" },
]

interface WizardData {
  lead?: Lead
  personal: {
    firstName: string
    lastName: string
    email: string
    phone: string
    dateOfBirth: string
    gender: "MALE" | "FEMALE" | "OTHER" | "UNDISCLOSED" | ""
    profilePhoto: File | null
  }
  contact: {
    addressLine1: string
    addressLine2: string
    city: string
    state: string
    postalCode: string
    country: string
    emergencyContactName: string
    emergencyContactPhone: string
    emergencyContactRelationship: string
  }
  gym: {
    primaryBranchId: string
    assignedTrainerId: string
    memberType: "GYM" | "PT" | "GYM_PT" | ""
    fitnessGoal: string
    leadSource: string
  }
  fitness: {
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
}

const DEFAULT_DATA: WizardData = {
  personal: {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    profilePhoto: null,
  },
  contact: {
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
  },
  gym: {
    primaryBranchId: "",
    assignedTrainerId: "",
    memberType: "",
    fitnessGoal: "",
    leadSource: "",
  },
  fitness: {
    heightCm: "",
    weightKg: "",
    fitnessExperience: "",
    injuries: "",
    allergies: "",
    medicalNotes: "",
    parqHeartCondition: false,
    parqChestPain: false,
    parqDizziness: false,
    parqJointProblems: false,
    parqMedication: false,
    parqPregnant: false,
    parqOtherConcerns: false,
    waiverConsent: false,
  },
}

export function OnboardingWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = React.useState(0)
  const [data, setData] = React.useState<WizardData>(DEFAULT_DATA)
  const completeOnboarding = useCompleteOnboarding()

  function updateData<K extends keyof WizardData>(key: K, value: WizardData[K]) {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  function goToStep(step: number) {
    if (step >= 0 && step < STEPS.length) {
      setCurrentStep(step)
    }
  }

  function goNext() {
    goToStep(currentStep + 1)
  }

  function goBack() {
    goToStep(currentStep - 1)
  }

  async function handleSubmit() {
    try {
      const member = await completeOnboarding.mutateAsync({
        primaryBranchId: data.gym.primaryBranchId,
        firstName: data.personal.firstName,
        lastName: data.personal.lastName,
        email: data.personal.email || undefined,
        phone: data.personal.phone,
        dateOfBirth: data.personal.dateOfBirth || undefined,
        gender: data.personal.gender || undefined,
        addressLine1: data.contact.addressLine1 || undefined,
        addressLine2: data.contact.addressLine2 || undefined,
        city: data.contact.city || undefined,
        state: data.contact.state || undefined,
        postalCode: data.contact.postalCode || undefined,
        country: data.contact.country || undefined,
        emergencyContactName: data.contact.emergencyContactName || undefined,
        emergencyContactPhone: data.contact.emergencyContactPhone || undefined,
        emergencyContactRelationship: data.contact.emergencyContactRelationship || undefined,
        assignedTrainerId: data.gym.assignedTrainerId || undefined,
        memberType: data.gym.memberType || undefined,
        leadSource: data.gym.leadSource || undefined,
        fitnessGoal: data.gym.fitnessGoal || undefined,
        heightCm: data.fitness.heightCm ? parseFloat(data.fitness.heightCm) : undefined,
        weightKg: data.fitness.weightKg ? parseFloat(data.fitness.weightKg) : undefined,
        fitnessExperience: data.fitness.fitnessExperience || undefined,
        injuries: data.fitness.injuries || undefined,
        allergies: data.fitness.allergies || undefined,
        medicalNotes: data.fitness.medicalNotes || undefined,
        parqHeartCondition: data.fitness.parqHeartCondition,
        parqChestPain: data.fitness.parqChestPain,
        parqDizziness: data.fitness.parqDizziness,
        parqJointProblems: data.fitness.parqJointProblems,
        parqMedication: data.fitness.parqMedication,
        parqPregnant: data.fitness.parqPregnant,
        parqOtherConcerns: data.fitness.parqOtherConcerns,
        flaggedForMedicalClearance:
          data.fitness.parqHeartCondition ||
          data.fitness.parqChestPain ||
          data.fitness.parqDizziness ||
          data.fitness.parqJointProblems ||
          data.fitness.parqMedication ||
          data.fitness.parqPregnant ||
          data.fitness.parqOtherConcerns,
        waiverConsent: data.fitness.waiverConsent,
        profilePhoto: data.personal.profilePhoto,
      })

      toast.success("Member created successfully!")
      router.push(`/members/${member.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create member")
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <section aria-label="Onboarding progress" className="overflow-hidden rounded-[28px] border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl">
        <div className="border-b border-stone-100/80 bg-gradient-to-r from-violet-50/90 via-white to-cyan-50/70 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-md shadow-violet-500/25">
              <Sparkles className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="font-serif text-lg font-semibold tracking-tight text-stone-950">
                Step {currentStep + 1} of {STEPS.length} — {STEPS[currentStep].label}
              </h2>
              <p className="mt-0.5 text-xs font-medium text-stone-600">Every step saves into the review screen before anything is created.</p>
            </div>
            <span className="ml-auto hidden rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1 font-mono text-xs font-black text-white tabular-nums shadow-md sm:inline-block">
              {Math.round(((currentStep + 1) / STEPS.length) * 100)}%
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100" role="presentation">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400 transition-all duration-500 motion-safe:animate-none"
              style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
        <ol className="flex items-start justify-between gap-1 px-4 py-5 sm:px-6">
          {STEPS.map((step, idx) => (
            <React.Fragment key={step.id}>
              <li className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center" aria-current={idx === currentStep ? "step" : undefined}>
                <span
                  className={`flex size-9 items-center justify-center rounded-full text-sm font-black shadow-md transition-all duration-300 ${
                    idx < currentStep
                      ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-violet-500/30"
                      : idx === currentStep
                        ? "bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-500/30 ring-4 ring-violet-500/15"
                        : "border border-stone-200 bg-white text-stone-400"
                  }`}
                  aria-hidden="true"
                >
                  {idx < currentStep ? <Check className="size-4" /> : step.id + 1}
                </span>
                <span className={`truncate text-[11px] font-extrabold ${idx === currentStep ? "text-violet-800" : idx < currentStep ? "text-stone-700" : "text-stone-400"}`}>{step.label}</span>
              </li>
              {idx < STEPS.length - 1 && (
                <span
                  className={`mt-4 h-1 min-w-2 flex-1 rounded-full sm:mx-1 ${idx < currentStep ? "bg-gradient-to-r from-violet-600 to-fuchsia-500" : "bg-stone-200"}`}
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          ))}
        </ol>
      </section>

      {/* Step Content */}
      <section aria-label={`Step ${currentStep + 1}: ${STEPS[currentStep].label}`} className="min-h-[400px] overflow-hidden rounded-[28px] border-white/90 bg-white/88 p-5 shadow-xl shadow-violet-900/5 backdrop-blur-xl sm:p-7">
        {currentStep === 0 && (
          <LeadSelectionStep
            onSelectLead={(lead) => {
              updateData("lead", lead)
              updateData("personal", {
                ...data.personal,
                firstName: lead.firstName,
                lastName: lead.lastName,
                email: lead.email || "",
                phone: lead.phone || "",
              })
              goNext()
            }}
            onSkip={goNext}
          />
        )}

        {currentStep === 1 && (
          <PersonalInfoStep
            defaultValues={data.personal}
            onUpdate={(personal) => updateData("personal", personal)}
            onContinue={goNext}
          />
        )}

        {currentStep === 2 && (
          <ContactEmergencyStep
            data={data.contact}
            onUpdate={(contact) => updateData("contact", contact)}
            onContinue={goNext}
            onBack={goBack}
          />
        )}

        {currentStep === 3 && (
          <GymSetupStep
            data={data.gym}
            onUpdate={(gym) => updateData("gym", gym)}
            onContinue={goNext}
            onBack={goBack}
          />
        )}

        {currentStep === 4 && (
          <FitnessHealthStep
            data={data.fitness}
            onUpdate={(fitness) => updateData("fitness", fitness)}
            onContinue={goNext}
            onBack={goBack}
          />
        )}

        {currentStep === 5 && (
          <ReviewStep
            data={data}
            onEdit={goToStep}
            onSubmit={handleSubmit}
            isSubmitting={completeOnboarding.isPending}
          />
        )}
      </section>
    </div>
  )
}

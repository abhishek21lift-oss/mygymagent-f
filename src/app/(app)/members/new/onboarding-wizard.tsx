"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check } from "lucide-react"

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
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      {/* Stepper */}
      <div className="flex items-center justify-between px-4">
        {STEPS.map((step, idx) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`size-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  idx < currentStep
                    ? "bg-primary text-primary-foreground"
                    : idx === currentStep
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {idx < currentStep ? <Check className="size-4" /> : step.id + 1}
              </div>
              <span className="text-xs text-muted-foreground">{step.label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 ${
                  idx < currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
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
      </div>
    </div>
  )
}

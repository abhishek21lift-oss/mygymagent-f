import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import type { Member } from "@/lib/types/gym"

interface OnboardingData {
  primaryBranchId: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  dateOfBirth?: string
  gender?: "MALE" | "FEMALE" | "OTHER" | "UNDISCLOSED"
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContactRelationship?: string
  assignedTrainerId?: string
  memberType?: "GYM" | "PT" | "GYM_PT"
  leadSource?: string
  fitnessGoal?: string
  notes?: string
  heightCm?: number
  weightKg?: number
  fitnessExperience?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
  injuries?: string
  allergies?: string
  medicalNotes?: string
  parqHeartCondition?: boolean
  parqChestPain?: boolean
  parqDizziness?: boolean
  parqJointProblems?: boolean
  parqMedication?: boolean
  parqPregnant?: boolean
  parqOtherConcerns?: boolean
  flaggedForMedicalClearance?: boolean
  waiverConsent: boolean
  profilePhoto?: File | null
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: OnboardingData) => {
      const member = await api.post<Member>("/members", {
        primaryBranchId: data.primaryBranchId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || null,
        phone: data.phone || null,
        dateOfBirth: data.dateOfBirth || null,
        gender: data.gender || null,
        addressLine1: data.addressLine1 || null,
        addressLine2: data.addressLine2 || null,
        city: data.city || null,
        state: data.state || null,
        postalCode: data.postalCode || null,
        country: data.country || null,
        emergencyContactName: data.emergencyContactName || null,
        emergencyContactPhone: data.emergencyContactPhone || null,
        emergencyContactRelationship: data.emergencyContactRelationship || null,
        assignedTrainerId: data.assignedTrainerId || null,
        memberType: data.memberType || null,
        leadSource: data.leadSource || null,
        fitnessGoal: data.fitnessGoal || null,
        waiverConsent: data.waiverConsent,
        injuries: data.injuries || null,
        allergies: data.allergies || null,
        medicalNotes: data.medicalNotes || null,
      })

      if (data.profilePhoto) {
        const formData = new FormData()
        formData.append("file", data.profilePhoto)
        formData.append("category", "PROGRESS_PHOTO")
        formData.append("description", "Profile photo")
        await api.post(`/members/${member.id}/documents`, formData)
      }

      const parqResponses: Record<string, boolean> = {}
      if (data.parqHeartCondition !== undefined) parqResponses.heartCondition = data.parqHeartCondition
      if (data.parqChestPain !== undefined) parqResponses.chestPain = data.parqChestPain
      if (data.parqDizziness !== undefined) parqResponses.dizziness = data.parqDizziness
      if (data.parqJointProblems !== undefined) parqResponses.jointProblems = data.parqJointProblems
      if (data.parqMedication !== undefined) parqResponses.onMedication = data.parqMedication
      if (data.parqPregnant !== undefined) parqResponses.pregnant = data.parqPregnant
      if (data.parqOtherConcerns !== undefined) parqResponses.otherConcerns = data.parqOtherConcerns

      await api.post(`/members/${member.id}/screenings`, {
        responses: parqResponses,
        flaggedForMedicalClearance: data.flaggedForMedicalClearance || false,
        notes: data.medicalNotes || null,
      })

      if (data.heightCm || data.weightKg) {
        await api.post(`/members/${member.id}/measurements`, {
          heightCm: data.heightCm || null,
          weightKg: data.weightKg || null,
          notes: data.fitnessExperience ? `Fitness level: ${data.fitnessExperience}` : null,
        })
      }

      return member
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] })
    },
  })
}

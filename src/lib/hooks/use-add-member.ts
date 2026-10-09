import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api, ApiError } from "@/lib/api/client"
import type { Lead, Member } from "@/lib/types/gym"

export type Gender = "MALE" | "FEMALE" | "OTHER" | "UNDISCLOSED"
export type MemberType = "GYM" | "PT" | "GYM_PT"
export type PaymentMethod = "CASH" | "UPI" | "CARD" | "BANK_TRANSFER" | "OTHER"

export interface ParqAnswers {
  heartCondition: boolean
  chestPain: boolean
  dizziness: boolean
  jointProblems: boolean
  onMedication: boolean
  pregnant: boolean
  otherConcerns: boolean
}

export interface AddMemberInput {
  /** Joining from an enquiry: the lead is converted, not left open. */
  leadId?: string
  primaryBranchId: string
  firstName: string
  lastName: string
  phone: string
  email?: string
  dateOfBirth?: string
  gender?: Gender
  memberType?: MemberType
  assignedTrainerId?: string
  leadSource?: string
  fitnessGoal?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContactRelationship?: string
  injuries?: string
  allergies?: string
  medicalNotes?: string
  waiverConsent: boolean
  photo?: File | null
  /** Only when the health questions were asked. */
  parq?: ParqAnswers
  heightCm?: number
  weightKg?: number
  fitnessExperience?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
  membership?: {
    planId: string
    startDate: string
    discount: number
    amountPaid: number
    paymentMethod: PaymentMethod
  }
}

export interface AddMemberResult {
  member: Member
  /** Steps after the member was saved that did not go through. */
  problems: string[]
}

function reason(error: unknown) {
  return error instanceof ApiError || error instanceof Error ? error.message : "unknown error"
}

/**
 * Adds a member in one go: the person, then their photo, health answers,
 * first measurements and the membership with what they paid at the desk.
 *
 * Only the first call can fail the whole thing. Once the member exists,
 * a later step that fails is reported in `problems` instead of thrown,
 * so a retry can never create the same person twice.
 */
export function useAddMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: AddMemberInput): Promise<AddMemberResult> => {
      const fields = {
        primaryBranchId: input.primaryBranchId,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        email: input.email || null,
        dateOfBirth: input.dateOfBirth || null,
        gender: input.gender || null,
        memberType: input.memberType || null,
        assignedTrainerId: input.assignedTrainerId || null,
        leadSource: input.leadSource || null,
        fitnessGoal: input.fitnessGoal || null,
        addressLine1: input.addressLine1 || null,
        addressLine2: input.addressLine2 || null,
        city: input.city || null,
        state: input.state || null,
        postalCode: input.postalCode || null,
        country: input.country || null,
        emergencyContactName: input.emergencyContactName || null,
        emergencyContactPhone: input.emergencyContactPhone || null,
        emergencyContactRelationship: input.emergencyContactRelationship || null,
        injuries: input.injuries || null,
        allergies: input.allergies || null,
        medicalNotes: input.medicalNotes || null,
        waiverConsent: input.waiverConsent,
      }

      const problems: string[] = []
      let member: Member
      if (input.leadId) {
        // Converting marks the enquiry won and links it to the member;
        // the form's own details then replace the lead's copy.
        const converted = await api.post<{ lead: Lead; member: Member }>(
          `/leads/${input.leadId}/convert`,
          { branchId: input.primaryBranchId },
        )
        member = converted.member
        try {
          member = await api.patch<Member>(`/members/${member.id}`, fields)
        } catch (error) {
          problems.push(`details beyond the enquiry's (${reason(error)})`)
        }
      } else {
        member = await api.post<Member>("/members", fields)
      }

      const steps: Array<[string, () => Promise<unknown>]> = []
      if (input.photo) {
        const photo = input.photo
        steps.push([
          "photo",
          () => {
            const form = new FormData()
            form.append("file", photo)
            form.append("category", "PROGRESS_PHOTO")
            form.append("description", "Profile photo")
            return api.post(`/members/${member.id}/documents`, form)
          },
        ])
      }
      if (input.parq) {
        const parq = input.parq
        steps.push([
          "health questions",
          () =>
            api.post(`/members/${member.id}/screenings`, {
              responses: parq,
              flaggedForMedicalClearance: Object.values(parq).some(Boolean),
              notes: input.medicalNotes || null,
            }),
        ])
      }
      if (input.heightCm || input.weightKg) {
        steps.push([
          "measurements",
          () =>
            api.post(`/members/${member.id}/measurements`, {
              heightCm: input.heightCm ?? null,
              weightKg: input.weightKg ?? null,
              notes: input.fitnessExperience ? `Fitness level: ${input.fitnessExperience}` : null,
            }),
        ])
      }
      if (input.membership) {
        const m = input.membership
        steps.push([
          "membership",
          () =>
            api.post("/memberships", {
              memberId: member.id,
              membershipPlanId: m.planId,
              startDate: m.startDate,
              ...(m.discount > 0 ? { discount: m.discount } : {}),
              ...(m.amountPaid > 0
                ? { initialPayment: m.amountPaid, paymentMethod: m.paymentMethod }
                : {}),
            }),
        ])
      }

      for (const [label, run] of steps) {
        try {
          await run()
        } catch (error) {
          problems.push(`${label} (${reason(error)})`)
        }
      }

      return { member, problems }
    },
    onSuccess: () => {
      for (const key of ["members", "memberships", "payments", "leads"]) {
        void queryClient.invalidateQueries({ queryKey: [key] })
      }
    },
  })
}

import { z } from "zod"

export const createMemberSchema = z.object({
  primaryBranchId: z.string().min(1, "Branch is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email address").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "UNDISCLOSED"]).optional(),
  emergencyContactName: z.string().optional().or(z.literal("")),
  emergencyContactPhone: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
})
export type CreateMemberInput = z.infer<typeof createMemberSchema>

export const createBranchSchema = z.object({
  name: z.string().min(1, "Branch name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("Enter a valid email address").optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
})
export type CreateBranchInput = z.infer<typeof createBranchSchema>

export const createMembershipPlanSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  description: z.string().optional().or(z.literal("")),
  durationDays: z.coerce.number().int().positive("Must be a positive number of days"),
  price: z.coerce.number().positive("Price must be greater than 0"),
  currency: z.string().min(1),
  maxFreezeDays: z.coerce.number().int().min(0),
})
export type CreateMembershipPlanInput = z.infer<typeof createMembershipPlanSchema>

export const inviteStaffSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional().or(z.literal("")),
  primaryBranchId: z.string().min(1, "Branch is required"),
  roleKey: z.string().min(1, "Role is required"),
  jobTitle: z.string().optional().or(z.literal("")),
  isTrainer: z.boolean(),
})
export type InviteStaffInput = z.infer<typeof inviteStaffSchema>

export const checkInSchema = z.object({
  branchId: z.string().min(1, "Branch is required"),
  memberId: z.string().optional(),
  staffUserId: z.string().optional(),
  method: z.enum(["QR", "MANUAL", "KIOSK", "APP", "STAFF"]),
})
export type CheckInInput = z.infer<typeof checkInSchema>

export const createPaymentSchema = z.object({
  memberId: z.string().min(1, "Member is required"),
  membershipId: z.string().optional(),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  method: z.enum(["CASH", "CARD", "UPI", "BANK_TRANSFER", "OTHER"]),
  note: z.string().optional().or(z.literal("")),
})
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>

export const refundPaymentSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0").optional(),
  reason: z.string().optional().or(z.literal("")),
})
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>

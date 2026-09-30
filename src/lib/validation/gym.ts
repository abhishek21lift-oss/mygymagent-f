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
  emergencyContactRelationship: z.string().optional(),
  notes: z.string().optional().or(z.literal("")),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  assignedTrainerId: z.string().optional(),
  memberType: z.enum(["GYM", "PT", "GYM_PT"]).optional(),
  fitnessGoal: z.string().optional(),
  leadSource: z.string().optional(),
  leadId: z.string().optional(),
  heightCm: z.number().optional(),
  weightKg: z.number().optional(),
  fitnessExperience: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  injuries: z.string().optional(),
  allergies: z.string().optional(),
  medicalNotes: z.string().optional(),
  parqHeartCondition: z.boolean().optional(),
  parqChestPain: z.boolean().optional(),
  parqDizziness: z.boolean().optional(),
  parqJointProblems: z.boolean().optional(),
  parqMedication: z.boolean().optional(),
  parqPregnant: z.boolean().optional(),
  parqOtherConcerns: z.boolean().optional(),
  flaggedForMedicalClearance: z.boolean().optional(),
  waiverConsent: z.boolean(),
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

/**
 * The Add staff form. One schema for all three ways in, with the rules
 * each one adds checked against the chosen `access`: an email to sign in
 * with, a password when one is set now, and neither when there is no app
 * access (the server refuses an email then -- see `toAddStaffPayload`).
 */
export const addStaffSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required").max(80),
    lastName: z.string().trim().min(1, "Last name is required").max(80),
    phone: z
      .string()
      .trim()
      .max(20)
      .regex(/^[+\d][\d\s-]{6,}$/, "Enter a valid phone number")
      .optional()
      .or(z.literal("")),
    jobTitle: z.string().trim().max(80).optional().or(z.literal("")),
    isTrainer: z.boolean(),
    specializations: z.array(z.string().trim().min(1).max(40)).max(12),
    primaryBranchId: z.string().min(1, "Pick a branch"),
    roleKey: z.string().min(1, "Pick a role"),
    allBranches: z.boolean(),
    access: z.enum(["INVITE", "PASSWORD", "NONE"]),
    email: z.string().trim().optional().or(z.literal("")),
    password: z.string().optional().or(z.literal("")),
    salaryType: z.enum(["NONE", "MONTHLY", "DAILY", "HOURLY"]),
    salaryAmount: z.string().trim().optional().or(z.literal("")),
    employeeCode: z.string().trim().max(60).optional().or(z.literal("")),
    hireDate: z.string().optional().or(z.literal("")),
  })
  .superRefine((values, ctx) => {
    if (values.access !== "NONE") {
      if (!values.email || !z.string().email().safeParse(values.email).success) {
        ctx.addIssue({ code: "custom", path: ["email"], message: "Enter a valid email address" })
      }
    }
    if (values.access === "PASSWORD" && (values.password ?? "").length < 10) {
      ctx.addIssue({ code: "custom", path: ["password"], message: "Use at least 10 characters" })
    }
    if (values.salaryType !== "NONE") {
      const amount = Number(values.salaryAmount)
      if (!values.salaryAmount || !Number.isFinite(amount) || amount <= 0) {
        ctx.addIssue({ code: "custom", path: ["salaryAmount"], message: "Enter an amount above 0" })
      } else if (!/^\d+(\.\d{1,2})?$/.test(values.salaryAmount)) {
        ctx.addIssue({ code: "custom", path: ["salaryAmount"], message: "Up to 2 decimal places" })
      }
    }
  })
export type AddStaffValues = z.infer<typeof addStaffSchema>

/** What `POST /users` takes. */
export interface AddStaffPayload {
  access: "INVITE" | "PASSWORD" | "NONE"
  email?: string
  password?: string
  firstName: string
  lastName: string
  phone?: string
  primaryBranchId: string
  roleKey: string
  roleBranchId?: string
  jobTitle?: string
  isTrainer: boolean
  specializations?: string[]
  employeeCode?: string
  hireDate?: string
  pay?: {
    salaryType: "MONTHLY" | "DAILY" | "HOURLY"
    baseSalary?: number
    hourlyRate?: number
  }
}

/** Form values to the request: empty strings dropped, the email left out
 * when there is no app access, and the amount put on the rate the salary
 * type pays by. `canSetPay` is `hr.manage`: without it no pay is sent,
 * since the server would refuse the whole request. */
export function toAddStaffPayload(values: AddStaffValues, canSetPay: boolean): AddStaffPayload {
  const text = (value: string | undefined) => (value && value.trim() ? value.trim() : undefined)
  const amount = Number(values.salaryAmount)
  return {
    access: values.access,
    email: values.access === "NONE" ? undefined : text(values.email)?.toLowerCase(),
    password: values.access === "PASSWORD" ? values.password : undefined,
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    phone: text(values.phone),
    primaryBranchId: values.primaryBranchId,
    roleKey: values.roleKey,
    roleBranchId: values.allBranches ? undefined : values.primaryBranchId,
    jobTitle: text(values.jobTitle),
    isTrainer: values.isTrainer,
    specializations: values.isTrainer && values.specializations.length ? values.specializations : undefined,
    employeeCode: canSetPay ? text(values.employeeCode) : undefined,
    hireDate: canSetPay ? text(values.hireDate) : undefined,
    pay:
      canSetPay && values.salaryType !== "NONE"
        ? values.salaryType === "HOURLY"
          ? { salaryType: "HOURLY", hourlyRate: amount }
          : { salaryType: values.salaryType, baseSalary: amount }
        : undefined,
  }
}

export const checkInSchema = z.object({
  branchId: z.string().min(1, "Branch is required"),
  memberId: z.string().optional(),
  staffUserId: z.string().optional(),
  method: z.enum(["QR", "MANUAL", "KIOSK", "APP", "STAFF", "BIOMETRIC"]),
})
export type CheckInInput = z.infer<typeof checkInSchema>

export const createPaymentSchema = z.object({
  memberId: z.string().min(1, "Member is required"),
  membershipId: z.string().optional(),
  invoiceId: z.string().optional(),
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

export const invoiceLineSchema = z.object({
  label: z.string().min(1, "Label is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  qty: z.coerce.number().int().positive("Qty must be at least 1").optional(),
})
export type InvoiceLineInput = z.infer<typeof invoiceLineSchema>

export const taxBreakupLineSchema = z.object({
  label: z.string().min(1, "Label is required"),
  amount: z.coerce.number().min(0, "Amount must be 0 or more"),
})
export type TaxBreakupLineInput = z.infer<typeof taxBreakupLineSchema>

export const createInvoiceSchema = z.object({
  memberId: z.string().min(1, "Member is required"),
  membershipId: z.string().optional(),
  branchId: z.string().optional(),
  lines: z.array(invoiceLineSchema).min(1, "Add at least one line"),
  discount: z.coerce.number().min(0, "Discount must be 0 or more").optional(),
  taxBreakup: z.array(taxBreakupLineSchema).optional(),
  dueAt: z.string().optional().or(z.literal("")),
  draft: z.boolean().optional(),
})
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>

export const voidInvoiceSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
})
export type VoidInvoiceInput = z.infer<typeof voidInvoiceSchema>

export const createExerciseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  muscleGroup: z.string().optional().or(z.literal("")),
  equipment: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
})
export type CreateExerciseInput = z.infer<typeof createExerciseSchema>

export const workoutPlanExerciseSchema = z.object({
  exerciseId: z.string().min(1, "Pick an exercise"),
  order: z.coerce.number().int().positive(),
  sets: z.coerce.number().int().positive("Sets must be at least 1"),
  reps: z.string().min(1, "Reps is required (e.g. \"8-12\")"),
  restSeconds: z.coerce.number().int().min(0).optional(),
  notes: z.string().optional().or(z.literal("")),
})

export const createWorkoutPlanSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  description: z.string().optional().or(z.literal("")),
  exercises: z.array(workoutPlanExerciseSchema).min(1, "Add at least one exercise"),
})
export type CreateWorkoutPlanInput = z.infer<typeof createWorkoutPlanSchema>

/** PATCH /workout-plans/:id takes the same shape: the edit form loads the
 * whole plan and sends the whole plan back, so a removed exercise is
 * actually removed rather than merged. */
export const updateWorkoutPlanSchema = createWorkoutPlanSchema
export type UpdateWorkoutPlanInput = z.infer<typeof updateWorkoutPlanSchema>

export const assignWorkoutPlanSchema = z.object({
  memberId: z.string().min(1, "Member is required"),
  notes: z.string().optional().or(z.literal("")),
})
export type AssignWorkoutPlanInput = z.infer<typeof assignWorkoutPlanSchema>

export const createLeadSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email address").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  source: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
})
export type CreateLeadInput = z.infer<typeof createLeadSchema>

export const createFollowUpSchema = z.object({
  dueAt: z.string().min(1, "Due date is required"),
  note: z.string().min(1, "Note is required"),
})
export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>

export const createFoodItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  servingSize: z.string().optional().or(z.literal("")),
  calories: z.coerce.number().int().min(0).optional(),
  proteinG: z.coerce.number().min(0).optional(),
  carbsG: z.coerce.number().min(0).optional(),
  fatG: z.coerce.number().min(0).optional(),
})
export type CreateFoodItemInput = z.infer<typeof createFoodItemSchema>

export const dietPlanItemSchema = z.object({
  foodItemId: z.string().min(1, "Pick a food item"),
  mealSlot: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit is required (e.g. \"g\", \"cup\")"),
})

export const createDietPlanSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  description: z.string().optional().or(z.literal("")),
  items: z.array(dietPlanItemSchema).min(1, "Add at least one food item"),
  targetCalories: z.coerce.number().int().positive().optional(),
})
export type CreateDietPlanInput = z.infer<typeof createDietPlanSchema>

/** The three macro targets the API has always accepted but the create form
 * never offered. The edit form exposes all four. */
export const updateDietPlanSchema = createDietPlanSchema.extend({
  targetProteinG: z.coerce.number().min(0).optional(),
  targetCarbsG: z.coerce.number().min(0).optional(),
  targetFatG: z.coerce.number().min(0).optional(),
})
export type UpdateDietPlanInput = z.infer<typeof updateDietPlanSchema>

export const assignDietPlanSchema = z.object({
  memberId: z.string().min(1, "Member is required"),
  notes: z.string().optional().or(z.literal("")),
})
export type AssignDietPlanInput = z.infer<typeof assignDietPlanSchema>

export const createProductSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().or(z.literal("")),
  category: z.string().optional().or(z.literal("")),
  barcode: z.string().optional().or(z.literal("")),
  unit: z.string().optional().or(z.literal("")),
  unitPrice: z.coerce.number().min(0, "Price must be 0 or more"),
  costPrice: z.coerce.number().min(0).optional(),
  quantityOnHand: z.coerce.number().int().min(0).optional(),
  reorderLevel: z.coerce.number().int().min(0).optional(),
  reorderQuantity: z.coerce.number().int().min(0).optional(),
})
export type CreateProductInput = z.infer<typeof createProductSchema>

/** quantityOnHand is absent on purpose: once a product exists, stock only
 * moves through the movement ledger, and PATCH /products/:id rejects it. */
export const updateProductSchema = createProductSchema
  .omit({ quantityOnHand: true })
  .extend({ isActive: z.boolean() })
export type UpdateProductInput = z.infer<typeof updateProductSchema>

export const createStockMovementSchema = z.object({
  type: z.enum(["RESTOCK", "SALE", "ADJUSTMENT", "DAMAGED"]),
  quantity: z.coerce.number().int().refine((v) => v !== 0, "Quantity cannot be 0"),
  note: z.string().optional().or(z.literal("")),
  branchId: z.string().optional(),
  unitCost: z.coerce.number().min(0).optional(),
})
export type CreateStockMovementInput = z.infer<typeof createStockMovementSchema>

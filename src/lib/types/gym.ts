export interface Branch {
  id: string
  organizationId: string
  name: string
  slug: string
  status: "ACTIVE" | "INACTIVE"
  timezone: string | null
  phone: string | null
  email: string | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  country: string | null
  createdAt: string
  updatedAt: string
}

export interface StaffProfile {
  id: string
  employeeCode: string | null
  jobTitle: string | null
  isTrainer: boolean
  specializations: string[]
  bio: string | null
  commissionRate: string | null
  hireDate: string | null
}

export interface StaffUser {
  id: string
  organizationId: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  status: "INVITED" | "ACTIVE" | "SUSPENDED" | "DISABLED"
  primaryBranchId: string | null
  emailVerifiedAt: string | null
  lastLoginAt: string | null
  createdAt: string
  staffProfile: StaffProfile | null
  userRoles: { id: string; role: { id: string; key: string; name: string }; branchId: string | null }[]
}

export type Gender = "MALE" | "FEMALE" | "OTHER" | "UNDISCLOSED"
export type MemberStatus = "ACTIVE" | "INACTIVE" | "FROZEN" | "EXPIRED"

export interface Member {
  id: string
  organizationId: string
  primaryBranchId: string
  memberCode: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  dateOfBirth: string | null
  gender: Gender | null
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  country: string | null
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  profilePhotoUrl: string | null
  status: MemberStatus
  assignedTrainerId: string | null
  notes: string | null
  joinedAt: string
  createdAt: string
  updatedAt: string
  primaryBranch?: { id: string; name: string }
  assignedTrainer?: { id: string; firstName: string; lastName: string } | null
  memberships?: Membership[]
}

export interface MembershipPlan {
  id: string
  organizationId: string
  branchId: string | null
  name: string
  description: string | null
  durationDays: number
  price: string
  currency: string
  benefits: string[]
  maxFreezeDays: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type MembershipStatus = "PENDING" | "ACTIVE" | "FROZEN" | "EXPIRED" | "CANCELLED"

export interface Membership {
  id: string
  organizationId: string
  branchId: string
  memberId: string
  membershipPlanId: string
  status: MembershipStatus
  startDate: string
  endDate: string
  freezeStartDate: string | null
  freezeEndDate: string | null
  totalFreezeDaysUsed: number
  price: string
  currency: string
  autoRenew: boolean
  cancelledAt: string | null
  cancellationReason: string | null
  createdAt: string
  updatedAt: string
  membershipPlan?: MembershipPlan
  member?: { id: string; firstName: string; lastName: string }
}

export type AttendanceMethod = "QR" | "MANUAL" | "KIOSK" | "APP" | "STAFF"

export interface Attendance {
  id: string
  organizationId: string
  branchId: string
  memberId: string | null
  staffUserId: string | null
  checkInAt: string
  checkOutAt: string | null
  method: AttendanceMethod
  recordedByUserId: string | null
  createdAt: string
  member?: { id: string; firstName: string; lastName: string } | null
  staffUser?: { id: string; firstName: string; lastName: string } | null
}

export type PaymentMethod = "CASH" | "CARD" | "UPI" | "BANK_TRANSFER" | "OTHER"
export type PaymentStatus = "COMPLETED" | "REFUNDED" | "PARTIALLY_REFUNDED"

export interface Refund {
  id: string
  paymentId: string
  amount: string
  reason: string | null
  recordedByUserId: string | null
  createdAt: string
}

export interface Payment {
  id: string
  organizationId: string
  branchId: string
  memberId: string
  membershipId: string | null
  amount: string
  currency: string
  method: PaymentMethod
  status: PaymentStatus
  note: string | null
  recordedByUserId: string | null
  createdAt: string
  member?: { id: string; firstName: string; lastName: string }
  membership?: Membership
  refunds?: Refund[]
}

export interface Exercise {
  id: string
  organizationId: string
  name: string
  muscleGroup: string | null
  equipment: string | null
  description: string | null
  videoUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface WorkoutPlanExercise {
  exerciseId: string
  order: number
  sets: number
  reps: string
  restSeconds?: number
  notes?: string
}

export interface WorkoutPlan {
  id: string
  organizationId: string
  name: string
  description: string | null
  exercises: WorkoutPlanExercise[]
  createdByUserId: string | null
  createdAt: string
  updatedAt: string
}

export type WorkoutAssignmentStatus = "ACTIVE" | "COMPLETED" | "CANCELLED"

export interface WorkoutAssignment {
  id: string
  organizationId: string
  workoutPlanId: string
  memberId: string
  assignedByUserId: string | null
  status: WorkoutAssignmentStatus
  startDate: string
  notes: string | null
  createdAt: string
  updatedAt: string
  workoutPlan?: { id: string; name: string }
  member?: { id: string; firstName: string; lastName: string }
}

export type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "TRIAL" | "WON" | "LOST"

export interface LeadFollowUp {
  id: string
  leadId: string
  dueAt: string
  note: string
  completedAt: string | null
  createdByUserId: string | null
  createdAt: string
}

export interface Lead {
  id: string
  organizationId: string
  branchId: string | null
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  source: string | null
  status: LeadStatus
  notes: string | null
  assignedToUserId: string | null
  convertedMemberId: string | null
  convertedAt: string | null
  createdAt: string
  updatedAt: string
  assignedToUser?: { id: string; firstName: string; lastName: string } | null
  followUps?: LeadFollowUp[]
  _count?: { followUps: number }
}

export interface FoodItem {
  id: string
  organizationId: string
  name: string
  servingSize: string | null
  calories: number | null
  proteinG: string | null
  carbsG: string | null
  fatG: string | null
  createdAt: string
  updatedAt: string
}

export type MealSlot = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK"

export interface DietPlanItem {
  foodItemId: string
  mealSlot: MealSlot
  quantity: number
  unit: string
  notes?: string
}

export interface DietPlan {
  id: string
  organizationId: string
  name: string
  description: string | null
  items: DietPlanItem[]
  targetCalories: number | null
  targetProteinG: string | null
  targetCarbsG: string | null
  targetFatG: string | null
  createdByUserId: string | null
  createdAt: string
  updatedAt: string
}

export type DietAssignmentStatus = "ACTIVE" | "COMPLETED" | "CANCELLED"

export interface DietAssignment {
  id: string
  organizationId: string
  dietPlanId: string
  memberId: string
  assignedByUserId: string | null
  status: DietAssignmentStatus
  startDate: string
  notes: string | null
  createdAt: string
  updatedAt: string
  dietPlan?: { id: string; name: string }
  member?: { id: string; firstName: string; lastName: string }
}

export interface Product {
  id: string
  organizationId: string
  sku: string
  name: string
  description: string | null
  category: string | null
  unitPrice: string
  costPrice: string | null
  quantityOnHand: number
  reorderLevel: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type StockMovementType = "RESTOCK" | "SALE" | "ADJUSTMENT" | "DAMAGED"

export interface StockMovement {
  id: string
  organizationId: string
  productId: string
  type: StockMovementType
  quantity: number
  note: string | null
  recordedByUserId: string | null
  createdAt: string
  product?: { id: string; name: string; sku: string }
}

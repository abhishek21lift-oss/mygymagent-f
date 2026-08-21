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

export type MemberAddressType = "HOME" | "WORK" | "BILLING" | "OTHER"

export interface MemberAddress {
  id: string
  type: MemberAddressType
  isPrimary: boolean
  addressLine1: string
  addressLine2: string | null
  city: string | null
  state: string | null
  postalCode: string | null
  country: string | null
  createdAt: string
  updatedAt: string
}

export interface MemberEmergencyContact {
  id: string
  name: string
  phone: string
  relationship: string | null
  isPrimary: boolean
  createdAt: string
  updatedAt: string
}

export interface MemberNote {
  id: string
  body: string
  pinned: boolean
  authorUserId: string | null
  authorUser?: { id: string; firstName: string; lastName: string } | null
  createdAt: string
  updatedAt: string
}

export type MemberConsentType = "WAIVER" | "MARKETING" | "PHOTO_RELEASE" | "DATA_PROCESSING" | "OTHER"

export interface MemberConsent {
  id: string
  type: MemberConsentType
  granted: boolean
  note: string | null
  recordedByUserId: string | null
  createdAt: string
}

export interface MemberStatusHistoryEntry {
  id: string
  fromStatus: MemberStatus | null
  toStatus: MemberStatus
  reason: string | null
  changedByUser?: { id: string; firstName: string; lastName: string } | null
  createdAt: string
}

export interface MemberBranchHistoryEntry {
  id: string
  fromBranch?: { id: string; name: string } | null
  toBranch: { id: string; name: string }
  reason: string | null
  changedByUser?: { id: string; firstName: string; lastName: string } | null
  createdAt: string
}

export interface MemberTrainerHistoryEntry {
  id: string
  fromTrainer?: { id: string; firstName: string; lastName: string } | null
  toTrainer?: { id: string; firstName: string; lastName: string } | null
  reason: string | null
  changedByUser?: { id: string; firstName: string; lastName: string } | null
  createdAt: string
}

export type MemberAssessmentType = "INITIAL" | "PROGRESS" | "PAR_Q" | "FITNESS_TEST" | "CUSTOM"

export interface MemberAssessment {
  id: string
  type: MemberAssessmentType
  notes: string | null
  conductedByUser?: { id: string; firstName: string; lastName: string } | null
  conductedAt: string
  measurements: MemberMeasurement[]
  fitnessResults: MemberFitnessTestResult[]
  screening: MemberScreening | null
}

export interface MemberMeasurement {
  id: string
  assessmentId: string | null
  recordedAt: string
  weightKg: string | null
  heightCm: string | null
  bodyFatPercent: string | null
  muscleMassKg: string | null
  waistCm: string | null
  hipCm: string | null
  chestCm: string | null
  restingHeartRate: number | null
  bloodPressureSystolic: number | null
  bloodPressureDiastolic: number | null
  notes: string | null
}

export interface MemberFitnessTestResult {
  id: string
  assessmentId: string | null
  testName: string
  value: string
  unit: string
  notes: string | null
  recordedAt: string
}

export interface MemberScreening {
  id: string
  assessmentId: string | null
  responses: Record<string, boolean>
  flaggedForMedicalClearance: boolean
  notes: string | null
  completedAt: string
}

export type MemberGoalCategory =
  | "WEIGHT_LOSS"
  | "MUSCLE_GAIN"
  | "STRENGTH"
  | "ENDURANCE"
  | "GENERAL_FITNESS"
  | "OTHER"
export type MemberGoalStatus = "ACTIVE" | "ACHIEVED" | "ABANDONED" | "PAUSED"

export interface MemberGoalMilestone {
  id: string
  title: string
  targetDate: string | null
  achievedAt: string | null
  value: string | null
  note: string | null
  createdAt: string
}

export interface MemberGoal {
  id: string
  title: string
  description: string | null
  category: MemberGoalCategory
  status: MemberGoalStatus
  targetValue: string | null
  targetUnit: string | null
  baselineValue: string | null
  startDate: string
  targetDate: string | null
  achievedAt: string | null
  milestones: MemberGoalMilestone[]
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

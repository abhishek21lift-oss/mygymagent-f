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

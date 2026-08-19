export interface AuthUser {
  id: string
  organizationId: string | null
  email: string
  firstName: string
  lastName: string
  status: "INVITED" | "ACTIVE" | "SUSPENDED" | "DISABLED"
  primaryBranchId: string | null
  emailVerified: boolean
}

export interface Organization {
  id: string
  name: string
  slug: string
  status: "TRIAL" | "ACTIVE" | "SUSPENDED" | "CANCELLED"
  timezone: string
  currency: string
  parentOrganizationId: string | null
  settings: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface LoginResponse {
  user: AuthUser
  accessToken: string
}

export interface RegisterResponse {
  user: AuthUser
  organization: Organization
  accessToken: string
}

export interface MeResponse {
  user: AuthUser
  permissions: string[]
}

export interface AuthUser {
  id: string
  organizationId: string | null
  email: string
  firstName: string
  lastName: string
  status: "INVITED" | "ACTIVE" | "SUSPENDED" | "DISABLED"
  primaryBranchId: string | null
  emailVerified: boolean
  /** The gym member this login belongs to, when it is one. Decides
   * which app the session opens: a member in the staff app would have
   * every request 403, so the server answers this at sign-in rather than
   * leaving the client to probe for it. */
  memberId: string | null
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

/**
 * Where the signed-in user stands against their organization's second-factor
 * policy. `ENFORCED` does not mean the session was refused -- it means the
 * backend has confined it to the enrolment screens, so the UI must show
 * enrolment instead of the app rather than surfacing 403s everywhere.
 */
export interface MfaEnrolmentInfo {
  state: "NOT_REQUIRED" | "GRACE" | "ENFORCED"
  /** ISO date enforcement begins. Only ever set in `GRACE`. */
  deadline: string | null
}

export interface LoginResponse {
  user: AuthUser
  accessToken: string
  mfaEnrolment: MfaEnrolmentInfo
}

export interface RegisterResponse {
  user: AuthUser
  organization: Organization
  accessToken: string
}

export interface MeResponse {
  user: AuthUser
  permissions: string[]
  mfaEnrolment: MfaEnrolmentInfo
}

/**
 * `POST /auth/login` answers one of two shapes. A correct password alone
 * earns no session when a second factor is enrolled: the backend returns
 * only a short-lived, `mfa`-typed challenge token, and no refresh cookie
 * is set until `/auth/mfa/verify` succeeds.
 */
export type LoginResult =
  | ({ mfaRequired: false } & LoginResponse)
  | { mfaRequired: true; mfaToken: string; expiresIn: number }

export interface MfaStatus {
  enabled: boolean
  pendingEnrolment: boolean
  /** Absent until MFA has actually been switched on. */
  enabledAt?: string | null
  recoveryCodesRemaining: number
}

/** Returned exactly once, by `POST /auth/mfa/setup`. The secret is stored
 * only encrypted server-side and is never retrievable again. */
export interface MfaSetupResponse {
  secret: string
  otpauthUri: string
}

/** Returned exactly once, by `POST /auth/mfa/enable`. */
export interface MfaEnableResponse {
  enabled: true
  recoveryCodes: string[]
}

/** Organization-wide second-factor policy (`GET`/`PATCH /auth/mfa/policy`). */
export interface MfaPolicySettings {
  policy: "OPTIONAL" | "REQUIRED_FOR_PRIVILEGED"
  graceUntil: string | null
  /** True when unenrolled privileged users are being restricted right now,
   * as opposed to merely warned. */
  enforcementActive: boolean
  privilegedRoles: string[]
}

export interface MfaPolicyReportUser {
  id: string
  email: string
  firstName: string
  lastName: string
  status: string
  roles: string[]
  mfaEnabled: boolean
  mfaEnabledAt: string | null
}

export interface MfaPolicyReport {
  policy: MfaPolicySettings["policy"]
  graceUntil: string | null
  enforcementActive: boolean
  summary: { total: number; enrolled: number; pending: number }
  users: MfaPolicyReportUser[]
}
